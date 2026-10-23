// v0.51.0: deliveries-card raggruppata, una riga di stato per canale (pausa da scenario, spento, transport spento).
import { boot, load, ok, fail } from "./_harness.mjs";

boot();
load();

const del = (name, fn, transport, inc, extra = {}, state = "on") => ({ state, attributes: { name, enabled: state === "on", transport, inclusion: inc,
  transport_enabled: true, friendly_name: `SuperNotify Delivery ${fn} abilitata`, ...extra } });
const states = {
  "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono", "mobile_push", ["default"]),
  "switch.supernotify_delivery_tts": del("tts", "Voce (TTS)", "tts", ["default"]),
  "switch.supernotify_delivery_email": del("email", "Email", "email", ["default"], {}, "off"),
  "switch.supernotify_delivery_matrix": del("matrix", "Matrix", "matrix", ["explicit"], { transport_enabled: false }),
  "switch.supernotify_delivery_campanello": del("campanello", "Campanello ingresso", "chime", ["scenario"]),
  // scenario attivo: spegne tts, accende campanello
  "switch.supernotify_scenario_ospiti": { state: "on", attributes: { name: "ospiti", friendly_name: "SuperNotify Scenario Voce spenta (ospiti)",
    delivery: { tts: { enabled: false }, campanello: { enabled: true } } } },
  "binary_sensor.supernotify_scenario_ospiti": { state: "on", attributes: {} },
  // scenario NON attivo: non deve contare
  "switch.supernotify_scenario_notte": { state: "on", attributes: { name: "notte", friendly_name: "SuperNotify Scenario Notte",
    delivery: { mobile_push: { enabled: false } } } },
  "binary_sensor.supernotify_scenario_notte": { state: "off", attributes: {} },
};
const el = document.createElement("supernotify-deliveries-card");
el.setConfig({}); document.body.appendChild(el);
el.hass = { language: "it", themes: { darkMode: false }, entities: {}, states, callService: async () => {} };
const row = (alias) => [...el.shadowRoot.querySelectorAll(".row")].find((r) => r.querySelector(".mid b").textContent === alias);
const st = (alias) => { const s = row(alias) && row(alias).querySelector(".st"); return s ? s.textContent.replace(/\s+/g, " ").trim() : ""; };

ok(st("Voce (TTS)") === "in pausa ora: Voce spenta (ospiti)" && row("Voce (TTS)").querySelector(".st.warn"), "tts: in pausa per lo scenario attivo");
ok(st("Notifica sul telefono") === "", "mobile_push: lo scenario 'notte' non è attivo, nessuna pausa");
ok(st("Email") === "spento a mano" && row("Email").classList.contains("dim"), "email: spento a mano, riga attenuata");
ok(/transport spento/.test(st("Matrix")) && row("Matrix").querySelector(".st.crit"), "matrix: transport spento in rosso");
ok(st("Campanello ingresso") === "acceso ora da Voce spenta (ospiti)", "campanello (solo scenario): acceso ora da");
ok(/4 di 5 accesi/.test(el.shadowRoot.querySelector(".chd").textContent), "conteggio accesi");
const order = [...el.shadowRoot.querySelectorAll(".grp:first-of-type .row .mid b")].map((b) => b.textContent);
ok(order[order.length - 1] === "Email", "dentro il gruppo prima gli accesi, poi gli spenti");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
