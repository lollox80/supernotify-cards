// CHANGELOG
// 2026-10-23 v1.0.0: audit fase 3 (prestazioni). Asserzioni misurabili: chiamate WS, assegnazioni di
//   innerHTML / ridisegni, niente _update dopo la disconnessione, eventi dell'archivio solo se cambia
//   qualcosa (SN_SRC=<file> per provarlo su un'altra copia del bundle).
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
process.on("unhandledRejection", () => {});
// count the intervals the bundle starts
let intervals = 0;
const si0 = global.setInterval;
global.setInterval = (...a) => { intervals++; return si0(...a); };
// count innerHTML assignments
let html = 0;
for (const P of [dom.window.Element.prototype, dom.window.ShadowRoot.prototype]) {
  const d = Object.getOwnPropertyDescriptor(P, "innerHTML");
  Object.defineProperty(P, "innerHTML", { ...d, set(v) { html++; return d.set.call(this, v); } });
}
const api = new dom.window.Function(SRC + "\nreturn { snArchiveStore, snStatsDaily, snEntityRows, snAppl, snActive, SN_ENQ, snEnquire };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (t) => new Date(t).toISOString();
const NOW = Date.now();
const S = (state, attributes = {}, t = NOW - 3600e3) => ({ state, attributes, last_changed: iso(t), last_updated: iso(t) });
const proto = (tag) => customElements.get(tag).prototype;
/** Counts the calls of a prototype method (outermost only). */
function count(tag, m) {
  const p = proto(tag), orig = p[m];
  const c = { n: 0 };
  let depth = 0;
  p[m] = function (...a) { if (depth++ === 0) c.n++; try { return orig.apply(this, a); } finally { depth--; } };
  return c;
}

const DOCS = Array.from({ length: 30 }, (_, i) => ({ id: `n${String(i).padStart(4, "0")}-0000`, created: iso(NOW - i * 600e3),
  message: `M ${i}`, title: `T ${i}`, priority: "medium", outcome: "success", deliveries: { mobile_push: { success: [{}] } } }));
const ws = [];
const baseStates = () => ({
  "sensor.supernotify_notifications": S("30"),
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push", transport: "mobile_push" }),
  "switch.supernotify_delivery_email": S("on", { name: "email", transport: "email", fallback: ["mobile_push"] }),
  "switch.supernotify_transport_mobile_push": S("on", { name: "mobile_push" }),
  "switch.supernotify_recipient_lorenzo": S("on", { entity_id: "person.lorenzo", email: "l@x" }),
  "person.lorenzo": S("home", { user_id: "u1", friendly_name: "Lorenzo" }),
  "switch.supernotify_scenario_morning": S("on", { name: "morning" }),
  "binary_sensor.supernotify_scenario_morning": S("unknown", { name: "morning" }),
});
const mkHass = (states, extra = {}) => ({
  language: "it", locale: { language: "it", time_format: "24" }, themes: { darkMode: false }, user: { id: "u1", is_admin: true },
  entities: {}, devices: {}, config: { version: "2026.10.1" },
  services: { supernotify: { enquire_archive: {}, enquire_active_scenarios: {}, enquire_snoozes: {}, enquire_deliveries_by_scenario: {},
    enquire_implicit_deliveries: {}, enquire_last_notification: {}, notify: { response: { optional: true } } } },
  connection: { subscribeEvents: async () => () => {}, subscribeMessage: async () => () => {} },
  states, callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m);
    const sd = m.service_data || {};
    if (m.service === "enquire_archive") {
      if (sd.verbosity === "daily") return { response: { days: [{ date: "2026-10-23", count: 3 }] } };
      return { response: { notifications: DOCS.slice(0, sd.limit || 20) } };
    }
    if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["morning"] } };
    if (m.service === "enquire_deliveries_by_scenario") return { response: { morning: { enabled: ["email"], disabled: [] } } };
    if (m.service === "enquire_implicit_deliveries") return { response: { default: ["mobile_push"] } };
    return { response: {} };
  },
  ...extra,
});
const svcCalls = (name) => ws.filter((m) => m.service === name).length;

// ── P-11: snEntityRows - a new array, the same rows ─────────────────────────
{
  const h = mkHass(baseStates());
  const a = api.snEntityRows(h, "delivery"), b = api.snEntityRows(h, "delivery");
  ok(a !== b && a.length === 2 && a[0] === b[0], "P-11: snEntityRows dà un array nuovo con le stesse righe (nessuna copia per riga)");
}

// ── P-2: archive store - an event only when something changed, merged ──────
{
  const S0 = api.snArchiveStore;
  let ev = 0;
  window.addEventListener("supernotify-archive", () => { ev++; });
  const st = baseStates();
  S0.ensure(mkHass(st), 20); S0.ensureLight(mkHass(st), 150);
  await wait(30);
  ok(ev === 1, `P-2: prima lettura (completa + leggera nello stesso tick) -> un solo evento (${ev})`);
  const v0 = S0.version, idx0 = S0.getIndex();
  ev = 0;
  const st2 = { ...st, "sensor.supernotify_notifications": S("31", {}, NOW) };
  S0.ensure(mkHass(st2), 20); S0.ensureLight(mkHass(st2), 150);
  await wait(30);
  ok(ev === 0 && S0.version === v0, `P-2: rilettura con le stesse notifiche -> nessun evento (${ev}), version invariata`);
  ok(S0.getIndex().items === idx0.items, "P-2: indice non ricostruito se nulla è cambiato");
  DOCS.unshift({ id: "nNEW-0000", created: iso(Date.now()), message: "nuova", title: "Nuova", priority: "high", outcome: "success", deliveries: {} });
  const st3 = { ...st, "sensor.supernotify_notifications": S("32", {}, Date.now()) };
  S0.ensure(mkHass(st3), 20); S0.ensureLight(mkHass(st3), 150);
  await wait(30);
  ok(ev === 1 && S0.getIndex().items.some((r) => r.fid === "nNEW-0000" || r.id === "nNEW-000"), `P-2: notifica nuova -> un evento (${ev}) e indice aggiornato`);
  // P-6: a quiet read (appliances) does not touch the archive card's store
  const before = S0.extra.size;
  const d = await S0.doc(mkHass(st3), "zzzz-not-in-list", true);
  ok(d === null || S0.extra.size === before, "P-6: lettura 'quiet' di un documento non entra in snArchiveStore.extra");
}

// ── P-3: archive card - one list redraw for events that come together ───────
{
  const lists = count("supernotify-archive-card", "_renderList");
  const el = document.createElement("supernotify-archive-card");
  el.setConfig({ priority_filters: false });
  document.body.appendChild(el);
  el.hass = mkHass(baseStates());
  await wait(60);
  ok(el.shadowRoot.querySelectorAll("#list .it").length > 0, "P-3: archivio disegnato");
  lists.n = 0;
  for (let i = 0; i < 10; i++) window.dispatchEvent(new CustomEvent("supernotify-archive"));
  await wait(10);
  ok(lists.n === 1, `P-3: 10 eventi nello stesso tick -> 1 ridisegno della lista (${lists.n})`);
  // one listener on the list: a tap on a row selects it
  const rowEl = el.shadowRoot.querySelectorAll("#list .it")[2];
  rowEl.click(); await wait(20);
  ok(el._sel === rowEl.dataset.id && rowEl.getAttribute("role") === "button", "P-3: tocco sulla riga (listener delegato) la seleziona; la riga resta un pulsante accessibile");
  el.remove();
  lists.n = 0;
  window.dispatchEvent(new CustomEvent("supernotify-archive")); await wait(10);
  ok(lists.n === 0, "P-3: card staccata, nessun ridisegno");
}

// ── P-10: daily totals - one call, shared and kept 60 s ─────────────────────
{
  const D = api.snStatsDaily;
  D.memo = null;
  window.localStorage.removeItem("supernotify-stats-daily");
  const h = mkHass(baseStates());
  const n0 = ws.filter((m) => (m.service_data || {}).verbosity === "daily").length;
  const start = Date.now() - 5 * 86400000;
  await Promise.all([D.get(h, start), D.get(h, start)]);
  await D.get(h, start); await D.get(h, start + 86400000);
  const n1 = ws.filter((m) => (m.service_data || {}).verbosity === "daily").length - n0;
  ok(n1 === 1, `P-10: 4 letture dei totali giornalieri (2 insieme, 2 dopo) -> 1 chiamata WS (${n1})`);
  const h2 = mkHass({ ...baseStates(), "sensor.supernotify_notifications": S("99", {}, Date.now()) });
  await D.get(h2, start);
  const n2 = ws.filter((m) => (m.service_data || {}).verbosity === "daily").length - n0;
  ok(n2 === 2, `P-10: il contatore cambia -> letto di nuovo (${n2})`);
}

// ── P-8: scenarios - no poll of their own, one request with three cards ─────
{
  api.snActive.names = null; api.snActive.t = 0; api.snActive.states = null; api.SN_ENQ.clear();
  const iv0 = intervals, n0 = svcCalls("enquire_active_scenarios");
  const cards = [];
  for (let i = 0; i < 3; i++) {
    const c = document.createElement("supernotify-scenarios-card");
    c.setConfig({ poll_seconds: 10 });
    document.body.appendChild(c);
    c.hass = mkHass(baseStates());
    cards.push(c);
  }
  await wait(60);
  ok(intervals === iv0, `P-8: nessun setInterval della card scenari (${intervals - iv0})`);
  const n = ws.filter((m) => m.service === "enquire_active_scenarios" && !(m.service_data || {}).trace).length - 0;
  ok(svcCalls("enquire_active_scenarios") - n0 <= 2 && n >= 1, `P-8: 3 card -> active (+ trace) una volta sola (${svcCalls("enquire_active_scenarios") - n0})`);
  // hass before snActive's answer: drawn again when it comes
  ok(cards[0].shadowRoot.querySelector('.row[data-name="morning"].act'), "P-8: risposta di snActive arrivata dopo il primo hass -> scenario attivo disegnato");
  cards.forEach((c) => c.remove());
}

// ── P-7b: deliveries - nothing changed, nothing rebuilt; one delegated listener ─
{
  const el = document.createElement("supernotify-deliveries-card");
  el.setConfig({});
  document.body.appendChild(el);
  const st = baseStates();
  el.hass = mkHass(st);
  await wait(20);
  const rows = el.shadowRoot.getElementById("rows");
  const first = rows.firstElementChild;
  html = 0;
  el._update(); el._update();
  ok(html === 0 && rows.firstElementChild === first, `P-7b deliveries: _update senza cambiamenti -> nessun innerHTML (${html})`);
  const r = rows.querySelector(".row");
  r.click(); await wait(10);
  ok(rows.querySelector('.row[aria-expanded="true"]'), "P-7b deliveries: tocco (listener delegato) apre il dettaglio");
  ok(/riserva di|fallback for/i.test(rows.textContent), "P-15 deliveries: «riserva di» dalla mappa precalcolata");
  el.remove();
}

// ── P-7b: overview - the same data, no rebuild ───────────────────────────────
{
  const el = document.createElement("supernotify-overview-card");
  el.setConfig({ last_notification: true });
  document.body.appendChild(el);
  el.hass = mkHass(baseStates());
  await wait(80);
  html = 0;
  el._update(); el._update();
  ok(html === 0, `P-7b overview: _update con gli stessi dati -> nessun innerHTML (${html})`);
  el.remove();
}

// ── P-14: simulator - one refresh at start, no baseline in dry-run mode ─────
{
  const n0 = svcCalls("enquire_deliveries_by_scenario"), i0 = svcCalls("enquire_implicit_deliveries");
  api.SN_ENQ.clear();
  const el = document.createElement("supernotify-simulator-card");
  el.setConfig({});
  document.body.appendChild(el);
  el.hass = mkHass(baseStates());
  await wait(60);
  ok(svcCalls("enquire_deliveries_by_scenario") - n0 === 1, `P-14 simulatore: by_scenario una volta all'avvio (${svcCalls("enquire_deliveries_by_scenario") - n0})`);
  ok(svcCalls("enquire_implicit_deliveries") - i0 === 0, "P-14 simulatore: in modalità dry run niente enquire_implicit_deliveries");
  const dry0 = svcCalls("notify");
  el._simulate(); el.remove(); await wait(400);
  ok(svcCalls("notify") === dry0, "P-16 simulatore: dry run programmato e card staccata -> non parte");
}

// ── P-13: tile feature - one draw for hass + context + stateObj ─────────────
{
  const draws = count("supernotify-last", "_draw");
  const f = document.createElement("supernotify-last");
  f.setConfig({ type: "custom:supernotify-last" });
  document.body.appendChild(f);
  const h = mkHass(baseStates());
  f.hass = h; f.context = { entity_id: "sensor.supernotify_notifications" }; f.stateObj = h.states["sensor.supernotify_notifications"];
  await wait(5);
  ok(draws.n === 1, `P-13: tre setter nello stesso tick -> un _draw (${draws.n})`);
}

// ── P-1 / P-4 / P-5 / P-16: appliances ───────────────────────────────────────
{
  const A = api.snAppl;
  const entities = {
    "sensor.lav_power": { entity_id: "sensor.lav_power", device_id: "d1", platform: "shelly" },
    "switch.lav_plug": { entity_id: "switch.lav_plug", device_id: "d1", platform: "shelly" },
  };
  const devices = { d1: { id: "d1", name: "Lavatrice" } };
  const statsReads = [];
  const st = (w) => ({ ...baseStates(), "sensor.lav_power": S(String(w), { device_class: "power", state_class: "measurement", friendly_name: "Lavatrice Power" }, NOW - 1800e3),
    "switch.lav_plug": S("on") });
  const ah = (w) => mkHass(st(w), { entities, devices, callWS: async (m) => {
    ws.push(m);
    if (m.type === "config_entries/get") return [{ entry_id: "e1", title: "Lavatrice", domain: "appliance_autonotify" }];
    if (m.type === "config_entries/flow/progress") return [];
    if (m.type === "recorder/statistics_during_period") {
      statsReads.push(m);
      const out = [];
      for (let t = Math.ceil(Date.parse(m.start_time) / 300e3) * 300e3; t < Date.parse(m.end_time); t += 300e3) out.push({ start: t, mean: 1, max: 2 });
      return { "sensor.lav_power": out };
    }
    if (m.service === "enquire_archive") return { response: { notifications: [] } };
    return { response: {} };
  } });
  const el = document.createElement("supernotify-appliances-card");
  el.setConfig({});
  document.body.appendChild(el);
  el.hass = ah(1500);
  await wait(150);
  el.hass = ah(1500);
  await wait(100);
  const ap = A.appliances(ah(1500), el._config)[0];
  ok(ap && Array.isArray(ap.ents) && ap.ents.length === 2, "P-4: snApplResolve tiene le entità del dispositivo (ap.ents)");
  // P-1: two loads at once read once; the next reading asks only the last hour of 5-minute rows
  const e = A.stats.get("sensor.lav_power");
  ok(e && Array.isArray(e.fine) && e.fine.length > 100, `P-1: prima lettura completa (${e && e.fine && e.fine.length} righe da 5 min)`);
  statsReads.length = 0;
  e.at = 0;
  A.loadStats(ah(1500), ap); A.loadStats(ah(1500), ap);
  await wait(30);
  const fine = statsReads.filter((m) => m.period === "5minute");
  ok(fine.length === 1, `P-1: due loadStats insieme -> una lettura (inflight) (${fine.length})`);
  const span = fine.length ? (Date.parse(fine[0].end_time) - Date.parse(fine[0].start_time)) / 60000 : 1e9;
  ok(span <= 70, `P-1: la rilettura chiede solo l'ultima ora circa (${Math.round(span)} min)`);
  // P-5: a power change rewrites the power text, not the body
  const body = el.shadowRoot.getElementById("body");
  const card0 = body.firstElementChild;
  html = 0;
  el.hass = ah(1600);
  await wait(10);
  ok(body.firstElementChild === card0 && /1[.,]6\s?kW|1600/.test(body.textContent), `P-5: la potenza cambia -> testo aggiornato senza ricostruire la lista (innerHTML ${html})`);
  ok(html <= 2, `P-5: al più le scritte della potenza (${html} innerHTML)`);
  // panel open: same
  el._openPanel(ap.id); await wait(30);
  const sheet = el.shadowRoot.querySelector(".ov .sheet");
  html = 0;
  el.hass = ah(1700); await wait(10);
  ok(el.shadowRoot.querySelector(".ov .sheet") === sheet && /1[.,]7\s?kW|1700/.test(sheet.textContent), `P-5: pannello aperto -> stesso foglio, potenza aggiornata (innerHTML ${html})`);
  // P-16: no _update after the card left the page
  const upd = count("supernotify-appliances-card", "_update");
  el._msg[ap.id] = { ok: true, text: "x" }; el._msgLater(ap.id);
  el._arm("e1|switch_off");
  upd.n = 0;
  el.remove();
  await wait(60);
  ok(!el._msgT && el._armed == null, "P-16: timer dei messaggi e del doppio tocco annullati alla disconnessione");
  ok(upd.n === 0, `P-16: nessun _update dopo la disconnessione (${upd.n})`);
  // P-7: events read again only when the counter moved
  const r0 = ws.filter((m) => m.service === "enquire_archive" && (m.service_data || {}).verbosity === "summary" && (m.service_data || {}).limit === 500).length;
  A.rowsAt = Date.now() - 60000; // older than the 30 s of before
  A.refreshEvents(ah(1700));
  await wait(20);
  const r1 = ws.filter((m) => m.service === "enquire_archive" && (m.service_data || {}).verbosity === "summary" && (m.service_data || {}).limit === 500).length;
  ok(r1 === r0, `P-7: contatore fermo -> eventi degli elettrodomestici non riletti dopo 30 s (${r1 - r0})`);
  const h3 = ah(1700); h3.states["sensor.supernotify_notifications"] = S("77", {}, Date.now());
  A.rowsAt = Date.now() - 5000;
  A.refreshEvents(h3);
  await wait(20);
  const r2 = ws.filter((m) => m.service === "enquire_archive" && (m.service_data || {}).verbosity === "summary" && (m.service_data || {}).limit === 500).length;
  ok(r2 === r0 + 1, `P-7: contatore cambiato -> riletti (${r2 - r0})`);
}

// ── P-16: recipients - no redraw after the card left the page ──────────────
{
  const el = document.createElement("supernotify-recipients-card");
  el.setConfig({});
  document.body.appendChild(el);
  const st = { ...baseStates(), "notify.recipient_lorenzo": S("unknown") };
  el.hass = mkHass(st);
  await wait(20);
  const upd = count("supernotify-recipients-card", "_update");
  el.shadowRoot.querySelector(".tst").click();
  ok(el._armed === "lorenzo", "recipients: primo tocco della prova arma il pulsante (listener delegato)");
  upd.n = 0;
  el.remove();
  ok(el._armed == null, "P-16 recipients: disconnessione -> pulsante disarmato, timer annullato");
}

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
