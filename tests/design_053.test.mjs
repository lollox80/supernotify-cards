// v0.53.0: why-card - percorso in 4 passi, problemi in cima con cosa fare, il resto ripiegato.
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
const T0 = Math.floor(Date.now() / 1000) - 600;
const IDX = { count: 1, chan: ["mobile_push"], scen: ["home"], items: [{ id: "aaaa1111", t: T0, ti: "Porta", o: "partial_delivery", d: 1, s: 2, mi: 1, c: [0] }] };
const DET = JSON.stringify({ ok: true, n: { id: "aaaa1111-x", t: T0, ti: "Porta d'ingresso", m: "Qualcuno è alla porta", p: "high", o: "partial_delivery", mi: 1,
  sc: { on: ["home"], sel: ["home"] }, occ: { home: ["person.lorenzo"], away: ["person.jessica"] },
  dl: [
    { n: "mobile_push", r: "ok", calls: 2, tg: { mobile_app_id: ["mobile_app_lorenzo"] } },
    { n: "email", r: "skip", why: "NO_TARGET", tr: "always" },
    { n: "tts", r: "skip", why: "SNOOZED" },
    { n: "telegram", r: "err", err: ["chat not found"] },
  ] } });
const del = (name, fn) => ({ state: "on", attributes: { name, enabled: true, transport: "x", inclusion: ["default"], friendly_name: `SuperNotify Delivery ${fn} abilitata` } });
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, services: { shell_command: { sn_archive_detail: {} } },
  states: {
    "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono"),
    "switch.supernotify_delivery_email": del("email", "Email"),
    "switch.supernotify_delivery_tts": del("tts", "Voce (TTS)"),
    "switch.supernotify_delivery_telegram": del("telegram", "Telegram famiglia"),
    "switch.supernotify_delivery_sirena": { state: "on", attributes: { name: "sirena", enabled: true, transport: "x", inclusion: ["explicit"] } },
    "switch.supernotify_scenario_home": { state: "on", attributes: { name: "home", friendly_name: "SuperNotify Scenario Qualcuno in casa" } },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo" } },
    "person.jessica": { state: "not_home", attributes: { friendly_name: "Jessica" } },
    "sensor.supernotify_archivio": { state: "1", attributes: IDX, last_updated: "x" },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => (m.domain === "shell_command" ? { response: { stdout: DET, stderr: "", returncode: 0 } } : { response: {} }),
};
const mk = async (cfg) => {
  const w = document.createElement("supernotify-why-card");
  w.setConfig({ source: "sensor", entity: "sensor.supernotify_archivio", ...cfg }); document.body.appendChild(w); w.hass = hass;
  await tick(); await w._select("aaaa1111"); await tick();
  return w.shadowRoot.getElementById("det");
};
const det = await mk({});
const steps = [...det.querySelectorAll(".path .step")].map((s) => s.textContent.replace(/\s+/g, " ").trim());
console.log("    percorso:", steps.join(" | "));
ok(steps.length === 4, "quattro passi");
ok(/instradamento normale/.test(steps[0]) && /Qualcuno in casa/.test(steps[1]) && /Lorenzo/.test(steps[2]) && /fuori: Jessica/.test(steps[2]), "chiamata, scenari, persone");
ok(/1 partiti · 2 da guardare · 1 saltati/.test(steps[3]), "conteggio canali");
const pbs = [...det.querySelectorAll(".pb")];
ok(pbs.length === 2 && det.firstElementChild.nextElementSibling.classList.contains("path") && det.children[2].classList.contains("pb"), "problemi subito dopo il percorso");
const em = pbs.find((x) => /Email/.test(x.textContent));
ok(em && em.classList.contains("warn") && /chiesto ma non partito/.test(em.textContent) && /aggiungilo a un destinatario/.test(em.textContent), "email: mancato in arancio con cosa fare");
const tg = pbs.find((x) => /Telegram famiglia/.test(x.textContent));
ok(tg && tg.classList.contains("crit") && /fallito/.test(tg.textContent) && /chat not found/.test(tg.textContent), "telegram: fallito in rosso con l'errore");
const folds = [...det.querySelectorAll("details.fold")];
ok(folds.some((f) => /1 saltati per regola: normale/.test(f.querySelector("summary").textContent) && /Voce \(TTS\)/.test(f.textContent) && !f.open), "snooze: ripiegato tra i saltati per regola");
ok(folds.some((f) => /1 non coinvolti/.test(f.querySelector("summary").textContent) && /sirena/.test(f.textContent)), "canali non coinvolti ripiegati");
ok(/Alta/.test(det.querySelector(".hd .meta").textContent), "priorità tradotta");
const det2 = await mk({ expand: true });
ok([...det2.querySelectorAll("details.fold")].every((f) => f.open), "expand: true apre tutto");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
