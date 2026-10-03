// v0.46.0: allineamento a SuperNotify 2.11 / 2.11.1 — conteggio `missed`, motivi
// SNOOZED / TRANSPORT_DISABLED, esiti error / fallback_delivery, snooze per tag.
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
const tick = () => new Promise((r) => setTimeout(r, 30));
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();
const hms = (d) => [d.getHours(), d.getMinutes(), d.getSeconds()].map((x) => String(x).padStart(2, "0")).join(":");

// Notifiche come le archivia SuperNotify 2.11 (Notification.contents())
const DOCS = [
  { id: "aaaa1111-0000", created: iso(60e3), message: "Campanello", priority: "high", outcome: "partial_delivery",
    delivered: 1, failed: 0, skipped: 1, missed: 1,
    deliveries: {
      mobile_push: { success: [{ target: { mobile_app_id: ["mobile_app_phone"] }, calls: [{}] }] },
      email: { skipped: { target_required: "always", suppression_reason: "NO_TARGET" } },
    } },
  { id: "bbbb2222-0000", created: iso(120e3), message: "Lavatrice finita", outcome: "success",
    delivered: 1, skipped: 2, missed: 0,
    deliveries: {
      mobile_push: { success: [{ calls: [{}] }] },
      alexa_announce: { skipped: { suppression_reason: "SNOOZED" } },
      telegram: { skipped: { suppression_reason: "TRANSPORT_DISABLED" } },
    } },
  { id: "cccc3333-0000", created: iso(180e3), message: "Porta aperta", outcome: "fallback_delivery",
    delivered: 1, skipped: 1,
    deliveries: {
      sms_fallback: { success: [{ calls: [{}] }] },
      mobile_push: { skipped: { suppression_reason: "INVALID_ACTION_DATA" } },
    } },
];
const now = new Date();
const SNOOZES = [{ target_type: "TAG", target: "portico", recipient_type: "EVERYONE", recipient: null,
  reason: "User command", snoozed_at: hms(new Date(now - 5 * 60e3)), snooze_until: hms(new Date(+now + 55 * 60e3)) }];

const hass = {
  language: "it", themes: { darkMode: false },
  services: { supernotify: { enquire_archive: {}, enquire_snoozes: {}, enquire_last_notification: {} } },
  states: {
    "sensor.supernotify_notifications": { state: "10", attributes: {}, last_updated: iso(0) },
    "switch.supernotify_delivery_mobile_push": { entity_id: "switch.supernotify_delivery_mobile_push", state: "on",
      attributes: { friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" } },
  },
  callWS: async (msg) => {
    const svc = msg.service;
    if (svc === "enquire_archive") return { response: { notifications: DOCS } };
    if (svc === "enquire_snoozes") return { response: { snoozes: SNOOZES } };
    if (svc === "enquire_last_notification") return { response: DOCS[0] };
    if (svc === "enquire_active_scenarios") return { response: { scenarios: [] } };
    return { response: {} };
  },
  callService: async () => {}, callApi: async () => ({}),
};

// ── archive-card ──────────────────────────────────────────────────────────
const a = document.createElement("supernotify-archive-card");
a.setConfig({ style: "flat" });
document.body.appendChild(a);
a.hass = hass; await tick(); a.hass = { ...hass }; await tick();
const rows = () => [...a.shadowRoot.querySelectorAll(".row")];
ok(rows().length === 3, `archivio: 3 righe (${rows().length})`);
const det0 = rows()[0].querySelector(".det").textContent.replace(/\s+/g, " ");
console.log("    dettaglio riga 1:", det0.trim());
ok(/⚠ 1 mancata/.test(det0), "riga con missed: '⚠ 1 mancata'");
const tags1 = rows()[1].querySelector(".tags").textContent;
console.log("    canali riga 2:", tags1.trim());
ok(/pausa/.test(tags1) && /transport spento/.test(tags1), "SNOOZED → pausa, TRANSPORT_DISABLED → transport spento");
const tags2 = rows()[2].querySelector(".tags").textContent;
ok(/dati non validi/.test(tags2), "INVALID_ACTION_DATA → dati non validi");
const chip = [...a.shadowRoot.querySelectorAll(".chip")].find((c) => /problemi/i.test(c.textContent));
chip.onclick();
const ids = rows().map((r) => r.dataset.id);
console.log("    'Solo con problemi':", ids.join(", "));
ok(ids.includes("aaaa1111"), "la notifica con un canale mancato è un problema");
ok(!ids.includes("bbbb2222"), "pausa + transport spento NON sono problemi");
ok(ids.includes("cccc3333"), "fallback + dati non validi sono un problema");

// ── why-card ──────────────────────────────────────────────────────────────
window.__snWhyCards = undefined;
const w = document.createElement("supernotify-why-card");
w.setConfig({ style: "flat", auto_select: false });
document.body.appendChild(w);
w.hass = hass; await tick(); w.hass = { ...hass }; await tick();
const dots = [...w.shadowRoot.querySelectorAll(".dot")].map((d) => d.className.replace("dot ", ""));
console.log("    pallini:", dots.join(", "));
ok(dots[0] === "d-warn" && dots[1] === "d-ok" && dots[2] === "d-warn", "colori: missed giallo, pausa verde, fallback giallo");
const detOf = async (id) => { await w._select(id); await tick(); return w.shadowRoot.getElementById("det").textContent.replace(/\s+/g, " "); };
let d = await detOf("aaaa1111");
console.log("    dettaglio why 1:", d.slice(0, 160));
ok(/⚠ 1 mancati/.test(d), "why: intestazione con i mancati");
d = await detOf("cccc3333");
ok(/consegnata dal canale di riserva/.test(d), "why: esito fallback_delivery tradotto");
ok(/dati dell'azione non validi/.test(d), "why: motivo INVALID_ACTION_DATA tradotto");
d = await detOf("bbbb2222");
ok(/in pausa/.test(d) && !/SNOOZED/.test(d), "why: SNOOZED → 'in pausa'");

// ── control-card ──────────────────────────────────────────────────────────
const c = document.createElement("supernotify-control-card");
c.setConfig({ last_notification: true });
document.body.appendChild(c);
c.hass = hass; await tick(); c.hass = { ...hass }; await tick();
const sr = c.shadowRoot.textContent.replace(/\s+/g, " ");
const tile = sr.match(/⏳[^😴]{0,120}/);
console.log("    tile snooze:", tile && tile[0]);
ok(/🏷️ portico/.test(sr), "control: la tile dice che lo snooze è sul tag 'portico'");
ok(/⚠ 1 mancati/.test(sr), "control: chip 'mancati' nell'ultima notifica");

// ── overview-card ─────────────────────────────────────────────────────────
const o = document.createElement("supernotify-overview-card");
o.setConfig({});
document.body.appendChild(o);
o.hass = hass; await tick(); o._snoozes = SNOOZES; o.hass = { ...hass }; await tick();
const chips = o._health().map((h) => h.t);
console.log("    chip overview:", chips.join(" | "));
ok(chips.some((t) => t === "😴 In pausa: 🏷️ portico"), "overview: chip con il soggetto dello snooze");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
