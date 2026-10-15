// v0.89.0: allineamento a SuperNotify 2.13-2.15 - esito dell'ultimo invio per canale (card canali,
// banda di stato, badge), Critiche/Alte con una sola chiamata `priority`, scenari attivi dai
// binary_sensor quando scenario_control.refresh e' acceso.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const boot = () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
  global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
  global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.customCards = [];
  dom.window.fetch = async () => ({ ok: false });
  return new dom.window.Function(SRC + "\nreturn { snActive, snActiveEnsure, snLastSendText, snChannelsFailed, snNativeHealth, snT, snArchivePrio };")();
};

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

const calls = [];
const baseStates = () => ({
  "sensor.supernotify_notifications": { state: "30", attributes: {} },
  "update.supernotify_update": { state: "off", attributes: { installed_version: "v2.15.0", latest_version: "v2.15.0" } },
  "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push",
    friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata", last_outcome: "success", last_sent_at: ago(5) } },
  "switch.supernotify_delivery_telegram_lorenzo": { state: "on", attributes: { name: "telegram_lorenzo", transport: "telegram",
    friendly_name: "SuperNotify Delivery Telegram Lorenzo abilitata", last_outcome: "error", last_sent_at: ago(90) } },
  "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { name: "alexa_announce", transport: "alexa_devices",
    friendly_name: "SuperNotify Delivery Annuncio vocale Alexa abilitata", last_outcome: "skipped", last_skip_reason: "SNOOZED" } },
  "switch.supernotify_delivery_email": { state: "on", attributes: { name: "email", transport: "email",
    friendly_name: "SuperNotify Delivery email abilitata" } },
  "switch.supernotify_delivery_backup_mail": { state: "on", attributes: { name: "backup_mail", transport: "email",
    friendly_name: "SuperNotify Delivery Email di backup abilitata", last_outcome: "error", last_sent_at: ago(30) } },
  "binary_sensor.supernotify_scenario_late_night": { state: "on", attributes: { friendly_name: "SuperNotify Condizione scenario Late Night" } },
  "switch.supernotify_scenario_late_night": { state: "on", attributes: {} },
  "binary_sensor.supernotify_scenario_morning": { state: "off", attributes: { friendly_name: "SuperNotify Condizione scenario Morning" } },
  "switch.supernotify_scenario_morning": { state: "on", attributes: {} },
  "binary_sensor.supernotify_scenario_ospiti": { state: "on", attributes: { friendly_name: "SuperNotify Scenario manuale Ospiti" } },
});
const mkHass = (states, prioField = true) => ({
  language: "it", themes: { darkMode: false }, user: { id: "u1", is_admin: true },
  entities: { "binary_sensor.supernotify_scenario_ospiti": { platform: "supernotify", translation_key: "scenario_manual" } },
  services: { supernotify: { enquire_archive: prioField ? { fields: { priority: {}, verbosity: {} } } : {},
    enquire_active_scenarios: {}, enquire_snoozes: {} } },
  states, callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    const sd = m.service_data || {};
    calls.push({ service: m.service, ...sd });
    if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["morning"] } };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    if (m.service === "enquire_archive" && sd.verbosity === "daily") {
      const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
      return { response: { days: [
        { date: k(0), count: 10, priority: { medium: 9, critical: 1 }, outcome: {}, deliveries: {}, hour: Array(24).fill(0) },
        { date: k(2), count: 10, priority: { medium: 8, high: 2 }, outcome: {}, deliveries: {}, hour: Array(24).fill(0) },
        { date: k(5), count: 10, priority: { medium: 9, critical: 1 }, outcome: {}, deliveries: {}, hour: Array(24).fill(0) },
      ] } };
    }
    if (m.service === "enquire_archive" && sd.priority) {
      return { response: { notifications: [
        { id: "c1", created: ago(10), priority: "critical", message: "Fumo", title: "Fumo in cucina", outcome: "success", deliveries: {} },
        { id: "h1", created: ago(2 * 1440), priority: "high", message: "Fulmine", title: "Fulmine a 3 km", outcome: "success", deliveries: {} },
        { id: "h2", created: ago(2 * 1440 + 30), priority: "high", message: "Fulmine", title: "Fulmine a 6 km", outcome: "success", deliveries: {} },
        { id: "c2", created: ago(5 * 1440), priority: "critical", message: "Acqua", title: "Acqua sotto il lavello", outcome: "success", deliveries: {} },
      ] } };
    }
    if (m.service === "enquire_archive" && sd.verbosity === "summary" && sd.before) return { response: { notifications: [] } };
    return { response: { notifications: [] } };
  },
});

// ── 1. testo dell'ultimo invio ──────────────────────────────────────────
let G = boot();
const T = G.snT({}, { language: "it" });
ok(/^✔ inviata 5 min fa$/.test(G.snLastSendText({ last_outcome: "success", last_sent_at: ago(5) }, T)), "successo: «✔ inviata 5 min fa»");
ok(/^✖ fallita 1 h fa · \d\d:\d\d$/.test(G.snLastSendText({ last_outcome: "error", last_sent_at: ago(90) }, T)), "errore con l'ora");
const sk = G.snLastSendText({ last_outcome: "skipped", last_skip_reason: "SNOOZED" }, T);
ok(/^⏭ saltata: \S/.test(sk) && !/SNOOZED/.test(sk), `saltata col motivo tradotto (${sk})`);
ok(G.snLastSendText({}, T) === "", "senza attributi (SuperNotify < 2.14 o dopo un riavvio): niente");

// ── 2. card canali ──────────────────────────────────────────────────────
let hass = mkHass(baseStates());
const dl = document.createElement("supernotify-deliveries-card"); dl.setConfig({}); document.body.appendChild(dl); dl.hass = hass;
await wait(80);
const row = (name) => [...dl.shadowRoot.querySelectorAll(".row")].find((r) => txt(r.querySelector("b")) === name);
ok(/inviata 5 min fa/.test(txt(row("Notifica sul telefono"))), "telefono: ✔ inviata 5 min fa");
const tg = row("Telegram Lorenzo");
ok(tg && tg.querySelector(".st.ls.crit") && /fallita 1 h fa/.test(txt(tg)), "Telegram: ✖ fallita, in rosso");
ok(/⏭ saltata/.test(txt(row("Annuncio vocale Alexa"))), "Alexa: saltata");
ok(!/inviata|fallita|saltata/.test(txt(row("email"))), "email senza esito: nessuna scritta");
tg.onclick({ target: tg }); await wait(30);
ok(/Ultimo invio/.test(txt(row("Telegram Lorenzo"))) && dl.shadowRoot.querySelectorAll('.row[aria-expanded="true"]').length === 1, "nel dettaglio: «Ultimo invio»");

// ── 3. banda di stato e badge ───────────────────────────────────────────
const ov = document.createElement("supernotify-overview-card"); ov.setConfig({ ignore: ["backup_mail"] }); document.body.appendChild(ov); ov.hass = hass;
await wait(80);
const ch = ov._health().find((c) => /fallit/.test(c.t));
ok(ch && ch.k === "crit" && /^✖ 1 canale fallito all'ultimo invio$/.test(ch.t), `panoramica: «${ch && ch.t}» (backup_mail ignorato)`);
ok(ch && ch.go[0] === "deliveries" && ch.go[1].ids[0] === "switch.supernotify_delivery_telegram_lorenzo", "porta alla card dei canali, sulla riga");
ok(ch && /Telegram Lorenzo: ✖ fallita/.test(ch.title), "il tooltip dice quale e quando");
const nh = G.snNativeHealth(hass, [], {});
ok(nh.some((x) => x.k === "crit" && x.n === 2 && /canali falliti/.test(x.text)), "badge: 2 canali falliti");

// ── 4. scenari dai binary_sensor (refresh acceso) ───────────────────────
calls.length = 0;
G.snActive.t = 0;
G.snActiveEnsure(hass);
await wait(20);
ok(G.snActive.live === true, "sensori vivi riconosciuti");
ok(G.snActive.names.has("late_night") && G.snActive.names.has("ospiti") && !G.snActive.names.has("morning"), "attivi = binary_sensor accesi (manuale compreso)");
ok(!calls.some((c) => c.service === "enquire_active_scenarios"), "nessuna enquire_active_scenarios");
const v0 = G.snActive.v;
const st2 = baseStates(); st2["binary_sensor.supernotify_scenario_morning"].state = "on"; st2["binary_sensor.supernotify_scenario_late_night"].state = "off";
hass = { ...hass, states: st2 };
G.snActiveEnsure(hass);
ok(G.snActive.names.has("morning") && !G.snActive.names.has("late_night") && G.snActive.v > v0, "cambio di stato letto subito, le card si ridisegnano (v cresce)");

// SuperNotify 2.12 (sensori forse fermi): chiede a SuperNotify anche se sono on/off
G = boot(); calls.length = 0;
const st12 = baseStates(); st12["update.supernotify_update"].attributes.installed_version = "v2.12.1";
G.snActiveEnsure(mkHass(st12));
await wait(30);
ok(G.snActive.live === false && calls.some((c) => c.service === "enquire_active_scenarios"), "su 2.12 non si fida dei sensori");

// refresh spento: sensori unknown (il manuale resta on/off) -> chiede a SuperNotify
G = boot(); calls.length = 0;
const st3 = baseStates();
st3["binary_sensor.supernotify_scenario_late_night"].state = "unknown";
st3["binary_sensor.supernotify_scenario_morning"].state = "unknown";
G.snActiveEnsure(mkHass(st3));
await wait(30);
ok(G.snActive.live === false && calls.some((c) => c.service === "enquire_active_scenarios"), "refresh spento: chiede enquire_active_scenarios come prima");
ok(G.snActive.names && G.snActive.names.has("morning"), "e usa la sua risposta");

// ── 5. Critiche / Alte con una chiamata ─────────────────────────────────
try { window.localStorage.clear(); } catch (e) { /* */ }
calls.length = 0;
await G.snArchivePrio.refresh(mkHass(baseStates()), true);
const pc = calls.filter((c) => c.service === "enquire_archive" && c.priority);
const perDay = calls.filter((c) => c.service === "enquire_archive" && c.verbosity === "summary" && c.before);
ok(pc.length === 1 && JSON.stringify(pc[0].priority) === '["critical","high"]' && pc[0].verbosity === "summary", "una sola chiamata con priority [critical, high]");
ok(perDay.length === 0, "nessuna lettura giorno per giorno");
ok(G.snArchivePrio.counts.critical === 2 && G.snArchivePrio.counts.high === 2, "conteggi dai totali giornalieri");
ok(G.snArchivePrio.rows("critical").length === 2 && G.snArchivePrio.rows("high").length === 2, "righe critiche e alte");
calls.length = 0;
await G.snArchivePrio.refresh(mkHass(baseStates()), true);
ok(!calls.some((c) => c.priority), "totali invariati: non rilegge");

// SuperNotify senza priority: giorno per giorno come prima
G = boot();
try { window.localStorage.clear(); } catch (e) { /* */ }
calls.length = 0;
await G.snArchivePrio.refresh(mkHass(baseStates(), false), true);
ok(!calls.some((c) => c.priority) && calls.filter((c) => c.verbosity === "summary" && c.before).length === 3, "senza il campo priority: i 3 giorni uno per uno");

if (fail) { console.log(`\nFAIL ${fail}`); process.exit(1); }
console.log("\nall ok");
process.exit(0);
