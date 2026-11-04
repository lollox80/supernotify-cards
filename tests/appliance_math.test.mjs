// Unreleased: the appliance card's sums, tested on their own with a fixed "now" - snApplEstimate (the end of the
// cycle under way from a finish time, a time left, a progress or the average of past cycles), snApplCycles and
// snApplTypes (power bins -> cycles, short / long), snApplPeriodStarts / snApplPeriods (today, week from Monday,
// month, year) and snApplDays (the last 7 days).
import { boot, load, ok, fail } from "./_harness.mjs";

boot();
const A = load("snApplEstimate, snApplCycles, snApplTypes, snApplPeriodStarts, snApplPeriods, snApplDays, snApplBins");
const MIN = 60000, H = 3600000;
const at = (y, mo, d, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
const NOW = at(2026, 11, 4, 15, 0); // a Wednesday
const near = (a, b, tol = 1000) => Math.abs(a - b) <= tol;

// ── 1. snApplEstimate ───────────────────────────────────────────────────────
{
  const run = { status: "running", since: NOW - 30 * MIN };
  const est = (states, ap, cy = null, s = run) => A.snApplEstimate({ states }, ap, s, cy, NOW);
  const rem = (state, unit) => ({ "sensor.rem": { state, attributes: unit ? { unit_of_measurement: unit } : {} } });
  ok(est({}, {}, null, { status: "done" }) === null, "not running: no estimate");
  let r = est({ "sensor.fin": { state: new Date(NOW + 30 * MIN).toISOString() } }, { finish: "sensor.fin" });
  ok(r && r.end === NOW + 30 * MIN && near(r.pct, 50, 0.01) && !r.guess, "finish time ahead: that end, half way");
  r = est({ "sensor.fin": { state: new Date(NOW - MIN).toISOString() }, ...rem("10") }, { finish: "sensor.fin", remaining: "sensor.rem" });
  ok(r && r.end === NOW + 10 * MIN, "finish time already gone: the time left is used instead");
  ok(est(rem("45"), { remaining: "sensor.rem" }).end === NOW + 45 * MIN, "time left in minutes by default");
  ok(est(rem("2", "h"), { remaining: "sensor.rem" }).end === NOW + 2 * H, "time left in hours");
  ok(est(rem("600", "s"), { remaining: "sensor.rem" }).end === NOW + 10 * MIN, "time left in seconds");
  ok(est(rem("1:30"), { remaining: "sensor.rem" }).end === NOW + 90 * MIN, "time left as H:MM");
  ok(est(rem("0:20:30"), { remaining: "sensor.rem" }).end === NOW + 20.5 * MIN, "time left as H:MM:SS");
  r = est({ ...rem("unknown"), "sensor.prog": { state: "25" } }, { remaining: "sensor.rem", progress: "sensor.prog" });
  ok(r && r.end === NOW - 30 * MIN + 120 * MIN && r.pct === 25, "time left unknown: from the progress (25 % in 30 min = 2 h)");
  ok(est({ "sensor.prog": { state: "100" } }, { progress: "sensor.prog" }) === null, "progress 100 % and no history: no estimate");
  const all = { types: { all: { dur: 60 * MIN } } };
  r = est({}, {}, all);
  ok(r && r.end === NOW + 30 * MIN && r.guess === true, "no sensors: the average cycle (60 min), marked as a guess");
  const split = { types: { all: { dur: 75 * MIN }, split: 45 * MIN, short: { dur: 30 * MIN }, long: { dur: 120 * MIN } } };
  r = est({}, {}, split, { status: "running", since: NOW - 20 * MIN });
  ok(r && r.end === NOW + 10 * MIN, "20 min in, under the short cycle: the short average");
  r = est({}, {}, split, { status: "running", since: NOW - 40 * MIN });
  ok(r && r.end === NOW + 80 * MIN, "40 min in, past the short cycle: the long average");
  r = est({}, {}, all, { status: "running", since: NOW - 90 * MIN });
  ok(r && r.end === NOW + MIN && r.pct < 100, "running longer than the average: one more minute, never 100 %");
  ok(est({}, {}, null) === null && est({}, {}, { types: {} }) === null, "nothing to go on: no estimate");
}

// ── 2. snApplCycles / snApplTypes ───────────────────────────────────────────
{
  const T0 = at(2026, 11, 4, 8, 0), dt = 5 * MIN;
  const watts = [0, 2000, 2000, 0, 1500, 0, 0, 0, 0, 0, 800, 0];
  const bins = watts.map((w, i) => ({ t: T0 + i * dt, dt, mean: w, max: w }));
  const cy = A.snApplCycles(bins, 5, 6 * MIN, 10 * MIN);
  ok(cy.length === 1, `one cycle: the 5 min gap joined, the lone 5 min burst too short (${cy.length})`);
  ok(cy[0] && cy[0].start === T0 + dt && cy[0].end === T0 + 5 * dt && near(cy[0].kwh, (2000 + 2000 + 1500) * dt / H / 1000, 1e-9),
    "the cycle's start, end and kWh");
  ok(A.snApplCycles([{ t: T0, dt, mean: 1, max: 900 }, { t: T0 + dt, dt, mean: 1, max: 900 }], 5, 0, 0).length === 1,
    "the peak in a bin counts, not only its mean");
  const c = (mins) => ({ start: 0, end: mins * MIN, kwh: 1 });
  ok(!A.snApplTypes([c(10), c(12), c(60)]).split && A.snApplTypes([c(10), c(12), c(60)]).all.dur === (82 / 3) * MIN,
    "three cycles: one average, no short / long");
  const t = A.snApplTypes([c(10), c(12), c(60), c(64)]);
  ok(t.split === 36 * MIN && t.short.dur === 11 * MIN && t.long.dur === 62 * MIN, "four cycles in two groups: short 11, long 62 min");
  ok(!A.snApplTypes([c(30), c(32), c(34), c(36)]).split, "durations close together: no split");
  ok(A.snApplTypes([{ ...c(500), anomalous: true }, c(30)]).all.dur === 30 * MIN, "an anomalous cycle stays out of the average");
  ok(Object.keys(A.snApplTypes([])).length === 0, "no cycles: nothing");
}

// ── 3. periods ─────────────────────────────────────────────────────────────
{
  const p = A.snApplPeriodStarts(NOW);
  ok(p.d0.getTime() === at(2026, 11, 4) && p.w0.getTime() === at(2026, 11, 2) && p.m0.getTime() === at(2026, 11, 1)
    && p.y0.getTime() === at(2026, 1, 1), "Wednesday: today, Monday, the 1st, 1 January");
  ok(A.snApplPeriodStarts(at(2026, 11, 8, 23, 0)).w0.getTime() === at(2026, 11, 2), "Sunday belongs to the week started on Monday");
  ok(A.snApplPeriodStarts(at(2026, 11, 2, 0, 30)).w0.getTime() === at(2026, 11, 2), "Monday starts its own week");
  const bin = (t) => ({ t, dt: H, mean: 1000 });
  const cy = {
    bins: [bin(at(2026, 11, 4, 10)), bin(at(2026, 11, 2, 10)), bin(at(2026, 10, 15)), bin(at(2026, 1, 10)), bin(at(2025, 12, 31))],
    done: [{ start: at(2026, 11, 4, 9) }, { start: at(2026, 11, 3, 9) }, { start: at(2026, 10, 30) }, { start: at(2025, 12, 1) }],
    current: { start: at(2026, 11, 4, 14) },
  };
  const per = Object.fromEntries(A.snApplPeriods(cy, NOW).map((x) => [x.key, x]));
  ok(per.today.kwh === 1 && per.week.kwh === 2 && per.month.kwh === 2 && per.year.kwh === 4, "kWh: today 1, week 2, month 2, year 4");
  ok(per.today.cycles === 2 && per.week.cycles === 3 && per.month.cycles === 3 && per.year.cycles === 4,
    "cycles started, the one under way included");
  const days = A.snApplDays({ bins: cy.bins, done: [{ start: at(2026, 11, 4, 9), end: at(2026, 11, 4, 10), area: 20 },
    { start: at(2026, 11, 3, 23, 30), end: at(2026, 11, 4, 0, 30) }], current: { start: at(2026, 11, 4, 14) } }, NOW);
  ok(days.length === 7 && days[0].t === at(2026, 11, 4) && days[6].t === at(2026, 10, 29), "seven days, today first");
  ok(days[0].n === 2 && days[0].ms === 2 * H && days[0].kwh === 1 && days[0].area === 20, "today: 2 runs (one under way until now), 2 h, 1 kWh, 20 m²");
  ok(days[1].n === 1 && days[1].ms === H && days[1].area === null, "a run across midnight counts on the day it started");
  ok(days[2].n === 0 && days[2].kwh === 1, "Monday: no runs, 1 kWh");
}

// ── 4. snApplBins ──────────────────────────────────────────────────────────
{
  const b = A.snApplBins([{ start: "2026-11-04T10:00:00Z", mean: "12.5", max: null }, { start: NOW }, { start: "bad" }], H);
  ok(b.length === 2 && b[0].t === Date.parse("2026-11-04T10:00:00Z") && b[0].mean === 12.5 && b[0].max === null
    && b[1].t === NOW && b[1].mean === null && b[1].dt === H, "statistics rows: ISO or ms starts, numbers, unreadable rows out");
  ok(A.snApplBins(null, H).length === 0, "no rows");
}

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
