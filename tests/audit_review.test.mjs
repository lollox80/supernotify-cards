// 1.0.0 (audit, final review): the scenarios card has no poll of its own any more, but its condition lines still
// follow the clock (the shared trace is read again when the card is updated, at most every 30 s); the composer's
// "+ channel" menu lists the channels as they are when it is tapped; the senders cache is bounded.
import { boot, load, ok, wait, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/x", scroll: true });
const w = dom.window;
let off = 0;
const realNow = Date.now; Date.now = () => realNow() + off;
const WD = w.eval("Date"); const wReal = WD.now.bind(WD); WD.now = () => wReal() + off;
const api = load("SN_SENDERS, snSenderEvents");

let res = true, traceCalls = 0;
const attrs = { name: "morning", enabled: true };
const states = {
  "switch.supernotify_scenario_morning": { entity_id: "switch.supernotify_scenario_morning", state: "on", attributes: { ...attrs, friendly_name: "SuperNotify Scenario Morning" } },
  "binary_sensor.supernotify_scenario_morning": { entity_id: "binary_sensor.supernotify_scenario_morning", state: "on", attributes: { ...attrs, friendly_name: "SuperNotify Scenario Morning" } },
  "input_boolean.dnd": { entity_id: "input_boolean.dnd", state: "on", attributes: { friendly_name: "DND" } },
};
const hass = {
  language: "en", locale: { language: "en" }, themes: { darkMode: false }, user: { is_admin: true },
  states, entities: {}, devices: {}, config: { version: "2026.2.0" },
  services: { supernotify: { enquire_active_scenarios: { fields: {} } } },
  callService: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_active_scenarios") {
      if (m.service_data && m.service_data.trace) traceCalls++;
      return { response: { scenarios: ["morning"], trace: [[{ name: "morning", conditions: [{ condition: "state", entity_id: "input_boolean.dnd", state: "on" }],
        trace: { trace: { "condition/conditions/condition/0": [{ result: { result: res } }] } } }], []] } };
    }
    if (m.type === "logbook/get_events") return [];
    return { response: {} };
  },
};

const el = document.createElement("supernotify-scenarios-card");
el.setConfig({}); document.body.appendChild(el); el.hass = hass;
await wait(300);
const line = () => { const r = el.shadowRoot.querySelector('.row[data-name="morning"]'); const m = r && r.innerHTML.match(/[✓✕]/); return m && m[0]; };
const first = traceCalls;
ok(first >= 1 && line() === "✓", "scenarios: condition line drawn from the trace (✓)");
res = false;
for (let k = 1; k <= 3; k++) { off += 61000; el.hass = { ...hass, states: { ...states } }; await wait(150); }
ok(traceCalls > first, `scenarios: the trace is read again as time passes (${first} → ${traceCalls})`);
ok(line() === "✕", "scenarios: the condition line follows the new result (✕)");

// senders cache bounded at 60
for (let i = 0; i < 80; i++) api.snSenderEvents(hass, { id: `n${i}`, created: new Date().toISOString(), original_context: { id: `c${i}` } });
ok(api.SN_SENDERS.size <= 60, `senders cache bounded (${api.SN_SENDERS.size})`);
process.exit(fail ? 1 : 0);
