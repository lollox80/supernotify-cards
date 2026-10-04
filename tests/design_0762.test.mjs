// CHANGELOG
// 2026-10-05 v0.76.2: perché - "riserva di <canale>" per un canale partito come riserva (fallback:).
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
const w = document.createElement("supernotify-why-card");
w.setConfig({ auto_select: false }); document.body.appendChild(w);
w.hass = { language: "it", themes: { darkMode: false }, entities: {}, services: {}, user: { id: "u", is_admin: true },
  states: { "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { name: "alexa_announce", friendly_name: "Annuncio Alexa" } } },
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }) };
const T = { src_fallback: "riserva di {x}", src_default: "d", src_call: "c", src_scen: "s", src_recipient: "r" };
ok(w._provLabel("fallback:alexa_announce", T) === "riserva di Annuncio Alexa", `etichetta (${w._provLabel("fallback:alexa_announce", T)})`);
ok(w._provLabel("default", T) === "d", "le altre come prima");
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
