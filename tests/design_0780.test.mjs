// CHANGELOG
// 2026-10-05 v0.78.0: scenari - volume e opzioni sui chip dei canali (template calcolati), condizioni
//   sempre visibili, avviso quando un altro scenario attivo spegne il canale; overview - effetti sui chip.
import { JSDOM } from "jsdom";
import fs from "fs";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();
let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const S = (state, attributes) => ({ state, attributes });
const TPL = "{{ (states('input_number.notifier_late_night_volume') | float(20)) / 100 }}";
const LN = { name: "late_night", enabled: true, friendly_name: "SuperNotify Scenario Late Night", delivery: {
  alexa_announce: { target: null, enabled: true, data: { type: "announce", method: "speak", volume: TPL } },
  mobile_push: { target: null, enabled: true, data: null },
  tts: { target: null, enabled: true, data: { volume_level: TPL } } } };
const CV = { name: "casa_vuota", enabled: true, friendly_name: "SuperNotify Scenario Casa vuota", delivery: {
  alexa_announce: { enabled: false }, tts: { enabled: false } } };
const MO = { name: "morning", enabled: true, friendly_name: "SuperNotify Scenario Morning", delivery: {
  alexa_announce: { enabled: true, data: { volume: 0.5 } }, mobile_push: { enabled: true, target: ["person.lorenzo"] } } };
const TR = (p, r) => ({ [p]: [{ path: p, result: { result: r } }] });
const TRACE = [
  [{ name: "late_night", enabled: true, conditions: [{ condition: "time", after: "23:00:00", before: "06:30:00" }],
     trace: { trace: TR("condition/conditions/condition/0", true) } },
   { name: "casa_vuota", enabled: true, conditions: [{ condition: "state", entity_id: ["binary_sensor.casa_vuota"], state: "on" }],
     trace: { trace: TR("condition/conditions/condition/0", true) } }],
  [{ name: "morning", enabled: true, conditions: [{ condition: "time", after: "07:00:00", before: "09:00:00" }],
     trace: { trace: TR("condition/conditions/condition/0", false) } }],
];
const subs = [];
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u", is_admin: true },
  services: { supernotify: { notify: { response: { optional: true } }, enquire_active_scenarios: {} } },
  states: {
    "switch.supernotify_scenario_late_night": S("on", LN), "binary_sensor.supernotify_scenario_late_night": S("unknown", LN),
    "switch.supernotify_scenario_casa_vuota": S("on", CV),
    "switch.supernotify_scenario_morning": S("on", MO),
    "switch.supernotify_delivery_alexa_announce": S("on", { name: "alexa_announce", friendly_name: "SuperNotify Delivery Alexa abilitata" }),
    "switch.supernotify_delivery_tts": S("on", { name: "tts", friendly_name: "SuperNotify Delivery Voce abilitata" }),
    "switch.supernotify_delivery_mobile_push": S("off", { name: "mobile_push", friendly_name: "SuperNotify Delivery Telefono abilitata" }),
    "binary_sensor.casa_vuota": S("on", { friendly_name: "Casa vuota" }),
  },
  connection: { subscribeMessage: async (cb, msg) => { subs.push(msg); setTimeout(() => cb({ result: 0.0 }), 5); return () => {}; } },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_active_scenarios") return { response: m.service_data.trace ? { scenarios: ["late_night", "casa_vuota"], trace: TRACE } : { scenarios: ["late_night", "casa_vuota"] } };
    return { response: {} };
  },
};
const mount = (tag) => { const c = document.createElement(tag); c.setConfig({}); document.body.appendChild(c); c.hass = hass; return c; };
const sc = mount("supernotify-scenarios-card");
await wait(150);
const rowEl = (n) => sc.shadowRoot.querySelector(`.row[data-name="${n}"]`);
const ic = (h) => h.replace(/<ha-icon[^>]*icon="mdi:([^"]+)"[^>]*><\/ha-icon>/g, "[$1]").replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
const row = (n) => ic(rowEl(n).innerHTML);
const ln = row("late_night");
ok(subs.some((m) => m.type === "render_template" && m.template === TPL), "il template del volume è chiesto a HA");
ok(subs.filter((m) => m.template === TPL).length === 1, "un solo render per lo stesso template");
ok(/\[volume-off\] Alexa · muto/.test(ln), "late_night: Alexa muta (volume 0 dal template) - " + ln);
ok(/\[volume-off\] Voce · muto/.test(ln), "late_night: TTS muta (volume_level)");
ok(!/\[check\] Alexa/.test(ln), "niente più ✓ verde su Alexa");
ok(/Alexa · muto · \[cog-outline\]/.test(ln), "altre opzioni segnalate (type/method)");
ok(/orario dopo le 23:00 prima delle 06:30/.test(ln), "condizione visibile senza aprire: " + ln);
ok(/la spegne Casa vuota/.test(ln), "avviso: Alexa spenta da casa_vuota");
ok(/Telefono: il canale è spento/.test(ln), "avviso: canale telefono spento");
const mo = row("morning");
ok(/\] Alexa · vol 50%/.test(mo), "morning: volume numerico 50% - " + mo);
ok(/Telefono · \[[a-z-]+\]/.test(mo), "morning: altri destinatari");
ok(/\[close\] orario dopo le 07:00/.test(mo), "morning: condizione falsa");
ok(!/la spegne/.test(mo), "scenario non attivo: nessun avviso");
const cv = row("casa_vuota");
ok(/\[close\] Alexa/.test(cv) && /Casa vuota è on/.test(cv), "casa_vuota: spegne Alexa, condizione di stato");

// annidate: "almeno una vera: (tutte vere: A, B) o C"
hass.states["switch.supernotify_scenario_ufficio"] = S("on", { name: "ufficio", delivery: {} });
TRACE[1].push({ name: "ufficio", conditions: [{ condition: "or", conditions: [
  { condition: "and", conditions: [{ condition: "state", entity_id: ["binary_sensor.casa_vuota"], state: "on" }, { condition: "time", after: "08:00:00" }] },
  { condition: "state", entity_id: ["binary_sensor.casa_vuota"], state: "off" }] }], trace: { trace: TR("condition/conditions/condition/0", false) } });
TRACE[1][0].conditions.push({ condition: "time", after: "input_datetime.start_wd" });
hass.states["input_datetime.start_wd"] = S("08:00:00", { friendly_name: "Inizio feriali" });
const ov = mount("supernotify-overview-card");
await wait(150); ov.hass = { ...hass }; await wait(100);
const t = ov.shadowRoot.getElementById("scen").innerHTML;
const tx = ic(t);
ok(/Late Night(?: · )?\[volume-off\] Alexa, \[volume-off\] Voce/.test(tx), "overview: il chip dice cosa abbassa - " + tx);
ok(/title="Quando: ✓ orario dopo le 23:00/.test(t), "overview: condizioni nel tooltip");
ok(/Casa vuota(?: · )?\[close\] Alexa, \[close\] Voce/.test(tx), "overview: casa_vuota spegne");
const sc2 = document.createElement("supernotify-scenarios-card"); sc2.setConfig({}); document.body.appendChild(sc2);
await wait(31000); sc2.hass = { ...hass }; await wait(150);
const uf = ic(sc2.shadowRoot.querySelector('.row[data-name="ufficio"]').innerHTML);
ok(/almeno una vera: \(tutte vere: Casa vuota è on, orario dopo le 08:00\) o Casa vuota è off/.test(uf), "condizioni annidate spiegate - " + uf);
ok(/orario dopo le Inizio feriali/.test(ic(sc2.shadowRoot.querySelector('.row[data-name="morning"]').innerHTML)), "orario legato a input_datetime: nome leggibile");
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
