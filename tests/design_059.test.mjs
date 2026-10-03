// v0.59.0: revisione grafica parte 2 - rifiniture (A5, C1-C9).
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

const hass = {
  language: "it", locale: { time_format: "24" }, themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: {} },
  states: {
    "switch.supernotify_transport_alexa_media_player": { state: "on", attributes: { friendly_name: "SuperNotify Transport alexa_media_player Transport Adaptor" } },
    "switch.supernotify_transport_sms": { state: "on", attributes: {} },
    "switch.supernotify_delivery_a1": { state: "on", attributes: { name: "a1", transport: "alexa_media_player" } },
    "switch.supernotify_delivery_a2": { state: "on", attributes: { name: "a2", transport: "alexa_media_player" } },
    "input_datetime.s_m": { state: "07:30:00", attributes: {} }, "input_number.v_m": { state: "45", attributes: {} },
    "input_datetime.s_a": { state: "13:00:00", attributes: {} }, "input_number.v_a": { state: "50", attributes: {} },
  },
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }),
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// C3 bands: one line, start field, slider, percent, "fino alle"
const bc = mount("supernotify-bands-card", { bands: { morning: { start: "input_datetime.s_m", volume: "input_number.v_m" }, afternoon: { start: "input_datetime.s_a", volume: "input_number.v_a" } } });
const row = bc.shadowRoot.querySelector('.row[data-row="morning"]');
ok(row && row.querySelector(".rng").textContent.trim() === "fino alle 13:00", `fasce: «fino alle 13:00» (${row && row.querySelector(".rng").textContent.trim()})`);
ok(row && row.querySelector(".pct").textContent.trim() === "45%" && !row.querySelector(".fld"), "fasce: percentuale a destra, niente etichette INIZIO/VOLUME per riga");
ok(row && row.querySelector("input[type=time]").getAttribute("aria-label").includes("inizio") && row.querySelector("input[type=range]").getAttribute("aria-label").includes("volume"), "fasce: campi con aria-label");
ok(/grid-template-columns: minmax\(0, 1fr\) auto minmax\(80px, 1fr\) 42px/.test(bc.shadowRoot.innerHTML), "fasce: una riga a griglia");

// C6 transports
const tc = mount("supernotify-transports-card");
const trow = [...tc.shadowRoot.querySelectorAll(".row")].map((r) => r.textContent.replace(/\s+/g, " ").trim());
ok(trow.some((t) => /^Alexa Media Player usato da 2 canali/.test(t)), `transport: nome leggibile + uso (${trow[0]})`);
ok(trow.some((t) => /^SMS nessun canale lo usa/.test(t)), `transport: SMS, nome tecnico uguale nascosto (${trow[1]})`);

// C5, A5, C1, C2, C7, C8, C9 (source level)
ok(/left = `\$\{T\.snoozed\} · \$\{mins\} \$\{T\.min\}`/.test(SRC), "control: «In pausa · 25 min»");
ok((SRC.match(/hour12: snH12\(this\._hass\)/g) || []).length === 4, "archivio e perché: formato orario del profilo HA");
ok(/h % 6 === 0/.test(SRC) && /\.bars text \{ font-size: 10\.5px/.test(SRC) && /opt\.half && cw > 640/.test(SRC), "statistiche: grafici a metà larghezza disegnati alla loro misura");
ok(/snBandName\(T, String\(k\)/.test(SRC), "statistiche: fasce del giorno col nome");
ok(/\.map\(\(x\) => `<div>\$\{x\}<\/div>`\)/.test(SRC), "perché: passo 4 in pila");
ok(/snScenarioName\(this\._hass, idx\.scen\[s\]\)/.test(SRC), "archivio: scenari col nome");
ok(/minmax\(0, min\(15em, 42%\)\)/.test(SRC), "simulatore: motivo vicino al nome");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
