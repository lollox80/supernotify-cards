// v0.87.0: strategy - vista Archivio propria, disattivabile da `views:`.
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
const hass = (language = "it") => ({ language, states: {}, user: { is_admin: true }, config: { version: "2026.10.1" } });
const gen = async (cfg, lang) => (await Strat.generate({ type: "custom:supernotify", ...cfg }, hass(lang))).views;
const kinds = (v) => JSON.stringify(v).match(/supernotify-\w+-card/g) || [];

let vs = await gen({});
ok(vs.map((v) => v.path).slice(0, 2).join() === "home,archive", "default: Archivio subito dopo Casa");
const av = vs.find((v) => v.path === "archive");
ok(av && av.title === "Archivio" && av.icon === "mdi:archive-outline", "titolo e icona");
ok(av.sections.length === 1 && av.sections[0].column_span === 2, "una sezione a tutta larghezza");
const ac = av.sections[0].cards[0];
ok(ac.type === "custom:supernotify-archive-card" && ac.pause_sender === true && ac.max_height === "calc(100vh - 300px)", "card archivio con i default della vista");
ok(!kinds(vs.find((v) => v.path === "home")).includes("supernotify-archive-card"), "Casa non ripete l'archivio");

vs = await gen({ views: ["home", "send", "setup", "stats"] });
ok(!vs.some((v) => v.path === "archive"), "views senza archive: niente vista");
const hc = vs.find((v) => v.path === "home").sections.flatMap((s) => s.cards).find((c) => c.type === "custom:supernotify-archive-card");
ok(hc && !hc.pause_sender && !hc.max_height, "views senza archive: archivio torna in Casa, senza i default della vista");

vs = await gen({ cards: { archive: { max_height: "60vh", pause_sender: false, limit: 30 } } });
const oc = vs.find((v) => v.path === "archive").sections[0].cards[0];
ok(oc.max_height === "60vh" && oc.pause_sender === false && oc.limit === 30, "cards.archive vince sui default");

vs = await gen({ hide: ["archive"] });
ok(!vs.some((v) => v.path === "archive") && !kinds(vs).includes("supernotify-archive-card"), "hide: [archive] toglie card e vista");

vs = await gen({ tabs: "emoji" });
ok(vs.find((v) => v.path === "archive").title === "🗂️ Archivio", "emoji");
vs = await gen({}, "de");
ok(vs.find((v) => v.path === "archive").title === "Archiv", "tradotto (de)");
vs = await gen({}, "en");
ok(vs.find((v) => v.path === "archive").title === "Archive", "inglese");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
