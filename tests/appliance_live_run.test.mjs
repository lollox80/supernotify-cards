// appliances 0.2.23: a cycle under way starts at its own first "live", not at one of a cycle before whose
// end never reached the archive. A washer: last night's "live" rows (21:08, 21:40) with no end, then tonight's
// cycle started at 22:33 (live rows 22:33, 22:50): the card said "started 21:08", 25 h 50 min.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const { snAppl, snApplState, snApplRunBreak } = new dom.window.Function(SRC + "\nreturn { snAppl, snApplState, snApplRunBreak };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const MIN = 60000, H = 3600000;
const NOW = Date.parse("2026-10-21T20:59:00Z");            // 22:59 local
const at = (iso) => Date.parse(iso);
const iso = (t) => new Date(t).toISOString();

const ap = { id: "washer1", name: "Washer", kind: "power", power: "sensor.washer_power", switch: "switch.washer",
  threshold: 5, grace: 120000, minDur: 60000 };
const hass = { states: {
  "sensor.washer_power": { state: "2101", attributes: { unit_of_measurement: "W" }, last_changed: iso(NOW - 2 * MIN) },
  "switch.washer": { state: "on", attributes: {}, last_changed: iso(NOW - 48 * H) },
} };
const tonight = at("2026-10-21T20:33:00Z"), tonight2 = at("2026-10-21T20:50:00Z");
const lastNight = at("2026-10-20T19:08:00Z"), lastNight2 = at("2026-10-20T19:40:00Z");
const lastEnd = at("2026-10-20T20:28:00Z");
const cy = { loading: false, bins: [], done: [{ start: lastNight, end: lastEnd, kwh: 0.9 }], current: { start: at("2026-10-21T20:30:00Z") } };
const lives = [{ t: tonight2, kind: "live" }, { t: tonight, kind: "live" }, { t: lastNight2, kind: "live" }, { t: lastNight, kind: "live" }];

// 1. the statistics saw last night's cycle end: since = tonight's first live
snAppl.events.set(ap.id, lives);
let s = snApplState(hass, ap, NOW, cy);
ok(s.status === "running", `running (got ${s.status})`);
ok(s.since === tonight, `since tonight 22:33 (got ${s.since && iso(s.since)})`);

// 2. no statistics: the 24 h gap alone cuts the run
s = snApplState(hass, ap, NOW, null);
ok(s.since === tonight, `no statistics, 24 h gap -> since 22:33 (got ${s.since && iso(s.since)})`);

// 3. one cycle with several live rows (no end between, under 12 h apart): since = its first one
snAppl.events.set(ap.id, [{ t: NOW - 5 * MIN, kind: "live" }, { t: NOW - 40 * MIN, kind: "live" }, { t: NOW - 90 * MIN, kind: "live" },
  { t: NOW - 30 * H, kind: "clear" }]);
s = snApplState(hass, ap, NOW, { loading: false, bins: [], done: [], current: { start: NOW - 90 * MIN } });
ok(s.since === NOW - 90 * MIN, `one cycle, three lives -> since its first (got ${s.since && iso(s.since)})`);

// 4. a long cycle with live rows 5 h apart is not cut
ok(snApplRunBreak(NOW - 6 * H, NOW - 1 * H, { done: [] }) === false, "5 h apart, no end between -> same cycle");
ok(snApplRunBreak(NOW - 13 * H, NOW - 30 * MIN, null) === true, "12.5 h apart -> different cycles");
ok(snApplRunBreak(tonight - 20 * MIN, tonight2, cy) === false, "a pause the statistics cut a cycle at, under 12 h -> same cycle (0.2.24)");
ok(snApplRunBreak(tonight, tonight2, cy) === false, "tonight's two lives -> same cycle");

// 5. 0.2.24: the statistics cut the wash at a pause (a cycle ended at 23:20, one under way since 00:00):
// the start stays the first live of the wash
snAppl.events.set(ap.id, [{ t: tonight2, kind: "live" }, { t: tonight, kind: "live" }, { t: lastNight2, kind: "live" }]);
const split = { loading: false, bins: [], done: [{ start: tonight - 3 * MIN, end: tonight + 47 * MIN }], current: { start: tonight + 88 * MIN } };
s = snApplState(hass, ap, NOW + 60 * MIN, split);
ok(s.since === tonight, `wash split by a pause in the statistics -> since 22:33 (got ${s.since && iso(s.since)})`);

console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
