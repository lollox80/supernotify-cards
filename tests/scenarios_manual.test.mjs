// SuperNotify 2.7.0: uno scenario SENZA condizioni ha un binary_sensor "manuale"
// scrivibile. La scenarios-card deve riconoscerlo, pulirne il nome e offrire
// l'interruttore "applica ora" (scrittura dello stato), separato da "abilitato".
import { JSDOM } from "jsdom";
import fs from "fs";
import assert from "assert";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

const calls = [];
const attrs = (n) => ({ name: n, enabled: true, delivery: {}, action_groups: [] });
const hass = {
  language: "it", themes: { darkMode: false },
  states: {
    "switch.supernotify_scenario_morning": { state: "on", attributes: { ...attrs("morning"), friendly_name: "SuperNotify Scenario Morning" } },
    "binary_sensor.supernotify_scenario_morning": { state: "on", attributes: { ...attrs("morning"), friendly_name: "SuperNotify Condizione scenario Morning" } },
    "switch.supernotify_scenario_ospiti": { state: "on", attributes: { ...attrs("ospiti"), friendly_name: "SuperNotify Scenario Ospiti in casa" } },
    "binary_sensor.supernotify_scenario_ospiti": { state: "off", attributes: { ...attrs("ospiti"), friendly_name: "SuperNotify Scenario manuale Ospiti in casa" } },
    // manuale riconosciuto SOLO dal friendly_name (registro senza translation_key)
    "binary_sensor.supernotify_scenario_test": { state: "on", attributes: { ...attrs("test"), friendly_name: "SuperNotify Scenario Manual Test" } },
  },
  entities: {
    "binary_sensor.supernotify_scenario_morning": { translation_key: "scenario" },
    "binary_sensor.supernotify_scenario_ospiti": { translation_key: "scenario_manual" },
  },
  callWS: async () => ({ response: { scenarios: [] } }),
  callService: (d, s, data) => { calls.push(["svc", d, s, data.entity_id]); return Promise.resolve(); },
  callApi: (m, path, body) => { calls.push(["api", m, path, body.state]); return Promise.resolve(); },
};

const card = document.createElement("supernotify-scenarios-card");
card.setConfig({});
document.body.appendChild(card);
card.hass = hass;
const root = card.shadowRoot;
const rows = [...root.querySelectorAll(".row")];
assert.strictEqual(rows.length, 3, "una riga per scenario");
const byName = (n) => rows.find((r) => r.textContent.includes(n));

const osp = byName("Ospiti in casa");
assert.ok(osp, "nome pulito 'Ospiti in casa' (niente 'manuale')");
assert.ok(!osp.querySelector(".mid b").textContent.includes("manuale"));
assert.ok(osp.textContent.includes("✋ manuale"), "tag manuale");
assert.strictEqual(osp.querySelectorAll(".sw").length, 2, "abilitato + applica ora");
assert.ok(!osp.textContent.includes("attivo ora"), "manuale spento -> non attivo");

const mor = byName("Morning");
assert.strictEqual(mor.querySelectorAll(".sw").length, 1, "scenario con condizioni: solo abilitato");
assert.ok(!mor.textContent.includes("✋"));
assert.ok(mor.textContent.includes("attivo ora"));

const tst = byName("Test");
assert.ok(tst.textContent.includes("✋ manuale"), "fallback friendly_name");
assert.strictEqual(tst.querySelector(".mid b").textContent, "Test");

// applica ora -> scrittura stato del binary_sensor manuale
const man = osp.querySelector(".sw.man input");
man.checked = true; man.dispatchEvent(new dom.window.Event("change"));
// abilitato -> servizio switch
const en = osp.querySelector(".sw:not(.man) input");
en.checked = false; en.dispatchEvent(new dom.window.Event("change"));
assert.deepStrictEqual(calls, [
  ["api", "POST", "states/binary_sensor.supernotify_scenario_ospiti", "on"],
  ["svc", "switch", "turn_off", "switch.supernotify_scenario_ospiti"],
]);

// manuale acceso + abilitato -> attivo ora
hass.states["binary_sensor.supernotify_scenario_ospiti"].state = "on";
card.hass = { ...hass };
assert.ok([...root.querySelectorAll(".row")].find((r) => r.textContent.includes("Ospiti")).textContent.includes("attivo ora"));
console.log("scenarios_manual: OK");
process.exit(0);
