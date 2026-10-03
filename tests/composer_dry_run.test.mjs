// v0.48.0: composer-card "Prova senza inviare" sul dry-run vero di SuperNotify 2.12
// (supernotify.notify con dry_run: simulate, risposta = Notification.contents()).
// Sostituisce il test della 0.44.0, scritto per un'azione enquire_dry_run mai esistita.
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
  language: "it", themes: { darkMode: false }, services: { supernotify: { notify: v.includes("2.12") ? { response: { optional: true } } : {} } },
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
card.hass = mkHass("v2.11.1");
const sr = card.shadowRoot;
ok(sr.getElementById("dry").style.display === "none", "su 2.11.1 il pulsante è nascosto");

sr.getElementById("m").value = "Porta aperta";
sr.getElementById("p").value = "high";
card.hass = mkHass("v2.12.0-beta1");
ok(sr.getElementById("m").value === "Porta aperta", "il modulo non si svuota");
ok(sr.getElementById("dry").style.display === "", "su 2.12.0-beta1 il pulsante compare");

await card._dryRun();
const call = ws[0] || {};
ok(call.domain === "supernotify" && call.service === "notify" && call.return_response === true, "chiama supernotify.notify con la risposta");
ok(call.service_data && call.service_data.dry_run === "simulate", "dry_run: simulate");
ok(call.service_data && call.service_data.force_resend === true, "force_resend: niente cache dei doppioni");
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
ok(/Controllo doppioni non simulato/.test(txt), "nota sul controllo doppioni");
const rows = [...box.querySelectorAll(".dRow")].map((r) => r.textContent.trim());
const rowIcons = [...box.querySelectorAll(".dRow")].map((r) => (r.querySelector("ha-icon") || {}).getAttribute?.("icon"));
ok(rowIcons[0] === "mdi:check-circle" && rowIcons[rowIcons.length - 1] === "mdi:minus-circle-outline", "prima chi parte, poi i saltati");

// doppione segnalato
card._renderDry({ ...CONTENTS, outcome: "dupe", deliveries: { mobile_push: { skipped: { suppression_reason: "DUPE" } } } }, false);
ok(/Doppione di una notifica recente/.test(box.textContent), "doppione segnalato");
// risposta vuota
card._renderDry({}, true);
ok(/è la 2\.12/.test(box.textContent), "risposta vuota spiegata");

// con dry_run_dupe_check: la prova controlla i doppioni, l'Invia dopo porta force_resend
const c2 = document.createElement("supernotify-composer-card");
c2.setConfig({ dry_run_dupe_check: true });
document.body.appendChild(c2);
c2.hass = mkHass("v2.12.0");
c2.shadowRoot.getElementById("m").value = "Garage aperto";
await c2._dryRun();
ok(!("force_resend" in ws[ws.length - 1].service_data), "dry_run_dupe_check: la prova controlla i doppioni");
await c2._send();
ok(services.length === 1 && services[0][2].force_resend === true, "l'Invia subito dopo porta force_resend");
await c2._send();
ok(!("force_resend" in services[1][2]), "il secondo Invia no (vale solo una volta)");
c2.shadowRoot.getElementById("m").value = "Altro testo";
await c2._dryRun();
c2.shadowRoot.getElementById("m").value = "Testo cambiato";
await c2._send();
ok(!("force_resend" in services[2][2]), "testo cambiato dopo la prova: niente force_resend");

// forzato da config senza entità update
const c3 = document.createElement("supernotify-composer-card");
c3.setConfig({ dry_run: true });
document.body.appendChild(c3);
c3.hass = { ...mkHass("x"), states: {} };
ok(c3.shadowRoot.getElementById("dry").style.display === "", "dry_run: true lo mostra anche senza versione");

// errore
card._hass.callWS = async () => { throw { code: "service_validation_error", message: "boom" }; };
await card._dryRun();
ok(/Simulazione non riuscita: boom/.test(box.textContent), "errore mostrato");

// scaricata ma HA non riavviato: update dice 2.12, l'azione non risponde ancora
const c4 = document.createElement("supernotify-composer-card");
c4.setConfig({}); document.body.appendChild(c4);
c4.hass = { ...mkHass("v2.12.0-beta1"), services: { supernotify: { notify: {} } } };
ok(c4.shadowRoot.getElementById("dry").style.display === "none", "2.12 scaricata ma non attiva: pulsante nascosto");
card._hass.callWS = async () => { throw { code: "service_validation_error", message: "Validation error: An action which does not return responses can't be called with return_response=True" }; };
await card._dryRun();
ok(/va riavviato/.test(box.textContent), "errore 'does not return responses' spiegato come riavvio");

// v0.48.3: nomi delle camere e anteprima con il testo automatico
const c5 = document.createElement("supernotify-composer-card");
c5.setConfig({}); document.body.appendChild(c5);
c5.hass = mkHass("v2.12.0");
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
