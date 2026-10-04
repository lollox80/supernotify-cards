// CHANGELOG
// 2026-10-05 v0.76.0: "mentre eri in pausa" - notifiche trattenute dalla pausa, dall'archivio.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
let snoozes = [];
const asks = [];
const ARCH = [
  { id: "1", created: ago(300), title: "Movimento ingresso", suppressed: "SNOOZED", deliveries: { mobile_push: { skipped: "SNOOZED" } } },
  { id: "2", created: ago(250), title: "Movimento ingresso", suppressed: "SNOOZED", deliveries: {} },
  { id: "3", created: ago(200), title: "Lavatrice finita", deliveries: { mobile_push: { delivered: 1 }, alexa_announce: { skipped: "SNOOZED" } } },
  { id: "4", created: ago(100), title: "Porta", deliveries: { mobile_push: { delivered: 1 } } },
];
const hass = { language: "it", themes: { darkMode: false }, entities: {}, states: {}, user: { id: "u", is_admin: true },
  services: { supernotify: { enquire_archive: {}, enquire_snoozes: {} } }, callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_snoozes") return { response: { snoozes } };
    if (m.service === "enquire_archive") { asks.push(m.service_data); return { response: { notifications: ARCH } }; }
    return { response: {} };
  } };
dom.window.localStorage.clear();
const mk = (cfg) => { const el = document.createElement("supernotify-control-card"); el.setConfig(cfg); document.body.appendChild(el); el.hass = hass; return el; };
const c = mk({ tiles: ["snooze"], occupancy: false });
await wait(150);
const cu = c.shadowRoot.getElementById("cu");
const txt = cu.textContent.replace(/\s+/g, " ");
ok(!cu.hidden && /3 trattenute/.test(txt) && /1 solo su alcuni canali/.test(txt), `riepilogo (${txt.slice(0, 120)})`);
ok(/2× Movimento ingresso/.test(txt) && !/Porta/.test(txt), "raggruppate per titolo, senza quelle consegnate");
ok(asks[0].verbosity === "summary" && Date.parse(asks[0].after) >= Date.now() - 86400000 - 5000, "archivio summary, ultime 24 h");
cu.querySelector("#cuOk").click();
ok(cu.hidden && +dom.window.localStorage.getItem("supernotify-catchup-seen") > 0, "OK lo nasconde e ricorda quando");

// card senza riquadro pausa: niente
asks.length = 0;
const c2 = mk({ tiles: [], occupancy: false });
await wait(100);
ok(!asks.length && c2.shadowRoot.getElementById("cu").hidden, "senza riquadro pausa non chiede niente");
// catch_up: false
const c3 = mk({ tiles: ["snooze"], occupancy: false, catch_up: false });
await wait(100);
ok(!asks.length, "catch_up: false");

// durante una pausa niente; quando finisce, di nuovo
dom.window.localStorage.clear();
asks.length = 0;
snoozes = [{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 3600000).toISOString(), snoozed_at: new Date().toISOString() }];
await wait(2700); // the shared enquire cache keeps a reply 2.5 s
asks.length = 0;
const c4 = mk({ tiles: ["snooze"], occupancy: false });
await wait(100);
ok(!asks.length && c4.shadowRoot.getElementById("cu").hidden, "pausa in corso: niente riepilogo");
snoozes = [];
await c4._catchUp([]);
ok(asks.length === 1 && !c4.shadowRoot.getElementById("cu").hidden, "pausa finita: riepilogo");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
