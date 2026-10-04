// CHANGELOG
// 2026-10-04 v0.74.1: archivio e perché non restano su "lettura" se il ridisegno è stato perso.
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const N = [{ id: "abc12345", created: new Date().toISOString(), title: "Porta", message: "Qualcuno", priority: "medium", outcome: "success", deliveries: { mobile_push: { success: 1 } } }];
const hass = { language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u", is_admin: true },
  services: { supernotify: { enquire_archive: {} } }, states: { "sensor.supernotify_notifications": { state: "1", attributes: {}, last_updated: "x" } },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => { await wait(50); return m.service === "enquire_archive" ? { response: { notifications: N, count: 1 } } : { response: {} }; } };
for (const tag of ["supernotify-archive-card", "supernotify-why-card"]) {
  const el = document.createElement(tag);
  el.setConfig({}); document.body.appendChild(el);
  // the "archive read" event is missed (as on a page opened straight on this view)
  window.removeEventListener("supernotify-archive", el._onArchive);
  el.hass = hass;
  await wait(150);
  el.hass = { ...hass };
  await wait(20);
  const txt = el.shadowRoot.getElementById("list").textContent;
  ok(!/Lettura/i.test(txt) && txt.trim().length > 0, `${tag}: ridisegnata al primo aggiornamento (${txt.trim().slice(0, 40)})`);
}
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
