// CHANGELOG
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
const alertEl = () => sr.getElementById("alert");

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
pick("min", 0);
ok(/does not end on its own/.test(txt(sr.querySelector(".swarn"))), "senza fine: avviso che non finisce da sola");
ctl._snzOpen = false; ctl._renderSnz(true);

// --- the alert at the top: everything silenced, critical included
snoozes = [{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 3600e3).toISOString(), snoozed_at: new Date().toISOString() }];
G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10);
ok(!alertEl().hidden && alertEl().classList.contains("crit") && /Everything is silenced/.test(txt(alertEl())), `avviso in cima: tutto silenziato (${txt(alertEl())})`);
calls.length = 0;
alertEl().querySelector("button").click(); await wait(20);
ok(calls.some((c) => c[1] === "unsnooze" && c[2].scope === "everything"), "avviso: Riprendi riprende quella pausa");

// a timed non-critical pause is a normal choice: no alert
snoozes = [{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 1800e3).toISOString(), snoozed_at: new Date().toISOString() }];
G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10);
ok(alertEl().hidden, "pausa non critica a tempo: nessun avviso");
// a non-critical pause with no end: warn
snoozes = [{ target_type: "NONCRITICAL", recipient_type: "EVERYONE" }];
G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10);
ok(!alertEl().hidden && alertEl().classList.contains("warn") && /no end time/.test(txt(alertEl())), "pausa senza fine: avviso");

// --- the status bar: one notification state, which sees the pauses (Quiet said "off" during a pause)
const bar = () => txt(sr.getElementById("statusbar"));
ok(/Notifications ?paused · until resumed/.test(bar()) && !/Quiet/.test(bar()), `stato: in pausa senza fine (${bar()})`);
snoozes = [{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 3600e3).toISOString(), snoozed_at: new Date().toISOString() }];
G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10);
ok(/Notifications ?all silenced · until/.test(bar()), `stato: tutte silenziate (${bar()})`);
ok(!!sr.querySelector('#statusbar [data-go="snz"]'), "stato: tocca per aprire il pannello pausa");
snoozes = [{ target_type: "DELIVERY", target: "alexa_announce", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 600e3).toISOString(), snoozed_at: new Date().toISOString() }];
G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10);
ok(/Notifications ?normal · 1 pause/.test(bar()), `stato: pausa di un canale (${bar()})`);
snoozes = [];
G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10);
ok(/Notifications ?normal/.test(bar()) && !/pause/.test(bar()), `stato: normali (${bar()})`);
hass.states = { ...hass.states, "input_boolean.dnd": S("on", { friendly_name: "Do not disturb" }) };
ctl.hass = { ...hass }; await wait(20);
ok(/Notifications ?do not disturb/.test(bar()), `stato: non disturbare (${bar()})`);
hass.states = { ...hass.states, "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }) };
ctl.hass = { ...hass }; await wait(20);

// --- SuperNotify not answering: said after a poll, gone when it answers again
wsDown = true;
G.snEnquireBust(); await wait(10);
ctl._failSince = Date.now() - 60000;
await ctl._refreshSnoozes(); await wait(10);
ok(!alertEl().hidden && alertEl().classList.contains("down") && /not responding/.test(txt(alertEl())), "SuperNotify non risponde: detto");
wsDown = false;
G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);
ok(!/not responding/.test(txt(alertEl())), "SuperNotify risponde di nuovo: avviso tolto");

ctl.remove();
console.log(fail ? `FAIL ${fail}` : "control_harden: all ok");
process.exit(fail ? 1 : 0);
