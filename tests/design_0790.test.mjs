// CHANGELOG
// 2026-10-05 v0.79.0: perché - riquadro doppione (quanti secondi prima, link all'originale, stessa esecuzione),
//   "doppione" una volta sola, frase parlata solo se diversa, saltati col motivo, target richiesto solo per NO_TARGET.
import { JSDOM } from "jsdom";
import fs from "fs";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();
let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const t1 = new Date(Date.now() - 60000), t2 = new Date(t1.getTime() + 2000);
const MSG = "Le notifiche vocali sono nuovamente operative.";
const base = { message: MSG, spoken_message: MSG, priority: "medium", condition_variables: { notification_title: "🔊 Notifiche Vocali Attivate" },
  original_context: { id: "RUN1", parent_id: "P1" } };
const ORIG = { ...base, id: "orig-1111", created: t1.toISOString(), outcome: "success", delivered: 2,
  deliveries: { alexa_announce: { success: [{ calls: [{}] }] }, mobile_push: { success: [{ calls: [{}] }] } } };
const DUP = { ...base, id: "dupe-2222", created: t2.toISOString(), outcome: "dupe", dupe: true,
  deliveries: { alexa_announce: { skipped: { suppression_reason: "DUPE" } }, mobile_push: { skipped: { suppression_reason: "DUPE" } },
    tts: { skipped: { suppression_reason: "DELIVERY_CONDITION", target_required: "always" } } } };
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u", is_admin: true },
  services: { supernotify: { enquire_archive: {} } },
  connection: { subscribeEvents: () => Promise.resolve(() => {}) },
  states: {
    "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { name: "alexa_announce", friendly_name: "SuperNotify Delivery Annuncio vocale Alexa abilitata" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push" } },
    "switch.supernotify_delivery_tts": { state: "on", attributes: { name: "tts" } },
    "sensor.supernotify_notifications": { state: "5", attributes: {}, last_updated: "x" },
    "automation.voce": { state: "on", attributes: { friendly_name: "Notifiche Vocali Attive - Annuncio" } },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_archive") {
      const id = m.service_data && m.service_data.id;
      if (id) return { response: [DUP, ORIG].find((d) => d.id.startsWith(id)) || null };
      return { response: { notifications: [DUP, ORIG], count: 2 } };
    }
    if (m.type === "logbook/get_events") return [{ entity_id: "automation.voce", name: "Notifiche Vocali Attive - Annuncio", context_id: "RUN1" }];
    return { response: {} };
  },
};
const c = document.createElement("supernotify-why-card"); c.setConfig({}); c.hass = hass; document.body.appendChild(c);
await wait(200); c.hass = { ...hass }; await wait(300);
const det = () => c.shadowRoot.getElementById("det");
const txt = () => det().textContent.replace(/\s+/g, " ");
ok(/Notifiche Vocali Attivate/.test(txt()), "il doppione è aperto (il più recente) - " + txt().slice(0, 160));
ok((txt().match(/doppione/g) || []).length >= 1 && !/doppione · ♻ doppione/.test(txt()), "«doppione» una sola volta nell'intestazione");
ok(!det().querySelector(".hd .note") || ![...det().querySelectorAll(".hd .note")].some((x) => x.textContent.includes(MSG)), "frase parlata uguale al testo: non ripetuta");
ok(/Doppione: lo stesso testo è partito 2 s prima, alle/.test(txt()), "riquadro: 2 s prima, con l'ora");
ok(/stessa esecuzione di automazione «Notifiche Vocali Attive - Annuncio»/.test(txt()), "stessa esecuzione, con il nome dell'automazione");
const sum = [...det().querySelectorAll("details.fold summary")].map((s) => s.textContent).join(" | ");
ok(/3 saltati · doppione 2, condizione del canale falsa 1/.test(sum), "saltati col motivo - " + sum);
ok(!/target richiesto/.test(txt()), "niente «target richiesto» accanto a una condizione falsa");
det().querySelector("#dupeLink").click(); await wait(200);
ok(/consegnata/.test(txt()) && !/Doppione:/.test(txt()), "il link apre l'originale");
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
