// CHANGELOG
// 2026-11-24 - control 0.43.0: the status line says notifications may not arrive (in red) when SuperNotify cannot be
//   counted on - it stopped answering for longer than a poll, it is not loaded (no supernotify actions) or its
//   counter is unavailable - instead of "normal" in green under the "not responding" alert. Every language has it.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
const G = load("snEnquireBust, SN_STRINGS, snPalette");

const S = (state, attributes = {}) => ({ state, attributes });
let wsDown = false;
const SN_SVC = { snooze: {}, silence: {}, unsnooze: {}, clear_snoozes: {}, enquire_snoozes: {} };
const hass = {
  language: "en", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  states: {
    "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }),
    "sensor.supernotify_notifications": S("12"),
  },
  services: { supernotify: SN_SVC, input_boolean: { turn_on: {} } },
  callService: async () => {},
  callApi: async () => {},
  callWS: async (m) => {
    if (wsDown) throw { code: "timeout", message: "timeout" };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    return { response: {} };
  },
};

const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ dnd_entity: "input_boolean.dnd", tiles: ["dnd", "snooze"], occupancy: false });
document.body.appendChild(ctl);
ctl.hass = hass;
await wait(60);
const sr = ctl.shadowRoot;
const bar = () => txt(sr.getElementById("statusbar"));
const alertEl = () => sr.getElementById("alert");
const notifSeg = () => [...sr.querySelectorAll("#statusbar .sseg")].find((s) => /Notifications|Notifiche/.test(txt(s)));
const crit = G.snPalette(false, "supernotify").crit;
const norm = (c) => { const d = document.createElement("div"); d.style.color = c; return d.style.color; };
const isCrit = () => { const v = notifSeg() && notifSeg().querySelector(".sv"); return !!v && norm(v.style.color) === norm(crit); };
const set = async (patch) => { Object.assign(hass, patch); ctl.hass = { ...hass }; await wait(20); };

ok(/Notifications ?normal/.test(bar()) && alertEl().hidden, `di base: normali, nessun avviso (${bar()})`);

// --- the counter unavailable: SuperNotify is there but not working
await set({ states: { ...hass.states, "sensor.supernotify_notifications": S("unavailable") } });
ok(/Notifications ?may not arrive/.test(bar()) && !/normal/.test(bar()), `contatore unavailable: potrebbero non arrivare (${bar()})`);
ok(isCrit(), "contatore unavailable: in rosso");
ok(!notifSeg().classList.contains("go"), "contatore unavailable: non apre il pannello pausa");
ok(!alertEl().hidden && alertEl().classList.contains("down") && /not responding/.test(txt(alertEl())),
  `contatore unavailable: l'avviso in cima dice perché (${txt(alertEl())})`);
await set({ states: { ...hass.states, "sensor.supernotify_notifications": S("13") } });
ok(/Notifications ?normal/.test(bar()) && alertEl().hidden, `contatore di nuovo disponibile: normali (${bar()})`);

// --- SuperNotify not loaded: its actions are gone from Home Assistant
await set({ services: { input_boolean: { turn_on: {} } } });
ok(/Notifications ?may not arrive/.test(bar()) && isCrit(), `SuperNotify non caricato: potrebbero non arrivare (${bar()})`);
await set({ services: { supernotify: SN_SVC, input_boolean: { turn_on: {} } } });
ok(/Notifications ?normal/.test(bar()), `SuperNotify di nuovo caricato: normali (${bar()})`);
// no services list yet (first hass of some frontends): not taken as "not loaded"
await set({ services: {} });
ok(/Notifications ?normal/.test(bar()), `elenco azioni vuoto: non è un guasto (${bar()})`);
await set({ services: { supernotify: SN_SVC, input_boolean: { turn_on: {} } } });

// --- not answering for longer than a poll: the status line follows the alert, both ways
wsDown = true;
G.snEnquireBust(); ctl._failSince = Date.now() - 60000;
await ctl._refreshSnoozes(); await wait(10);
ok(/Notifications ?may not arrive/.test(bar()) && isCrit() && !alertEl().hidden, `non risponde: riga e avviso insieme (${bar()})`);
// a failed poll shorter than that says nothing yet
wsDown = false;
G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);
ok(/Notifications ?normal/.test(bar()) && alertEl().hidden, `risponde di nuovo: normali, avviso tolto (${bar()})`);
wsDown = true; ctl._failSince = 0;
G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);
ok(/Notifications ?normal/.test(bar()), "un solo giro fallito: ancora normali");
wsDown = false; G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);

// --- it comes before every other state: do not disturb on and SuperNotify down -> may not arrive
await set({ states: { ...hass.states, "input_boolean.dnd": S("on"), "sensor.supernotify_notifications": S("unavailable") } });
ok(/Notifications ?may not arrive/.test(bar()), `prima di non disturbare (${bar()})`);

// --- a card with neither DND nor the pause tile still says it
const bare = document.createElement("supernotify-control-card");
bare.setConfig({ tiles: [], occupancy: false });
document.body.appendChild(bare);
bare.hass = { ...hass }; await wait(40);
ok(/Notifications ?may not arrive/.test(txt(bare.shadowRoot.getElementById("statusbar"))), "card senza DND né pausa: lo dice lo stesso");
bare.remove();

// --- Italian, and every language has its own words
await set({ language: "it" });
ok(/Notifiche ?potrebbero non arrivare/.test(bar()), `italiano: ${bar()}`);
const langs = Object.keys(G.SN_STRINGS);
const missing = langs.filter((l) => !G.SN_STRINGS[l].st_unreach || (l !== "en" && G.SN_STRINGS[l].st_unreach === G.SN_STRINGS.en.st_unreach));
ok(langs.length >= 11 && !missing.length, `st_unreach tradotto in ${langs.length} lingue (mancano: ${missing.join(", ") || "nessuna"})`);

ctl.remove();
console.log(fail ? `FAIL ${fail}` : "status_down: all ok");
process.exit(fail ? 1 : 0);
