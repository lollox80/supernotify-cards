// v0.56.1: fix visti sul HA vero - 5 numeri senza buco, messaggio senza titolo, markdown, chip scenari.
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

const LAST = { id: "x1", title: "", priority: "medium", created: new Date(Date.now() - 7 * 60000).toISOString(), delivered: 2,
  message: "Nuovi Aggiornamenti in HACS (3) Ci sono 3 aggiornamenti in HACS. [Clock Weather Card Update](https://github.com/pkissling/clock-weather-card/releases/tag/v2.9.0) e **altri due**",
  deliveries: { mobile_push: { success: [1] }, email: { success: [1] }, alexa: {} } };
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true }, services: { supernotify: {} },
  states: { "sensor.inviate": { state: "177", attributes: {} } },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => ({ response: m.service === "enquire_last_notification" ? LAST
    : m.service === "enquire_active_scenarios" ? { scenarios: ["afternoon"] } : {} }),
};
const mount = (cfg = {}) => { const c = document.createElement("supernotify-overview-card"); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

const oc = mount({ stats: "full", sent_today_entity: "sensor.inviate" });
await flush(); await flush();
const st = oc.shadowRoot.getElementById("stats");
ok(st.dataset.n === "5" && st.children.length === 5, `stats full: 5 riquadri, data-n=${st.dataset.n}`);
const css = oc.shadowRoot.innerHTML;
ok(/\.stats\[data-n="5"\] \{ grid-template-columns: repeat\(6, 1fr\)/.test(css), "5 numeri: griglia 3+2");
const o3 = mount({});
await flush(); await flush();
ok(o3.shadowRoot.getElementById("stats").dataset.n === "3", "default: 3 riquadri");

const last = oc.shadowRoot.getElementById("last");
ok(!last.querySelector(".lt"), "senza titolo niente riga in grassetto");
const m = last.querySelector(".lmm.solo");
ok(m && /Clock Weather Card Update e altri due$/.test(m.textContent), `markdown ripulito (${m && m.textContent.slice(-40)})`);
ok(!/https?:\/\//.test(last.textContent) && !/\*\*/.test(last.textContent), "niente link grezzo né asterischi");
ok(/-webkit-line-clamp: 3/.test(css), "messaggio tagliato a 3 righe, non a metà parola");
ok(/\.chip \{ display: inline-flex; align-items: center; gap: 6px;/.test(css), "chip scenari: spazio tra icona e nome");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
