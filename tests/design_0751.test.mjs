// CHANGELOG
// 2026-10-05 v0.75.1: SuperNotify 2.13.0 - snooze, silence e unsnooze come tre azioni, senza command.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const G = new dom.window.Function(SRC + "\nreturn { snNativePause };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const S = (state, attributes = {}) => ({ state, attributes });
const calls = [];
const states = {
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push" }),
  "person.lorenzo": S("home", { user_id: "u1" }),
};
const hass = { language: "it", themes: { darkMode: false }, entities: {}, states, user: { id: "u1", is_admin: false },
  services: { supernotify: { snooze: {}, silence: {}, unsnooze: {}, clear_snoozes: {}, enquire_archive: {} } },
  callService: async () => {}, callApi: async (m, p, d) => { calls.push(["api", p, d]); },
  callWS: async (m) => { if (m.domain === "supernotify" && ["snooze", "silence", "unsnooze"].includes(m.service)) calls.push([m.service, m.service_data]); return { response: { snoozes: [] } }; } };
const last = (svc) => (calls.filter((c) => c[0] === svc).pop() || [])[1];

await G.snNativePause(hass, 60);
const a = last("snooze");
ok(a && a.minutes === 60 && a.scope === "noncritical" && !("command" in a), `feature: snooze senza command (${JSON.stringify(a)})`);

const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ tiles: ["snooze"], occupancy: false });
document.body.appendChild(ctl); ctl.hass = hass;
await wait(50);
ctl._snzOpen = true; ctl._renderSnz();
const sr = ctl.shadowRoot;
sr.querySelector('.sc[data-g="min"][data-v="0"]').click();
sr.querySelector("#snzGo").click(); await wait(30);
const b = last("silence");
ok(b && !("minutes" in b) && !("command" in b) && b.reason === "Dashboard", `pannello: silence (${JSON.stringify(b)})`);
ctl._snoozes = [{ target_type: "DELIVERY", target: "mobile_push", recipient_type: "USER", recipient: "person.lorenzo",
  snooze_until: new Date(Date.now() + 3600000).toISOString(), snoozed_at: new Date().toISOString() }];
ctl._renderSnz();
sr.querySelector(".sb[data-r]").click(); await wait(30);
const c = last("unsnooze");
ok(c && c.scope === "delivery" && c.name === "mobile_push" && c.person === "person.lorenzo" && !("reason" in c) && !("command" in c),
  `Riprendi: unsnooze (${JSON.stringify(c)})`);
ok(!calls.some((x) => x[0] === "api"), "nessun evento da admin");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
