// v0.55.0: editor visuale (getConfigForm) su tutte le card, simulatore con il perché.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM('<!doctype html><html lang="it"><body></body></html>', { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 40));

const tags = ["control", "overview", "bands", "deliveries", "transports", "recipients", "scenarios", "simulator",
  "composer", "automations", "stats", "archive", "why"];
for (const t of tags) {
  const cls = customElements.get(`supernotify-${t}-card`);
  const f = cls && cls.getConfigForm && cls.getConfigForm();
  const last = f && f.schema[f.schema.length - 1];
  ok(f && Array.isArray(f.schema) && last.type === "expandable" && last.flatten === true && typeof f.computeLabel === "function",
    `${t}: getConfigForm con sezione Aspetto ripiegata (${f ? f.schema.length : 0} voci)`);
}
const fc = customElements.get("supernotify-control-card").getConfigForm();
ok(fc.computeLabel({ name: "dnd_entity" }) === "Interruttore non disturbare", "etichette in italiano con <html lang=it>");
ok(!fc.schema.some((x) => x.name === "tiles" || x.name === "groups"), "tile e gruppi restano al codice (il modulo non li tocca)");
const fd = customElements.get("supernotify-deliveries-card").getConfigForm();
ok(fd.schema.find((x) => x.name === "group").default === true, "deliveries: 'raggruppa' acceso di default come la card");

// simulatore
const st = (state, attributes = {}) => ({ state, attributes });
const del = (name, fn, inc, on = "on") => st(on, { name, enabled: on === "on", transport: "x", inclusion: inc, friendly_name: `SuperNotify Delivery ${fn} abilitata` });
const states = {
  "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono", ["default"]),
  "switch.supernotify_delivery_tts": del("tts", "Voce (TTS)", ["default"]),
  "switch.supernotify_delivery_campanello": del("campanello", "Campanello", ["scenario"]),
  "switch.supernotify_delivery_telegram": del("telegram", "Telegram", ["explicit"]),
  "switch.supernotify_delivery_sms": del("sms", "SMS di riserva", ["fallback"], "off"),
  "switch.supernotify_scenario_ospiti": st("on", { friendly_name: "SuperNotify Scenario Voce spenta (ospiti)" }),
  "switch.supernotify_scenario_casa": st("on", { friendly_name: "SuperNotify Scenario Qualcuno in casa" }),
};
const el = document.createElement("supernotify-simulator-card"); el.setConfig({}); document.body.appendChild(el);
el.hass = { language: "it", themes: { darkMode: false }, states, entities: {},
  callWS: async (m) => {
    if (m.service === "enquire_deliveries_by_scenario") return { response: { ospiti: { enabled: [], disabled: ["tts"] }, casa: { enabled: ["campanello"], disabled: [] } } };
    if (m.service === "enquire_implicit_deliveries") return { response: { default: ["mobile_push", "tts"] } };
    if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["ospiti", "casa"] } };
    return { response: {} };
  } };
await tick(); await tick();
const rows = [...el.shadowRoot.querySelectorAll(".sr")].map((r) => [...r.children].map((c) => c.textContent.trim()).filter(Boolean).join(" "));
console.log("    righe:", rows.join(" | "));
const has = (re) => rows.some((r) => re.test(r));
ok(has(/Notifica sul telefono parte da solo/), "telefono: parte da solo");
ok(has(/Campanello acceso da Qualcuno in casa/), "campanello: acceso dallo scenario");
ok(has(/Voce \(TTS\) spento da Voce spenta \(ospiti\)/), "tts: spento dallo scenario");
ok(has(/Telegram solo se chiamato per nome/), "telegram: solo per nome");
ok(has(/SMS di riserva spento a mano/), "sms: spento a mano");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
