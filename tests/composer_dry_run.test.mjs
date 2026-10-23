// v0.48.0: composer-card "Prova senza inviare" sul dry-run vero di SuperNotify 2.12
// (supernotify.notify con dry_run: simulate, risposta = Notification.contents()).
// Sostituisce il test della 0.44.0, scritto per un'azione enquire_dry_run mai esistita.
// 1.0.0 (phase 5): SuperNotify 2.13 minimo - il dry run c'è sempre e ha la sua cache dei doppioni:
// via i controlli di versione (2.11.1 / 2.12.0 / 2.12.1), il force_resend di default e il "riavvia".
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.confirm = () => true;
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

// Risposta come la dà 2.12.0-beta1 con dry_run: simulate
const CONTENTS = {
  id: "01DRY", outcome: "partial_delivery", created: new Date().toISOString(), message: "Porta aperta",
  priority: "high", delivered: 2, skipped: 2, missed: 1, failed: 0, dupe: false,
  selected_scenario_names: ["afternoon", "multi_home"],
  occupancy: { home: [{ person: "person.lorenzo" }], not_home: [] },
  deliveries: {
    mobile_push: { success: [{ target: { mobile_app_id: ["mobile_app_s23"] }, calls: [] }] },
    alexa_announce: { success: [{ target: { entity_id: ["media_player.cucina", "media_player.sala", "media_player.ufficio", "media_player.camera"] } }] },
    tts: { skipped: { suppression_reason: "SNOOZED" } },
    email: { skipped: { suppression_reason: "NO_TARGET", target_required: "always" } },
  },
};
const ws = [];
const services = [];
const ver = (v) => ({ "update.supernotify_update": { state: "off", attributes: { installed_version: v } } });
const mkHass = (v) => ({
  language: "it", themes: { darkMode: false }, services: v ? { supernotify: { notify: { response: { optional: true } } } } : {},
  states: {
    ...ver(v),
    "switch.supernotify_delivery_mobile_push": { entity_id: "switch.supernotify_delivery_mobile_push", state: "on",
      attributes: { transport: "mobile_push", friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" } },
    "switch.supernotify_delivery_tts": { entity_id: "switch.supernotify_delivery_tts", state: "on", attributes: { transport: "tts" } },
    "media_player.cucina": { state: "idle", attributes: { friendly_name: "Echo Cucina" } },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo" } },
    "switch.supernotify_scenario_multi_home": { state: "on", attributes: { friendly_name: "SuperNotify Scenario Persone a casa abilitato" } },
    "camera.a1_camera": { state: "idle", attributes: { friendly_name: "Ingresso" } },
  },
  callService: async (d, s, data) => { services.push([d, s, data]); },
  callWS: async (msg) => { ws.push(msg); return { context: {}, response: CONTENTS }; },
});

const card = document.createElement("supernotify-composer-card");
card.setConfig({});
document.body.appendChild(card);
card.hass = mkHass("");
const sr = card.shadowRoot;
ok(sr.getElementById("dry").style.display === "none", "SuperNotify non caricato: pulsante nascosto");

sr.getElementById("m").value = "Porta aperta";
sr.getElementById("p").value = "high";
card.hass = mkHass("v2.13.0");
ok(sr.getElementById("m").value === "Porta aperta", "il modulo non si svuota");
ok(sr.getElementById("dry").style.display === "", "su 2.13 il pulsante compare");

await card._dryRun();
const call = ws[0] || {};
ok(call.domain === "supernotify" && call.service === "notify" && call.return_response === true, "chiama supernotify.notify con la risposta");
ok(call.service_data && call.service_data.dry_run === "simulate", "dry_run: simulate");
ok(call.service_data && !("force_resend" in call.service_data), "di default la prova controlla i doppioni (cache dei doppioni separata)");
ok(call.service_data.message === "Porta aperta" && call.service_data.priority === "high", "stessi campi dell'Invia");
ok(services.length === 0, "niente inviato davvero");
const box = sr.getElementById("dryBox");
const txt = box.textContent.replace(/\s+/g, " ");
console.log("    riquadro:", txt.slice(0, 260));
ok(/ 2 canali partirebbero/.test(txt) && box.querySelector('.dHead ha-icon[icon="mdi:check-circle"]'), "conteggio dei canali che partirebbero");
ok(/ 1 mancati/.test(txt) && box.querySelector('.dWarnI ha-icon[icon="mdi:alert"]'), "mancati");
ok(/Notifica sul telefono/.test(txt) && /s23/.test(txt), "alias e destinatario del telefono");
ok(/Echo Cucina, sala, ufficio \+1/.test(txt), "target Alexa: nome, id accorciati, +N");
ok(/in pausa/.test(txt) && /nessun destinatario utilizzabile/.test(txt), "motivi tradotti (SNOOZED, NO_TARGET)");
ok(/Priorità: Alta/.test(txt) && /afternoon, Persone a casa/.test(txt) && /In casa: Lorenzo/.test(txt), "priorità, scenari, chi è in casa");
ok(!/Controllo doppioni non simulato/.test(txt), "nessuna nota: il controllo doppioni è simulato");
const rows = [...box.querySelectorAll(".dRow")].map((r) => r.textContent.trim());
const rowIcons = [...box.querySelectorAll(".dRow")].map((r) => (r.querySelector("ha-icon") || {}).getAttribute?.("icon"));
ok(rowIcons[0] === "mdi:check-circle" && rowIcons[rowIcons.length - 1] === "mdi:minus-circle-outline", "prima chi parte, poi i saltati");

// doppione segnalato
card._renderDry({ ...CONTENTS, outcome: "dupe", deliveries: { mobile_push: { skipped: { suppression_reason: "DUPE" } } } }, false);
ok(/Doppione di una notifica recente/.test(box.textContent), "doppione segnalato");
// risposta vuota
card._renderDry({}, true);
ok(/è la 2\.12/.test(box.textContent), "risposta vuota spiegata");

// dry_run_dupe_check: false = niente controllo doppioni (force_resend), detto nel riquadro
const c2 = document.createElement("supernotify-composer-card");
c2.setConfig({ dry_run_dupe_check: false });
document.body.appendChild(c2);
c2.hass = mkHass("v2.13.0");
c2.shadowRoot.getElementById("m").value = "Garage aperto";
await c2._dryRun();
ok(ws[ws.length - 1].service_data.force_resend === true, "dry_run_dupe_check: false -> force_resend");
ok(/Controllo doppioni non simulato/.test(c2.shadowRoot.getElementById("dryBox").textContent), "nota sul controllo doppioni");
await c2._send();
ok(services.length === 1 && !("force_resend" in services[0][2]), "l'Invia dopo la prova non porta force_resend");
ok(!c2._dryKey, "nessuna memoria della prova (_dryKey) per l'Invia");

// senza update.supernotify_update il pulsante c'è lo stesso; dry_run: false lo nasconde
const c3 = document.createElement("supernotify-composer-card");
c3.setConfig({});
document.body.appendChild(c3);
c3.hass = { ...mkHass("x"), states: {} };
ok(c3.shadowRoot.getElementById("dry").style.display === "", "senza entità update il pulsante compare");
const c3b = document.createElement("supernotify-composer-card");
c3b.setConfig({ dry_run: false });
document.body.appendChild(c3b);
c3b.hass = mkHass("v2.13.0");
ok(c3b.shadowRoot.getElementById("dry").style.display === "none", "dry_run: false lo nasconde");

// errore
card._hass.callWS = async () => { throw { code: "service_validation_error", message: "boom" }; };
await card._dryRun();
ok(/Simulazione non riuscita: boom/.test(box.textContent), "errore mostrato");

// v0.48.3: nomi delle camere e anteprima con il testo automatico
const c5 = document.createElement("supernotify-composer-card");
c5.setConfig({}); document.body.appendChild(c5);
c5.hass = mkHass("v2.13.0");
const s5 = c5.shadowRoot;
const opt = [...s5.getElementById("cam").options].find((o) => o.value === "camera.a1_camera");
ok(opt && /Ingresso/.test(opt.textContent) && !/a1_camera/.test(opt.textContent), "camera mostrata col nome");
s5.getElementById("m").value = "";
s5.getElementById("cam").value = "camera.a1_camera";
s5.getElementById("cam").dispatchEvent(new window.Event("change"));
ok(s5.getElementById("pvM").textContent === "📷 Ingresso", `anteprima col testo automatico (${s5.getElementById("pvM").textContent})`);
ok(c5._payload().message === "📷 Ingresso", "payload con lo stesso testo dell'anteprima");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
