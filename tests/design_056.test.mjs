// v0.56.0: l'ultima notifica dell'overview si legge come quella della control, ed è disattivabile.
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
const flush = () => new Promise((r) => setTimeout(r, 30));

const created = new Date(Date.now() - 4 * 60000).toISOString();
const LAST = { id: "abc123", title: "Porta d'ingresso", message: "La porta è aperta da 10 minuti", priority: "high",
  created, delivered: 2, failed: 0, missed: 1,
  deliveries: { mobile_push: { success: [1] }, email: { success: [1] }, alexa: {}, chime: { success: [], error: [] } } };
let calls = [];
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: {} },
  states: { "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", enabled: true,
    friendly_name: "SuperNotify Delivery Telefono abilitata" } } },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => { calls.push(m.service); return { response: m.service === "enquire_last_notification" ? LAST : {} }; },
};
const mount = (cfg = {}) => { const c = document.createElement("supernotify-overview-card"); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

window.__snWhyCards = 1;
const oc = mount();
await flush(); await flush();
const last = oc.shadowRoot.getElementById("last");
// 0.88.0: "4 min" moved into the block title
const txt = last ? (oc.shadowRoot.getElementById("lastH").textContent + " " + last.textContent).replace(/\s+/g, " ") : "";
ok(/Porta d'ingresso/.test(txt) && /La porta è aperta/.test(txt), "titolo + messaggio");
ok(/4 min/.test(txt) && !/\d{4}-\d\d-\d\d \d\d:\d\d/.test(txt), `tempo relativo, non timestamp (${txt.slice(0, 120)})`);
ok(/2 consegnati/.test(txt), "conteggio consegnate al plurale");
const okChip = [...last.querySelectorAll(".badge.b-ok")][0];
ok(okChip && /email/.test(okChip.title), `tooltip coi nomi (${okChip && okChip.title})`);
ok(/1 mancato/.test(txt), "mancato al singolare");
ok(/2 saltati/.test(txt), "saltati");
ok(/Alta/i.test(txt), "priorità tradotta");
ok(!!last.querySelector("#whyBtn"), "bottone Perché ›");

calls = [];
const off = mount({ last_notification: false });
await flush(); await flush();
ok(!off.shadowRoot.getElementById("last"), "last_notification: false nasconde il blocco");
ok(!calls.includes("enquire_last_notification"), "e non chiama enquire_last_notification");

const form = customElements.get("supernotify-overview-card").getConfigForm();
const names = JSON.stringify(form.schema);
ok(/"last_notification"/.test(names), "editor visuale: opzione last_notification");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
