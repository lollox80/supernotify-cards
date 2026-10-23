// CHANGELOG
// 2026-10-23 v1.0.0: audit fase 1 (bug). Ogni blocco fallisce su 50ed25d e passa dopo la correzione
//   (SN_SRC=<file> per provarlo su un'altra copia del bundle).
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync(process.env.SN_SRC || "dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
let unhandled = 0;
process.on("unhandledRejection", () => { unhandled++; });
// setTimeout delays asked by the bundle (snWS timeouts)
const delays = [];
const st0 = global.setTimeout;
global.setTimeout = (fn, ms, ...a) => { delays.push(ms); return st0(fn, ms, ...a); };
const api = new dom.window.Function(SRC + "\nreturn { snAppl, SN_APPL_KEY, snStatsDaily, snDash, snDashEnsure, snCards, snCardOn, snTech };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const proto = (tag) => customElements.get(tag).prototype;

// ── BUG-1: a toggle refused (401 for a non admin) puts the switch back ─────────
{
  const states = { "binary_sensor.supernotify_delivery_mobile_push": { state: "on",
    attributes: { name: "mobile_push", transport: "mobile_push", enabled: true, inclusion: ["default"] } } };
  const el = document.createElement("supernotify-deliveries-card");
  el.setConfig({});
  document.body.appendChild(el);
  el.hass = { language: "it", themes: { darkMode: false }, states, user: { id: "u", is_admin: false },
    callApi: async () => { throw new Error("401: Unauthorized"); }, callService: async () => {}, callWS: async () => ({}) };
  const label = el.shadowRoot.querySelector(".sw[data-id]");
  const input = label && label.querySelector("input");
  ok(input && input.checked, "deliveries: switch acceso all'inizio");
  const u0 = unhandled;
  input.checked = false;
  input.dispatchEvent(new dom.window.Event("change"));
  await wait(50);
  ok(input.checked === true, "BUG-1 deliveries: 401 -> lo switch torna acceso");
  ok(/401/.test(label.title || ""), `BUG-1 deliveries: l'errore nel tooltip (${label.title})`);
  ok(unhandled === u0, "BUG-1 deliveries: nessuna unhandled rejection");
  el.remove();
}

// ── BUG-2 / BUG-7 / BUG-13: control card ──────────────────────────────────────
const ctlWS = [];
const ctlHass = (extra = {}) => ({
  language: "it", themes: { darkMode: false }, user: { id: "u", is_admin: true }, entities: {},
  services: { supernotify: { enquire_snoozes: {}, enquire_occupancy: {}, enquire_active_scenarios: {}, enquire_last_notification: {} } },
  connection: { subscribeEvents: () => Promise.resolve(() => {}), subscribeMessage: () => Promise.resolve(() => {}) },
  states: {
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", last_sent_at: extra.t || "a" } },
    "switch.supernotify_delivery_alexa": { state: "on", attributes: { name: "alexa", last_sent_at: extra.t || "a" } },
    "sensor.supernotify_notifications": { state: String(extra.n || 1), attributes: {} },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => { ctlWS.push(m); return { response: {} }; },
});
{
  const el = document.createElement("supernotify-control-card");
  el.setConfig({ tiles: ["snooze"] });
  document.body.appendChild(el);
  el.hass = ctlHass();
  await wait(30);
  el._snzOpen = true; el._snz = { what: "DELIVERY", target: "", who: "EVERYONE", min: 30 };
  el._renderSnz(true);
  const sel = el.shadowRoot.getElementById("snzT");
  ok(!!sel, "BUG-2: pannello pausa con la tendina del canale");
  sel.focus();
  el._update();
  ok(el.shadowRoot.getElementById("snzT") === sel, "BUG-2: un update non ridisegna la tendina che l'utente sta usando");
  sel.blur();
  const chip = el.shadowRoot.querySelector("#snzp .sc");
  el._update();
  ok(el.shadowRoot.querySelector("#snzp .sc") === chip, "BUG-2: pannello identico -> stessi elementi, non ridisegnato");
  // catch-up list
  el._cu = [{ t: Date.now() - 60000, ti: "Porta aperta", all: true }, { t: Date.now() - 30000, ti: "Lavatrice", all: false }];
  el._renderCatchUp();
  const det = el.shadowRoot.querySelector("#cu details");
  det.open = true;
  el._update();
  const det2 = el.shadowRoot.querySelector("#cu details");
  ok(det2 && det2.open, "BUG-2: la lista «trattenute» resta aperta dopo un update");
  el.remove();
}
{
  ctlWS.length = 0;
  const el = document.createElement("supernotify-control-card");
  el.setConfig({ tiles: ["snooze"], status: false });
  document.body.appendChild(el);
  el.hass = ctlHass();
  await wait(30);
  el._update(); el._refreshOcc();
  await wait(30);
  const svcs = ctlWS.map((m) => m.service);
  ok(!svcs.includes("enquire_occupancy") && !svcs.includes("enquire_active_scenarios"),
    `BUG-7: status: false non chiede occupancy / scenari attivi (${svcs.join(",")})`);
  el.remove();
}
{
  // card in the page before its first hass (HA does it the other way too)
  ctlWS.length = 0;
  const el = document.createElement("supernotify-control-card");
  el.setConfig({ tiles: ["snooze"], last_notification: true });
  let lastCalls = 0;
  const orig = el._refreshLast;
  el._refreshLast = function () { if (this._hass) lastCalls++; return orig.call(this); };
  let occCalls = 0;
  const origOcc = el._refreshOcc;
  el._refreshOcc = function () { if (this._hass) occCalls++; return origOcc.call(this); };
  document.body.appendChild(el);
  await wait(10);
  el.hass = ctlHass({ n: 7 });
  await wait(30);
  ok(lastCalls === 1, `BUG-13: primo hass -> _refreshLast una volta (${lastCalls})`);
  ok(occCalls === 1, `BUG-13: primo hass -> legge anche chi è in casa (${occCalls})`);
  el.remove();
}

// ── BUG-3: bands slider released on the same value ────────────────────────────
{
  const B = { morning: { name: "Mattina", start: "input_datetime.m", volume: "input_number.m" },
    night: { name: "Notte", start: "input_datetime.n", volume: "input_number.n" } };
  const h = (v) => ({ language: "it", themes: { darkMode: false }, callService: async () => {},
    states: { "input_datetime.m": { state: "07:00:00" }, "input_number.m": { state: String(v) },
      "input_datetime.n": { state: "22:00:00" }, "input_number.n": { state: "10" } } });
  const el = document.createElement("supernotify-bands-card");
  el.setConfig({ bands: B });
  document.body.appendChild(el);
  el.hass = h(40);
  const r = el.shadowRoot.querySelector('input[type=range][data-e="input_number.m"]');
  r.dispatchEvent(new dom.window.Event("input"));
  r.dispatchEvent(new dom.window.Event("pointerup"));
  el.hass = h(70);
  const r2 = el.shadowRoot.querySelector('input[type=range][data-e="input_number.m"]');
  ok(+r2.value === 70, `BUG-3: rilasciato senza change, la card segue di nuovo lo stato (${r2.value})`);
  el.remove();
}

// ── BUG-4: archive detail cache ───────────────────────────────────────────────
{
  const P = proto("supernotify-archive-card");
  let calls = 0;
  const me = { _cache: new Map(), _hass: null, _config: {}, shadowRoot: null, _row: () => null, _showDetail() {}, _loadSnz() {},
    _scrollToDetail() {}, _fetch: async () => (++calls === 1 ? { ok: false, error: "timeout" } : { ok: true, n: {} }) };
  await P._select.call(me, "aaaa1111");
  await P._select.call(me, "aaaa1111");
  ok(calls === 2, `BUG-4: un errore temporaneo viene richiesto di nuovo (${calls} letture)`);
  await P._select.call(me, "aaaa1111");
  ok(calls === 2, "BUG-4: un esito ok resta in cache");
  me._fetch = async () => ({ ok: false, error: "gone", final: true });
  await P._select.call(me, "bbbb"); calls = 0;
  me._fetch = async () => { calls++; return { ok: true }; };
  await P._select.call(me, "bbbb");
  ok(calls === 0, "BUG-4: un documento che non esiste più non viene richiesto di nuovo");
  me._fetch = async () => ({ ok: true, n: {} });
  for (let i = 0; i < 70; i++) await P._select.call(me, "id" + i);
  ok(me._cache.size <= 60, `BUG-4: cache limitata a 60 voci (${me._cache.size})`);
}

// ── BUG-5: two appliances load their statistics in the same tick ──────────────
{
  window.localStorage.removeItem(api.SN_APPL_KEY);
  const hass = { callWS: async (m) => {
    await wait(m.statistic_ids[0] === "sensor.a_power" ? 20 : 5);
    if (m.period !== "hour") return {};
    const t0 = Date.parse(m.start_time);
    return { [m.statistic_ids[0]]: [{ start: t0, mean: 12.3456, max: 99.987 }, { start: t0 + 3600000, mean: 0.04, max: 1.26 }] };
  } };
  const ap = (id) => ({ id, power: id, threshold: 5, grace: 300000, minDur: 600000 });
  api.snAppl.loadStats(hass, ap("sensor.a_power"));
  api.snAppl.loadStats(hass, ap("sensor.b_power"));
  await wait(80);
  const c = JSON.parse(window.localStorage.getItem(api.SN_APPL_KEY) || "{}");
  ok(c["sensor.a_power"] && c["sensor.b_power"], `BUG-5: entrambe le voci nella cache (${Object.keys(c).join(", ")})`);
  const row = (c["sensor.a_power"] || c["sensor.b_power"] || { rows: [[0, 0, 0]] }).rows[0];
  ok(row[1] === 12.3 && row[2] === 100, `BUG-5: mean/max arrotondati a 1 decimale (${row})`);
}

// ── BUG-6: daily statistics, a transient error on the first call ──────────────
{
  const D = api.snStatsDaily;
  window.localStorage.removeItem("supernotify-stats-daily");
  let n = 0;
  const hass = { callWS: async () => { if (++n === 1) throw new Error("Connection lost"); return { response: { days: [{ date: "2026-10-22", count: 3 }] } }; } };
  const start = Date.now() - 3 * 86400000;
  const a = await D.get(hass, start);
  ok(a === null && D.ok === null, `BUG-6: disconnessione alla prima chiamata -> ok resta null (${D.ok})`);
  const b = await D.get(hass, start);
  ok(Array.isArray(b) && D.ok === true, "BUG-6: la chiamata dopo usa daily");
  D.ok = null;
  const h2 = { callWS: async () => { throw new Error("value must be one of ['summary', 'standard', 'full']"); } };
  await D.get(h2, start);
  ok(D.ok === false, "BUG-6: verbosity rifiutata -> ok false");
  D.ok = null;
  await D.get({ callWS: async () => ({ response: {} }) }, start);
  ok(D.ok === false, "BUG-6: risposta senza days -> ok false");
}

// ── BUG-8 / BUG-9: calls with a timeout ───────────────────────────────────────
{
  const never = { language: "it", callWS: () => new Promise(() => {}), states: {}, services: {} };
  delays.length = 0;
  proto("supernotify-tools-card")._call.call({ _hass: never }, "refresh_entities", {});
  ok(delays.includes(30000), "BUG-8: tools _call con timeout 30 s");
  delays.length = 0;
  proto("supernotify-simulator-card")._dry.call({ shadowRoot: { getElementById: () => ({}) }, _config: {}, _hass: never, _sel: new Set(), _prio: "medium" });
  ok(delays.includes(30000), "BUG-9: simulatore _dry con timeout 30 s");
  delays.length = 0;
  proto("supernotify-composer-card")._dryRun.call({ shadowRoot: { getElementById: () => ({ style: {} }) }, _config: {}, _hass: never,
    _dryAvailable: () => true, _payload: () => ({ message: "x" }), _renderDry() {} });
  ok(delays.includes(30000), "BUG-9: composer _dryRun con timeout 30 s");
}

// ── BUG-10: dashboard configuration read again after a failure ────────────────
{
  let n = 0;
  const hass = { user: { id: "u" }, callWS: async () => { n++; throw new Error("boom"); } };
  api.snDash.key = null; api.snDash.map = null;
  api.snDashEnsure(hass);
  await wait(20);
  ok(!api.snDash.map, `BUG-10: dopo un errore la mappa non è «vuota ma valida» (${JSON.stringify(api.snDash.map)})`);
  api.snDashEnsure(hass);
  await wait(20);
  ok(n === 1, `BUG-10: entro 60 s non riprova (${n})`);
  if ("failedAt" in api.snDash) api.snDash.failedAt = Date.now() - 61000;
  api.snDashEnsure(hass);
  await wait(20);
  ok(n === 2, `BUG-10: dopo 60 s riprova (${n})`);
}

// ── BUG-11: cards on other views still reachable, collected ones pruned ───────
{
  const el = document.createElement("supernotify-tools-card");
  el.setConfig({});
  document.body.appendChild(el);
  el.hass = { language: "it", themes: { darkMode: false }, states: {}, services: {}, callWS: async () => ({}) };
  ok(api.snCardOn("tools") === el, "BUG-11: card nella pagina trovata");
  el.remove();
  ok(api.snCardOn("tools") === null, "BUG-11: card su un'altra view (staccata) non è «sulla pagina»");
  document.body.appendChild(el);
  ok(api.snCardOn("tools") === el, "BUG-11: tornata visibile, di nuovo raggiungibile");
  el.remove();
  const before = api.snCards.size;
  api.snCards.add({ deref: () => undefined });
  api.snCardOn("tools");
  ok(api.snCards.size === before, `BUG-11: i riferimenti a card raccolte vengono potati (${before} -> ${api.snCards.size})`);
}

// ── BUG-12: snTech escapes like snEsc ─────────────────────────────────────────
{
  const h = api.snTech('a"b>c', "x");
  ok(h.includes("a&quot;b&gt;c"), "BUG-12: snTech usa snEsc (\" e > compresi)");
}

// ── EXTRA: stats from the archive without update.supernotify_update ───────────
{
  const P = proto("supernotify-stats-card");
  const h = (fields) => ({ states: {}, services: { supernotify: { enquire_archive: { fields } } } });
  ok(P._fromArchive.call({ _config: {}, _hass: h({ verbosity: {}, id: {} }) }) === true, "EXTRA: verbosity tra i campi dell'azione -> archivio");
  ok(P._fromArchive.call({ _config: {}, _hass: h({ id: {} }) }) === false, "EXTRA: azione senza verbosity -> cronologia");
}

// ── BUG-14: a channel skipped as DUPE is routine in the list as in the detail ──
{
  const DOC = { id: "abcd1234-x", created: new Date(Date.now() - 60000).toISOString(), message: "Porta", priority: "medium",
    outcome: "success", delivered: 1, condition_variables: { notification_title: "Porta" }, original_context: { id: "c1" },
    deliveries: { mobile_push: { success: [{ calls: [{}] }] }, alexa_announce: { skipped: { suppression_reason: "DUPE" } } } };
  const hass = { language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u", is_admin: true },
    services: { supernotify: { enquire_archive: {} } }, connection: { subscribeEvents: () => Promise.resolve(() => {}) },
    states: { "sensor.supernotify_notifications": { state: "1", attributes: {}, last_updated: "a" } },
    callService: async () => {}, callApi: async () => ({}),
    callWS: async (m) => {
      if (m.service === "enquire_archive") return { response: m.service_data.id ? DOC : { notifications: [DOC], count: 1 } };
      if (m.type === "logbook/get_events") return [];
      return { response: {} };
    } };
  const a = document.createElement("supernotify-archive-card");
  a.setConfig({});
  document.body.appendChild(a);
  a.hass = hass; await wait(150); a.hass = { ...hass }; await wait(300);
  const R = a.shadowRoot;
  const ic = R.querySelector("#list .it .ic");
  const pb = R.querySelectorAll("#det .c-pb").length;
  ok(pb === 0, `BUG-14: dettaglio, il canale DUPE è un salto di routine (${pb} problemi)`);
  ok(ic && ic.classList.contains("ok"), `BUG-14: lista, stessa classificazione del dettaglio (${ic && ic.className})`);
  a.remove();
}

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
