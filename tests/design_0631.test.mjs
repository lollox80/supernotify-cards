// CHANGELOG
// 2026-10-04 v0.63.1: snooze_announce - la pausa detta a voce, prima di metterla e dopo averla tolta.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const mk = (admin) => ({
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: admin },
  services: { supernotify: {} },
  states: { "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo", user_id: "u1" } },
    "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { name: "alexa_announce", friendly_name: "SuperNotify Delivery Annuncio Alexa abilitata" } } },
  callService: async (d, s, data) => { log.push(["say", data.message, data.data]); },
  callApi: async (m, p, body) => { log.push(["event", body.action]); return {}; },
  callWS: async (m) => {
    if (m.type === "conversation/process") { log.push(["voice", m.text]); return { response: { response_type: "action_done", speech: { plain: { speech: "ok" } } } }; }
    if (m.service === "clear_snoozes") { log.push(["clear"]); return { response: { cleared: 1 } }; }
    if (m.service === "enquire_snoozes") return { response: { snoozes: [{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: null }] } };
    return { response: {} };
  },
});
const mount = (cfg, hass) => { const c = document.createElement("supernotify-control-card"); c.setConfig({ tiles: ["snooze"], ...cfg }); c.hass = hass; document.body.appendChild(c); return c; };
const open = async (c) => { c.shadowRoot.querySelector(".ctile").click(); await wait(10); return c.shadowRoot.getElementById("snzp"); };

// off by default: nothing said
let c = mount({}, mk(true)); await wait(30);
let p = await open(c);
p.querySelector("#snzGo").click(); await wait(20);
ok(!log.some((x) => x[0] === "say") && log.some((x) => x[0] === "event"), "spento (predefinito): la pausa parte e nessun annuncio");
log.length = 0;

// on: announced before the event, on the announce channel
c = mount({ snooze_announce: true, announce_delivery: "alexa_announce" }, mk(true)); await wait(30);
p = await open(c);
p.querySelector('.sc[data-g="min"][data-v="60"]').click(); await wait(5);
c.shadowRoot.getElementById("snzGo").click(); await wait(20);
ok(log[0] && log[0][0] === "say" && log[0][1] === "Le notifiche non critiche in pausa per un'ora." && log[1] && log[1][0] === "event",
  `acceso: annuncio PRIMA della pausa (${JSON.stringify(log.slice(0, 2))})`);
ok(log[0][2].delivery_selection === "fixed" && "alexa_announce" in log[0][2].delivery, "annuncio sul canale annunci");
log.length = 0;
c.shadowRoot.getElementById("snzAll").click(); await wait(20);
ok(log[0] && log[0][0] === "clear" && log[1] && log[1][1] === "Notifiche di nuovo attive.", "riprendi tutto: annuncio DOPO");
log.length = 0;
c.shadowRoot.querySelector(".sb[data-r]").click(); await wait(20);
ok(log[0] && log[0][0] === "event" && /NORMAL/.test(log[0][1]) && log[1] && /^Pausa finita: /.test(log[1][1]), "riprendi una: annuncio dopo");
log.length = 0;

// non admin, by voice
c = mount({ snooze_announce: true }, mk(false)); await wait(30);
p = await open(c);
p.querySelector('.sc[data-g="min"][data-v="30"]').click(); await wait(5);
c.shadowRoot.getElementById("snzGo").click(); await wait(20);
ok(log[0] && log[0][1] === "Le tue notifiche in pausa per 30 minuti." && log[1] && log[1][0] === "voice", "non admin: annuncio prima del comando vocale");
log.length = 0;
c.shadowRoot.getElementById("snzMine").click(); await wait(20);
ok(log[0] && log[0][0] === "voice" && log[1] && log[1][1] === "Le tue notifiche di nuovo attive.", "non admin: riprendi le mie, annuncio dopo");

const form = customElements.get("supernotify-control-card").getConfigForm();
ok(form.schema.some((x) => x.name === "snooze_announce" && x.default === false), "editor: interruttore snooze_announce, spento");
console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
