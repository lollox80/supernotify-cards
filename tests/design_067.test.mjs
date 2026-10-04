// CHANGELOG
// 2026-10-04 v0.67.0: link tra viste della stessa dashboard.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/dashboard-supernotify/panoramica" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ws = [];
const DASH = { views: [
  { path: "panoramica", sections: [{ cards: [{ type: "custom:supernotify-overview-card" }] }] },
  { path: "configura", visible: [{ user: "u1" }], sections: [{ cards: [{ type: "custom:supernotify-deliveries-card" }, { type: "vertical-stack", cards: [{ type: "custom:supernotify-transports-card" }] }] }] },
  { path: "segreta", visible: [{ user: "altro" }], sections: [{ cards: [{ type: "custom:supernotify-recipients-card" }] }] },
] };
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true }, services: { supernotify: {} },
  states: {
    "switch.supernotify_transport_telegram": { state: "on", attributes: { name: "telegram", error_count: 2, last_error_message: "chat not found" } },
    "switch.supernotify_delivery_sms": { state: "off", attributes: { name: "sms", transport: "sms" } },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => { ws.push(m); if (m.type === "lovelace/config") return DASH; return { response: {} }; },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

const ov = mount("supernotify-overview-card");
await wait(60); ov.hass = { ...hass }; await wait(20);
const lc = ws.find((m) => m.type === "lovelace/config");
ok(lc && lc.url_path === "dashboard-supernotify", "configurazione della dashboard letta (una volta)");
ok(ws.filter((m) => m.type === "lovelace/config").length === 1, "una sola lettura");
const goBtn = [...ov.shadowRoot.querySelectorAll("#health [data-go]")].find((b) => /transport/.test(b.closest(".hr").textContent));
ok(!!goBtn, "Mostra › anche se la card Transport è in un'altra vista");
goBtn.click(); await wait(10);
ok(window.location.pathname === "/dashboard-supernotify/configura", `naviga alla vista che la contiene (${window.location.pathname})`);
// the view opens: its cards are created now
const tr = mount("supernotify-transports-card");
await wait(500);
ok(tr._open && tr._open.has("switch.supernotify_transport_telegram"), "la card Transport apre la riga quando è disegnata");
ok(!ov.shadowRoot.querySelector("#occ [data-gor]") || !ov.shadowRoot.querySelector("#occ .chip.go"), "destinatari in una vista non visibile all'utente: nessun link");
console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
