// v0.84.0: schede delle viste della strategy - icona + nome, emoji, solo testo.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/lovelace/0" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const G = new dom.window.Function(SRC + "\nreturn {};")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const Strat = customElements.get("ll-strategy-dashboard-supernotify");
const hass = (version) => ({ language: "it", states: {}, user: { is_admin: true }, config: { version } });
const tabs = async (cfg, v) => (await Strat.generate({ type: "custom:supernotify", ...cfg }, hass(v))).views;

let vs = await tabs({}, "2026.10.1");
ok(vs.every((v) => /^mdi:/.test(v.icon) && v.show_icon_and_title === true), "default: icona mdi + nome");
ok(vs.find((v) => v.path === "home").title === "Casa", "default: titolo senza emoji");
vs = await tabs({}, "2026.1.3");
ok(vs.every((v) => !v.icon && !v.show_icon_and_title), "HA prima della 2026.2: solo nome, mai icona da sola");
vs = await tabs({ tabs: "emoji" }, "2026.10.1");
ok(vs.every((v) => !v.icon) && vs.find((v) => v.path === "stats").title === "📊 Statistiche", "emoji: emoji davanti al nome");
vs = await tabs({ tabs: "text" }, "2026.10.1");
ok(vs.every((v) => !v.icon && !/^\W/.test(v.title)), "text: solo nome");
vs = await tabs({ icons: { home: "mdi:home", stats: "📈" } }, "2026.10.1");
ok(vs.find((v) => v.path === "home").icon === "mdi:home", "icons: mdi per una vista");
const sv = vs.find((v) => v.path === "stats");
ok(!sv.icon && sv.title === "📈 Statistiche", "icons: emoji per una vista");
ok(vs.find((v) => v.path === "send").icon === "mdi:send", "icons: le altre restano col default");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
