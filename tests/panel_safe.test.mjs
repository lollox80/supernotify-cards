// CHANGELOG
// 2026-11-24 - control 0.46.0: the pause panel is safe to hand to anyone. Every opening starts from non-critical and
//   the configured length (a pause of everything / until resumed stayed selected and the next person found the red
//   button ready); a pause that worked closes the panel and the head says the new state (the toast at the bottom of
//   the card was off screen with the panel open); a failure is said in the panel, by the button, and the choice
//   stays; on a touch screen the controls of the panel and the announce box are at least 44 px; the announce box
//   has a name for screen readers.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
load("");

const S = (state, attributes = {}) => ({ state, attributes });
const calls = [];
let snzError = null;
const hass = {
  language: "en", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  states: {
    "input_boolean.dnd": S("off", { friendly_name: "Do not disturb" }),
    "sensor.supernotify_notifications": S("3"),
  },
  services: { supernotify: { snooze: {}, silence: {}, unsnooze: {}, clear_snoozes: {}, enquire_snoozes: {} } },
  callService: async (d, s, data) => { calls.push([d, s, data]); if (snzError && d === "supernotify") throw snzError; },
  callApi: async () => {},
  callWS: async (m) => {
    if (m.domain === "supernotify" && ["snooze", "silence", "unsnooze"].includes(m.service)) {
      calls.push(["ws", m.service, m.service_data]);
      if (snzError) throw snzError;
    }
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    return { response: {} };
  },
};

const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ dnd_entity: "input_boolean.dnd", tiles: ["dnd", "snooze", "announce"], occupancy: false, snooze_minutes: 60 });
document.body.appendChild(ctl);
ctl.hass = hass;
await wait(60);
const sr = ctl.shadowRoot;
const panel = () => sr.getElementById("snzp");
const snzTile = () => [...sr.querySelectorAll(".ctile")].find((t) => t.hasAttribute("aria-expanded"));
const open = async () => { snzTile().click(); await wait(10); };
const pick = (g, v) => sr.querySelector(`.sc[data-g="${g}"][data-v="${v}"]`).click();
const onChip = (g) => { const c = sr.querySelector(`.sc.on[data-g="${g}"]`); return c && c.dataset.v; };
const go = () => sr.getElementById("snzGo");
const toast = () => sr.getElementById("toast");

// --- every opening starts from the safe choice
await open();
ok(!panel().hidden && onChip("what") === "NONCRITICAL" && onChip("min") === "60", `prima apertura: non critiche, durata configurata (${onChip("what")}, ${onChip("min")})`);
pick("what", "EVERYTHING"); pick("min", 0);
ok(go().classList.contains("crit"), "scelta rischiosa: pulsante rosso");
sr.getElementById("snzX").click(); await wait(10);
ok(panel().hidden, "chiuso con ✕");
await open();
ok(onChip("what") === "NONCRITICAL" && onChip("min") === "60" && !go().classList.contains("crit") && !sr.querySelector(".swarn"),
  `riaperto: di nuovo non critiche e ${onChip("min")} min, niente rosso pronto`);
// Esc and the tile close it the same way
pick("what", "EVERYTHING");
panel().dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait(10);
await open();
ok(onChip("what") === "NONCRITICAL", "riaperto dopo Esc: non critiche");
// a redraw while it is open keeps the choice (only an opening resets it)
pick("min", 15);
ctl.hass = { ...hass }; await wait(20);
ok(!panel().hidden && onChip("min") === "15", "aggiornamento a pannello aperto: la scelta resta");

// --- a pause that worked: the panel closes, the head is the confirmation, the focus goes back to the tile
calls.length = 0;
go().click(); await wait(30);
const sn = calls.find((c) => c[1] === "snooze");
ok(sn && sn[2].minutes === 15, `pausa inviata (${JSON.stringify(sn && sn[2])})`);
ok(panel().hidden && snzTile().getAttribute("aria-expanded") === "false", "riuscita: il pannello si chiude");
ok(sr.activeElement === snzTile(), "riuscita: il focus torna sulla tile pausa");

// --- a pause that failed: said in the panel, by the button; the panel and the choice stay
await open();
pick("min", 120);
snzError = { code: "unauthorized", message: "Unauthorized" };
const toastBefore = txt(toast());
go().click(); await wait(30);
const err = sr.querySelector("#snzp .serr");
ok(!panel().hidden && !!err && err.getAttribute("role") === "alert", "fallita: il pannello resta aperto con l'errore (role=alert)");
ok(/not allowed/i.test(txt(err)) && !/Unauthorized/.test(txt(err)), `fallita: errore in parole (${txt(err)})`);
ok(err.nextElementSibling && err.nextElementSibling.querySelector("#snzGo"), "l'errore sta subito sopra il pulsante");
ok(onChip("min") === "120", "fallita: la scelta resta per riprovare");
ok(!toast().classList.contains("err") || txt(toast()) === toastBefore, "fallita: niente toast rosso in fondo alla card");
// a new choice clears the error; a retry that works closes the panel
pick("min", 30);
ok(!sr.querySelector("#snzp .serr"), "nuova scelta: l'errore sparisce");
snzError = null;
go().click(); await wait(30);
ok(panel().hidden, "riprova riuscita: il pannello si chiude");

// --- "everything" still asks twice, and a confirmed pause closes the panel too
await open();
pick("what", "EVERYTHING");
calls.length = 0;
go().click(); await wait(10);
ok(!calls.some((c) => c[1] === "snooze") && /Tap again/.test(txt(go())), "tutto: il primo tocco chiede conferma");
go().click(); await wait(30);
ok(calls.some((c) => c[1] === "snooze" && c[2].scope === "everything") && panel().hidden, "tutto confermato: pausa e pannello chiuso");

// --- touch targets and names
const css = sr.querySelector("style").textContent;
ok(/@media \(pointer: coarse\) \{[^}]*\.snzp \.sc, \.snzp \.sb, \.snzp \.sp \{ min-height: 44px; \}/.test(css), "touch: chip, Riprendi e pulsante principale a 44 px");
ok(/\.snzp \.sx \{ min-width: 44px; min-height: 44px; \}/.test(css) && /\.announce input, \.announce button \{ min-height: 44px;/.test(css), "touch: ✕ e casella dell'annuncio a 44 px");
ok(sr.getElementById("announceInput").getAttribute("aria-label") === "Announce", "casella dell'annuncio con un nome per lo screen reader");

ctl.remove();
console.log(fail ? `FAIL ${fail}` : "panel_safe: all ok");
process.exit(fail ? 1 : 0);
