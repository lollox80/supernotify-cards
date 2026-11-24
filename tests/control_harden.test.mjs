// CHANGELOG
// 2026-11-24 - control 0.44.0: the alert at the top and the Notifications word of the status bar became the head;
//   the same behaviour is checked there (sentence, severity, Resume / Retry).
// 2026-11-22 - control 0.41.0: the card says the truth when it matters. Silencing everything (or pausing with
//   no end) asks for a second tap and says what it means; such a pause stays at the top of the card until it
//   is resumed; "Announced" only once SuperNotify took it (the text stays on a failure); a refused toggle is
//   shown in words; SuperNotify not answering is said instead of an empty card.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
const G = load("snEnquireBust");

const S = (state, attributes = {}) => ({ state, attributes });
const calls = [];
let snoozes = [];
let wsDown = false;
let svcError = null;
const hass = {
  language: "en", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  states: {
    "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }),
    "input_boolean.guests": S("off", { friendly_name: "Guests" }),
    "switch.supernotify_delivery_alexa_announce": S("on", { name: "alexa_announce" }),
  },
  services: { supernotify: { snooze: {}, silence: {}, unsnooze: {}, clear_snoozes: {}, enquire_snoozes: {} } },
  callService: async (d, s, data) => { calls.push([d, s, data]); if (svcError) throw svcError; },
  callApi: async () => {},
  callWS: async (m) => {
    if (wsDown) throw { code: "timeout", message: "timeout" };
    if (m.domain === "supernotify" && ["snooze", "silence", "unsnooze"].includes(m.service)) calls.push(["ws", m.service, m.service_data]);
    if (m.service === "enquire_snoozes") return { response: { snoozes } };
    return { response: {} };
  },
};

const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ dnd_entity: "input_boolean.dnd", tiles: ["dnd", "snooze", "announce"], occupancy: false,
  groups: [{ name: "House", entities: ["input_boolean.guests"] }] });
document.body.appendChild(ctl);
ctl.hass = hass;
await wait(60);
const sr = ctl.shadowRoot;
const toast = () => sr.getElementById("toast");

// --- tiles: one name per concept, one behaviour per tile
const tileTxt = () => [...sr.querySelectorAll(".ctile")].map(txt);
ok(tileTxt().length === 2 && !tileTxt().some((t) => /Announce/.test(t)) && !!sr.getElementById("announceRow"),
  `niente tile Annuncia doppione, la riga resta (${tileTxt().join(" | ")})`);
ok(/^Do not disturb ?off$/.test(tileTxt()[0]), `DND: dice il suo stato (${tileTxt()[0]})`);
const snzTile = sr.querySelectorAll(".ctile")[1];
ok(/^Pause…/.test(txt(snzTile)) && !!snzTile.querySelector(".mo") && snzTile.getAttribute("aria-expanded") === "false",
  `pausa: «Pause…» con freccia, apre il pannello (${txt(snzTile)})`);
snzTile.click(); await wait(10);
ok(sr.querySelectorAll(".ctile")[1].getAttribute("aria-expanded") === "true" && !sr.getElementById("snzp").hidden, "pausa: pannello aperto, aria-expanded");
sr.querySelectorAll(".ctile")[1].click(); await wait(10);
ok(!/Snooze/.test(txt(sr.querySelector("ha-card"))), "nessun «Snooze» nella card");
// the panel takes the focus when it opens; Esc closes it and gives the focus back to the tile
sr.querySelectorAll(".ctile")[1].click(); await wait(10);
ok(sr.activeElement && sr.activeElement.classList.contains("sc"), "pannello aperto: il focus va sulla prima scelta");
sr.activeElement.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
await wait(10);
ok(sr.getElementById("snzp").hidden && sr.activeElement && sr.activeElement.getAttribute("aria-expanded") === "false",
  "Esc chiude il pannello e il focus torna sulla tile");

// --- announce: success clears the box, a failure keeps the text and says why
const input = sr.getElementById("announceInput");
input.value = "Dinner is ready";
sr.getElementById("announceBtn").click(); await wait(20);
ok(txt(toast()) === "Announced" && !toast().classList.contains("err") && input.value === "", "annuncio riuscito: Announced, casella vuota");
svcError = { code: "unauthorized", message: "Unauthorized" };
input.value = "Dinner is ready";
sr.getElementById("announceBtn").click(); await wait(20);
ok(toast().classList.contains("err") && /Couldn't announce/.test(txt(toast())) && /not allowed/.test(txt(toast())),
  `annuncio fallito: errore in parole (${txt(toast())})`);
ok(input.value === "Dinner is ready", "annuncio fallito: il testo resta nella casella");
ok(!/✖|Unauthorized/.test(txt(toast())), "nessun messaggio tecnico grezzo");

// --- toggle: a refused toggle is shown, the pill is busy while waiting
svcError = { code: "home_assistant_error", message: "Entity is read only" };
const pill = sr.querySelector(".mpill");
pill.click();
ok(pill.classList.contains("busy"), "pill occupata mentre Home Assistant risponde");
await wait(20);
ok(/Couldn't change Guests/.test(txt(toast())) && /read only/.test(txt(toast())), `toggle rifiutato: ${txt(toast())}`);
svcError = null;

// --- tile: Space does not scroll the page as well
const tile = sr.querySelector(".ctile");
const ev = new dom.window.KeyboardEvent("keydown", { key: " ", cancelable: true });
tile.dispatchEvent(ev);
ok(ev.defaultPrevented, "Spazio su una tile: niente scorrimento della pagina");
await wait(20);

// --- pause panel: everything asks twice and says what it means
ctl._snzOpen = true; ctl._renderSnz(true);
const pick = (g, v) => sr.querySelector(`.sc[data-g="${g}"][data-v="${v}"]`).click();
pick("what", "NONCRITICAL"); pick("min", 30);
ok(!sr.querySelector(".swarn") && !sr.getElementById("snzGo").classList.contains("crit"), "pausa normale: nessun avviso");
pick("what", "EVERYTHING");
let go = sr.getElementById("snzGo");
ok(go.classList.contains("crit") && /Silence everything, critical too/.test(txt(go)), `tutto: pulsante d'allarme (${txt(go)})`);
ok(/critical alerts will not reach anyone/.test(txt(sr.querySelector(".swarn"))), "tutto: avviso sulle critiche");
calls.length = 0;
go.click(); await wait(20);
ok(!calls.some((c) => c[1] === "snooze") && /Tap again to confirm/.test(txt(sr.getElementById("snzGo"))), "tutto: il primo tocco chiede conferma");
sr.getElementById("snzGo").click(); await wait(20);
const sn = calls.find((c) => c[1] === "snooze");
ok(sn && sn[2].scope === "everything" && sn[2].minutes === 30, `tutto: il secondo tocco mette in pausa (${JSON.stringify(sn)})`);
// control 0.46.0: a pause that worked closes the panel - open it again
ctl._openSnz(); await wait(5);
pick("min", 0);
ok(/does not end on its own/.test(txt(sr.querySelector(".swarn"))), "senza fine: avviso che non finisce da sola");
ctl._snzOpen = false; ctl._renderSnz(true);

// --- the head (control 0.44.0, it took the alert at the top and the Notifications word of the status bar):
// one sentence for "are notifications arriving?", the severity, one action
const head = () => sr.getElementById("head");
const ht = () => txt(head());
const sev = () => (head().classList.contains("crit") ? "crit" : head().classList.contains("warn") ? "warn" : "ok");
const setSnz = async (list) => { snoozes = list; G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10); };
const inH = (ms) => new Date(Date.now() + ms).toISOString();

// everything silenced, critical included: red, with its end, Resume resumes that pause
await setSnz([{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: inH(3600e3), snoozed_at: new Date().toISOString() }]);
ok(sev() === "crit" && /Everything is silenced/.test(ht()) && /Critical alerts too · until/.test(ht()), `testata: tutto silenziato (${ht()})`);
calls.length = 0;
head().querySelector("button").click(); await wait(20);
ok(calls.some((c) => c[1] === "unsnooze" && c[2].scope === "everything"), "testata: Riprendi riprende quella pausa");

// non-critical paused for everyone: orange, says critical alerts still arrive, with the end or "until resumed"
await setSnz([{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: inH(1800e3), snoozed_at: new Date().toISOString() }]);
ok(sev() === "warn" && /Notifications are paused/.test(ht()) && /Critical alerts still get through · until/.test(ht()), `testata: in pausa a tempo (${ht()})`);
await setSnz([{ target_type: "NONCRITICAL", recipient_type: "EVERYONE" }]);
ok(sev() === "warn" && /until resumed/.test(ht()) && !!head().querySelector('button[data-a="resume"]'), `testata: in pausa senza fine, con Riprendi (${ht()})`);

// a pause of one channel: they arrive, the line under says which pause
await setSnz([{ target_type: "DELIVERY", target: "alexa_announce", recipient_type: "EVERYONE", snooze_until: inH(600e3), snoozed_at: new Date().toISOString() }]);
ok(sev() === "ok" && /Notifications are getting through/.test(ht()) && /1 pause: /.test(ht()) && !head().querySelector("button"), `testata: pausa di un canale (${ht()})`);
await setSnz([]);
ok(sev() === "ok" && /Notifications are getting through/.test(ht()) && !/pause/.test(ht()), `testata: arrivano (${ht()})`);
hass.states = { ...hass.states, "input_boolean.dnd": S("on", { friendly_name: "Do not disturb" }) };
ctl.hass = { ...hass }; await wait(20);
ok(sev() === "warn" && /Do not disturb is on/.test(ht()), `testata: non disturbare (${ht()})`);
hass.states = { ...hass.states, "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }) };
ctl.hass = { ...hass }; await wait(20);
// the status row no longer repeats it, and the head is announced politely, not as an alarm
ok(!/Notifications/.test(txt(sr.getElementById("statusbar"))) && head().getAttribute("role") === "status", "riga di stato senza «Notifications», testata role=status");

// --- SuperNotify not answering: said after a poll, gone when it answers again
wsDown = true;
G.snEnquireBust(); await wait(10);
ctl._failSince = Date.now() - 60000;
await ctl._refreshSnoozes(); await wait(10);
ok(sev() === "crit" && /may not arrive/.test(ht()) && /not responding/.test(ht()) && /Retry/.test(txt(head().querySelector("button"))), `SuperNotify non risponde: detto, con Riprova (${ht()})`);
wsDown = false;
G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);
ok(!/not responding/.test(ht()) && sev() === "ok", "SuperNotify risponde di nuovo: testata normale");

ctl.remove();
console.log(fail ? `FAIL ${fail}` : "control_harden: all ok");
process.exit(fail ? 1 : 0);
