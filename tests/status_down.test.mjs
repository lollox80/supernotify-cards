// CHANGELOG
// 2026-11-24 - control 0.43.0: the status line says notifications may not arrive (in red) when SuperNotify cannot be
//   counted on - it stopped answering for longer than a poll, it is not loaded (no supernotify actions) or its
//   counter is unavailable - instead of "normal" in green under the "not responding" alert. Every language has it.
// 2026-11-24 - control 0.44.0: the state lives in the head of the card (sentence, severity, Retry), not in the status row.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
const G = load("snEnquireBust, SN_STRINGS");

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
const head = () => sr.getElementById("head");
const bar = () => txt(head());
const isCrit = () => head().classList.contains("crit");
const down = () => /may not arrive|potrebbero non arrivare/.test(bar()) && /not responding|non risponde/.test(bar());
const set = async (patch) => { Object.assign(hass, patch); ctl.hass = { ...hass }; await wait(20); };

ok(/getting through/.test(bar()) && !isCrit(), `di base: arrivano (${bar()})`);

// --- the counter unavailable: SuperNotify is there but not working
await set({ states: { ...hass.states, "sensor.supernotify_notifications": S("unavailable") } });
ok(down() && !/getting through/.test(bar()), `contatore unavailable: potrebbero non arrivare, e perché (${bar()})`);
ok(isCrit(), "contatore unavailable: in rosso");
ok(/Retry/.test(txt(head().querySelector("button"))), "contatore unavailable: Riprova");
await set({ states: { ...hass.states, "sensor.supernotify_notifications": S("13") } });
ok(/getting through/.test(bar()) && !isCrit() && !head().querySelector("button"), `contatore di nuovo disponibile: arrivano (${bar()})`);

// --- SuperNotify not loaded: its actions are gone from Home Assistant
await set({ services: { input_boolean: { turn_on: {} } } });
ok(down() && isCrit(), `SuperNotify non caricato: potrebbero non arrivare (${bar()})`);
await set({ services: { supernotify: SN_SVC, input_boolean: { turn_on: {} } } });
ok(/getting through/.test(bar()), `SuperNotify di nuovo caricato: arrivano (${bar()})`);
// no services list yet (first hass of some frontends): not taken as "not loaded"
await set({ services: {} });
ok(/getting through/.test(bar()), `elenco azioni vuoto: non è un guasto (${bar()})`);
await set({ services: { supernotify: SN_SVC, input_boolean: { turn_on: {} } } });

// --- not answering for longer than a poll: the status line follows the alert, both ways
wsDown = true;
G.snEnquireBust(); ctl._failSince = Date.now() - 60000;
await ctl._refreshSnoozes(); await wait(10);
ok(down() && isCrit(), `non risponde: potrebbero non arrivare (${bar()})`);
// a failed poll shorter than that says nothing yet
wsDown = false;
G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);
ok(/getting through/.test(bar()) && !isCrit(), `risponde di nuovo: arrivano (${bar()})`);
wsDown = true; ctl._failSince = 0;
G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);
ok(/getting through/.test(bar()), "un solo giro fallito: ancora arrivano");
wsDown = false; G.snEnquireBust(); await ctl._refreshSnoozes(); await wait(10);

// --- it comes before every other state: do not disturb on and SuperNotify down -> may not arrive
await set({ states: { ...hass.states, "input_boolean.dnd": S("on"), "sensor.supernotify_notifications": S("unavailable") } });
ok(down(), `prima di non disturbare (${bar()})`);

// --- a card with neither DND nor the pause tile still says it
const bare = document.createElement("supernotify-control-card");
bare.setConfig({ tiles: [], occupancy: false });
document.body.appendChild(bare);
bare.hass = { ...hass }; await wait(40);
ok(/may not arrive/.test(txt(bare.shadowRoot.getElementById("head"))), "card senza DND né pausa: lo dice lo stesso");
bare.remove();

// --- Italian, and every language has its own words
await set({ language: "it" });
ok(/Le notifiche potrebbero non arrivare/.test(bar()) && /Il sistema delle notifiche non risponde/.test(bar()), `italiano: ${bar()}`);
const langs = Object.keys(G.SN_STRINGS);
const missing = langs.filter((l) => !G.SN_STRINGS[l].st_unreach || (l !== "en" && G.SN_STRINGS[l].st_unreach === G.SN_STRINGS.en.st_unreach));
ok(langs.length >= 11 && !missing.length, `st_unreach tradotto in ${langs.length} lingue (mancano: ${missing.join(", ") || "nessuna"})`);
const HD = ["hd_ok", "hd_down", "hd_down_why", "hd_all", "hd_all_sub", "hd_paused", "hd_paused_sub", "hd_dnd", "hd_quiet"];
const hdMissing = langs.flatMap((l) => HD.filter((k) => !G.SN_STRINGS[l][k] || (l !== "en" && G.SN_STRINGS[l][k] === G.SN_STRINGS.en[k])).map((k) => l + "." + k));
ok(!hdMissing.length, `frasi della testata tradotte in ${langs.length} lingue (mancano: ${hdMissing.join(", ") || "nessuna"})`);

ctl.remove();
console.log(fail ? `FAIL ${fail}` : "status_down: all ok");
process.exit(fail ? 1 : 0);
