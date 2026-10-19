// v0.91.0: supernotify-appliances-card 0.1.0 e vista "Elettrodomestici" (Appliances) della strategy.
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
const api = new dom.window.Function(SRC + "\nreturn { snAppl, snApplCycles, snApplTypes, snApplClassify, snApplEstimate, snApplState, snApplConsName, SN_APPL_STRINGS, SN_I18N_EXTRA, SupernotifyDashboardStrategy };")();

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
  callService: async (domain, service, data, target) => { calls.push({ svc: `${domain}.${service}`, data, target }); },
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
ok(/^1,2\sW · /.test(sum.replace(/^⚡\s*/, "")) && lav.querySelector(".sum .pw"), "potenza istantanea in testa al riassunto (1,2 W)");
ok(txt(lav.querySelector(".pb")) === "Svuotata" && lav.querySelectorAll(".pb").length === 1, "un solo pulsante: Svuotata");
ok(lav.querySelector('.art.ill.s-done[data-open] svg.sna .b-done'), "illustrazione: il nostro disegno, finito, con il bollino da svuotare");
ok(/Dettagli, consumi e cicli/.test(txt(lav.querySelector(".lnk"))), "link Dettagli, consumi e cicli");
const br = R.querySelector(".ap");
ok(/Ha bisogno di aiuto/.test(txt(br.querySelector(".st"))) && br.querySelector(".dot.err"), "Bruno: rosso, ha bisogno di aiuto");
ok(/#312/.test(txt(br)) && /Robot bloccato/.test(txt(br)), "errore 312 con la descrizione");
ok(/Filtro al 5%/.test(txt(br)) && !/Durata filtro/.test(txt(br)) && !/spazzola/i.test(txt(br)), "consumabile sotto il 10%: «Filtro al 5%», il nome corto (la spazzola al 64% no)");
ok(txt(br.querySelector(".pb")) === "Riprendi pulizia", "Bruno: Riprendi pulizia");
const ls = [...R.querySelectorAll(".row")].find((n) => /Lavastoviglie/.test(n.textContent));
// the test cycle started 26 h ago: "ieri" in the day, a date just after midnight
ok(/Fermo · Ultimo ciclo (ieri|\d{1,2} \S+ \d)/.test(txt(ls)), `Lavastoviglie: ${txt(ls.querySelector(".rs"))}`);
ok(/^0,4\sW$/.test(txt(ls.querySelector(".rp"))), `riga: potenza della presa vera a destra (${txt(ls.querySelector(".rp"))})`);
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
// 0.1.6: prima la panoramica, lo storico a un tocco
const info = R.querySelector(".ov .sheet");
ok(info && info.querySelector('.ptab.on[data-ptab="info"]') && info.querySelector(".hero .hwrap .pv-art svg.sna") && !info.querySelector(".ph .pv-art") && !info.querySelector(".tiles"),
  "un tocco apre la panoramica: il disegno nell'anello (0.2.9, in ogni stato), una sola immagine, niente riquadri");
ok(R.activeElement && R.activeElement.classList.contains("x"), "fuoco sul pulsante Chiudi");
const dts = [...info.querySelectorAll(".facts dt")].map((n) => txt(n));
ok(/Inizio/.test(txt(info.querySelector(".lstrip"))) && /→/.test(txt(info.querySelector(".lstrip .v2"))) && /1,2\sW/.test(txt(info.querySelector(".pq"))) && /Presa accesa/.test(txt(info.querySelector(".pq")))
  && info.querySelector('.pchips [data-pact="switch_off"]'), `panoramica: ultimo ciclo; potenza e presa sotto lo stato (${dts.join(", ")})`);
ok(info.querySelectorAll(".facts dt ha-icon").length === dts.length, "0.2.7: un'icona per ogni riga della panoramica");
const chips = [...info.querySelectorAll(".pchips .chip")].map((n) => txt(n));
const icl = (sel) => { const b = info.querySelector(sel); return b && b.classList.contains("ic") && b.getAttribute("aria-label"); };
ok(chips.some((c) => /Spegni presa/.test(c)) && icl("#pNotifs") === "Notifiche" && icl("#pSettings") === "Impostazioni"
  && icl("#pDevice") === "Dispositivo" && !info.querySelector(".pm, .pmenu"), `tutte le azioni in vista; Notifiche, Impostazioni e Dispositivo come icone (${chips.join(" | ")})`);
ok(info.querySelector("#pDevice"), "link al dispositivo in Home Assistant");
info.querySelector('[data-ptab="stats"]').onclick();
await wait(100);
const sheet = R.querySelector(".ov .sheet");
ok(/Consumi e cicli/.test(txt(sheet.querySelector(".ptab.on"))), "seconda scheda: Consumi e cicli");
ok(sheet && sheet.getAttribute("role") === "dialog" && sheet.getAttribute("aria-modal") === "true", "pannello: dialog modale");
ok(/Lavatrice/.test(txt(sheet.querySelector(".ph"))) && /⚡ 1,2\sW/.test(txt(sheet.querySelector(".ph .pq"))), `testata con stato e potenza (${txt(sheet.querySelector(".ph"))})`);
const tiles = [...sheet.querySelectorAll(".tile")].map((t) => txt(t));
console.log("    riquadri:", tiles.join(" | "));
ok(tiles.length === 4 && /^Oggi/.test(tiles[0]) && /^Anno/.test(tiles[3]) && tiles.every((t) => /kWh/.test(t) && /cicl/.test(t) && /€/.test(t)), "Oggi / Settimana / Mese / Anno con kWh, cicli e costo");
const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
const inMonth = cy.filter((c) => c.start >= m0.getTime() && c.end < NOW - 30 * MIN).length;
ok(sheet.querySelectorAll(".bars .b").length === inMonth, `una barra per ciclo del mese (${sheet.querySelectorAll(".bars .b").length}/${inMonth})`);
ok(sheet.querySelectorAll(".bars .b.anom").length === (long.start >= m0.getTime() ? 1 : 0), "il ciclo da 22 h in arancio");
ok(sheet.querySelector(".bars .b.short") && sheet.querySelector(".bars .b.long"), "corti e lunghi di colori diversi");
ok(/Corti · media/.test(txt(sheet.querySelector(".leg"))) && /Lunghi · media 2\sh\s30\smin/.test(txt(sheet.querySelector(".leg"))), `legenda con le medie (${txt(sheet.querySelector(".leg"))})`);
ok(sheet.querySelectorAll(".tb:not(.days) tbody tr").length === 8 && sheet.querySelector(".tb:not(.days) tr.anom"), "tabella degli ultimi cicli, l'anomalo segnato");
ok(/a ore/.test(txt(sheet)), "dice che i cicli vecchi sono a ore");
const d7 = [...sheet.querySelectorAll(".tb.days tbody tr")];
ok(d7.length === 7 && /Ultimi 7 giorni/.test(txt(sheet)) && /kWh/.test(txt(d7[0])) && /€/.test(txt(sheet.querySelector(".tb.days"))), `ultimi 7 giorni: una riga al giorno con consumo e costo (${txt(d7[1])})`);
ok(sheet.querySelector("#pNotifs") && sheet.querySelector("#pSettings").getAttribute("aria-label") === "Impostazioni", "pulsanti Notifiche e Impostazioni");
ok(R.activeElement && R.activeElement.dataset.ptab === "stats", "cambiando scheda il fuoco resta sulla scheda");
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
ok(run && /1,9\skW/.test(txt(run.querySelector(".sum"))), "in funzione: 1900 W scritti 1,9 kW");
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
ok(v && v.title === "Elettrodomestici" && v.icon === "mdi:washing-machine" && v.sections[0].cards[0].type === "custom:supernotify-appliances-card", "Elettrodomestici, mdi:washing-machine, la card");
ok(Object.values(api.SN_I18N_EXTRA).every((l) => l.SN_STRATEGY_TITLES.appliances === l.SN_APPL_STRINGS.title), "la vista si chiama come la card in ogni lingua");
const gen0 = await api.SupernotifyDashboardStrategy.generate({}, mkHass({ entries: [entry(E.disc, "Automatic discovery"), entry(E.ascIgn, "Asciugatrice", "ignore")] }));
ok(!gen0.views.some((x) => x.path === "appliances"), "zero elettrodomestici: nessuna vista");
const genHide = await api.SupernotifyDashboardStrategy.generate({ hide: ["appliances"] }, mkHass());
ok(!genHide.views.some((x) => x.path === "appliances"), "hide: [appliances] la toglie");

// ── 9. 0.1.3: i nostri disegni, guidati dallo stato della card ──
const mkArt = async (cfg, states, docs) => {
  api.snAppl.rows = []; api.snAppl.rowsAt = 0; api.snAppl.events.clear(); api.snAppl.at = 0; api.snAppl.reminded.clear();
  const c = document.createElement("supernotify-appliances-card");
  c.setConfig(cfg);
  document.body.appendChild(c);
  c.hass = mkHass({ states, docs }); await wait(400); c.hass = mkHass({ states, docs }); await wait(300);
  return c;
};
const apOf = (c, re) => [...c.shadowRoot.querySelectorAll(".ap")].find((n) => re.test(n.textContent));
const a1 = await mkArt({});
const lavA = apOf(a1, /Lavatrice/);
const lavSvg = lavA && lavA.querySelector(".art svg.sna");
ok(lavSvg && lavSvg.getAttribute("role") === "img" && /Lavatrice: Finito/.test(lavSvg.getAttribute("aria-label")), `lavatrice: disegno con la voce per i lettori di schermo (${lavSvg && lavSvg.getAttribute("aria-label")})`);
ok(!document.querySelector("appliance-washer-card") && !a1.shadowRoot.querySelector("[class*=appliance-]"), "nessuna card di skyrotter");
const lavBox = lavA.querySelector(".art");
ok(lavBox.classList.contains("stale") === (Date.now() - tLavEnd > 2 * H), `da svuotare da più di 2 ore: insiste (${lavBox.className})`);
const brA = apOf(a1, /Bruno/);
ok(brA && brA.querySelector(".art.s-error svg.sna.dockv .b-error"), "Bruno bloccato: robot con la base, bollino «!»");
ok(!brA.querySelector(".b-done"), "il robot non ha il bollino da svuotare");
ok(a1.shadowRoot.querySelector(".rows .ri.ill svg.sna"), "anche le righe dei fermi hanno il disegno");
ok(/\.offs \.sna/.test(a1.shadowRoot.querySelector("style").textContent), "fuori schermo i movimenti si fermano");
// Ricordamelo dalla card: orologio al posto della freccia, finché non arriva un altro promemoria
api.snAppl.markRemind(E.lav);
a1.hass = mkHass(); await wait(200);
ok(apOf(a1, /Lavatrice/).querySelector(".art.s-done.snooze"), "promemoria impostato: bollino con l'orologio");
// robot senza base, movimenti spenti, disegni spenti
const a2 = await mkArt({ robot_dock: false, animations: false });
const br2 = apOf(a2, /Bruno/);
ok(br2 && br2.querySelector("svg.sna:not(.dockv)") && br2.querySelector(".art.still"), "robot_dock: false = robot senza base; animations: false = fermo");
const a3 = await mkArt({ illustrations: false });
ok(!a3.shadowRoot.querySelector("svg.sna") && a3.shadowRoot.querySelector('.art ha-icon[icon="mdi:washing-machine"]'), "illustrations: false = icona mdi");
// Bruno in pausa, poi sulla base in carica
const paused = baseStates(); paused["vacuum.bruno"] = st("paused", { friendly_name: "Bruno", battery_level: 60 }); paused["sensor.bruno_errore"] = st("0");
const a4 = await mkArt({}, paused);
const br4 = apOf(a4, /Bruno/);
ok(br4 && br4.querySelector(".art.s-paused .b-pause") && /In pausa/.test(txt(br4.querySelector(".st"))), "Bruno in pausa: bollino ⏸ e «In pausa»");
const dock = baseStates(); dock["vacuum.bruno"] = st("docked", { friendly_name: "Bruno", battery_level: 60 }); dock["sensor.bruno_errore"] = st("0");
const a5 = await mkArt({}, dock, DOCS.filter((d) => !/^br/.test(d.id)));
const row5 = [...a5.shadowRoot.querySelectorAll(".row")].find((n) => /Bruno/.test(n.textContent));
ok(row5 && row5.querySelector(".ri.ill.s-idle.charging svg.dockv") && /In carica/.test(txt(row5)), "Bruno sulla base al 60%: in carica");
// Bruno: il pannello con le pulizie al posto dei consumi
entities["sensor.bruno_total_cleanings"] = ent("sensor.bruno_total_cleanings", "dBruno", "ecovacs", { translation_key: "total_stats_cleanings" });
entities["sensor.bruno_total_cleaning_duration"] = ent("sensor.bruno_total_cleaning_duration", "dBruno", "ecovacs", { translation_key: "total_stats_time" });
entities["sensor.bruno_area_pulita"] = ent("sensor.bruno_area_pulita", "dBruno", "ecovacs", { translation_key: "stats_area" });
const sec = (t) => t / 1000;
const vHist = { "vacuum.bruno": [{ s: "docked", lu: sec(NOW - 30 * H) }, { s: "cleaning", lu: sec(NOW - 5 * H) }, { s: "docked", lu: sec(NOW - 5 * H + 40 * MIN) },
  { s: "cleaning", lu: sec(NOW - 2 * H) }, { s: "returning", lu: sec(NOW - 2 * H + 30 * MIN) }, { s: "docked", lu: sec(NOW - 2 * H + 35 * MIN) }],
  "sensor.bruno_area_pulita": [{ s: "0", lu: sec(NOW - 5 * H) }, { s: "31", lu: sec(NOW - 5 * H + 39 * MIN) }, { s: "0", lu: sec(NOW - 2 * H) }, { s: "24", lu: sec(NOW - 2 * H + 29 * MIN) }] };
const d0v = new Date(NOW); d0v.setHours(0, 0, 0, 0);
const vStats = { "sensor.bruno_total_cleanings": [{ start: d0v.getTime() - 86400000, change: 5 }, { start: d0v.getTime(), change: 2 }, { start: d0v.getTime() - 2 * 86400000, change: -300 }],
  "sensor.bruno_total_cleaning_duration": [{ start: d0v.getTime(), change: 1.25 }] };
const vHass = () => { const h = mkHass({ states: dock, docs: DOCS.filter((d) => !/^br/.test(d.id)) }); const w = h.callWS; h.callWS = async (m) => {
  if (m.type === "history/history_during_period") return vHist;
  if (m.type === "recorder/statistics_during_period" && m.statistic_ids.includes("sensor.bruno_total_cleanings")) return vStats;
  return w(m); }; return h; };
api.snAppl._listKey = null; api.snAppl.stats.clear();
a5.hass = vHass(); await wait(200);
[...a5.shadowRoot.querySelectorAll(".row")].find((n) => /Bruno/.test(n.textContent)).onclick({ preventDefault() {} });
await wait(300); a5.hass = vHass(); await wait(200);
let vInfo = a5.shadowRoot.querySelector(".ov .sheet");
ok(vInfo && vInfo.querySelector(".hero .pv-art svg.dockv") && /🔋 \d+%/.test(txt(vInfo.querySelector(".pq"))) && /Pulizie/.test(txt(vInfo.querySelector('[data-ptab="stats"]'))),
  "Bruno: panoramica con robot sulla base e batteria, scheda Pulizie");
const dueBtn = vInfo && vInfo.querySelector('.facts .fv[data-ptab="cons"]');
ok(dueBtn && /Filtro 5%/.test(txt(dueBtn)) && !vInfo.querySelector(".cgrid") && /Consumabili/.test(txt(vInfo.querySelector('.ptab[data-ptab="cons"]'))),
  "0.2.9: in panoramica una riga dice cosa è consumato; la griglia sta nella scheda Consumabili");
dueBtn.onclick(); await wait(100);
vInfo = a5.shadowRoot.querySelector(".ov .sheet");
const ciNames = vInfo ? [...vInfo.querySelectorAll(".cgrid .ci .cn")].map((n) => txt(n)) : [];
ok(vInfo.querySelector('.ptab.on[data-ptab="cons"]') && ciNames.length >= 2 && ciNames.includes("Filtro") && new Set(ciNames).size === ciNames.length && vInfo.querySelector(".cgrid .ci.wrn[data-more]"),
  `toccare la riga apre la scheda: consumabili in griglia, nomi corti e diversi, toccabili (${ciNames.join(" | ")})`);
vInfo.querySelector('[data-ptab="info"]').onclick(); await wait(100);
vInfo = a5.shadowRoot.querySelector(".ov .sheet");
vInfo.querySelector('[data-ptab="stats"]').onclick(); await wait(100);
const vs = a5.shadowRoot.querySelector(".ov .sheet");
const vt = vs ? [...vs.querySelectorAll(".tile")].map((t) => txt(t)) : [];
console.log("    Bruno:", vt.join(" | "));
ok(vt.length === 4 && /^Oggi\s*2 pulizie\s*1 h 15 min/.test(vt[0]) && !/-/.test(vt.join(" ")), "Bruno: pulizie e tempo da Oggi ad Anno, un contatore tornato indietro non conta");
ok(vs.querySelectorAll(".bars .b").length === (NOW - 5 * H >= new Date(new Date(NOW).setDate(1)).setHours(0, 0, 0, 0) ? 2 : 0) && vs.querySelectorAll(".tb:not(.days) tbody tr").length === 2
  && /40 min/.test(txt(vs.querySelector(".tb:not(.days)"))) && /31 m²/.test(txt(vs.querySelector(".tb:not(.days)"))), "Bruno: barre e tabella delle pulizie con durata e area");
ok(!/consumi e cicli non si contano/.test(txt(vs)) && /cronologia di Home Assistant/.test(txt(vs)), "Bruno: niente più «non si contano», dice da dove vengono i dati");
a5.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });

// un dispositivo aggiunto a mano: il deumidificatore, stato dalla potenza, niente Autonotify
api.snAppl._listKey = null;
const mStates = baseStates(); mStates["sensor.presa_lavastoviglie_power"] = pw(180, "Presa Lavastoviglie Potenza");
const a7 = await mkArt({ devices: [{ name: "Deumidificatore", power_entity: "sensor.presa_lavastoviglie_power", switch_entity: "switch.presa_lavastoviglie", threshold: 20, info: ["sensor.bruno_batteria"] }] }, mStates);
const deu = apOf(a7, /Deumidificatore/);
ok(deu && /In funzione/.test(txt(deu.querySelector(".st"))) && !deu.querySelector(".pb"), "a mano: in funzione dalla potenza (180 W > 20 W), nessun pulsante di Autonotify");
const deuAp = api.snAppl._list.find((x) => x.name === "Deumidificatore");
ok(deuAp && deuAp.manual && deuAp.id === "manual_deumidificatore" && deuAp.type === "dehumidifier" && deuAp.switch === "switch.presa_lavastoviglie", "a mano: id, tipo dal nome, presa");
a7._openPanel(deuAp.id); await wait(200);
const dSheet = a7.shadowRoot.querySelector(".ov .sheet");
dSheet.querySelector('[data-ptab="sets"]').onclick(); await wait(100);
ok(dSheet && !dSheet.querySelector("#pNotifs") && /aggiunto a mano/.test(txt(a7.shadowRoot.querySelector(".ov .sheet .pinfo"))) && /Bruno Batteria|Batteria/.test(txt(dSheet.querySelector(".facts"))), "a mano: panoramica senza notifiche di Autonotify, dice da dove viene, mostra le entità di info:");
a7.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });

// 0.2.5: potenza non leggibile (contatore offline) e presa accesa: in funzione
api.snAppl._listKey = null;
const uStates = baseStates(); uStates["sensor.presa_lavastoviglie_power"] = st("unavailable"); uStates["switch.presa_lavastoviglie"] = st("on");
const a9 = await mkArt({ devices: [{ name: "Deumidificatore", power_entity: "sensor.presa_lavastoviglie_power", switch_entity: "switch.presa_lavastoviglie", threshold: 20 }] }, uStates);
const deu9 = apOf(a9, /Deumidificatore/);
ok(deu9 && /In funzione/.test(txt(deu9.querySelector(".st"))), "a mano: potenza non disponibile ma presa accesa = in funzione");

// 0.2.3: righe toccabili (more-info di HA), pulsanti di actions:, Accendi presa
api.snAppl._listKey = null;
const s8 = baseStates(); s8["input_datetime.da"] = st("06:30:00"); s8["input_datetime.a"] = st("08:00:00");
s8["input_datetime.da"].attributes = { has_date: false, has_time: true, friendly_name: "Da" }; s8["input_datetime.a"].attributes = { has_date: false, has_time: true, friendly_name: "A" };
const a8 = await mkArt({ devices: [{ name: "Boiler", power_entity: "sensor.presa_asciugatrice_power", switch_entity: "switch.presa_asciugatrice", threshold: 50,
  info: [{ entity: "sensor.bruno_batteria", name: "Batteria robot" }, { name: "Orari", entities: ["input_datetime.da", "input_datetime.a"] }],
  actions: [{ entity: "script.pulisci_cucina", name: "Cucina", icon: "mdi:silverware-fork-knife" },
    { name: "Svuota", tap_action: { action: "perform-action", perform_action: "button.press", target: { entity_id: "button.bruno_svuota" } } },
    { name: "Con conferma", entity: "script.pericoloso", confirmation: true }] }] }, s8);
const bAp = api.snAppl._list.find((x) => x.name === "Boiler");
a8._openPanel(bAp.id); await wait(200);
const bSheet = a8.shadowRoot.querySelector(".ov .sheet");
const bChips = [...bSheet.querySelectorAll(".pchips .chip")].map((n) => txt(n));
ok(bChips.includes("Accendi presa") && !bChips.includes("Spegni presa") && bChips.includes("Cucina") && bChips.includes("Svuota")
  && bSheet.querySelector('[data-uact="0"] ha-icon'), `presa spenta: Accendi presa; i pulsanti di actions: con l'icona (${bChips.join(" | ")})`);
calls.length = 0;
bSheet.querySelector('[data-pact="switch_on"]').onclick(); await wait(50);
ok(calls.some((c) => c.svc === "switch.turn_on" && c.data.entity_id === "switch.presa_asciugatrice"), "Accendi presa = switch.turn_on sulla presa");
calls.length = 0;
a8.shadowRoot.querySelector('.ov .sheet [data-uact="0"]').onclick(); await wait(50);
ok(calls.some((c) => c.svc === "script.turn_on" && c.target && c.target.entity_id === "script.pulisci_cucina"), "uno script da solo: script.turn_on");
ok(/Fatto: Cucina/.test(txt(a8.shadowRoot.querySelector(".ov .sheet .res"))), "conferma dell'esito");
calls.length = 0;
a8.shadowRoot.querySelector('.ov .sheet [data-uact="1"]').onclick(); await wait(50);
ok(calls.some((c) => c.svc === "button.press" && c.target.entity_id === "button.bruno_svuota"), "tap_action perform-action con target");
calls.length = 0; let asked = "";
window.confirm = (q) => { asked = q; return false; };
a8.shadowRoot.querySelector('.ov .sheet [data-uact="2"]').onclick(); await wait(50);
ok(/Eseguire «Con conferma»/.test(asked) && !calls.some((c) => c.svc), "confirmation: chiede prima, e con «no» non parte niente");
let more = null;
a8.addEventListener("hass-more-info", (e) => { more = e.detail.entityId; });
const fv = [...a8.shadowRoot.querySelectorAll(".ov .sheet .facts .fv")].find((n) => /Batteria robot/.test(txt(n.closest("dd").previousElementSibling)));
ok(fv, "info: con il nome dato, la riga è toccabile");
fv.onclick(); await wait(50);
ok(more === "sensor.bruno_batteria" && !a8.shadowRoot.querySelector(".ov .sheet"), "tocco sulla riga: finestra di HA dell'entità, il pannello si chiude");
a8._openPanel(bAp.id); await wait(200);
const bInfo = txt(a8.shadowRoot.querySelector(".ov .sheet .pinfo"));
a8.shadowRoot.querySelector('.ov .sheet [data-ptab="sets"]').onclick(); await wait(100);
const bSets = a8.shadowRoot.querySelector(".ov .sheet .pinfo");
const orari = bSets && [...bSets.querySelectorAll("dt")].find((n) => /Orari/.test(txt(n)));
ok(a8.shadowRoot.querySelector('.ov .sheet .ptab.on[data-ptab="sets"]') && orari && orari.nextElementSibling.querySelectorAll(".fv").length === 2 && /06:30(:00)? – 08:00/.test(txt(orari.nextElementSibling))
  && !/Orari/.test(bInfo), "le impostazioni nella loro scheda (0.2.9), due entità su una riga (06:30 – 08:00)");
a8._panelTab = "info";
a8.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });

// 0.2.6: manutenzione ogni N cicli, una lista
api.snAppl._listKey = null;
const s10 = baseStates(); s10["sensor.cicli_da_manut"] = st("46"); s10["input_number.manut_ogni"] = st("50"); s10["sensor.filtro_mancano"] = st("0");
const a10 = await mkArt({ devices: [{ name: "Lavatrice2", power_entity: "sensor.presa_asciugatrice_power", threshold: 5000,
  maintenance: [{ name: "Pulizia cestello", count: "sensor.cicli_da_manut", every: "input_number.manut_ogni", done: "counter.cicli_lavatrice" },
    { name: "Sale", count: 10, every: 50 }, { name: "Filtro", left: "sensor.filtro_mancano", every: 30 }] }] }, s10);
const lTxt = txt(a10.shadowRoot.querySelector("#body"));
ok(/Pulizia cestello · tra 4 cicli/.test(lTxt) && /Filtro · da fare/.test(lTxt) && !/Sale/.test(lTxt), `elenco: solo le manutenzioni vicine o da fare (${lTxt.slice(0, 160)})`);
const lAp = api.snAppl._list.find((x) => x.name === "Lavatrice2");
a10._openPanel(lAp.id); await wait(200);
ok(/Pulizia cestello tra 4 cicli · Filtro da fare/.test(txt(a10.shadowRoot.querySelector('.ov .sheet .facts .fv[data-ptab="cons"]'))) && /Manutenzione/.test(txt(a10.shadowRoot.querySelector('.ov .sheet .ptab[data-ptab="cons"]'))),
  "0.2.9: in panoramica la riga di ciò che è vicino o da fare; senza consumabili la scheda si chiama Manutenzione");
a10.shadowRoot.querySelector('.ov .sheet [data-ptab="cons"]').onclick(); await wait(100);
const mSheet = a10.shadowRoot.querySelector(".ov .sheet");
const mRow = (n) => [...mSheet.querySelectorAll(".facts dt")].find((d) => txt(d) === n);
ok(mRow("Pulizia cestello") && /46 su 50 · tra 4 cicli/.test(txt(mRow("Pulizia cestello").nextElementSibling)) && mRow("Pulizia cestello").nextElementSibling.classList.contains("wrn")
  && mRow("Pulizia cestello").nextElementSibling.querySelector(".mbar i[style*='92%']"), "panoramica: 46 su 50, tra 4 cicli, barra al 92%, in evidenza");
ok(/10 su 50 · tra 40 cicli/.test(txt(mRow("Sale").nextElementSibling)) && !mRow("Sale").nextElementSibling.querySelector(".mdone"), "una lontana: senza evidenza e senza Fatto se non c'è done:");
ok(mRow("Filtro").nextElementSibling.classList.contains("bad") && /30 su 30 · da fare/.test(txt(mRow("Filtro").nextElementSibling)), "da fare: dai cicli che mancano");
calls.length = 0; asked = "";
window.confirm = (q) => { asked = q; return true; };
mSheet.querySelector('[data-maint="0"]').onclick(); await wait(50);
ok(/Segnare «Pulizia cestello» come fatto/.test(asked) && calls.some((c) => c.svc === "counter.reset" && c.target && c.target.entity_id === "counter.cicli_lavatrice"),
  "Fatto: chiede prima, poi counter.reset sul contatore");
a10.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });

// 0.2.7: in funzione il disegno nell'anello, colore della fase, fascia dello stato; nomi corti; connessione persa
ok(api.snApplConsName("Durata del filtro manuale") === "Filtro manuale" && api.snApplConsName("Durata della soluzione detergente") === "Soluzione detergente"
  && api.snApplConsName("Unit care lifespan") === "Unit care" && api.snApplConsName("Filter") === "Filter", "nomi corti dei consumabili");
api.snAppl._listKey = null;
const s11 = baseStates(); s11["sensor.presa_lavastoviglie_power"] = pw(480, "Presa Lavastoviglie Potenza");
s11["select.prog"] = st("Cotone 40°"); s11["sensor.fase"] = st("Risciacquo"); s11["sensor.manca"] = st("30", { unit_of_measurement: "min" });
const a11 = await mkArt({ devices: [{ name: "Lavatrice3", type: "washer", power_entity: "sensor.presa_lavastoviglie_power", switch_entity: "switch.presa_lavastoviglie", threshold: 20,
  program: "select.prog", phase: "sensor.fase", remaining: "sensor.manca", info: ["sensor.bruno_batteria"] }] }, s11);
const l3 = apOf(a11, /Lavatrice3/);
ok(l3 && l3.classList.contains("st-run"), "elenco: la card in funzione ha la fascia blu (st-run)");
const l3Ap = api.snAppl._list.find((x) => x.name === "Lavatrice3");
a11._openPanel(l3Ap.id); await wait(200);
const hs = a11.shadowRoot.querySelector(".ov .sheet");
ok(hs && hs.classList.contains("st-run") && hs.querySelector(".hero .hwrap .pv-art") && !hs.querySelector(".ph .pv-art"), "in funzione: il disegno passa nell'anello, non due volte");
ok(/4fc3f7/.test(hs.querySelector(".hero .hbar i").getAttribute("style")) && !hs.querySelector(".hero .hring"), "0.2.10: niente cerchio, la barra azzurra del risciacquo sotto la fine");
ok(hs.querySelectorAll(".hero .hpp .fv").length === 2 && /Cotone 40°/.test(txt(hs.querySelector(".hero .hpp"))) && /mancano 30 min/.test(txt(hs.querySelector(".hero"))),
  "programma e fase toccabili, quanto manca");
ok(hs.querySelectorAll(".facts dt").length === hs.querySelectorAll(".facts dt ha-icon").length && hs.querySelectorAll(".facts dt").length > 0, "ogni riga ha la sua icona");
hs.querySelector('[data-ptab="stats"]').onclick(); await wait(100);
ok(a11.shadowRoot.querySelector(".ov .sheet .ph .pv-art") && !a11.shadowRoot.querySelector(".ov .sheet .hero"), "nella scheda dei consumi il disegno torna in alto");
a11.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });
a11._panelTab = "info";
// una caduta breve della connessione tiene l'ultimo stato
const hAp = { id: "hold_t", kind: "power", power: "sensor.ph", manual: true, threshold: 5 };
const hh = (state, ago) => ({ states: { "sensor.ph": { state, attributes: { unit_of_measurement: "W" }, last_changed: iso(Date.now() - ago), last_updated: iso(Date.now() - ago) } } });
const h1 = api.snApplState(hh("500", 30 * 60000), hAp, Date.now(), null);
const h2 = api.snApplState(hh("unavailable", 2 * 60000), hAp, Date.now(), null);
const h3 = api.snApplState(hh("unavailable", 20 * 60000), hAp, Date.now(), null);
ok(h1.status === "running" && h2.status === "running" && h2.lost && h3.status === "off" && !h3.lost,
  `connessione persa: in funzione per 15 minuti con l'avviso, poi spento (${h1.status}/${h2.status}/${h3.status})`);

// 0.2.8: tanti comandi in un menu a gruppi, pulsanti per stato, doppio tocco
api.snAppl._listKey = null;
const s12 = baseStates(); s12["sensor.presa_lavastoviglie_power"] = pw(1, "Presa Lavastoviglie Potenza");
const sc = (n, g, extra) => ({ name: n, entity: `script.${n.toLowerCase()}`, group: g, ...extra });
const a12 = await mkArt({ devices: [{ name: "Robot2", power_entity: "sensor.presa_lavastoviglie_power", threshold: 20, actions: [
  sc("Pulisci", "Pulizia"), sc("Pausa", "Pulizia", { when: ["running"] }), sc("Base", "Pulizia"),
  sc("Trova", "Robot"), sc("Svuota", "Robot", { confirmation: "double" }), sc("Mappa")] }] }, s12);
const rAp = api.snAppl._list.find((x) => x.name === "Robot2");
a12._openPanel(rAp.id); await wait(200);
let rs = a12.shadowRoot.querySelector(".ov .sheet");
const cm = rs && rs.querySelector("details.cmds");
const gh = cm ? [...cm.querySelectorAll(".gh")].map((n) => txt(n)) : [];
ok(cm && !cm.open && !rs.querySelector(".pchips [data-uact]") && /Comandi · 5/.test(txt(cm.querySelector("summary"))), "più di 3 comandi: nel menu Comandi, chiuso, non nella fila");
ok(gh.join("|") === "Pulizia|Robot" && /Mappa/.test(txt(cm.querySelector(".cgrp > div:first-child"))) && !/Pausa/.test(txt(cm)),
  `gruppi nell'ordine, quelli senza gruppo prima, Pausa nascosta da ferma (${gh.join(" | ")})`);
calls.length = 0;
const sv = [...cm.querySelectorAll("[data-uact]")].find((b) => /Svuota/.test(txt(b)));
sv.onclick(); await wait(50);
rs = a12.shadowRoot.querySelector(".ov .sheet");
const armed = rs.querySelector("[data-uact][data-armed]");
ok(armed && /Tocca di nuovo/.test(txt(armed)) && !calls.some((c) => c.svc), "doppio tocco: il primo arma il pulsante, non parte niente");
armed.onclick(); await wait(50);
ok(calls.some((c) => c.svc === "script.turn_on" && c.target && c.target.entity_id === "script.svuota") && !a12.shadowRoot.querySelector(".ov .sheet [data-armed]"), "il secondo tocco lo esegue");
a12.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });
api.snAppl._listKey = null;
const s13 = baseStates(); s13["sensor.presa_lavastoviglie_power"] = pw(300, "Presa Lavastoviglie Potenza");
const a13 = await mkArt({ devices: [{ name: "Robot3", power_entity: "sensor.presa_lavastoviglie_power", threshold: 20, commands_menu: "never", actions: [
  sc("Pulisci", "Pulizia", { when: ["idle", "off"] }), sc("Pausa", "Pulizia", { when: "running" }), sc("Base"), sc("Trova"), sc("Mappa")] }] }, s13);
a13._openPanel(api.snAppl._list.find((x) => x.name === "Robot3").id); await wait(200);
const r3 = [...a13.shadowRoot.querySelectorAll(".ov .sheet .pchips [data-uact]")].map((n) => txt(n));
ok(!a13.shadowRoot.querySelector(".ov .sheet details.cmds") && r3.includes("Pausa") && !r3.includes("Pulisci") && r3.length === 4,
  `commands_menu: never = tutti in fila; in funzione Pausa sì, Pulisci no (${r3.join(" | ")})`);
a13.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });

// 0.2.9: spegnere la presa vuole due tocchi; da ferma l'anello vuoto e il ciclo medio
api.snAppl._listKey = null;
const s14 = baseStates(); s14["sensor.presa_lavastoviglie_power"] = pw(1, "Presa Lavastoviglie Potenza"); s14["switch.presa_lavastoviglie"] = st("on");
const a14 = await mkArt({ devices: [{ name: "Stufa", power_entity: "sensor.presa_lavastoviglie_power", switch_entity: "switch.presa_lavastoviglie", threshold: 20 }] }, s14);
let stufa = null;
for (let i = 0; i < 30 && !stufa; i++) { a14.hass = mkHass({ states: s14 }); await wait(100); stufa = (api.snAppl._list || []).find((x) => x.name === "Stufa"); }
a14._openPanel(stufa.id); await wait(200);
let sh = a14.shadowRoot.querySelector(".ov .sheet");
ok(sh.querySelector(".hero .hwrap .pv-art") && !sh.querySelector(".hero .hbar"), "ferma: il disegno nello stesso posto, nessuna barra");
calls.length = 0;
sh.querySelector('[data-pact="switch_off"]').onclick(); await wait(50);
sh = a14.shadowRoot.querySelector(".ov .sheet");
ok(!calls.some((c) => c.svc) && /Tocca di nuovo/.test(txt(sh.querySelector('[data-pact="switch_off"][data-armed]'))), "Spegni presa: il primo tocco chiede il secondo");
sh.querySelector('[data-pact="switch_off"]').onclick(); await wait(50);
ok(calls.some((c) => c.svc === "switch.turn_off" || (c.svc || "").endsWith("turn_off")), "il secondo tocco spegne la presa");
a14.shadowRoot.getElementById("ov").onkeydown({ key: "Escape" });

// 0.2.11: una lettura dello storico che va in timeout si riprova da sola; ciò che c'era resta
{
  const fail = { callWS: () => Promise.reject(new Error("timeout")) };
  const vAp = { id: "v_t", kind: "vacuum", vacuum: "vacuum.t_robot", vstats: {} };
  api.snAppl.stats.delete("vacuum.t_robot");
  api.snAppl.loadStats(fail, vAp, true); await wait(50);
  const e1 = api.snAppl.stats.get("vacuum.t_robot");
  ok(e1 && e1.error === "timeout" && e1.retryT && e1.fails === 1, "timeout senza niente da mostrare: errore e un nuovo tentativo in programma");
  clearTimeout(e1.retryT);
  const pAp = { id: "p_t", kind: "power", power: "sensor.t_power", threshold: 5, grace: 300000, minDur: 300000 };
  api.snAppl.stats.set("sensor.t_power", { bins: [{ t: 1, dt: 300000, mean: 1, max: 1 }], done: [{ start: 1, end: 2, kwh: 0.5 }], types: {}, loading: false, at: Date.now() - 700000, error: null });
  api.snAppl.loadStats(fail, pAp); await wait(50);
  const e2 = api.snAppl.stats.get("sensor.t_power");
  ok(e2.error === null && e2.done.length === 1 && e2.retryT, "timeout con dati già letti: restano quelli, nessun errore, si riprova");
  clearTimeout(e2.retryT);
  const rf = a11._readFailed({ error: "timeout" });
  ok(/Non sono riuscito a leggere lo storico \(timeout\); riprovo tra poco/.test(rf) && /data-retry/.test(rf) && /Riprova/.test(rf), "il pannello lo dice in chiaro, con Riprova");
}

// 0.2.0: una card per un solo dispositivo, con il nuovo nome
ok(customElements.get("supernotify-devices-card") && customElements.get("supernotify-appliances-card"), "supernotify-devices-card, e il vecchio nome resta");
api.snAppl.rows = []; api.snAppl.rowsAt = 0; api.snAppl.events.clear(); api.snAppl.at = 0;
const one = document.createElement("supernotify-devices-card");
one.setConfig({ device: "Lavatrice", price_per_kwh: 0.25 });
document.body.appendChild(one);
one.hass = mkHass(); await wait(400); one.hass = mkHass(); await wait(400);
const oneR = one.shadowRoot;
ok(oneR.querySelector(".one .ptabs") && !oneR.querySelector(".ov .sheet") && !oneR.querySelector(".hdr") && /Lavatrice/.test(txt(oneR.querySelector(".one .ph")))
  && !oneR.querySelector(".one .x"), "device: Lavatrice = panoramica e schede dentro la card, senza elenco, titolo né pulsante Chiudi");
ok(/Svuotata/.test(txt(oneR.querySelector(".pchips .chip.main"))) && /Ricordamelo/.test(txt(oneR.querySelector(".pchips"))), "da svuotare: Svuotata in evidenza, poi Ricordamelo, piccoli");
const oneDts = [...oneR.querySelectorAll(".one .facts dt")].map((n) => txt(n));
ok(oneR.querySelector("ha-card").dataset.st === "done" && oneDts.some((d) => /Notifiche/.test(d)) && oneR.querySelector(".one .lstrip .v2"),
  `0.2.7 niente si perde: fascia arancione sulla card, notifiche e promemoria, ultimo ciclo con la fine (${oneDts.join(", ")})`);
ok(oneR.querySelector(".one .hero .hwrap .pv-art") && !oneR.querySelector(".one .hero .hring") && /Da svuotare da/.test(txt(oneR.querySelector(".one .hero"))) && /Fine ciclo alle/.test(txt(oneR.querySelector(".one .hero"))),
  "0.2.9 da svuotare: stessa grafica (senza cerchio), da quanto aspetta e quando è finito");
oneR.querySelector('[data-ptab="stats"]').onclick(); await wait(100);
ok(oneR.querySelector(".one .tiles") && oneR.querySelector(".tb.days"), "device: la scheda dello storico nella card");
const none = document.createElement("supernotify-devices-card");
none.setConfig({ device: "Frigorifero" }); document.body.appendChild(none);
none.hass = mkHass(); await wait(300); none.hass = mkHass(); await wait(200);
ok(/Nessun elettrodomestico o dispositivo di nome «Frigorifero»/.test(txt(none.shadowRoot)), "device: nome sbagliato, lo dice");

// in funzione: il tempo che manca sul display e l'avanzamento
api.snAppl.rows = []; api.snAppl.rowsAt = 0; api.snAppl.events.clear(); api.snAppl.at = 0;
const c6 = document.createElement("supernotify-appliances-card");
c6.setConfig({});
document.body.appendChild(c6);
c6.hass = mkHass({ docs: runDocs, states: runStates });
api.snAppl.refreshEvents(mkHass({ docs: runDocs, states: runStates }), true);
await wait(300); c6.hass = mkHass({ docs: runDocs, states: runStates }); await wait(200);
const runA = [...c6.shadowRoot.querySelectorAll(".ap")].find((n) => /Lavatrice/.test(n.textContent));
const lcd = runA && runA.querySelector(".l-run");
ok(lcd && /^\d+:\d{2}$/.test(lcd.textContent) && runA.querySelector("svg.sna.has-p .prog").getAttribute("stroke-dasharray") !== "0 100",
  `in funzione: display ${lcd && lcd.textContent} e anello dell'avanzamento`);

console.log(fail ? `\n${fail} FAIL` : "\nall passed");
process.exit(fail ? 1 : 0);
