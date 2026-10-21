// v0.92.0 (perf): cache per oggetto states, a11y solo sui nodi aggiunti, stats senza ridisegni inutili.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
global.MutationObserver = dom.window.MutationObserver; // as in a browser: the a11y observer runs
dom.window.customCards = [];
dom.window.confirm = () => true;
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 20));

const sw = (name, state = "on") => ({ entity_id: `switch.supernotify_delivery_${name}`, state,
  attributes: { friendly_name: `SuperNotify Delivery ${name}`, transport: "mobile_push" } });
const base = {
  "switch.supernotify_delivery_mobile_push": sw("mobile_push"),
  "switch.supernotify_delivery_email": sw("email"),
  "sensor.temperatura_sala": { entity_id: "sensor.temperatura_sala", state: "21.0", attributes: {} },
  "update.supernotify_update": { entity_id: "update.supernotify_update", state: "off", attributes: { installed_version: "v2.11.1" } },
};
for (let i = 0; i < 500; i++) base[`sensor.x_${i}`] = { entity_id: `sensor.x_${i}`, state: "1", attributes: {} };
const THEMES = { darkMode: false }; const ENTS = {}; const SVCS = { supernotify: {} };
const mkHass = (states) => ({ language: "it", themes: THEMES, entities: ENTS, services: SVCS, states,
  callWS: async () => ({ response: {} }), callService: async () => {}, callApi: async () => ({}) });

// ── 1. deliveries: same rows for every card, redraw only on a relevant change ──
const d = document.createElement("supernotify-deliveries-card");
d.setConfig({});
document.body.appendChild(d);
let states = { ...base };
d.hass = mkHass(states); await tick();
let n = 0; const orig = d._update.bind(d); d._update = () => { n++; orig(); };
for (let i = 0; i < 20; i++) {
  states = { ...states, "sensor.temperatura_sala": { ...states["sensor.temperatura_sala"], state: String(21 + i / 10) } };
  d.hass = mkHass(states); await tick();
}
ok(n === 0, `20 aggiornamenti estranei -> ${n} ridisegni (atteso 0)`);
const rowsBefore = d.shadowRoot.querySelectorAll('[data-sn-a11y="row"]').length;
ok(rowsBefore > 0, `a11y: righe raggiungibili da tastiera (${rowsBefore})`);
states = { ...states, "switch.supernotify_delivery_email": sw("email", "off") };
d.hass = mkHass(states); await tick();
ok(n === 1, `spegnendo email -> ${n} ridisegno (atteso 1)`);
const rowsAfter = d.shadowRoot.querySelectorAll('[data-sn-a11y="row"]');
ok(rowsAfter.length === rowsBefore && [...rowsAfter].every((r) => r.getAttribute("tabindex") === "0"),
  `a11y: dopo il ridisegno parziale le righe nuove sono di nuovo raggiungibili (${rowsAfter.length})`);
states = { ...states, "switch.supernotify_delivery_sms": sw("sms") };
d.hass = mkHass(states); await tick();
ok(n === 2 && /sms/.test(d.shadowRoot.textContent), `nuova delivery -> compare (${n})`);
ok(d.shadowRoot.querySelectorAll("style[data-sn-a11y-css]").length === 1, "a11y: un solo foglio di stile");

// ── 2. stats: version boxes only when an update entity changes ──
const s = document.createElement("supernotify-stats-card");
s.setConfig({});
document.body.appendChild(s);
s.hass = mkHass(states); await tick();
let v = 0; const ov = s._updateVersions.bind(s); s._updateVersions = () => { v++; ov(); };
for (let i = 0; i < 20; i++) {
  states = { ...states, "sensor.temperatura_sala": { ...states["sensor.temperatura_sala"], state: String(30 + i) } };
  s.hass = mkHass(states); await tick();
}
ok(v === 0, `stats: 20 aggiornamenti estranei -> ${v} ridisegni delle versioni (atteso 0)`);
states = { ...states, "update.supernotify_update": { ...states["update.supernotify_update"], state: "on" } };
s.hass = mkHass(states); await tick();
ok(v === 1, `stats: update entity cambiata -> ${v} ridisegno (atteso 1)`);

console.log(fail ? `\n${fail} FAIL` : "\nall passed");
process.exit(fail ? 1 : 0);
