// 1.1.0 (control 0.40.0): the last notification - voice box ("Ha parlato in casa" / "Non ha parlato" + why),
// the "Ha superato" hook (bypassed_scenarios / bypassed_snoozes, when SuperNotify archives them), the skipped
// channels that open with their reasons, "Inviata su N canali" and the priority badge with the time.
// Everything comes from the archived record of that notification, never from the state of the house now.
import { boot, load, ok, fail, wait, txt } from "./_harness.mjs";

boot({ scroll: true });
const { SN_STRINGS, snEnquireBust } = load("SN_STRINGS, snEnquireBust");

const ago = (m) => new Date(Date.now() - m * 60e3).toISOString();
const del = (name, transport, fn) => ({ state: "on", attributes: { name, enabled: true, transport, transport_enabled: true,
  friendly_name: `SuperNotify Delivery ${fn} abilitata` } });
const baseStates = () => ({
  "switch.supernotify_delivery_mobile_push": del("mobile_push", "mobile_push", "Notifica sul telefono"),
  "switch.supernotify_delivery_alexa_announce": del("alexa_announce", "alexa_devices", "Annuncio Alexa"),
  "switch.supernotify_delivery_tts_casa": del("tts_casa", "tts", "Voce in casa"),
  "switch.supernotify_delivery_email": del("email", "email", "Email"),
  "switch.supernotify_scenario_notte": { state: "on", attributes: { name: "notte", friendly_name: "SuperNotify Scenario Notte abilitato" } },
  "notify.cucina_echo_announce": { state: "unknown", attributes: { friendly_name: "Echo Cucina" } },
  "media_player.salotto": { state: "idle", attributes: { friendly_name: "Altoparlante Salotto" } },
  "person.anna": { state: "home", attributes: { friendly_name: "Anna" } },
  "sensor.supernotify_notifications": { state: "1", attributes: {} },
});

// a record shaped like SuperNotify's (Notification.contents(): deliveries -> success/suppressed envelopes or a
// skipped summary {target_required, suppression_reason}, delivery_provenance {name: {enabled_by, disabled_by}})
const spoken = () => ({
  id: "v0000001-aaaa", created: ago(3), title: "Porta", message: "Qualcuno alla porta", priority: "high",
  delivered: 3, failed: 0, skipped: 3, missed: 0, outcome: "success",
  deliveries: {
    mobile_push: { success: [{ target: { mobile_app_id: ["mobile_app_anna"] }, calls: [{ domain: "notify", action: "mobile_app_anna" }] }] },
    alexa_announce: { success: [{ target: { entity_id: ["notify.cucina_echo_announce"] }, spoken_message: "Qualcuno alla porta",
      calls: [{ domain: "notify", action: "send_message", target_data: { entity_id: ["notify.cucina_echo_announce"] } }] }] },
    tts_casa: { success: [{ target: { entity_id: ["media_player.salotto"] }, spoken_message: "Qualcuno alla porta",
      calls: [{ domain: "tts", action: "speak", action_data: { media_player_entity_id: "media_player.salotto" } }] }] },
    email: { skipped: { target_required: "always", suppression_reason: "NO_TARGET" } },
    sms: { skipped: { target_required: "always", suppression_reason: "PRIORITY" } },
    telegram: { suppressed: [{ target: {}, skip_reason: "DUPE" }] },
  },
  delivery_provenance: { mobile_push: { enabled_by: ["default"] }, alexa_announce: { enabled_by: ["default"] } },
});

let last = spoken();
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, services: { supernotify: { notify: {} } }, user: { is_admin: true },
  states: baseStates(),
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_last_notification") return { response: last };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    return { response: {} };
  },
};
const mount = async (cfg = {}) => {
  const el = document.createElement("supernotify-control-card");
  el.setConfig({ last_notification: true, tiles: ["snooze"], status: false, ...cfg });
  document.body.appendChild(el); el.hass = hass; await wait(40); el.hass = { ...hass }; await wait(40);
  return el;
};
// enquire answers are shared for 2.5 s: forget them, as a new notification does
const show = async (rec) => { last = rec; snEnquireBust(); const el = await mount(); return el; };
const R = (el) => el.shadowRoot.getElementById("lastn");

// ── 1. spoke, with its speakers ─────────────────────────────────────────────
let c = await show(spoken());
let vb = R(c).querySelector(".vb");
console.log("    voce:", txt(vb));
ok(vb && vb.classList.contains("on") && /Ha parlato in casa/.test(txt(vb.querySelector(".v1"))), "voce: Ha parlato in casa (blu)");
ok(vb && txt(vb.querySelector(".v2")) === "Echo Cucina, Altoparlante Salotto", "seconda riga: i destinatari che hanno parlato, per nome");
ok(!R(c).querySelector(".vx"), "nessun 'Ha superato' senza bypassed_* nel record");
const badge = R(c).querySelector(".lh .lb");
ok(badge && /^● Alta · 3 min fa$/.test(txt(badge)), `badge priorità e tempo insieme (${txt(badge)})`);
ok(!/🕐/.test(txt(R(c).querySelector(".lh"))), "niente chip del tempo a parte");
ok(/^(📤 )?Inviata su 3 canali$/.test(txt(R(c).querySelector(".lso"))), "Inviata su 3 canali");

// ── 2. the skipped list opens, with its reasons ─────────────────────────────
let sb = R(c).querySelector("#skpBtn");
let list = R(c).querySelector("#skpList");
ok(sb && sb.tagName === "BUTTON" && /3 saltati/.test(txt(sb)) && sb.getAttribute("aria-expanded") === "false", "3 saltati: un bottone, chiuso");
ok(list && list.hidden && sb.getAttribute("aria-controls") === "skpList", "elenco nascosto e collegato (aria-controls)");
sb.click(); await wait(10);
sb = R(c).querySelector("#skpBtn"); list = R(c).querySelector("#skpList");
const items = [...list.querySelectorAll("li")].map(txt);
console.log("    saltati:", items.join(" | "));
ok(sb.getAttribute("aria-expanded") === "true" && !list.hidden, "tap: aperto, aria-expanded=true");
ok(items.includes("Email — nessun destinatario") && items.includes("sms — priorità sotto la soglia") && items.includes("telegram — duplicato"),
  "ogni canale saltato con il motivo tradotto");
ok(c.shadowRoot.activeElement === sb, "il fuoco resta sul bottone");
// a keyboard press on a <button> is a click: Enter / Space open and close it the same way
sb.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); sb.click(); await wait(10);
ok(R(c).querySelector("#skpBtn").getAttribute("aria-expanded") === "false" && R(c).querySelector("#skpList").hidden, "di nuovo: chiuso");

// ── 3. nothing redrawn while the notification stays the same ─────────────────
const before = R(c).firstElementChild;
c._renderLast(); c.hass = { ...hass, states: { ...hass.states, "sensor.temp": { state: "21", attributes: {} } } }; await wait(10);
ok(R(c).firstElementChild === before, "stessa notifica: nessun ridisegno");

// ── 4. no reasoning from the house now ──────────────────────────────────────
const t0 = txt(R(c).querySelector(".vb"));
const s2 = baseStates();
s2["switch.supernotify_delivery_alexa_announce"] = { ...s2["switch.supernotify_delivery_alexa_announce"], state: "off" };
s2["switch.supernotify_delivery_tts_casa"].attributes = { ...s2["switch.supernotify_delivery_tts_casa"].attributes, last_outcome: "skipped", last_skip_reason: "SNOOZED" };
s2["person.anna"] = { state: "not_home", attributes: { friendly_name: "Anna" } };
hass.states = s2;
c.hass = { ...hass }; await wait(20); c._renderLast();
ok(txt(R(c).querySelector(".vb")) === t0, "stato della casa cambiato dopo: il riquadro voce non cambia");
hass.states = baseStates();

// ── 5. did not speak, each reason ───────────────────────────────────────────
const silent = (code) => {
  const r = spoken();
  r.id = "s-" + code;
  r.deliveries.alexa_announce = { skipped: { target_required: "always", suppression_reason: code } };
  r.deliveries.tts_casa = { skipped: { target_required: "optional", suppression_reason: code } };
  return r;
};
const want = { SNOOZED: "pausa", PRIORITY: "priorità sotto la soglia", OCCUPANCY: "nessuno in casa",
  DELIVERY_CONDITION: "condizione del canale", DUPE: "duplicato", NO_TARGET: "nessun destinatario" };
for (const [code, words] of Object.entries(want)) {
  c = await show(silent(code));
  vb = R(c).querySelector(".vb");
  ok(vb && vb.classList.contains("off") && /Non ha parlato/.test(txt(vb.querySelector(".v1"))) && txt(vb.querySelector(".v2")) === words,
    `${code}: Non ha parlato · ${words} (${txt(vb && vb.querySelector(".v2"))})`);
}
// DUPE recorded on the envelope (suppressed), not on a skipped summary
{
  const r = spoken(); r.id = "dupe-env";
  r.deliveries.alexa_announce = { suppressed: [{ target: { entity_id: ["notify.cucina_echo_announce"] }, spoken_message: "x", skip_reason: "DUPE" }] };
  delete r.deliveries.tts_casa;
  c = await show(r);
  ok(txt(R(c).querySelector(".vb .v2")) === "duplicato", "DUPE sull'envelope soppresso: duplicato");
}
// two voice channels, two reasons: each named
{
  const r = spoken(); r.id = "two";
  r.deliveries.alexa_announce = { skipped: { suppression_reason: "SNOOZED" } };
  r.deliveries.tts_casa = { skipped: { suppression_reason: "OCCUPANCY" } };
  c = await show(r);
  ok(txt(R(c).querySelector(".vb .v2")) === "Annuncio Alexa: pausa · Voce in casa: nessuno in casa", `motivi diversi: per canale (${txt(R(c).querySelector(".vb .v2"))})`);
}
// switched off by a scenario: the record's delivery_provenance names it
{
  const r = spoken(); r.id = "scen";
  delete r.deliveries.alexa_announce; delete r.deliveries.tts_casa;
  r.delivery_provenance.alexa_announce = { enabled_by: ["default"], disabled_by: ["scenario:notte"] };
  r.delivery_provenance.tts_casa = { enabled_by: ["default"], disabled_by: ["scenario:notte"] };
  c = await show(r);
  vb = R(c).querySelector(".vb");
  ok(vb && /Non ha parlato/.test(txt(vb)) && txt(vb.querySelector(".v2")) === "spento dallo scenario Notte", `spento da uno scenario, col nome (${txt(vb && vb.querySelector(".v2"))})`);
}
// voice channels set up, not in this notification and nothing says why: still a reason
{
  const r = spoken(); r.id = "notsel";
  delete r.deliveries.alexa_announce; delete r.deliveries.tts_casa;
  c = await show(r);
  ok(txt(R(c).querySelector(".vb .v2")) === "nessun canale vocale scelto", "nessun canale vocale nella notifica: lo dice");
}

// ── 6. no voice delivery at all: no box ─────────────────────────────────────
{
  const st = baseStates();
  delete st["switch.supernotify_delivery_alexa_announce"]; delete st["switch.supernotify_delivery_tts_casa"];
  hass.states = st;
  const r = spoken(); r.id = "novoice";
  delete r.deliveries.alexa_announce; delete r.deliveries.tts_casa;
  c = await show(r);
  ok(!R(c).querySelector(".vb"), "nessun canale vocale configurato: nessun riquadro");
  ok(/Inviata su 1 canale$/.test(txt(R(c).querySelector(".lso"))), `Inviata su 1 canale (singolare) (${txt(R(c).querySelector(".lso"))})`);
  hass.states = baseStates();
}

// ── 7. "Ha superato": amber when high, red when critical, hidden otherwise ──
{
  const r = spoken(); r.id = "byp-high";
  r.bypassed_scenarios = ["notte"];
  c = await show(r);
  const vx = R(c).querySelector(".vx");
  ok(vx && !vx.classList.contains("crit") && /^(⚠ )?Ha superato: scenario Notte$/.test(txt(vx)),
    `alta: ambra, con lo scenario (${txt(vx)})`);
  ok(/\.lastn \.vx \{[^}]*warnSoft|\.lastn \.vx \{[^}]*#fdf1e3/.test(c.shadowRoot.innerHTML), "ambra = i colori warn della palette");
  const r2 = spoken(); r2.id = "byp-crit"; r2.priority = "critical";
  r2.bypassed_snoozes = [{ recipient_type: "EVERYONE", recipient: null, until: null }, { recipient_type: "USER", recipient: "person.anna", until: null }];
  c = await show(r2);
  const vx2 = R(c).querySelector(".vx");
  ok(vx2 && vx2.classList.contains("crit") && /Ha superato: la pausa di tutti, la pausa di Anna/.test(txt(vx2)), `critica: rossa, con le pause (${txt(vx2)})`);
  ok(/^● Critica · 3 min fa$/.test(txt(R(c).querySelector(".lh .lb"))), "badge critica con il tempo");
  const r3 = spoken(); r3.id = "byp-empty"; r3.bypassed_scenarios = []; r3.bypassed_snoozes = [];
  c = await show(r3);
  ok(!R(c).querySelector(".vx"), "bypassed_* vuoti: nascosto");
}

// ── 8. English ──────────────────────────────────────────────────────────────
{
  hass.language = "en";
  c = await show(spoken());
  ok(/Spoke at home/.test(txt(R(c).querySelector(".vb"))) && /Sent on 3 channels/.test(txt(R(c).querySelector(".lso"))), "en: Spoke at home / Sent on 3 channels");
  ok(/^● High · 3 min ago$/.test(txt(R(c).querySelector(".lh .lb"))), "en: ● High · 3 min ago");
  c = await show(silent("OCCUPANCY"));
  ok(/Did not speak/.test(txt(R(c).querySelector(".vb"))) && txt(R(c).querySelector(".vb .v2")) === "nobody home", "en: Did not speak · nobody home");
  hass.language = "it";
}

// ── 9. every language has the strings ───────────────────────────────────────
{
  const S = SN_STRINGS;
  const keys = ["vb_spoke", "vb_silent", "vb_not_sel", "vb_bypass", "vb_scen", "vb_snz_all", "vb_snz_of", "vb_by_scen", "sent_on", "vb_reasons"];
  const miss = Object.entries(S).filter(([l, d]) => keys.some((k) => !d[k] || (l !== "en" && d[k] === S.en[k] && k !== "vb_scen")));
  ok(Object.keys(S).length >= 11 && !miss.length, `stringhe in tutte le ${Object.keys(S).length} lingue (${miss.map(([l]) => l).join(",")})`);
}

console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
