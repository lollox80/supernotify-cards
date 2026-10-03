// v0.47.0: ridisegno solo su cambi rilevanti, composer senza testo (SuperNotify 2.11.1),
// getGridOptions per le dashboard a sezioni.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.confirm = () => true;
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 20));

const sw = (name, state = "on") => ({ entity_id: `switch.supernotify_delivery_${name}`, state,
  attributes: { friendly_name: `SuperNotify Delivery ${name} abilitata`, transport: "mobile_push" } });
const base = {
  "switch.supernotify_delivery_mobile_push": sw("mobile_push"),
  "switch.supernotify_delivery_email": sw("email"),
  "sensor.temperatura_sala": { entity_id: "sensor.temperatura_sala", state: "21.0", attributes: {} },
  "camera.ingresso": { entity_id: "camera.ingresso", state: "idle", attributes: { friendly_name: "Ingresso" } },
  "update.supernotify_update": { entity_id: "update.supernotify_update", state: "off", attributes: { installed_version: "v2.11.1" } },
};
const calls = [];
const mkHass = (states, extra = {}) => ({
  language: "it", themes: THEMES, entities: ENTS, services: SVCS, states,
  callWS: async () => ({ response: {} }),
  callService: async (d, s, data) => { calls.push([d, s, data]); },
  callApi: async () => ({}), ...extra,
});
const THEMES = { darkMode: false }; const ENTS = {}; const SVCS = { supernotify: { notify: {} } };

// ── 1. deliveries-card: niente ridisegno per un sensore estraneo ─────────────
const d = document.createElement("supernotify-deliveries-card");
d.setConfig({});
document.body.appendChild(d);
let states = { ...base };
d.hass = mkHass(states); await tick();
let n = 0; const orig = d._update.bind(d); d._update = () => { n++; orig(); };
d.hass = mkHass(states); await tick();
for (let i = 0; i < 20; i++) {
  states = { ...states, "sensor.temperatura_sala": { ...states["sensor.temperatura_sala"], state: String(21 + i / 10) } };
  d.hass = mkHass(states); await tick();
}
ok(n === 0, `21 aggiornamenti di un sensore estraneo → ${n} ridisegni (atteso 0)`);
states = { ...states, "switch.supernotify_delivery_email": sw("email", "off") };
d.hass = mkHass(states); await tick();
ok(n === 1, `spegnendo email → ${n} ridisegno (atteso 1)`);
ok(/email/.test(d.shadowRoot.textContent), "la card mostra ancora i canali");
states = { ...states, "switch.supernotify_delivery_sms": sw("sms") };
d.hass = mkHass(states); await tick();
ok(n === 2, `nuova delivery comparsa → ridisegno (${n})`);
d.hass = mkHass(states, { language: "en" }); await tick();
ok(n === 3, `cambio lingua → ridisegno (${n})`);

// ── 3. composer senza messaggio ──────────────────────────────────────────────
const c = document.createElement("supernotify-composer-card");
c.setConfig({});
document.body.appendChild(c);
c.hass = mkHass({ ...base }); await tick();
const sr = c.shadowRoot;
const toast = () => sr.getElementById("toast").textContent;
sr.getElementById("m").value = "";
await c._send();
ok(calls.length === 0 && /camera o un canale/.test(toast()), `senza testo né camera: avviso (${toast()})`);
sr.getElementById("cam").value = "camera.ingresso";
await c._send();
ok(calls.length === 1 && !("message" in calls[0][2]) && calls[0][2].camera_entity_id === "camera.ingresso",
  "con la camera e SuperNotify 2.11.1: inviata senza 'message'");
c.hass = mkHass({ ...base, "update.supernotify_update": { ...base["update.supernotify_update"], attributes: { installed_version: "v2.10.3" } } });
await c._send();
ok(calls.length === 1 && /2\.11\.1/.test(toast()), `su 2.10.3: non inviata (${toast()})`);
sr.getElementById("m").value = "Ciao";
await c._send();
ok(calls.length === 2 && calls[1][2].message === "Ciao", "con il testo parte come prima");
c.hass = mkHass({ ...base }, { callService: async () => { throw new Error("boom"); } });
await c._send();
ok(/Non inviata: boom/.test(toast()), `errore del servizio mostrato (${toast()})`);

// ── 4. getGridOptions ────────────────────────────────────────────────────────
const tags = ["control", "overview", "bands", "deliveries", "transports", "recipients", "scenarios",
  "simulator", "composer", "automations", "stats", "archive", "why"];
const missing = tags.filter((t) => typeof customElements.get(`supernotify-${t}-card`).prototype.getGridOptions !== "function");
ok(!missing.length, `getGridOptions su tutte le 13 card${missing.length ? " - mancano " + missing : ""}`);
const g = customElements.get("supernotify-archive-card").prototype.getGridOptions();
ok(g.columns === "full", "archivio a tutta larghezza");

// ── tema scuro: i controlli nativi seguono il tema ───────────────────────────
const b = document.createElement("supernotify-transports-card");
b.setConfig({}); document.body.appendChild(b);
b.hass = { ...mkHass({ ...base }), themes: { darkMode: true } }; await tick();
ok(b.style.colorScheme === "dark", "tema scuro: color-scheme dark sull'elemento");
b.hass = { ...mkHass({ ...base }), themes: { darkMode: false } }; await tick();
ok(b.style.colorScheme === "light", "tema chiaro: color-scheme light");

// ── overview: dati subito, senza aspettare il primo giro da 60 s ─────────────
let asked = 0;
const ov = document.createElement("supernotify-overview-card");
ov.setConfig({}); document.body.appendChild(ov);
ov.hass = mkHass({ ...base }, { callWS: async () => { asked++; return { response: {} }; } }); await tick();
ok(asked >= 3, `overview: interroga SuperNotify appena riceve hass (${asked} chiamate)`);

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
