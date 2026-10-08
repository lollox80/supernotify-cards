// v0.57.0: una chiamata condivisa tra card per le enquire_*, anteprima nel selettore "Aggiungi card".
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const calls = {};
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: { enquire_archive: {} } },
  states: {
    "input_boolean.casa_dnd": { state: "off", attributes: {} },
    "input_datetime.notifier_start_morning": { state: "07:00:00", attributes: {} },
    "input_number.notifier_morning_volume": { state: "40", attributes: {} },
    "input_datetime.notifier_start_night": { state: "22:00:00", attributes: {} },
    "input_number.notifier_night_volume": { state: "10", attributes: {} },
    "input_datetime.notifier_start_orphan": { state: "12:00:00", attributes: {} },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    calls[m.service] = (calls[m.service] || 0) + 1;
    await wait(5);
    if (m.service === "enquire_last_notification") return { response: { id: "a", message: "ciao", deliveries: {} } };
    if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["morning"] } };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    return { response: {} };
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// ── 1. same view, one call per service ──────────────────────────────────
mount("supernotify-control-card", { last_notification: true });
mount("supernotify-overview-card");
mount("supernotify-scenarios-card");
mount("supernotify-simulator-card");
await wait(80);
ok(calls.enquire_active_scenarios === 1, `enquire_active_scenarios: 1 chiamata per 3 card (${calls.enquire_active_scenarios})`);
ok(calls.enquire_last_notification === 1, `enquire_last_notification: 1 chiamata per 2 card (${calls.enquire_last_notification})`);
ok(calls.enquire_snoozes === 1, `enquire_snoozes: 1 chiamata per 2 card (${calls.enquire_snoozes})`);

// ── 2. after the cache window a refresh reads again ─────────────────────
await wait(2600);
window.dispatchEvent(new window.CustomEvent("supernotify-refresh"));
await wait(80);
ok(calls.enquire_snoozes === 2 && calls.enquire_last_notification === 2, `supernotify-refresh: control e overview rileggono, sempre 1 chiamata (${calls.enquire_snoozes}/${calls.enquire_last_notification})`);
ok(/snEnquireBust\(800\)/.test(SRC) && /snEnquireBust\(1500\)/.test(SRC), "snooze e invio dal composer svuotano la cache");

// ── 3. card picker ──────────────────────────────────────────────────────
const cc = window.customCards.filter((c) => c.type.startsWith("supernotify-"));
ok(cc.length === 13 && cc.every((c) => c.preview === true), "13 card con anteprima nel selettore (0.62.0: + tools; 0.85.0: why dentro archive)");
ok(cc.every((c) => /docs\/cards\/[a-z]+\.md$/.test(c.documentationURL)), "card con link alla documentazione");
const K = (t) => customElements.get(`supernotify-${t}-card`);
const st = K("control").getStubConfig(hass);
ok(st.dnd_entity === "input_boolean.casa_dnd" && st.last_notification === true, `control: usa l'interruttore DND che esiste (${st.dnd_entity})`);
const st0 = K("control").getStubConfig({ states: {} });
ok(!st0.dnd_entity && !st0.tiles.includes("dnd"), "control: senza DND niente riquadro DND");
const sb = K("bands").getStubConfig(hass);
ok(Object.keys(sb.bands).sort().join() === "morning,night", `bands: trova le coppie di helper (${Object.keys(sb.bands)})`);
ok(JSON.stringify(K("archive").getStubConfig()) === "{}" && JSON.stringify(K("why").getStubConfig()) === "{}", "archive/why: niente sensore personale nello stub");
for (const t of ["control", "overview", "bands", "deliveries", "transports", "recipients", "scenarios", "simulator", "composer", "automations", "stats", "archive", "why", "tools"]) {
  let err = null;
  try { const c = document.createElement(`supernotify-${t}-card`); c.setConfig(K(t).getStubConfig({ states: {}, services: {} })); } catch (e) { err = e.message; }
  if (err) ok(false, `${t}: lo stub non deve dare errore (${err})`);
}
ok(true, "tutti gli stub accettati da setConfig");
const be = mount("supernotify-bands-card", { bands: {} });
ok(/Nessuna fascia oraria/.test(be.shadowRoot.textContent), "bands senza fasce: spiega come aggiungerle");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
