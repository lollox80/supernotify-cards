// 1.0.0 (audit, phase 2): `icons` sets the icon of a scenario of your own on the scenarios and simulator cards.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync(process.env.SN_SRC || "dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
const api = new dom.window.Function(SRC + "\nreturn { snScenarioIcon };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

ok(api.snScenarioIcon({ icons: { dnd_globale: "🔕" } }, "dnd_globale") === "🔕", "icons: own scenario icon");
ok(api.snScenarioIcon({}, "xmas") === "🎄", "built-in icon kept");
ok(api.snScenarioIcon({ icons: { xmas: "⭐" } }, "xmas") === "⭐", "icons overrides the built-in one");
ok(api.snScenarioIcon(null, "dnd_globale") === "🎬", "unknown scenario without icons: 🎬");
process.exit(fail ? 1 : 0);
