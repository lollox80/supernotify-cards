// v0.44.0: composer-card "Try without sending" (SuperNotify issue #218 dry-run action).
import { JSDOM } from "jsdom";
import fs from "fs";
import assert from "assert";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

const services = [];
const ws = [];
const PLAN = {
  priority: "medium",
  scenarios: ["afternoon", "multi_home"],
  occupancy: { home: ["person.lorenzo"] },
  deliveries: {
    tts: { skipped: "DELIVERY_DISABLED" },
    mobile_push: { recipients: ["person.lorenzo"], targets: [{ mobile_app_id: ["mobile_app_phone"] }] },
    alexa_announce: { recipients: [], targets: [{ entity_id: ["media_player.a", "media_player.b"] }] },
  },
  delivery_provenance: {},
};
const mkHass = (withAction) => ({
  language: "it", themes: { darkMode: false },
  services: { supernotify: { notify: {}, ...(withAction ? { enquire_dry_run: {} } : {}) } },
  states: {
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { transport: "mobile_push", friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" } },
    "switch.supernotify_delivery_tts": { state: "off", attributes: { transport: "tts" } },
    "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { transport: "alexa_devices" } },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo" } },
  },
  callService: (d, s, data) => services.push([d, s, data]),
  callWS: async (msg) => { ws.push(msg); return { context: {}, response: PLAN }; },
});

const card = document.createElement("supernotify-composer-card");
card.setConfig({});
document.body.appendChild(card);
card.hass = mkHass(false);
const sr = card.shadowRoot;
const dry = sr.getElementById("dry");
assert.ok(dry, "dry button rendered");
assert.equal(dry.style.display, "none", "hidden while the action does not exist");

// the action appears (HA restarted on the new SuperNotify): shown without re-rendering the form
sr.getElementById("m").value = "Porta aperta";
sr.getElementById("p").value = "high";
card.hass = mkHass(true);
assert.equal(sr.getElementById("m").value, "Porta aperta", "form kept");
assert.equal(sr.getElementById("dry").style.display, "", "visible with the action");

await card._dryRun();
assert.equal(ws.length, 1);
assert.deepEqual(
  { type: ws[0].type, domain: ws[0].domain, service: ws[0].service, rr: ws[0].return_response },
  { type: "call_service", domain: "supernotify", service: "enquire_dry_run", rr: true });
assert.equal(ws[0].service_data.message, "Porta aperta");
assert.equal(ws[0].service_data.priority, "high");
assert.equal(services.length, 0, "nothing sent");
const box = sr.getElementById("dryBox");
const txt = box.textContent;
assert.ok(txt.includes("Se la inviassi adesso"));
assert.ok(txt.includes("Notifica sul telefono") && txt.includes("Lorenzo"), "alias + recipient name");
assert.ok(txt.includes("saltato: DELIVERY_DISABLED"), "skip reason");
assert.ok(txt.includes("2 target"), "direct targets counted");
assert.ok(txt.includes("afternoon, multi_home"), "scenarios");
const rows = [...box.querySelectorAll(".dRow")].map((r) => r.textContent);
assert.ok(rows[rows.length - 1].startsWith("✖"), "skipped channels listed last");

// suppressed + fallback, and the plan wrapped in result
card._renderDry({ result: { deliveries: {}, suppressed: "DUPE" } });
assert.ok(box.textContent.includes("soppressa: DUPE"));
card._renderDry({ deliveries: { tts: { skipped: "NO_TARGET" } }, fallback: ["persistent"] });
assert.ok(box.textContent.includes("ripiego su persistent"));

// error path
card._hass.callWS = async () => { throw { code: "service_validation_error", message: "boom" }; };
await card._dryRun();
assert.ok(box.textContent.includes("Simulazione non riuscita: boom"));

// custom name via config
const c2 = document.createElement("supernotify-composer-card");
c2.setConfig({ dry_run_action: "preview" });
document.body.appendChild(c2);
const h2 = mkHass(false); h2.services.supernotify.preview = {};
c2.hass = h2;
assert.equal(c2._dryAction(), "preview");

// Send still works and still refuses an empty message
sr.getElementById("p").value = "";
card._send();
assert.equal(services.length, 1);
assert.deepEqual(services[0].slice(0, 2), ["supernotify", "notify"]);
assert.equal(services[0][2].message, "Porta aperta");
sr.getElementById("m").value = "";
card._send();
assert.equal(services.length, 1, "empty message not sent");

console.log("composer dry run: OK");
