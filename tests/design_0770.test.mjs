// CHANGELOG
// 2026-10-05 v0.77.0: canali - "riserva: ..." e "riserva di ..." dall'attributo fallback dello switch.
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
const S = (state, attributes) => ({ state, attributes });
const states = {
  "switch.supernotify_delivery_alexa_announce": S("on", { name: "alexa_announce", friendly_name: "Annuncio Alexa", transport: "alexa_media_player", fallback: ["tts", "mobile_push"] }),
  "switch.supernotify_delivery_tts": S("on", { name: "tts", friendly_name: "Voce TTS", transport: "tts" }),
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push", friendly_name: "Telefono", transport: "mobile_push" }),
};
const el = document.createElement("supernotify-deliveries-card");
el.setConfig({}); document.body.appendChild(el);
el.hass = { language: "it", themes: { darkMode: false }, entities: {}, services: {}, user: { id: "u", is_admin: true }, states,
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }) };
await new Promise((r) => setTimeout(r, 50));
const t = el.shadowRoot.textContent.replace(/\s+/g, " ");
ok(/riserva: Voce TTS, Telefono/.test(t), "lista delle riserve sul canale");
ok((t.match(/riserva di Annuncio Alexa/g) || []).length === 2, "le riserve dicono di chi");
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
