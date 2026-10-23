// 1.0.0 (audit, phase 2): `icons` sets the icon of a scenario of your own on the scenarios and simulator cards.
import { boot, load, ok, fail } from "./_harness.mjs";

boot({ url: "http://ha.local/x" });
const api = load("snScenarioIcon");

ok(api.snScenarioIcon({ icons: { dnd_globale: "🔕" } }, "dnd_globale") === "🔕", "icons: own scenario icon");
ok(api.snScenarioIcon({}, "xmas") === "🎄", "built-in icon kept");
ok(api.snScenarioIcon({ icons: { xmas: "⭐" } }, "xmas") === "⭐", "icons overrides the built-in one");
ok(api.snScenarioIcon(null, "dnd_globale") === "🎬", "unknown scenario without icons: 🎬");
process.exit(fail ? 1 : 0);
