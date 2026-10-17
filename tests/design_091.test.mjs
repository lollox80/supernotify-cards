// v0.91.0: supernotify-appliances-card 0.1.0 e vista "SuperNotifier" della strategy.
// Un HA finto come quello di casa: Lavatrice finita con 3 promemoria, Lavastoviglie ferma,
// Asciugatrice spenta, Bruno (Ecovacs) in errore 312 con il filtro al 5%, un forno trovato e non
// configurato. Poi una lavastoviglie in funzione, un utente non admin e zero elettrodomestici.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/supernotify/appliances" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const api = new dom.window.Function(SRC + "\nreturn { snAppl, snApplCycles, snApplTypes, snApplClassify, snApplEstimate, SN_APPL_STRINGS, SN_I18N_EXTRA, SupernotifyDashboardStrategy };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
const NOW = Date.now(), MIN = 60000, H = 3600000, D = 86400000;
const iso = (t) => new Date(t).toISOString();
const hm = (t) => new Date(t).toLocaleTimeString("it", { hour: "2-digit", minute: "2-digit", hour12: false });

// ── entries, come config_entries/get su casa ─────────────────────────────
const E = { disc: "01M4JKFNZRZ98NDDPJMTD3PD74", lavast: "01M4JSHYRERQ3R4GP3T393Z55J", lav: "01M4JSK6Q7SD8RS3R4AKT2EKP6",
  bruno: "01M4XPRBMTWQNWJ2ETN2RS1AB1", asc: "01M4Y4E01DAR2GZD479NP5AC51", ascIgn: "01M4Y4EXJ42AQSYTTHWB5HG6WH" };
const entry = (id, title, source = "user") => ({ entry_id: id, domain: "appliance_autonotify", title, source, state: "loaded", disabled_by: null });
let ENTRIES = [entry(E.disc, "Automatic discovery"), entry(E.lavast, "Lavastoviglie"), entry(E.lav, "Lavatrice"),
  entry(E.bruno, "Bruno", "import"), entry(E.asc, "Asciugatrice", "integration_discovery"), entry(E.ascIgn, "Asciugatrice", "ignore")];
const FLOWS = [{ flow_id: "f1", handler: "appliance_autonotify", context: { source: "integration_discovery", title_placeholders: { name: "Forno" } } },
  { flow_id: "f2", handler: "hue", context: { source: "zeroconf" } }];

// ── registro: dispositivi ed entità ───────────────────────────────────────
const devices = {
  dLav: { id: "dLav", name: "Presa Lavatrice", name_by_user: null }, dLavst: { id: "dLavst", name: "Presa Lavastoviglie", name_by_user: null },
  dAsc: { id: "dAsc", name: "Presa Asciugatrice", name_by_user: null },
  dBruno: { id: "dBruno", name: "Bruno", name_by_user: null }, dDreame: { id: "dDreame", name: "Bruno", name_by_user: "Bruno 2" },
};
const ent = (entity_id, device_id, platform, extra = {}) => ({ entity_id, device_id, platform, ...extra });
const entities = Object.fromEntries([
  ent("sensor.presa_lavatrice_power", "dLav", "mqtt"), ent("switch.presa_lavatrice", "dLav", "mqtt"), ent("sensor.presa_lavatrice_energy", "dLav", "mqtt"),
  ent("sensor.presa_lavastoviglie_power", "dLavst", "mqtt"), ent("switch.presa_lavastoviglie", "dLavst", "mqtt"),
  ent("sensor.presa_lavastoviglie_device_power", "dLavst", "powercalc"),
  ent("sensor.presa_asciugatrice_power", "dAsc", "mqtt"), ent("switch.presa_asciugatrice", "dAsc", "mqtt"),
  ent("vacuum.bruno", "dBruno", "ecovacs"), ent("sensor.bruno_errore", "dBruno", "ecovacs", { translation_key: "error", entity_category: "diagnostic" }),
  ent("sensor.bruno_batteria", "dBruno", "ecovacs", { entity_category: "diagnostic" }),
  ent("sensor.bruno_durata_filtro", "dBruno", "ecovacs", { translation_key: "lifespan_filter", entity_category: "diagnostic" }),
  ent("sensor.bruno_durata_spazzola_principale", "dBruno", "ecovacs", { translation_key: "lifespan_brush", entity_category: "diagnostic" }),
  ent("vacuum.dreame_p2150a", "dDreame", "xiaomi_home"),
].map((e) => [e.entity_id, e]));
const st = (state, attributes = {}) => ({ state, attributes, last_changed: iso(NOW - 3 * H), last_updated: iso(NOW - 3 * H) });
const pw = (w, fn) => st(String(w), { device_class: "power", unit_of_measurement: "W", state_class: "measurement", friendly_name: fn });
const baseStates = () => ({
  "sensor.supernotify_notifications": st("40"),
  "sensor.presa_lavatrice_power": pw(1.2, "Presa Lavatrice Potenza"), "switch.presa_lavatrice": st("on"),
  "sensor.presa_lavatrice_energy": st("120", { device_class: "energy", unit_of_measurement: "kWh", state_class: "total_increasing" }),
  "sensor.presa_lavastoviglie_power": pw(0.4, "Presa Lavastoviglie Potenza"), "switch.presa_lavastoviglie": st("on"),
  "sensor.presa_lavastoviglie_device_power": pw(3, "Presa lavastoviglie Device Power"),
  "sensor.presa_asciugatrice_power": pw(0, "Presa Asciugatrice Potenza"), "switch.presa_asciugatrice": st("off"),
  "vacuum.bruno": st("error", { friendly_name: "Bruno", battery_level: 80 }),
  "sensor.bruno_errore": st("312", { friendly_name: "Bruno Errore", description: "Robot bloccato" }),
  "sensor.bruno_batteria": st("80", { device_class: "battery", unit_of_measurement: "%", friendly_name: "Bruno Batteria" }),
  "sensor.bruno_durata_filtro": st("5", { unit_of_measurement: "%", friendly_name: "Bruno Durata filtro" }),
  "sensor.bruno_durata_spazzola_principale": st("64", { unit_of_measurement: "%", friendly_name: "Bruno Durata spazzola principale" }),
  "vacuum.dreame_p2150a": st("docked", { friendly_name: "Bruno 2" }),
});

// ── archivio: quello che Autonotify ha mandato ─────────────────────────────
const tLavStart = NOW - 200 * MIN, tLavEnd = NOW - 120 * MIN;
const DOCS = [];
const doc = (id, t, title, message, extra, actions = []) => DOCS.push({ id, created: iso(t), title: null, message, priority: "medium",
  outcome: "success", condition_variables: { notification_title: title }, extra_data: extra, actions,
  deliveries: { mobile_push: { success: [{ calls: [{}] }] } } });
const tag = (id, end) => `appliance_${id}${end ? "_end" : ""}`;
const btns = (id) => [{ action: `APPLIANCE_FINISHED_${id}` }, { action: `APPLIANCE_REMIND_${id}` }, { action: `APPLIANCE_SWITCH_OFF_${id}` }];
doc("lav-start", tLavStart, "Lavatrice", "Lavatrice started", { mobile_push_notification_tag: tag(E.lav), live_update: true });
doc("lav-clear", tLavEnd, "Lavatrice", "Lavatrice is finished", { mobile_push_notification_tag: tag(E.lav), mobile_push_clear_notification: true });
doc("lav-end", tLavEnd + 2000, "Lavatrice", "Lavatrice is finished", { notification_icon: "mdi:washing-machine", mobile_push_notification_tag: tag(E.lav, true) }, btns(E.lav));
for (const [i, m] of [[1, 90], [2, 60], [3, 30]]) doc(`lav-rem${i}`, NOW - m * MIN, "Lavatrice", "Lavatrice is finished", { mobile_push_notification_tag: tag(E.lav, true) }, btns(E.lav));
// la lavastoviglie: un ciclo ieri, svuotata
doc("ls-start", NOW - 26 * H, "Lavastoviglie", "Lavastoviglie started", { mobile_push_notification_tag: tag(E.lavast), live_update: true });
doc("ls-clear", NOW - 24 * H, "Lavastoviglie", "Lavastoviglie is finished", { mobile_push_notification_tag: tag(E.lavast), mobile_push_clear_notification: true });
doc("ls-end", NOW - 24 * H + 2000, "Lavastoviglie", "Lavastoviglie is finished", { mobile_push_notification_tag: tag(E.lavast, true) }, btns(E.lavast));
doc("ls-emptied", NOW - 23 * H, "Lavastoviglie", "Lavastoviglie is finished", { mobile_push_notification_tag: tag(E.lavast, true), mobile_push_clear_notification: true });
// Bruno: partito, poi bloccato
doc("br-start", NOW - 50 * MIN, "Bruno", "Bruno started", { mobile_push_notification_tag: tag(E.bruno), live_update: true });
doc("br-stuck", NOW - 20 * MIN, "Bruno", "Bruno ha bisogno di aiuto", { notification_icon: "mdi:robot-vacuum" });
// altro
doc("other", NOW - 10 * MIN, "Aggiornamenti HACS", "Nuovi aggiornamenti", {});
DOCS.sort((a, b) => b.created.localeCompare(a.created));
const summarize = (c) => ({ id: c.id, created: c.created, outcome: c.outcome, message: c.message,
  title: (c.condition_variables || {}).notification_title, priority: c.priority, deliveries: { mobile_push: { success: 1 } } });

// ── statistiche della presa della lavatrice ───────────────────────────────
// cicli: corti da 60 min (0,6 kWh) e lunghi da 150 min (1,5 kWh) negli ultimi 9 giorni, uno da 22 h 12 min
// 7 giorni fa (anomalo) e quello di oggi; prima, a ore, due cicli a inizio anno
const CYC = [];
for (let d = 9; d >= 2; d--) if (d !== 6) CYC.push([NOW - d * D - 2 * H, d % 2 ? 60 : 150]);
CYC.push([NOW - 7 * D + 3 * H, 22 * 60 + 12]);
CYC.push([tLavStart, 80]);
const fine5 = () => {
  const out = [];
  const from = Math.floor((NOW - 10 * D) / (5 * MIN)) * 5 * MIN;
  for (let t = from; t < NOW - 5 * MIN; t += 5 * MIN) {
    const on = CYC.some(([s, m]) => t >= s && t < s + m * MIN);
    out.push({ start: t, end: t + 5 * MIN, mean: on ? 600 : 0.8, max: on ? 2100 : 1.4 });
  }
  return out;
};
const hourly = (from, to) => {
  const out = [];
  for (let t = Math.ceil(from / H) * H; t < to; t += H) {
    const d = new Date(t);
    const on = d.getMonth() === 0 && d.getDate() <= 2 && d.getHours() === 10;
    out.push({ start: t, end: t + H, mean: on ? 700 : 0.8, max: on ? 2100 : 1.4 });
  }
  return out;
};

const calls = [];
const mkHass = (opts = {}) => ({
  language: "it", locale: { language: "it" }, themes: { darkMode: false }, config: { currency: "EUR", version: "2026.10.1" },
  user: { id: "u1", is_admin: opts.admin !== false }, devices, entities, states: opts.states || baseStates(),
  services: { supernotify: { enquire_archive: {}, enquire_snoozes: {}, snooze: {} } },
  callService: async (domain, service, data) => { calls.push({ svc: `${domain}.${service}`, data }); },
  callApi: async () => ({}),
  callWS: async (m) => {
    calls.push(m);
    if (m.type === "config_entries/get") return opts.entries || ENTRIES;
    if (m.type === "config_entries/flow/progress") return FLOWS;
    if (m.type === "fire_event") return { context: {} };
    if (m.type === "recorder/statistics_during_period") {
      const id = m.statistic_ids[0];
      if (id !== "sensor.presa_lavatrice_power" && id !== "sensor.presa_lavastoviglie_power") return {};
      const a = Date.parse(m.start_time), b = Date.parse(m.end_time);
      const rows = m.period === "5minute" ? fine5().filter((r) => r.start >= a && r.start < b) : hourly(a, b);
      return { [id]: rows };
    }
    if (m.type === "logbook/get_events") return [];
    const sd = m.service_data || {};
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    if (m.service === "enquire_archive") {
      if (sd.id) return { response: (opts.docs || DOCS).find((d) => d.id === sd.id) };
      let list = (opts.docs || DOCS).filter((d) => !sd.after || d.created >= sd.after).slice(0, sd.limit || 20);
      if (sd.verbosity === "summary") list = list.map(summarize);
      return { response: { notifications: list, count: list.length } };
    }
    return {};
  },
});

// ── 0. funzioni ───────────────────────────────────────────────────────────
const bins = fine5().map((r) => ({ t: r.start, dt: 5 * MIN, mean: r.mean, max: r.max }));
const cy = api.snApplCycles(bins, 5, 300000, 300000);
ok(cy.length === 9, `cicli dalle statistiche a 5 minuti: 9 (${cy.length})`);
const long = cy.find((c) => c.end - c.start > 20 * H);
ok(long && Math.abs((long.end - long.start) - (22 * 60 + 12) * MIN) <= 5 * MIN, "il ciclo da 22 h 12 min c'è");
ok(Math.abs(cy[0].kwh - (cy[0].end - cy[0].start) / H * 0.6) < 0.05, `kWh integrati dalla media (${cy[0].kwh.toFixed(2)})`);
const types = api.snApplTypes(cy.map((c) => ({ ...c, anomalous: c.end - c.start > 20 * H })));
ok(types.split && Math.round(types.short.dur / MIN) <= 85 && Math.round(types.long.dur / MIN) === 150, `corti e lunghi separati (${Math.round(types.short.dur / MIN)} / ${Math.round(types.long.dur / MIN)} min)`);
ok(api.snApplClassify(DOCS.find((d) => d.id === "lav-rem3"), "x").kind === "end"
  && api.snApplClassify(DOCS.find((d) => d.id === "ls-emptied"), "x").kind === "emptied"
  && api.snApplClassify(DOCS.find((d) => d.id === "br-stuck"), E.bruno).kind === "stuck", "classifica fine, svuotata, bloccato");
const enKeys = Object.keys(api.SN_APPL_STRINGS.en);
const missing = Object.entries(api.SN_I18N_EXTRA).flatMap(([l, d]) => enKeys.filter((k) => !(d.SN_APPL_STRINGS || {})[k]).map((k) => `${l}.${k}`));
ok(!missing.length && Object.keys(api.SN_APPL_STRINGS.it).length === enKeys.length, `testi in 11 lingue (${missing.slice(0, 5)})`);

// ── 1. la card ────────────────────────────────────────────────────────────
const hass = mkHass();
const card = document.createElement("supernotify-appliances-card");
card.setConfig({ price_per_kwh: 0.3 });
document.body.appendChild(card);
card.hass = hass;
await wait(400); card.hass = mkHass(); await wait(400);
const R = card.shadowRoot;
const opened = [...R.querySelectorAll(".ap")].map((n) => txt(n.querySelector(".nm")));
const idle = [...R.querySelectorAll(".row")].map((n) => txt(n.querySelector(".rb b")));
console.log("    aperte:", opened.join(", "), "· ferme:", idle.join(", "));
ok(opened.join(",") === "Bruno,Lavatrice", "prima ciò che chiede un'azione: Bruno (errore) e Lavatrice (da svuotare)");
ok(idle.join(",") === "Asciugatrice,Lavastoviglie", "sotto «Fermi» Asciugatrice e Lavastoviglie, una riga ciascuna");
ok(!txt(R).includes("Automatic discovery") && idle.filter((n) => n === "Asciugatrice").length === 1, "niente entry di discovery né ignorate");
ok(txt(R.querySelector(".sec")) === "Fermi", "sezione Fermi");
const lav = [...R.querySelectorAll(".ap")].find((n) => /Lavatrice/.test(txt(n.querySelector(".nm"))));
ok(/Finito · da svuotare/.test(txt(lav.querySelector(".st"))) && lav.querySelector(".dot.done"), "Lavatrice: «Finito · da svuotare», pallino arancio");
const note = txt([...lav.querySelectorAll(".note")].find((n) => /promemoria/.test(n.textContent)));
ok(note.includes(`Fine ciclo alle ${hm(tLavEnd)}`) && note.includes(`+3 promemoria fino alle ${hm(NOW - 30 * MIN)}`), `promemoria raggruppati: «${note}»`);
const sum = txt(lav.querySelector(".sum"));
console.log("    riassunto:", sum);
ok(sum.includes(`${hm(tLavStart)} → ${hm(tLavEnd)}`) && /1\sh\s20\smin/.test(sum) && /kWh/.test(sum) && /€/.test(sum), "inizio → fine, durata, kWh, €");
ok(txt(lav.querySelector(".pb")) === "Svuotata" && lav.querySelectorAll(".pb").length === 1, "un solo pulsante: Svuotata");
ok(lav.querySelector('[data-open] ha-icon[icon="mdi:washing-machine"]'), "illustrazione: icona mdi (card skyrotter non installate)");
ok(/Dettagli, consumi e cicli/.test(txt(lav.querySelector(".lnk"))), "link Dettagli, consumi e cicli");
const br = R.querySelector(".ap");
ok(/Ha bisogno di aiuto/.test(txt(br.querySelector(".st"))) && br.querySelector(".dot.err"), "Bruno: rosso, ha bisogno di aiuto");
ok(/#312/.test(txt(br)) && /Robot bloccato/.test(txt(br)), "errore 312 con la descrizione");
ok(/Durata filtro al 5%/.test(txt(br)) && !/spazzola/.test(txt(br)), "consumabile sotto il 10%: filtro al 5% (la spazzola al 64% no)");
ok(txt(br.querySelector(".pb")) === "Riprendi pulizia", "Bruno: Riprendi pulizia");
const ls = [...R.querySelectorAll(".row")].find((n) => /Lavastoviglie/.test(n.textContent));
ok(/Fermo · Ultimo ciclo ieri/.test(txt(ls)), `Lavastoviglie: ${txt(ls.querySelector(".rs"))}`);
const asc = [...R.querySelectorAll(".row")].find((n) => /Asciugatrice/.test(n.textContent));
ok(/Spento/.test(txt(asc)), "Asciugatrice: spenta (presa spenta)");
ok(txt(R.getElementById("newdev")) === "1 nuovo dispositivo ›" && R.querySelector('#newdev a[href="/config/integrations/integration/appliance_autonotify"]'),
  "badge «1 nuovo dispositivo» verso la pagina dell'integrazione");
const ap = api.snAppl.appliances(hass, card._config);
ok(ap.find((a) => a.id === E.lavast).power === "sensor.presa_lavastoviglie_power", "la presa vera, non quella di Powercalc");
ok(ap.find((a) => a.id === E.bruno).vacuum === "vacuum.bruno", "Bruno: l'Ecovacs, non il Dreame «Bruno 2»");
ok(ap.find((a) => a.id === E.lav).switch === "switch.presa_lavatrice", "presa della lavatrice dallo stesso dispositivo");

// ── 2. i pulsanti ─────────────────────────────────────────────────────────
calls.length = 0;
br.querySelector(".pb").onclick(); await wait(50);
ok(calls.some((c) => c.svc === "vacuum.start" && c.data.entity_id === "vacuum.bruno"), "Riprendi pulizia = vacuum.start");
lav.querySelector(".more").onclick({ stopPropagation() {} }); await wait(20);
const items = [...R.querySelectorAll(".menu .mi")].map((b) => txt(b));
ok(items.join("|") === "Spegni presa|Ricordamelo dopo|Dettagli|Impostazioni", `menu ⋮: ${items.join(" | ")}`);
ok(document.activeElement === card && R.activeElement && R.activeElement.classList.contains("mi"), "il fuoco va al menu");
[...R.querySelectorAll(".menu .mi")].find((b) => /Ricordamelo/.test(b.textContent)).onclick({ stopPropagation() {} });
await wait(50);
const remind = calls.find((c) => c.type === "fire_event");
ok(remind && remind.event_type === "mobile_app_notification_action" && remind.event_data.action === `APPLIANCE_REMIND_${E.lav}`, "Ricordamelo dopo = evento APPLIANCE_REMIND_<entry>");
calls.length = 0;
[...R.querySelectorAll(".ap")].find((n) => /Lavatrice/.test(n.textContent)).querySelector(".pb").onclick();
await wait(80);
const fin = calls.find((c) => c.type === "fire_event");
ok(fin && fin.event_data.action === `APPLIANCE_FINISHED_${E.lav}`, "Svuotata = lo stesso evento del pulsante Finito (APPLIANCE_FINISHED_<entry>)");
ok(/Fatto: i promemoria si fermano/.test(txt(R)), "conferma");
ok(![...R.querySelectorAll(".ap")].some((n) => /Lavatrice/.test(n.textContent)) && [...R.querySelectorAll(".row")].some((n) => /Lavatrice/.test(n.textContent)),
  "la Lavatrice passa tra le ferme");

// ── 3. il pannello dettagli ───────────────────────────────────────────────
[...R.querySelectorAll(".row")].find((n) => /Lavatrice/.test(n.textContent)).onclick({ preventDefault() {} });
await wait(300);
const sheet = R.querySelector(".ov .sheet");
ok(sheet && sheet.getAttribute("role") === "dialog" && sheet.getAttribute("aria-modal") === "true", "pannello: dialog modale");
ok(/Lavatrice/.test(txt(sheet.querySelector(".ph"))) && /ora 1 W/.test(txt(sheet.querySelector(".ph"))), `testata con stato e potenza (${txt(sheet.querySelector(".ph"))})`);
const tiles = [...sheet.querySelectorAll(".tile")].map((t) => txt(t));
console.log("    riquadri:", tiles.join(" | "));
ok(tiles.length === 4 && /^Oggi/.test(tiles[0]) && /^Anno/.test(tiles[3]) && tiles.every((t) => /kWh/.test(t) && /cicl/.test(t) && /€/.test(t)), "Oggi / Settimana / Mese / Anno con kWh, cicli e costo");
const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
const inMonth = cy.filter((c) => c.start >= m0.getTime() && c.end < NOW - 30 * MIN).length;
ok(sheet.querySelectorAll(".bars .b").length === inMonth, `una barra per ciclo del mese (${sheet.querySelectorAll(".bars .b").length}/${inMonth})`);
ok(sheet.querySelectorAll(".bars .b.anom").length === (long.start >= m0.getTime() ? 1 : 0), "il ciclo da 22 h in arancio");
ok(sheet.querySelector(".bars .b.short") && sheet.querySelector(".bars .b.long"), "corti e lunghi di colori diversi");
ok(/Corti · media/.test(txt(sheet.querySelector(".leg"))) && /Lunghi · media 2\sh\s30\smin/.test(txt(sheet.querySelector(".leg"))), `legenda con le medie (${txt(sheet.querySelector(".leg"))})`);
ok(sheet.querySelectorAll(".tb tbody tr").length === 8 && sheet.querySelector(".tb tr.anom"), "tabella degli ultimi cicli, l'anomalo segnato");
ok(/a ore/.test(txt(sheet)), "dice che i cicli vecchi sono a ore");
ok(sheet.querySelector("#pNotifs") && /Impostazioni/.test(txt(sheet.querySelector("#pSettings"))), "pulsanti Notifiche e Impostazioni");
ok(R.activeElement && R.activeElement.classList.contains("x"), "fuoco sul pulsante Chiudi");
R.getElementById("ov").onkeydown({ key: "Escape" });
ok(!R.querySelector(".ov .sheet"), "Esc chiude");

// ── 4. dall'URL: ?device= in testa con il bordo blu ───────────────────────
dom.reconfigure({ url: `http://ha.local/supernotify/appliances?device=${E.lavast}` });
const c2 = document.createElement("supernotify-appliances-card");
c2.setConfig({});
document.body.appendChild(c2);
c2.hass = mkHass(); await wait(200);
const first = c2.shadowRoot.querySelector(".ap");
ok(first && /Lavastoviglie/.test(txt(first.querySelector(".nm"))) && first.classList.contains("flash"), "?device=<entry>: Lavastoviglie in testa, evidenziata");
ok(!/€/.test(txt(c2.shadowRoot)), "senza prezzo nessun costo");
dom.reconfigure({ url: "http://ha.local/supernotify/appliances" });

// ── 5. in funzione: fine prevista dai cicli dello stesso tipo ──────────────
const runDocs = [...DOCS.filter((d) => !d.id.startsWith("lav")), { id: "lav-run", created: iso(NOW - 40 * MIN), message: "Lavatrice started",
  condition_variables: { notification_title: "Lavatrice" }, extra_data: { mobile_push_notification_tag: tag(E.lav), live_update: true }, deliveries: {} }];
api.snAppl.rows = []; api.snAppl.rowsAt = 0; api.snAppl.events.clear(); api.snAppl.finished.clear();
const runStates = baseStates(); runStates["sensor.presa_lavatrice_power"] = pw(1900, "Presa Lavatrice Potenza");
const c3 = document.createElement("supernotify-appliances-card");
c3.setConfig({});
document.body.appendChild(c3);
c3.hass = mkHass({ docs: runDocs, states: runStates });
api.snAppl.refreshEvents(mkHass({ docs: runDocs, states: runStates }), true);
await wait(300); c3.hass = mkHass({ docs: runDocs, states: runStates }); await wait(200);
const run = [...c3.shadowRoot.querySelectorAll(".ap")].find((n) => /Lavatrice/.test(n.textContent));
console.log("    in funzione:", txt(run).slice(0, 160));
ok(run && /In funzione/.test(txt(run.querySelector(".st"))) && run.querySelector(".dot.run"), "in funzione, pallino blu");
ok(run && /Fine prevista/.test(txt(run.querySelector(".eta"))) && run.querySelector(".bar i") && /mancano/.test(txt(run.querySelector(".left"))), "fine prevista, barra, tempo rimasto");
ok(run && /stima dai cicli simili/.test(txt(run)), "dice che è una stima dai cicli simili");
ok(run && !run.querySelector(".pb"), "in funzione nessun pulsante principale (silenziare per elettrodomestico non è possibile)");

// ── 6. utente non admin: niente pulsanti con fire_event ───────────────────
api.snAppl.rows = []; api.snAppl.rowsAt = 0; api.snAppl.events.clear(); api.snAppl.at = 0;
const c4 = document.createElement("supernotify-appliances-card");
c4.setConfig({});
document.body.appendChild(c4);
c4.hass = mkHass({ admin: false }); await wait(400); c4.hass = mkHass({ admin: false }); await wait(300);
const lav4 = [...c4.shadowRoot.querySelectorAll(".ap")].find((n) => /Lavatrice/.test(n.textContent));
ok(lav4 && !lav4.querySelector(".pb"), "non admin: niente Svuotata");
ok(!txt(c4.shadowRoot.getElementById("newdev")), "non admin: niente badge dei nuovi dispositivi");

// ── 7. archivio filtrato su un elettrodomestico ───────────────────────────
const arch = document.createElement("supernotify-archive-card");
arch.setConfig({ auto_select: false });
document.body.appendChild(arch);
arch.hass = mkHass(); await wait(300); arch.hass = mkHass(); await wait(300);
arch._focus({ appliance: E.lav });
const shown = [...arch.shadowRoot.querySelectorAll("#list .it .ti")].map((n) => txt(n));
ok(arch._filter === "appliance" && shown.length > 0 && shown.every((t) => /Lavatrice/.test(t)), `archivio: solo le notifiche della Lavatrice (${shown.length})`);

// ── 8. strategy: la vista c'è solo con degli elettrodomestici ─────────────
const gen = await api.SupernotifyDashboardStrategy.generate({}, mkHass());
const paths = gen.views.map((v) => v.path);
const v = gen.views.find((x) => x.path === "appliances");
ok(v && paths.indexOf("appliances") === paths.indexOf("archive") + 1, `vista dopo Archivio (${paths.join(", ")})`);
ok(v && v.title === "SuperNotifier" && v.icon === "mdi:washing-machine" && v.sections[0].cards[0].type === "custom:supernotify-appliances-card", "SuperNotifier, mdi:washing-machine, la card");
const gen0 = await api.SupernotifyDashboardStrategy.generate({}, mkHass({ entries: [entry(E.disc, "Automatic discovery"), entry(E.ascIgn, "Asciugatrice", "ignore")] }));
ok(!gen0.views.some((x) => x.path === "appliances"), "zero elettrodomestici: nessuna vista");
const genHide = await api.SupernotifyDashboardStrategy.generate({ hide: ["appliances"] }, mkHass());
ok(!genHide.views.some((x) => x.path === "appliances"), "hide: [appliances] la toglie");

console.log(fail ? `\n${fail} FAIL` : "\nall passed");
process.exit(fail ? 1 : 0);
