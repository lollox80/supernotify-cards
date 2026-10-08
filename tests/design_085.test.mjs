// v0.85.0: archivio e "perché" in UNA card - lista a sinistra, dettaglio a destra;
// supernotify-why-card resta come alias.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (sAgo) => new Date(Date.now() - sAgo * 1000).toISOString();

// three camera alerts in a row, one failed channel, one that went nowhere (paused)
const cam = (id, sAgo) => ({ id, created: iso(sAgo), message: `Movimento Camera Ingresso\nalle ${sAgo}`,
  priority: "medium", outcome: "success", delivered: 1, skipped: 1,
  deliveries: { mobile_push: { success: [{ calls: [{}] }] }, alexa_announce: { skipped: { suppression_reason: "PRIORITY" } } } });
const DOCS = [
  cam("c0000001-a", 60), cam("c0000002-a", 120), cam("c0000003-a", 180),
  { id: "g0000001-a", created: iso(600), message: "Portone garage aperto\nAperto da 10 minuti", priority: "high",
    outcome: "partial_delivery", delivered: 2, failed: 1,
    extra_data: { entity_id: "cover.garage" },
    deliveries: {
      mobile_push: { success: [{ calls: [{}] }] },
      alexa_announce: { success: [{ spoken_message: "Il garage è aperto da dieci minuti", calls: [{}] }] },
      telegram: { error: ["timeout"] },
    } },
  { id: "p0000001-a", created: iso(900), message: "Garage chiuso", priority: "low", outcome: "no_delivery",
    delivered: 0, skipped: 2,
    deliveries: { mobile_push: { skipped: { suppression_reason: "SNOOZED" } }, alexa_announce: { skipped: { suppression_reason: "SNOOZED" } } } },
];
const ws = [];
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  services: { supernotify: { enquire_archive: {}, enquire_snoozes: {}, snooze: {} } },
  states: {
    "sensor.supernotify_notifications": { state: "5", attributes: {}, last_updated: iso(0) },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo", user_id: "u1" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" } },
    "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { name: "alexa_announce", friendly_name: "SuperNotify Delivery Annuncio Alexa abilitata" } },
    "switch.supernotify_delivery_telegram": { state: "on", attributes: { name: "telegram", friendly_name: "SuperNotify Delivery Telegram abilitata" } },
    "cover.garage": { state: "open", attributes: { friendly_name: "Portone garage" } },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m.service || m.type);
    if (m.service === "enquire_archive") return { response: { notifications: DOCS, count: DOCS.length } };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    return { response: {} };
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// ── 1. una card sola ────────────────────────────────────────────────────
const a = mount("supernotify-archive-card");
await wait(120); a.hass = { ...hass }; await wait(120);
const R = a.shadowRoot;
ok(R.querySelector(".split .lp #list") && R.querySelector(".split .rp #det"), "lista e dettaglio nella stessa card");
ok(/@container \(min-width: 720px\) \{[^}]*\}\s*\.split \{ grid-template-columns: minmax\(280px, 38%\)/.test(R.innerHTML), "affiancati quando la card è larga, uno sotto l'altro quando è stretta");
const rows = [...R.querySelectorAll("#list .it")];
console.log("    righe:", rows.map((r) => r.querySelector(".ti").textContent + " | " + r.querySelector(".l2").textContent.replace(/\s+/g, " ").trim()).join(" || "));
ok(rows.length === 3, `tre righe: le tre camere raggruppate (${rows.length})`);
const camRow = rows[0];
ok(camRow.querySelector(".rep") && camRow.querySelector(".rep").textContent === "×3", "camera: ×3");
ok(/Notifica sul telefono/.test(camRow.querySelector(".l2").textContent) && !camRow.querySelector(".tg"), "camera: dove è arrivata, niente pillole");
const gar = rows[1];
ok(gar.querySelector(".ic.err") && /Telegram fallito/.test(gar.querySelector(".l2").textContent), "garage: segno rosso e canale fallito nella riga");
ok(gar.querySelector(".bdg.pr.high"), "priorità mostrata solo se non media");
ok(!camRow.querySelector(".bdg.pr"), "priorità media: niente badge");
ok(rows[2].querySelector(".ic.none") && rows[2].classList.contains("quiet") && /nessun canale/.test(rows[2].textContent), "nessun canale: grigio, col motivo");

// ── 2. ×N si apre ───────────────────────────────────────────────────────
camRow.querySelector(".rep").onclick({ stopPropagation() {} });
ok(R.querySelectorAll("#list .it.sub").length === 2, "×3 aperto: le altre due sotto");
R.querySelector("#grp").onclick();
ok(R.querySelectorAll("#list .it").length === 5, "Raggruppa spento: cinque righe");
R.querySelector("#grp").onclick();

// ── 3. testata e filtri ─────────────────────────────────────────────────
const sum = R.getElementById("sum").textContent.replace(/\s+/g, " ");
ok(/5 oggi/.test(sum) && /3 arrivate/.test(sum) && /1 da guardare/.test(sum), `oggi in una riga (${sum.trim()})`);
const chips = [...R.querySelectorAll("#chips .chip[data-k]")].map((c) => c.textContent.replace(/\s+/g, " ").trim());
ok(chips[0] === "Tutte5" && /^Problemi1$/.test(chips[1]), `filtri con il numero (${chips.join(", ")})`);
ok(R.getElementById("legend").hidden, "legenda chiusa");
R.getElementById("help").onclick();
ok(!R.getElementById("legend").hidden && /×N/.test(R.getElementById("legend").textContent), "? apre la legenda");

// ── 4. dettaglio: si apre da solo sull'ultima, verdetto in cima ─────────
ok(a._sel === "c0000001", `l'ultima si apre da sola (${a._sel})`);
await a._select("g0000001", true); await wait(60);
const det = R.getElementById("det");
const vd = det.querySelector(".vd");
console.log("    verdetto:", vd && vd.textContent.replace(/\s+/g, " ").trim());
ok(vd && vd.classList.contains("err") && /Arrivata su 2 canali su 3/.test(vd.textContent) && /Telegram fallito/.test(vd.textContent), "verdetto: 2 su 3, Telegram fallito");
ok(det.querySelector(".hd") && det.querySelector(".path") && det.querySelector(".pb.crit"), "sotto: intestazione, i 4 passi, il problema");
ok(rows[1].classList.contains("sel") || R.querySelector('#list .it.sel[data-id="g0000001"]'), "riga selezionata nella lista");
const said = det.querySelector(".said");
ok(said && /Annuncio Alexa ha detto|Alexa ha detto/.test(said.textContent) && /dieci minuti/.test(said.textContent), `frase detta (${said && said.textContent.trim()})`);

// ── 5. pausa sotto il dettaglio ─────────────────────────────────────────
await wait(80);
const pz = R.getElementById("pzh");
ok(pz && /Portone garage/.test(pz.textContent) && pz.querySelectorAll(".pzb[data-min]").length === 4, "barra pausa della notifica scelta");

// ── 6. snWhyOpen da un'altra card ───────────────────────────────────────
window.dispatchEvent(new CustomEvent("supernotify-why", { detail: { id: "p0000001-a" } }));
await wait(60);
ok(a._sel === "p0000001", "snWhyOpen apre la notifica nella card archivio");
ok(/Non è partita su nessun canale/.test(R.querySelector("#det .vd").textContent), "verdetto: nessun canale");

// ── 7. alias: supernotify-why-card ──────────────────────────────────────
const w = mount("supernotify-why-card", { show_version: true });
await wait(150);
ok(w instanceof customElements.get("supernotify-archive-card"), "why-card = archive card");
ok(w.shadowRoot.querySelector(".split #list") && w.shadowRoot.querySelector("#det"), "alias: stessa card");
ok(/supernotify-why-card v0\.17\.0/.test(w.shadowRoot.textContent), "alias: versione why nel piè");
ok(customElements.get("supernotify-why-card").getConfigForm().schema.some((x) => x.name === "expand"), "alias: editor con le opzioni del perché");
ok(!window.customCards.some((c) => c.type === "supernotify-why-card"), "nel selettore delle card solo l'archivio");

// ── 8. strategy: niente why separata ────────────────────────────────────
const Strat = customElements.get("ll-strategy-dashboard-supernotify");
const views = (await Strat.generate({ type: "custom:supernotify" }, { ...hass, config: { version: "2026.10.1" } })).views;
const types = JSON.stringify(views);
ok(!/supernotify-why-card/.test(types) && /supernotify-archive-card/.test(types), "strategy: solo la card archivio");

// ── 9. tema scuro ───────────────────────────────────────────────────────
const d = document.createElement("supernotify-archive-card"); d.setConfig({}); document.body.appendChild(d);
d.hass = { ...hass, themes: { darkMode: true } }; await wait(80);
ok(d.style.colorScheme === "dark" && d.shadowRoot.querySelector(".split"), "tema scuro");

if (fail) { console.log(`\nFAIL ${fail}`); process.exit(1); }
console.log("\nall ok");
process.exit(0);
