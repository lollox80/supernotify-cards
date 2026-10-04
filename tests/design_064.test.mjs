// CHANGELOG
// 2026-10-04 v0.64.0: pulizia del codice - base comune SnCard, un solo snEsc, helper condivisi.
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

ok((SRC.match(/^  set hass\(hass\) \{/gm) || []).length === 1, "un solo setter hass (in SnCard)");
ok((SRC.match(/^\s*const esc = \(\w+\) => String/gm) || []).length === 0, "nessuna copia locale di esc");
ok((SRC.match(/const prioCol = \{ critical:/g) || []).length === 0, "colori priorità da snPrioColor");
const tags = window.customCards.map((c) => c.type);
ok(tags.length === 14 && tags.every((t) => customElements.get(t)), "14 card registrate");
// every card renders with the base setter
const hass = { language: "it", themes: { darkMode: true }, entities: {}, user: { id: "u", is_admin: true }, services: { supernotify: {} },
  states: {}, callWS: async () => ({ response: {} }), callService: async () => {}, callApi: async () => ({}) };
let rendered = 0;
for (const t of tags) {
  const el = document.createElement(t);
  el.setConfig({ ...(customElements.get(t).getStubConfig ? customElements.get(t).getStubConfig() : {}), show_version: true });
  document.body.appendChild(el);
  try { el.hass = hass; if (el.shadowRoot && el.style.colorScheme === "dark") rendered++; } catch (e) { console.log(t, e.message); }
}
ok(rendered === 14, `tutte le card disegnate in tema scuro (${rendered}/14)`);
console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
