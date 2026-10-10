// v0.88.0: panoramica "Proposta 2" - overview 0.39.0 (banda di stato, numeri dall'archivio, ultima
// notifica con Ripeti e Perché, scenari a righe con l'effetto adesso, parts) e stats 0.33.0
// (kpis/versions false, intestazione col periodo, picco e doppioni sotto le barre, errori in colonna).
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

const key = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
// archivio: oggi 50 (8 doppioni, 2 senza canale, 1 email fallita), ieri 120 (20 doppioni), poi 100 al giorno
const DAYS = [];
for (let n = 0; n <= 30; n++) {
  const count = n === 0 ? 50 : n === 1 ? 120 : n === 7 ? 300 : 100;
  const dupe = n === 0 ? 8 : n === 1 ? 20 : n === 7 ? 90 : 0;
  DAYS.push({ date: key(n), count, outcome: { success: count - dupe - (n === 0 ? 2 : 0), dupe, no_delivery: n === 0 ? 2 : 0 },
    priority: { medium: count - 5, low: 5 }, hour: Array.from({ length: 24 }, (_, h) => (h === 18 ? 10 : 1)),
    deliveries: { mobile_push: { success: count - dupe, failed: 0 }, email: { success: 5, failed: n === 0 ? 1 : n === 3 ? 2 : 0 } }, scenarios: {} });
}
const calls = [];
const snz = [{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: (Date.now() + 3600e3) / 1000 }];
const hass = {
  language: "it", themes: { darkMode: false }, user: { is_admin: true },
  services: { supernotify: { enquire_archive: {}, snooze: {}, unsnooze: {}, enquire_snoozes: {} } },
  states: {
    "update.supernotify_update": { state: "off", attributes: { installed_version: "2.13.2", latest_version: "2.13.2" } },
    "update.supernotify_cards_update": { state: "off", attributes: { installed_version: "0.88.0", latest_version: "0.88.0" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", overridden: false } },
    "switch.supernotify_delivery_email": { state: "on", attributes: { name: "email", overridden: false } },
    "switch.supernotify_delivery_sms": { state: "off", attributes: { name: "sms", overridden: true } },
    "binary_sensor.notifier_dnd": { state: "on", attributes: {} },
    "switch.supernotify_scenario_late_night": { state: "on", attributes: { friendly_name: "Late Night", delivery: { alexa: { data: { volume: 0 } } } } },
    "switch.supernotify_scenario_casa_vuota": { state: "on", attributes: { friendly_name: "Casa vuota", delivery: { tts: { enabled: false } } } },
    "input_button.supernotify_show_last": { state: "unknown", attributes: {} },
  },
  callWS: async (msg) => {
    const sd = msg.service_data || {};
    calls.push({ service: msg.service, ...sd });
    if (msg.service === "enquire_archive" && sd.verbosity === "daily") {
      const after = new Date(sd.after).getTime();
      return { response: { days: DAYS.filter((d) => new Date(`${d.date}T23:59:59`).getTime() >= after) } };
    }
    if (msg.service === "enquire_snoozes") return { response: { snoozes: snz } };
    if (msg.service === "enquire_active_scenarios") return { response: { scenarios: ["late_night", "casa_vuota"] } };
    if (msg.service === "enquire_last_notification") return { response: { id: "abc", created: new Date(Date.now() - 5 * 60e3).toISOString(),
      message: "Movimento alla porta", title: "Ingresso", priority: "medium", delivered: 2 } };
    if (msg.service === "enquire_occupancy") return { response: {} };
    return { response: {} };
  },
  callService: (dom, svc, data) => { calls.push({ service: `${dom}.${svc}`, ...data }); return Promise.resolve(); },
};
const mount = (tag, cfg) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = { ...hass }; return c; };

// ── 1. overview, parte alta ────────────────────────────────────────────
const top = mount("supernotify-overview-card", { parts: ["status", "numbers"], quiet_entity: "binary_sensor.notifier_dnd" });
await wait(60); top.hass = { ...hass }; await wait(80); top._update();
const R = top.shadowRoot;
const band = R.querySelector(".band");
console.log("    band:", band.className, [...R.querySelectorAll(".hr")].map(txt).join(" | "));
ok(band && band.classList.contains("crit"), "banda rossa: email fallita oggi, più pausa, canale spento, non disturbare");
ok(/4 cose da guardare/.test(txt(band.querySelector(".bl"))) && /2 di 3 canali accesi/.test(txt(band.querySelector(".bl"))), `frase e canali (${txt(band.querySelector(".bl"))})`);
ok(/SuperNotify 2\.13\.2/.test(txt(R.querySelector(".bver"))) && /Card 0\.88\.0/.test(txt(R.querySelector(".bver"))), "versioni a destra della banda");
ok(!R.querySelector(".hr.ok"), "le versioni non sono più righe dell'elenco");
const pz = R.querySelector("[data-resume]");
ok(pz && /Riprendi/.test(pz.textContent) && /finché non riprendi|fino alle/.test(txt(pz.closest(".hr"))), "pausa con ▶ Riprendi e fino a quando");
pz.click(); await wait(30);
ok(calls.some((c) => c.service === "unsnooze" && c.scope === "everything"), "Riprendi = unsnooze della pausa");
ok(!R.getElementById("last") && !R.getElementById("scen"), "parts: niente ultima notifica né scenari");
ok(!calls.some((c) => c.service === "enquire_last_notification" || c.service === "enquire_active_scenarios"), "parts: non li legge nemmeno");
const st = [...R.querySelectorAll(".stat")].map(txt);
console.log("    numeri:", st.join(" | "));
ok(st.length === 4, "quattro numeri");
ok(/^Oggi42 notificheieri 100 · media 30 gg 10\d/.test(st[0]), "Oggi senza doppioni, ieri, media 30 gg");
ok(/^Arrivate oggi40 · 8 doppioni scartati/.test(st[1]) && /1 canale fallito · 3 in 30 gg · 2 senza canale/.test(st[1]), "Arrivate, doppioni, falliti oggi e in 30 gg");
ok(/^Canali2 \/ 3 accesi1 spento/.test(st[2]), "Canali accesi e spenti");
ok(/^Silenzio1 pausa attivaNon disturbare: attivo/.test(st[3]), "Silenzio: pause e non disturbare");
ok(calls.filter((c) => c.verbosity === "daily").length === 1, "una sola lettura daily");
const hq = R.querySelector(".hq");
ok(hq && hq.getAttribute("aria-expanded") === "false", "«?» chiuso");
hq.click();
ok(R.querySelectorAll("#helpBox .help > div").length === 3 && R.querySelector(".hq").getAttribute("aria-expanded") === "true", "«?» apre la legenda in tre parti");

// ── 2. overview, adesso ────────────────────────────────────────────────
calls.length = 0;
const now = mount("supernotify-overview-card", { parts: ["last", "occupancy", "scenarios"], repeat_entity: "input_button.supernotify_show_last" });
await wait(60); now.hass = { ...hass }; await wait(80);
const N = now.shadowRoot;
ok(!N.getElementById("health") && !N.getElementById("stats"), "parts: niente banda né numeri");
ok(!calls.some((c) => c.service === "enquire_snoozes" || c.verbosity === "daily"), "parts: non legge pause né daily");
ok(/Ultima notifica · 5 min/.test(txt(N.getElementById("lastH"))), "tempo nel titolo del blocco");
N.getElementById("repBtn").click();
ok(calls.some((c) => c.service === "input_button.press" && c.entity_id === "input_button.supernotify_show_last"), "Ripeti preme il pulsante");
const rows = [...N.querySelectorAll("#scen .scr")].map(txt);
ok(rows.length === 2 && /^late_night/.test(rows[0]) && /^casa_vuota/.test(rows[1]), `scenari a righe (${rows.join(" | ")})`);
ok(/Scenari attivi · 2/.test(txt(N.getElementById("scenH"))), "conteggio nel titolo");
const eff = txt(N.querySelector(".effnow"));
ok(/Effetto adesso: voce spenta su alexa · spenti: tts/i.test(eff), `effetto adesso (${eff})`);

// ── 3. stats senza riquadri ────────────────────────────────────────────
dom.window.localStorage.setItem("supernotify-stats-days", "30");
const s = mount("supernotify-stats-card", { kpis: false, versions: false });
s.hass = { ...hass }; await wait(150);
const S = s.shadowRoot;
ok(!S.querySelector(".kpis"), "kpis: false = niente riquadri");
ok(/^Ultimi 30 giorni · [\d.,]+ notifiche · ≈ \d+ al giorno$/.test(txt(S.getElementById("sttl"))), `intestazione (${txt(S.getElementById("sttl"))})`);
ok(!S.querySelector(".vbox"), "versions: false = niente versioni");
const dl = txt(S.querySelector(".dl"));
ok(/picco \d+\/\d+: 210 \(90 doppioni\)/.test(dl) && /oggi 42/.test(dl), `sotto le barre picco e oggi (${dl})`);
ok(/picco alle 18/.test(S.innerHTML), "ora di punta nel titolo");
console.log("    ke:", [...S.querySelectorAll(".hrow")].map(txt).join(" | "));
ok([...S.querySelectorAll(".hrow .ke")].some((e) => /\d/.test(e.textContent)), "errori in colonna");
ok(S.querySelector("details.insd") && !S.querySelector("details.insd").open, "osservazioni ripiegate");
const s2 = mount("supernotify-stats-card", {});
s2.hass = { ...hass }; await wait(150);
ok(s2.shadowRoot.querySelector(".kpis") && /Utilizzo/.test(txt(s2.shadowRoot.getElementById("sttl"))), "default: riquadri e titolo di prima");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
