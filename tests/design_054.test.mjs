// v0.54.0: singolare/plurale, nomi leggibili in simulatore e scenari, fasce tradotte e dalla mattina.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 40));
const st = (state, attributes = {}) => ({ state, attributes });
const del = (name, fn, on = "on") => st(on, { name, enabled: on === "on", transport: "mobile_push", inclusion: ["default"], friendly_name: `SuperNotify Delivery ${fn} abilitata` });
const states = {
  "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono"),
  "switch.supernotify_delivery_sms_fallback": del("sms_fallback", "SMS di riserva", "off"),
  "switch.supernotify_scenario_ospiti": st("on", { name: "ospiti", friendly_name: "SuperNotify Scenario Voce spenta (ospiti)", delivery: { mobile_push: { enabled: false } } }),
  "binary_sensor.supernotify_scenario_ospiti": st("on"),
  "switch.supernotify_recipient_lorenzo": st("on", { entity_id: "person.lorenzo", mobile_devices: [{}], friendly_name: "SuperNotify Recipient Lorenzo abilitato" }),
  "sensor.supernotify_failures": st("1"),
};
for (const [b, t] of [["early_morning", "06:00"], ["morning", "07:30"], ["evening", "19:00"], ["late_night", "00:30"]]) {
  states["input_datetime.s_" + b] = st(t + ":00");
  states["input_number.v_" + b] = st("40");
}
const mk = async (tag, cfg, lang = "it") => {
  const el = document.createElement(tag); el.setConfig(cfg); document.body.appendChild(el);
  el.hass = { language: lang, themes: { darkMode: false }, entities: {}, services: {}, states,
    callService: async () => {}, callApi: async () => ({}),
    callWS: async (m) => {
      if (m.service === "enquire_deliveries_by_scenario") return { response: { ospiti: { enabled: [], disabled: ["mobile_push"] } } };
      if (m.service === "enquire_implicit_deliveries") return { response: { default: ["mobile_push"] } };
      if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["ospiti"] } };
      return { response: {} };
    } };
  await tick(); return el.shadowRoot;
};

const ov = await mk("supernotify-overview-card", {});
const txt = ov.textContent.replace(/\s+/g, " ");
ok(/1 canale spento/.test(txt) && /1 fallimento/.test(txt), "overview: '1 canale spento', '1 fallimento'");
const rc = await mk("supernotify-recipients-card", {});
ok(/1 dispositivo\b/.test(rc.textContent), "recipients: '1 dispositivo'");
const sim = await mk("supernotify-simulator-card", {});
ok(/Voce spenta \(ospiti\)/.test(sim.textContent) && /Notifica sul telefono/.test(sim.textContent), "simulatore: scenario e canale con il nome leggibile");
const sc = await mk("supernotify-scenarios-card", {});
ok([...sc.querySelectorAll(".tag")].some((t) => /Notifica sul telefono/.test(t.textContent) && t.title === "mobile_push"), "scenari: tag del canale con alias, tecnico nel tooltip");
const bands = Object.fromEntries(["early_morning", "morning", "evening", "late_night"].map((b) => [b, { start: "input_datetime.s_" + b, volume: "input_number.v_" + b }]));
const bd = await mk("supernotify-bands-card", { bands }, "en");
const names = [...bd.querySelectorAll(".row .who b")].map((n) => n.textContent.trim());
console.log("    fasce:", names.join(" | "));
ok(names[0] === "Early morning" && names[names.length - 1] === "Late night", "fasce tradotte, dalla mattina, notte fonda in fondo");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
