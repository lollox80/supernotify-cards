// appliances 0.2.20: a "live" of Autonotify left as the newest notification (its end lost, or Home
// Assistant restarted between the two) does not keep a plug appliance "running" at 0 W.
// A washer that ran last night: the archive's newest row for it is a "live", the plug draws 0 W.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const { snAppl, snApplState, snApplLiveStale } = new dom.window.Function(SRC + "\nreturn { snAppl, snApplState, snApplLiveStale };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const NOW = Date.now(), MIN = 60000, H = 3600000;
const iso = (t) => new Date(t).toISOString();

const ap = { id: "washer1", name: "Washer", kind: "power", power: "sensor.washer_power", switch: "switch.washer",
  threshold: 5, grace: 120000, minDur: 60000 };
const hass = (w, changedAgo = 14 * H) => ({ states: {
  "sensor.washer_power": { state: String(w), attributes: { unit_of_measurement: "W" }, last_changed: iso(NOW - changedAgo) },
  "switch.washer": { state: "on", attributes: {}, last_changed: iso(NOW - 2 * 24 * H) },
} });
const idleStats = { loading: false, bins: [{ t: NOW - 15 * H, dt: 300000, mean: 800, max: 2100 }], done: [{ start: NOW - 15 * H, end: NOW - 14 * H }], current: null };
const liveEvents = (ago) => [{ t: NOW - ago, kind: "live" }, { t: NOW - ago - 30 * MIN, kind: "live" }];

// 1. last night's "live" left as the newest, 0 W, no cycle in the statistics: idle
snAppl.events.set(ap.id, liveEvents(15 * H));
let s = snApplState(hass(0), ap, NOW, idleStats);
ok(s.status === "idle", `stale live at 0 W -> idle (got ${s.status})`);
ok(s.since === undefined, "no 'since' kept from the stale live");

// 2. standby draw under the threshold is still at rest
s = snApplState(hass(1.2), ap, NOW, idleStats);
ok(s.status === "idle", `stale live at 1.2 W standby -> idle (got ${s.status})`);

// 3. the plug draws above the threshold: the archive is believed
s = snApplState(hass(1900, 3 * MIN), ap, NOW, idleStats);
ok(s.status === "running", `live at 1900 W -> running (got ${s.status})`);

// 4. a fresh live (a cycle just started, a pause at 0 W): not yet a leftover
snAppl.events.set(ap.id, liveEvents(4 * MIN));
s = snApplState(hass(0, 1 * MIN), ap, NOW, idleStats);
ok(s.status === "running", `fresh live in a pause -> running (got ${s.status})`);

// 5. the statistics still have a cycle under way: running
snAppl.events.set(ap.id, liveEvents(15 * H));
s = snApplState(hass(0), ap, NOW, { ...idleStats, current: { start: NOW - 20 * MIN } });
ok(s.status === "running", `cycle open in the statistics -> running (got ${s.status})`);

// 6. statistics not read yet, or power unknown: the archive is believed
s = snApplState(hass(0), ap, NOW, null);
ok(s.status === "running", `statistics not read -> running (got ${s.status})`);
s = snApplState(hass(0), ap, NOW, { loading: true });
ok(s.status === "running", `statistics loading -> running (got ${s.status})`);
ok(snApplLiveStale(ap, { state: "unknown" }, idleStats, liveEvents(15 * H), NOW) === false, "unknown power -> not stale");

// 7. a finished cycle with its end in the archive is still "done"
snAppl.events.set(ap.id, [{ t: NOW - 14 * H, kind: "end" }, { t: NOW - 14 * H - 1000, kind: "clear" }, { t: NOW - 15 * H, kind: "live" }]);
s = snApplState(hass(0), ap, NOW, idleStats);
ok(s.status === "done", `end in the archive -> done (got ${s.status})`);

// 8. a device added by hand is not touched by this rule
const manual = { ...ap, id: "manual_heater", manual: true };
ok(snApplState(hass(0), manual, NOW, idleStats).status === "idle", "manual device at 0 W, no cycle -> idle");

console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
