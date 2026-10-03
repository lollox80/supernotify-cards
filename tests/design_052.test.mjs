// v0.52.0: control (riga di stato, tile con icona a sinistra, conteggi + Perché) e overview (frase + elenco).
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 40));
const del = (name, fn, state = "on") => ({ state, attributes: { name, enabled: state === "on", transport: "mobile_push", inclusion: ["default"],
  transport_enabled: true, friendly_name: `SuperNotify Delivery ${fn} abilitata` } });
const now = new Date().toISOString();
const last = { id: "aaaa1111-0000", title: "Porta", message: "Qualcuno alla porta", priority: "high", created: now, missed: 1,
  deliveries: { mobile_push: { success: [1] }, alexa_announce: { success: [1] }, email: { error: ["boom"] }, tts: {} } };
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, services: { supernotify: { notify: {} } },
  states: {
    "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono"),
    "switch.supernotify_delivery_alexa_announce": del("alexa_announce", "Annuncio vocale Alexa"),
    "switch.supernotify_delivery_email": del("email", "Email"),
    "switch.supernotify_delivery_sms_fallback": del("sms_fallback", "SMS di riserva", "off"),
    "switch.supernotify_transport_telegram": { state: "on", attributes: { name: "telegram", error_count: 3, last_error_message: "chat not found" } },
    "sensor.supernotify_notifications": { state: "12", attributes: {} },
    "sensor.supernotify_failures": { state: "0", attributes: {} },
    "update.supernotify_update": { state: "off", attributes: { installed_version: "v2.12.0" } },
    "input_boolean.notifier_dnd": { state: "off", attributes: {} },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_last_notification") return { response: last };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [{ target_type: "EVERYTHING", snoozed_at: now, snooze_until: "23:59:00" }] } };
    return { response: {} };
  },
};
const mount = (tag, cfg) => { const el = document.createElement(tag); el.setConfig(cfg); document.body.appendChild(el); el.hass = hass; return el; };
window.__snWhyCards = 1;

// ── control ────────────────────────────────────────────────────────────────
const c = mount("supernotify-control-card", { dnd_entity: "input_boolean.notifier_dnd", last_notification: true, tiles: ["dnd", "snooze", "announce"] });
await tick(); c.hass = { ...hass }; await tick();
const sr = c.shadowRoot;
ok(sr.querySelector(".ctile .tx b") && sr.querySelector(".ctile .tx .ts"), "tile: icona + blocco testo (icona a sinistra)");
ok(/minmax\(150px, 1fr\)/.test(sr.innerHTML) && /flex-direction: row/.test(sr.innerHTML), "tile in riga, 150px minimo");
ok(!/\.ctile\.warn \.ts \{ color: rgba\(255,255,255/.test(sr.innerHTML), "snooze attivo: testo non più bianco sulla tinta chiara");
const lf = sr.querySelector(".lastn .lf").textContent.replace(/\s+/g, " ");
ok(/2 consegnate/.test(lf) && /1 fallite/.test(lf) && /1 mancati/.test(lf) && /1 saltati/.test(lf), `ultima notifica a conteggi (${lf.trim()})`);
ok(sr.querySelector('.lb.ok').title === "Notifica sul telefono, Annuncio vocale Alexa", "nomi dei canali nel tooltip");
const wb = sr.querySelector("#whyBtn");
let opened = null; window.addEventListener("supernotify-why", (e) => { opened = e.detail.id; });
wb && wb.click();
ok(opened === "aaaa1111-0000", "Perché › apre la why-card su quella notifica");
const c2 = mount("supernotify-control-card", { last_notification: true, last_channels: true, tile_layout: "stacked", tiles: ["snooze"] });
await tick(); c2.hass = { ...hass }; await tick();
ok(c2.shadowRoot.querySelectorAll(".lastn .lb.ok").length === 2, "last_channels: true = un chip per canale");
ok(c2.shadowRoot.querySelector(".tiles.stacked"), "tile_layout: stacked = tile alte di prima");

// ── overview ───────────────────────────────────────────────────────────────
const o = mount("supernotify-overview-card", {});
await tick(); o.hass = { ...hass }; await tick();
const hb = o.shadowRoot.querySelector(".hb");
ok(hb && hb.classList.contains("crit") && /3 cose da guardare/.test(hb.textContent), `frase in testa (${hb && hb.textContent.replace(/\s+/g, " ").trim()})`);
ok(/il resto funziona · 3 di 4 canali accesi/.test(hb.textContent), "sottotitolo con i canali accesi");
const rows = [...o.shadowRoot.querySelectorAll(".hr")].map((r) => [...r.querySelectorAll(".ht > div")].map((d) => d.textContent.trim()).join(" / "));
console.log("    righe:", rows.join(" | "));
ok(rows.some((r) => /1 canali spenti \/ SMS di riserva/.test(r)), "canali spenti con il nome leggibile");
ok(rows.some((r) => /telegram: chat not found/.test(r)), "transport con errori con il messaggio");
ok(rows.some((r) => /In pausa: tutto$/.test(r)), "snooze attivo nell'elenco, senza dettaglio doppio");
ok(o.shadowRoot.querySelectorAll(".stat").length === 3, "tre numeri invece di cinque");
const o2 = mount("supernotify-overview-card", { health: "chips", stats: "full" });
await tick(); o2.hass = { ...hass }; await tick();
ok(o2.shadowRoot.querySelectorAll(".hc").length > 0 && !o2.shadowRoot.querySelector(".hb"), "health: chips = vecchi chip");
ok(o2.shadowRoot.querySelectorAll(".stat").length === 5, "stats: full = cinque numeri");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
