// CHANGELOG
// 2026-11-25 - control 0.47.0: the pause tile no longer takes four narrow lines. "Paused" / the time left on one
//   line / what is paused; the end time only when the head does not already say it (status: false, a pause of a
//   part). Seen on a real tablet: "Paused · 15 min / until 01:15 / non-critical" wrapped on four lines.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
const G = load("snEnquireBust");

const S = (state, attributes = {}) => ({ state, attributes });
let snoozes = [];
const hass = {
  language: "en", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  states: {
    "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }),
    "sensor.supernotify_notifications": S("3"),
  },
  services: { supernotify: { snooze: {}, silence: {}, unsnooze: {}, clear_snoozes: {}, enquire_snoozes: {} } },
  callService: async () => {},
  callApi: async () => {},
  callWS: async (m) => (m.service === "enquire_snoozes" ? { response: { snoozes } } : { response: {} }),
};

const make = async (cfg) => {
  const el = document.createElement("supernotify-control-card");
  el.setConfig({ dnd_entity: "input_boolean.dnd", tiles: ["dnd", "snooze"], occupancy: false, ...cfg });
  document.body.appendChild(el);
  el.hass = hass;
  await wait(60);
  return el;
};
const later = (ms) => new Date(Date.now() + ms).toISOString();
const now = () => new Date().toISOString();
const setSnz = async (el, list) => { snoozes = list; G.snEnquireBust(); el._snoozesRaw = null; await el._refreshSnoozes(); await wait(10); };
const tile = (el) => [...el.shadowRoot.querySelectorAll(".ctile")].find((t) => t.hasAttribute("aria-expanded"));
const lines = (el) => tile(el).querySelector(".ts").innerHTML.split("<br>").map((l) => l.replace(/<[^>]+>/g, "").replace(/&nbsp;| /g, " ").trim());
const name = (el) => txt(tile(el).querySelector("b"));
const head = (el) => txt(el.shadowRoot.getElementById("head"));
const NC = (ms) => ({ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: later(ms), snoozed_at: now() });

// --- non-critical for everyone, with the head: Paused / 15 min / what - the end time is in the head only
const ctl = await make({});
await setSnz(ctl, [NC(15 * 60e3)]);
const l1 = lines(ctl);
ok(name(ctl) === "Paused", `titolo corto: «${name(ctl)}»`);
ok(/^1[45] min$/.test(l1[0]), `seconda riga: il tempo rimasto da solo (${JSON.stringify(l1)})`);
ok(tile(ctl).querySelector(".ts .nw") && /^1[45] min$/.test(tile(ctl).querySelector(".ts .nw").textContent), "il tempo rimasto non va a capo (span .nw, spazio unificatore)");
ok(l1.length === 2 && !l1.some((l) => /^until /.test(l)), `niente «until …»: lo dice la testata (${JSON.stringify(l1)})`);
ok(/until \d/.test(head(ctl)), `la testata dice l'ora di fine (${head(ctl)})`);
ok(/white-space: nowrap/.test(ctl.shadowRoot.querySelector("style").textContent.match(/\.ctile \.ts \.nw \{[^}]*\}/)[0]), "CSS: .nw su una riga");
// a longer pause: hours and minutes still on one line
await setSnz(ctl, [NC(90 * 60e3)]);
ok(/^1 h 30 min$|^1 h 29 min$/.test(lines(ctl)[0]), `1 h 30 min su una riga (${lines(ctl)[0]})`);
ctl.remove();

// --- the head is hidden (status: false): the tile keeps the end time
const ctl2 = await make({ status: false });
await setSnz(ctl2, [NC(15 * 60e3)]);
const l2 = lines(ctl2);
ok(l2.length === 3 && /^until \d/.test(l2[1]), `senza testata: l'ora resta nella tile (${JSON.stringify(l2)})`);
ctl2.remove();

// --- a pause of a part: the head says "1 pause: …" without the end, so the tile keeps it
const ctl3 = await make({});
await setSnz(ctl3, [{ target_type: "DELIVERY", target: "alexa_announce", recipient_type: "EVERYONE", snooze_until: later(600e3), snoozed_at: now() }]);
const l3 = lines(ctl3);
ok(!/until \d/.test(head(ctl3)) && l3.some((l) => /^until \d/.test(l)), `pausa di una parte: l'ora nella tile (${JSON.stringify(l3)} · ${head(ctl3)})`);
// until resumed: no time left, no end time
await setSnz(ctl3, [{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snoozed_at: now() }]);
const l4 = lines(ctl3);
ok(name(ctl3) === "Paused" && !tile(ctl3).querySelector(".ts .nw") && !l4.some((l) => /^until \d/.test(l)), `finché non riprendo: niente durata né ora (${JSON.stringify(l4)})`);
ctl3.remove();

console.log(fail ? `FAIL ${fail}` : "pause_tile: all ok");
process.exit(fail ? 1 : 0);
