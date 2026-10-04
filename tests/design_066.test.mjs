// CHANGELOG
// 2026-10-04 v0.66.0: scenari attivi da SuperNotify, prova per canale, scenario perché/cosa cambia.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const T = (p, r, extra = {}) => ({ [p]: [{ path: p, result: { result: r, ...extra } }] });
// trace shaped like SuperNotify 2.12 answers (probed in a test HA)
const TRACE = [
  [{ name: "simple", enabled: true, conditions: [{ condition: "state", entity_id: ["input_boolean.guests"], state: "on" }],
     trace: { trace: { ...T("condition/conditions/condition/0", true), ...T("condition/conditions/condition/0/entity_id/0", true, { state: "on", wanted_state: "on" }) } } }],
  [{ name: "guests", enabled: true, conditions: [{ condition: "and", conditions: [
      { condition: "state", entity_id: ["input_boolean.guests"], state: "on" },
      { condition: "state", entity_id: ["input_boolean.dnd"], state: "on" },
      { condition: "template", value_template: { __type: "Template" } }] }],
     trace: { trace: { ...T("condition/conditions/condition/0", false), ...T("condition/conditions/condition/0/conditions/0", true),
       ...T("condition/conditions/condition/0/conditions/1", false), ...T("condition/conditions/condition/0/conditions/1/entity_id/0", false, { state: "off", wanted_state: "on" }) } } }],
  {},
];
const ws = [];
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u", is_admin: true },
  services: { supernotify: { notify: { response: { optional: true } }, enquire_active_scenarios: {} } },
  states: {
    // 2.12.1: binary_sensors unknown without scenario_control.refresh
    "binary_sensor.supernotify_scenario_simple": { state: "unknown", attributes: {} },
    "binary_sensor.supernotify_scenario_guests": { state: "unknown", attributes: {} },
    "switch.supernotify_scenario_simple": { state: "on", attributes: { name: "simple" } },
    "switch.supernotify_scenario_guests": { state: "on", attributes: { name: "guests", friendly_name: "SuperNotify Scenario Ospiti" } },
    "input_boolean.guests": { state: "on", attributes: { friendly_name: "Ospiti" } },
    "input_boolean.dnd": { state: "off", attributes: { friendly_name: "Non disturbare" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push", friendly_name: "SuperNotify Delivery Telefono abilitata" } },
    "switch.supernotify_delivery_alexa": { state: "on", attributes: { name: "alexa", transport: "alexa_media_player", friendly_name: "SuperNotify Delivery Alexa abilitata" } },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m);
    const r = (x) => ({ response: x });
    if (m.service === "enquire_active_scenarios") return r(m.service_data.trace ? { scenarios: ["simple"], trace: TRACE } : { scenarios: ["simple"] });
    if (m.service === "notify" && m.service_data.dry_run) {
      const d = m.service_data;
      const dl = { mobile_push: { success: [{ target: {} }] } };
      if ((d.apply_scenarios || []).includes("guests")) dl.alexa = { success: [{ target: {} }] };
      if (d.delivery_selection === "fixed") return r({ id: "p", deliveries: { [Object.keys(d.delivery)[0]]: { success: [{ target: { entity_id: ["media_player.sala"] } }] } } });
      return r({ id: "x", deliveries: dl });
    }
    return r({});
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// (1) control/overview: active scenarios from SuperNotify with binary_sensors unknown
const cc = mount("supernotify-control-card", {});
await wait(60); cc.hass = { ...hass }; await wait(10);
ok(/Scenari attivi\s*1/.test(cc.shadowRoot.getElementById("statusbar").textContent), `control: 1 scenario attivo con binary_sensor unknown (${cc.shadowRoot.getElementById("statusbar").textContent.replace(/\s+/g, " ").trim()})`);

// (3) scenarios: why + what changes
const sc = mount("supernotify-scenarios-card");
await wait(60); sc.hass = { ...hass }; await wait(10);
let row = sc.shadowRoot.querySelector('.row[data-name="guests"]');
row.querySelector(".mid b").click(); await wait(40);
row = sc.shadowRoot.querySelector('.row[data-name="guests"]');
const det = row.querySelector(".det");
ok(det && /Non attivo adesso/.test(det.textContent), "scenario non attivo: lo dice");
ok(/Ospiti è on/.test(det.textContent) && det.querySelector(".wl.y") && det.querySelector(".wl.n") && /Non disturbare è on/.test(det.textContent) && /ora: off/.test(det.textContent), `condizioni con esito e stato attuale (${det.textContent.replace(/\s+/g, " ").slice(0, 160)})`);
ok(/condizione con modello/.test(det.textContent) && /non valutata/.test(det.textContent), "condizione non valutata (corto circuito) segnata");
ok(ws.some((m) => m.service === "enquire_active_scenarios" && m.service_data.trace === true), "trace chiesto a SuperNotify");
det.querySelector(".sdiff").click(); await wait(40);
const res = sc.shadowRoot.querySelector('.row[data-name="guests"] .sdres');
ok(res && /partirebbe anche Alexa/.test(res.textContent), `cosa cambia se si attiva: + Alexa (${res && res.textContent.trim()})`);
const dr = ws.filter((m) => m.service === "notify" && m.service_data.dry_run);
ok(dr.length === 2 && dr[1].service_data.apply_scenarios[0] === "guests" && dr.every((m) => m.service_data.force_resend), "due prove: senza e con lo scenario");
let mi = null; sc.addEventListener("hass-more-info", (e) => { mi = e.detail.entityId; });
sc.shadowRoot.querySelector('.row[data-name="guests"] .dmore').click();
ok(mi === "switch.supernotify_scenario_guests" || /scenario_guests/.test(String(mi)), "Tutti gli attributi apre il dialogo");

// (2) deliveries: try this channel
const dl = mount("supernotify-deliveries-card");
await wait(20);
const ar = [...dl.shadowRoot.querySelectorAll(".row")].find((r) => /Alexa/.test(r.textContent));
ar.querySelector(".mid b").click(); await wait(10);
dl.shadowRoot.querySelector(".dprobe").click(); await wait(40);
const pr = ws.filter((m) => m.service === "notify" && m.service_data.delivery_selection === "fixed").pop();
ok(pr && Object.keys(pr.service_data.delivery).join() === "alexa" && pr.service_data.dry_run === "simulate", "prova canale: dry run solo su quel canale");
ok(/sala/.test(dl.shadowRoot.querySelector(".dres").textContent), "prova canale: risultato con i destinatari");

console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
