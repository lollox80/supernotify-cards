// CHANGELOG
// 2026-11-24 - control 0.45.0: one severity for the head and the tiles. The pause tile is red when everything is
//   silenced, orange when non-critical notifications are paused for everyone and neutral for a pause of a part
//   (it was always orange); do not disturb on is orange like the head (it was the blue of a switch that lets
//   notifications through); the switch tiles are role="switch" with aria-checked.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
const G = load("snEnquireBust");

const S = (state, attributes = {}) => ({ state, attributes });
let snoozes = [];
const calls = [];
const hass = {
  language: "en", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  states: {
    "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }),
    "input_boolean.voice": S("on", { friendly_name: "Voice" }),
    "sensor.supernotify_notifications": S("3"),
  },
  services: { supernotify: { snooze: {}, silence: {}, unsnooze: {}, clear_snoozes: {}, enquire_snoozes: {} } },
  callService: async (d, s, data) => { calls.push([d, s, data]); },
  callApi: async () => {},
  callWS: async (m) => (m.service === "enquire_snoozes" ? { response: { snoozes } } : { response: {} }),
};

const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ dnd_entity: "input_boolean.dnd", occupancy: false,
  tiles: ["dnd", "snooze", { toggle: "input_boolean.voice", name: "Voice", icon: "mdi:account-voice" }] });
document.body.appendChild(ctl);
ctl.hass = hass;
await wait(60);
const sr = ctl.shadowRoot;
const tiles = () => [...sr.querySelectorAll(".ctile")];
const dnd = () => tiles()[0];
const snz = () => tiles()[1];
const voice = () => tiles()[2];
const sevOf = (el) => (el.classList.contains("crit") ? "crit" : el.classList.contains("warn") ? "warn" : "ok");
const head = () => sr.getElementById("head");
const set = async (patch) => { Object.assign(hass, patch); ctl.hass = { ...hass }; await wait(20); };
const setSnz = async (list) => { snoozes = list; G.snEnquireBust(); ctl._snoozesRaw = null; await ctl._refreshSnoozes(); await wait(10); };
const later = (ms) => new Date(Date.now() + ms).toISOString();
const now = () => new Date().toISOString();

// --- switches: role="switch" + aria-checked; the pause tile stays a button that opens a panel
ok(dnd().getAttribute("role") === "switch" && dnd().getAttribute("aria-checked") === "false", "DND: role switch, aria-checked false");
ok(voice().getAttribute("role") === "switch" && voice().getAttribute("aria-checked") === "true", "interruttore Voice: role switch, aria-checked true");
ok(snz().getAttribute("role") === "button" && snz().hasAttribute("aria-expanded") && !snz().hasAttribute("aria-checked"),
  "tile pausa: resta un pulsante con aria-expanded");
ok(voice().classList.contains("on"), "interruttore acceso: resta blu (on)");

// --- do not disturb on: orange like the head, not blue
await set({ states: { ...hass.states, "input_boolean.dnd": S("on", { friendly_name: "Do not disturb" }) } });
ok(sevOf(dnd()) === "warn" && !dnd().classList.contains("on"), `DND acceso: arancione, non blu (${dnd().className})`);
ok(dnd().getAttribute("aria-checked") === "true", "DND acceso: aria-checked true");
ok(sevOf(head()) === "warn", "DND acceso: testata e tile con la stessa gravità");
await set({ states: { ...hass.states, "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }) } });
ok(sevOf(dnd()) === "ok" && dnd().getAttribute("aria-checked") === "false", "DND spento: neutra");

// --- keyboard on a switch: Space toggles it (and does not scroll)
calls.length = 0;
const ev = new dom.window.KeyboardEvent("keydown", { key: " ", cancelable: true });
voice().dispatchEvent(ev); await wait(20);
ok(ev.defaultPrevented && calls.some((c) => c[0] === "input_boolean" || c[0] === "homeassistant"), `Spazio sull'interruttore: lo commuta (${JSON.stringify(calls[0])})`);

// --- the pause tile follows what the pauses hold back
await setSnz([{ target_type: "DELIVERY", target: "alexa_announce", recipient_type: "EVERYONE", snooze_until: later(600e3), snoozed_at: now() }]);
ok(sevOf(snz()) === "ok" && /Paused/.test(txt(snz())), `pausa di un canale: tile neutra che dice la pausa (${snz().className} · ${txt(snz())})`);
ok(sevOf(head()) === "ok", "pausa di un canale: testata verde, stessa gravità");
await setSnz([{ target_type: "EVERYONE", recipient_type: "USER", recipient: "person.alex", snooze_until: later(600e3), snoozed_at: now() }]);
ok(sevOf(snz()) === "ok", "pausa di una persona: tile neutra");
await setSnz([{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: later(1800e3), snoozed_at: now() }]);
ok(sevOf(snz()) === "warn" && sevOf(head()) === "warn", "pausa delle non critiche per tutti: arancione, come la testata");
await setSnz([{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: later(3600e3), snoozed_at: now() }]);
ok(sevOf(snz()) === "crit" && sevOf(head()) === "crit", "tutto silenziato: rossa, come la testata");
// the most serious pause wins
await setSnz([{ target_type: "DELIVERY", target: "alexa_announce", recipient_type: "EVERYONE", snooze_until: later(600e3), snoozed_at: now() },
  { target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: later(600e3), snoozed_at: now() }]);
ok(sevOf(snz()) === "warn", "più pause: vince la più seria");
await setSnz([]);
ok(sevOf(snz()) === "ok" && sevOf(head()) === "ok", "nessuna pausa: neutra");

// --- the same in the dark theme: the classes do not depend on it, the colours come from the palette
await set({ themes: { darkMode: true } });
await setSnz([{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: later(3600e3), snoozed_at: now() }]);
ok(sevOf(snz()) === "crit" && /\.ctile\.crit \{ background: rgba\(255,154,154,\.12\)/.test(sr.innerHTML), "tema scuro: tile rossa con la tinta del tema scuro");

ctl.remove();
console.log(fail ? `FAIL ${fail}` : "tile_severity: all ok");
process.exit(fail ? 1 : 0);
