// v0.86.0: archivio leggero - elenco in verbosity summary, le ultime 20 complete, il resto al tocco;
// filtri Critiche / Alte su tutto l'archivio; panoramica "falliti oggi" da verbosity daily.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const NOW = Date.now();
const d0 = new Date(); d0.setHours(0, 0, 0, 0);
// keep every "today" notification after midnight, whatever the hour the test runs
const todayAt = (i) => new Date(Math.max(d0.getTime() + 60e3, NOW - i * 60e3)).toISOString();
const daysAgo = (n, h = 12) => { const d = new Date(d0); d.setDate(d.getDate() - n); d.setHours(h); return d.toISOString(); };

// the archive: 30 today (one with a failed Telegram, one missed, one critical), plus older ones
const DOCS = [];
for (let i = 0; i < 30; i++) {
  const doc = { id: `t${String(i).padStart(7, "0")}-x`, created: todayAt(i + 1), message: `Notifica ${i}\nTesto ${i}`, priority: "medium",
    outcome: "success", delivered: 1, skipped: 1, missed: 0,
    condition_variables: { notification_title: `Notifica ${i}` },
    extra_data: { entity_id: "cover.garage" },
    deliveries: { mobile_push: { success: [{ target: { person_id: ["person.lorenzo"] }, calls: [{}] }] },
      alexa_announce: { skipped: { suppression_reason: "PRIORITY" } } } };
  if (i === 2) { doc.missed = 1; }
  if (i === 25) { doc.deliveries.telegram = { error: [{ failed_calls: [{ exception: "timeout" }] }] }; doc.failed = 1; doc.outcome = "partial_delivery"; }
  if (i === 27) { doc.priority = "critical"; }
  DOCS.push(doc);
}
const old = (id, when, priority, title) => ({ id, created: when, message: title, priority, outcome: "success", delivered: 1,
  condition_variables: { notification_title: title }, deliveries: { mobile_push: { success: [{ calls: [{}] }] } } });
DOCS.push(old("h1000000-x", daysAgo(1), "high", "Fulmine a 6 km"));
DOCS.push(old("h2000000-x", daysAgo(1, 13), "high", "Fulmine a 3 km"));
DOCS.push(old("c1000000-x", daysAgo(3), "critical", "Fumo in cucina"));
DOCS.push(old("c2000000-x", daysAgo(10), "critical", "Acqua sotto il lavello"));
DOCS.sort((a, b) => b.created.localeCompare(a.created));

// SuperNotify's summarize_notification, cut down
const summarize = (c) => {
  const deliveries = {};
  for (const [name, o] of Object.entries(c.deliveries || {})) {
    if (o.skipped) { deliveries[name] = { skipped: o.skipped.suppression_reason }; continue; }
    const s = {};
    for (const k of ["success", "suppressed", "error"]) if ((o[k] || []).length) s[k] = o[k].length;
    deliveries[name] = s;
  }
  return { id: c.id, created: c.created, outcome: c.outcome, message: c.message, title: (c.condition_variables || {}).notification_title,
    priority: c.priority, scenarios: [], occupancy: {}, deliveries, delivery_provenance: { mobile_push: { enabled_by: ["default"] } } };
};
const dayKey = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const daily = (after) => {
  const days = {};
  for (const c of DOCS) {
    if (after && c.created < after) continue;
    const k = dayKey(c.created);
    const d = days[k] || (days[k] = { date: k, count: 0, outcome: {}, priority: {}, hour: Array(24).fill(0), deliveries: {}, scenarios: {} });
    d.count++;
    d.priority[c.priority] = (d.priority[c.priority] || 0) + 1;
    for (const [n, o] of Object.entries(c.deliveries)) {
      if (!o.success && !o.error) continue;
      const x = d.deliveries[n] || (d.deliveries[n] = { success: 0, failed: 0 });
      x.success += o.success ? 1 : 0; x.failed += o.error ? 1 : 0;
    }
  }
  return { days: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)), count: 0 };
};

const calls = [];
let summaryOk = true;
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  services: { supernotify: { enquire_archive: {}, enquire_snoozes: {}, snooze: {} } },
  states: {
    "sensor.supernotify_notifications": { state: "30", attributes: {}, last_updated: "a" },
    "cover.garage": { state: "open", attributes: { friendly_name: "Portone garage" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" } },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    const sd = m.service_data || {};
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    if (m.service !== "enquire_archive") return { response: {} };
    calls.push(sd);
    if (sd.verbosity === "daily") return { response: daily(sd.after) };
    if (sd.verbosity === "summary" && !summaryOk) throw Object.assign(new Error("value must be one of ['standard', 'full']"), { code: "invalid_format" });
    if (sd.id) { const d = DOCS.find((x) => x.id === sd.id); if (!d) throw Object.assign(new Error("not found"), { code: "service_validation_error" }); return { response: d }; }
    let list = DOCS.filter((x) => (!sd.after || x.created >= sd.after) && (!sd.before || x.created < sd.before)).slice(0, sd.limit || 20);
    if (sd.verbosity === "summary") list = list.map(summarize);
    return { response: { notifications: list, count: list.length } };
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// ── 1. elenco: 20 complete + il resto in riepilogo ──────────────────────
const a = mount("supernotify-archive-card", { group_repeats: false });
await wait(150); a.hass = { ...hass }; await wait(250);
const R = a.shadowRoot;
const full = calls.filter((c) => !c.verbosity && !c.id && !c.after);
const light = calls.filter((c) => c.verbosity === "summary" && !c.after);
ok(full.length === 1 && full[0].limit === 20, `complete: una lettura da 20 (${JSON.stringify(full)})`);
ok(light.length === 1 && light[0].limit === 150, `riepilogo: una lettura da 150 (${JSON.stringify(light)})`);
const rows = () => [...R.querySelectorAll("#list .it")];
ok(rows().length === 34, `tutte nell'elenco: 30 di oggi + 4 vecchie (${rows().length})`);
const rowOf = (id) => R.querySelector(`#list .it[data-id="${id}"]`);
ok(/1 mancat/.test(rowOf("t0000002").textContent), "riga completa recente: «1 mancato»");
const tel = rowOf("t0000025");
ok(tel && tel.querySelector(".ic.err") && /fallit/.test(tel.textContent), "riga in riepilogo: Telegram fallito, segno rosso");
const idx = a._index();
ok(idx.items.find((x) => x.id === "t0000025").light === true && !idx.items.find((x) => x.id === "t0000002").light, "le 20 recenti complete, le altre leggere");
ok(!JSON.stringify(a._index().items).includes("delivery_provenance"), "in memoria niente provenienza");

// ── 2. Critiche / Alte su tutto l'archivio ──────────────────────────────
await wait(300); a._renderList();
const chips = [...R.querySelectorAll("#chips .chip[data-k]")].map((c) => c.dataset.k + ":" + c.textContent.replace(/\s+/g, ""));
console.log("    filtri:", chips.join(" "));
ok(chips.some((c) => c === "critical:Critiche3") && chips.some((c) => c === "high:Alte2"), "Critiche 3 e Alte 2 contate su tutto l'archivio");
ok(R.querySelector('#chips .chip[data-k="critical"] .n.r') && R.querySelector('#chips .chip[data-k="high"] .n.o'), "numero rosso / arancio");
const dayReads = calls.filter((c) => c.verbosity === "summary" && c.after && c.before);
ok(dayReads.length === 4, `letti solo i 4 giorni con critiche/alte, oggi compreso (${dayReads.length})`);
R.querySelector('#chips .chip[data-k="critical"]').onclick();
const crit = rows().map((r) => r.querySelector(".ti").textContent);
console.log("    critiche:", crit.join(" | "));
ok(crit.length === 3 && crit.includes("Acqua sotto il lavello") && crit.includes("Fumo in cucina"), "anche quelle di 3 e 10 giorni fa");
ok(/tutto l'archivio/.test(R.getElementById("meta").textContent), "dice che cerca in tutto l'archivio");

// ── 3. una vecchia si apre al tocco, completa ───────────────────────────
rows().find((r) => /Acqua/.test(r.textContent)).onclick();
await wait(120);
ok(calls.some((c) => c.id === "c2000000-x" && c.verbosity === "standard"), "letta per id, completa");
ok(/Arrivata su 1 canale/.test(R.querySelector("#det .vd").textContent), "dettaglio con il verdetto");
R.querySelector('#chips .chip[data-k="all"]').onclick();
rowOf("t0000025").onclick(); await wait(150);
ok(R.getElementById("pzh").querySelectorAll(".pzb[data-min]").length === 4, "riga leggera aperta: c'è la pausa (entità dal documento completo)");
ok(!a._index().items.find((x) => x.id === "t0000025").light, "dopo l'apertura la riga è disegnata dal documento completo");

// ── 4. panoramica: falliti oggi da daily ────────────────────────────────
const o = mount("supernotify-overview-card", {});
await wait(30); o._failures(); await wait(80);
const fo = o._failures();
ok(fo.n === 1 && fo.today && calls.some((c) => c.verbosity === "daily" && c.after && new Date(c.after).getTime() === d0.getTime()), `panoramica: 1 fallito oggi, da daily di oggi (${fo.n})`);

// ── 5. SuperNotify senza summary: come prima ────────────────────────────
// fresh bundle, as on a page of an older installation
const dom2 = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom2.window; global.document = dom2.window.document; global.CustomEvent = dom2.window.CustomEvent;
global.HTMLElement = dom2.window.HTMLElement; global.customElements = dom2.window.customElements;
dom2.window.HTMLElement.prototype.scrollIntoView = function () {};
dom2.window.customCards = [];
new dom2.window.Function(SRC)();
summaryOk = false; calls.length = 0;
const b = document.createElement("supernotify-archive-card"); b.setConfig({ limit: 40 }); document.body.appendChild(b);
b.hass = { ...hass }; await wait(150); b.hass = { ...hass, states: { ...hass.states } }; await wait(200);
ok(calls.some((c) => !c.verbosity && c.limit === 40), `senza summary: 40 complete come prima (${JSON.stringify(calls.filter((c) => !c.after))})`);
ok(b.shadowRoot.querySelectorAll("#list .it").length > 0, "e l'elenco c'è");

if (fail) { console.log(`\nFAIL ${fail}`); process.exit(1); }
console.log("\nall ok");
process.exit(0);
