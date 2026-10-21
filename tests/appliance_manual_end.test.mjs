// appliances 0.2.21: a device added by hand on a plug ends its cycle from the power, not only from the
// statistics. A boiler heating at 1600 W through a restart of Home Assistant, then at 0 W: the 5-minute
// statistics still have its cycle open, the card says idle once the plug has rested for the grace period.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const { snApplState, snApplAtRest } = new dom.window.Function(SRC + "\nreturn { snApplState, snApplAtRest };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const NOW = Date.now(), MIN = 60000;
const iso = (t) => new Date(t).toISOString();

const ap = { id: "manual_boiler", name: "Boiler", manual: true, kind: "power", power: "sensor.boiler_power", switch: "switch.boiler",
  threshold: 50, grace: 300000, minDur: 300000 };
const hass = (w, changedAgo) => ({ states: {
  "sensor.boiler_power": { state: String(w), attributes: { unit_of_measurement: "W" }, last_changed: iso(NOW - changedAgo) },
  "switch.boiler": { state: "on", attributes: {}, last_changed: iso(NOW - 3 * 3600000) },
} });
const open = { loading: false, bins: [{ t: NOW - 10 * MIN, dt: 300000, mean: 161, max: 1622 }], done: [], current: { start: NOW - 22 * MIN } };

// 1. at 0 W for 9 minutes, the statistics still open: idle
let s = snApplState(hass(0, 9 * MIN), ap, NOW, open);
ok(s.status === "idle", `0 W for 9 min, statistics open -> idle (got ${s.status})`);

// 2. at 0 W for 2 minutes only (a pause shorter than the grace period): still running
s = snApplState(hass(0, 2 * MIN), ap, NOW, open);
ok(s.status === "running", `0 W for 2 min -> running (got ${s.status})`);

// 3. drawing: running, from the power
s = snApplState(hass(1622, 1 * MIN), ap, NOW, open);
ok(s.status === "running", `1622 W -> running (got ${s.status})`);

// 4. no cycle in the statistics and at rest: idle as before
s = snApplState(hass(0, 9 * MIN), ap, NOW, { ...open, current: null });
ok(s.status === "idle", `no cycle, 0 W -> idle (got ${s.status})`);

// 5. power unknown: not at rest (the plug's state decides, as before)
ok(snApplAtRest(ap, { state: "unknown", last_changed: iso(NOW - 9 * MIN) }, NOW) === false, "unknown power -> not at rest");
ok(snApplAtRest(ap, { state: "12", last_changed: iso(NOW - 9 * MIN) }, NOW) === true, "12 W under a 50 W threshold for 9 min -> at rest");

console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
