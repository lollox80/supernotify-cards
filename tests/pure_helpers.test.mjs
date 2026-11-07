// Unreleased: the pure helpers the cards' numbers and texts rest on, tested on their own with a fixed "now" -
// snLiveSnoozes (pauses as "HH:MM:SS" anchored across midnight), snOvDays (the overview's daily numbers),
// snVerCmp, the snooze texts (snSnzDur, snSnzUntil, snSnoozeLabel), snAgo, snTitleShow and the Python-like
// helpers (snPyJson, snTruthy, snLen / snCut, snJoinMax).
import { boot, load, ok, fail } from "./_harness.mjs";

boot();
const H = load("snLiveSnoozes, snOvDays, snVerCmp, snSnzDur, snSnzUntil, snSnoozeLabel, snAgo, snTitleShow, "
  + "snPyJson, snTruthy, snLen, snCut, snJoinMax, snDayKey");
const at = (y, mo, d, h, mi, s = 0) => new Date(y, mo - 1, d, h, mi, s, 0);
const same = (a, b) => a instanceof Date && b instanceof Date && a.getTime() === b.getTime();

// ── 1. snLiveSnoozes: local "HH:MM:SS" times anchored on snoozed_at ─────────
{
  const now = at(2026, 11, 4, 0, 10);
  const live = (s) => H.snLiveSnoozes([s], now);
  let r = live({ id: 1, snoozed_at: "23:50:00", snooze_until: "00:50:00" });
  ok(r.length === 1 && same(r[0]._end, at(2026, 11, 4, 0, 50)), "snoozed 23:50 yesterday until 00:50: ends today at 00:50");
  r = live({ snoozed_at: "23:00:00", snooze_until: "23:30:00" });
  ok(r.length === 0, "snoozed 23:00 yesterday until 23:30: already over, left out");
  r = live({ snoozed_at: "00:05", snooze_until: "02:00" });
  ok(r.length === 1 && same(r[0]._end, at(2026, 11, 4, 2, 0)), "HH:MM without seconds is read too");
  r = live({ snooze_until: "00:05:00" });
  ok(r.length === 1 && same(r[0]._end, at(2026, 11, 5, 0, 5)), "no snoozed_at and a time already gone today: tomorrow");
  r = live({ snooze_until: "08:00:00" });
  ok(r.length === 1 && same(r[0]._end, at(2026, 11, 4, 8, 0)), "no snoozed_at and a time still ahead: today");
  r = live({ snooze_until: null, target_type: "EVERYTHING" });
  ok(r.length === 1 && r[0]._end === null && r[0].target_type === "EVERYTHING", "no snooze_until: kept, with no end");
  r = live({ snooze_until: "later" });
  ok(r.length === 1 && r[0]._end === null, "an end it cannot read: kept, with no end");
  r = live({ snooze_until: "2026-11-04T01:00:00" });
  ok(r.length === 1 && same(r[0]._end, at(2026, 11, 4, 1, 0)), "an ISO end is used as it is");
  ok(live({ snooze_until: "2026-11-04T00:00:00" }).length === 0, "an ISO end in the past: left out");
  ok(H.snLiveSnoozes([null, undefined], now).length === 0 && H.snLiveSnoozes(null, now).length === 0, "null entries and no list");
  const src = { snoozed_at: "23:50:00", snooze_until: "00:50:00" };
  H.snLiveSnoozes([src], now);
  ok(!("_end" in src), "the list from SuperNotify is not changed");
  // 0.80.0: a snoozed_at a few minutes ahead of the browser clock is today, not yesterday
  const noon = at(2026, 11, 4, 12, 0);
  r = H.snLiveSnoozes([{ snoozed_at: "12:03:00", snooze_until: "13:03:00" }], noon);
  ok(r.length === 1 && same(r[0]._end, at(2026, 11, 4, 13, 3)), "clock skew under 5 min: snoozed today, ends today at 13:03");
  r = H.snLiveSnoozes([{ snoozed_at: "12:30:00", snooze_until: "12:45:00" }], noon);
  ok(r.length === 0, "snoozed_at 30 min ahead is yesterday: that pause is over");
}

// ── 2. snOvDays: the overview's numbers from verbosity daily ──────────────────
{
  const now = at(2026, 11, 4, 15, 0);
  const days = [
    { date: "2026-11-04", count: 10, outcome: { success: 7, dupe: 2, no_delivery: 1 },
      deliveries: { email: { success: 3, failed: 1 }, push: { success: 7, failed: 0 } } },
    { date: "2026-11-03", count: "20", outcome: { dupe: 5 }, deliveries: { email: { failed: 2 } } },
    { date: "2026-11-01", count: 6 },
  ];
  const o = H.snOvDays(days, now);
  console.log("    snOvDays:", JSON.stringify(o));
  ok(o.today === 8, "today leaves the duplicates out (10 - 2)");
  ok(o.yesterday === 15, "yesterday from a count written as a string");
  ok(o.avg === 7, "average over the days since the first one the archive has ((15 + 6) / 3)");
  ok(o.success === 7 && o.dupes === 2 && o.noDel === 1, "today's outcome");
  ok(o.failToday === 1 && o.fail30 === 3, "failed channel sends today and over the whole window");
  const onlyToday = H.snOvDays([days[0]], now);
  ok(onlyToday.yesterday === null && onlyToday.avg === null, "only today in the archive: no yesterday, no average");
  const gap = H.snOvDays([days[0], days[2]], now);
  ok(gap.yesterday === 0, "past days but none yesterday: yesterday is 0");
  const none = H.snOvDays([], now);
  ok(none.today === 0 && none.failToday === 0 && none.fail30 === 0, "an empty archive: zeros");
  const neg = H.snOvDays([{ date: "2026-11-04", count: 1, outcome: { dupe: 3 } }], now);
  ok(neg.today === 0, "more duplicates than notifications never gives a negative count");
  const long = [];
  for (let n = 1; n <= 30; n++) { const d = at(2026, 11, 4, 12, 0); d.setDate(d.getDate() - n); long.push({ date: H.snDayKey(d), count: 4 }); }
  ok(H.snOvDays(long, now).avg === 4, "30 full days of 4: the average is 4 (calendar days, DST included)");
}

// ── 3. snVerCmp ─────────────────────────────────────────────────────────────
ok(H.snVerCmp("0.88.0", "0.88.1") === -1 && H.snVerCmp("0.88.1", "0.88.0") === 1, "patch level");
ok(H.snVerCmp("1.10.0", "1.9.0") === 1, "numbers, not text (1.10 > 1.9)");
ok(H.snVerCmp("1.0", "1.0.0") === 0 && H.snVerCmp("2.13.2", "2.13.2") === 0, "missing parts count as 0");
ok(H.snVerCmp("1.0.0", "0.99.9") === 1, "major wins");

// ── 4. snooze texts ─────────────────────────────────────────────────────────
const T = { min: "min", snz_all: "everything", snz_nc: "non-critical", snz_prio: "priority", snz_transport: "transport",
  snz_for: "for", ago_now: "now", ago_min: "min ago", ago_h: "h ago" };
ok(H.snSnzDur(25, T) === "25 min" && H.snSnzDur(60, T) === "1 h" && H.snSnzDur(90, T) === "1 h 30 min",
  "minutes left under 3 h: h and min");
ok(H.snSnzDur(179, T) === "2 h 59 min" && H.snSnzDur(180, T) === "3 h" && H.snSnzDur(1440, T) === "24 h", "from 3 h: rounded hours");
{
  const now = new Date();
  ok(/^\d\d:\d\d$/.test(H.snSnzUntil(new Date(now), { language: "en" })), "end today: just HH:MM");
  const next = new Date(now); next.setDate(next.getDate() + 2);
  ok(/^\d\d:\d\d \(.+\)$/.test(H.snSnzUntil(next, { language: "en" })), "end on another day: HH:MM (weekday)");
}
const hass = { states: { "person.jessica": { state: "home", attributes: { friendly_name: "Jessica" } },
  "camera.porch": { state: "idle", attributes: { friendly_name: "Porch" } } } };
const L = (s) => H.snSnoozeLabel(hass, s, T);
ok(L({ target_type: "everything" }) === "everything" && L({ target_type: "NONCRITICAL" }) === "non-critical", "everything / non-critical, any case");
ok(L({ target_type: "CAMERA", target: "camera.porch" }) === "📷 Porch" && L({ target_type: "CAMERA", target: "camera.back" }) === "📷 back",
  "camera: its name, else the id without camera.");
ok(L({ target_type: "TAG", target: "automation.luci_cucina" }) === "🤖 Luci cucina", "a paused automation not in states: its id, readable");
ok(L({ target_type: "TAG", target: "porch" }) === "🏷️ porch", "a plain tag");
ok(L({ target_type: "PRIORITY", target: ["low", "medium"] }) === "priority low, medium", "a list of targets is joined");
ok(L({ target_type: "EVERYTHING", recipient_type: "USER", recipient: "person.jessica" }) === "everything (for Jessica)"
  && L({ target_type: "EVERYTHING", recipient_type: "user", recipient: "person.mark" }) === "everything (for mark)",
  "for one person: the name, else the id without person.");
ok(L({}) === "?" && L(null) === "?", "nothing known: ?");

// ── 5. snAgo ────────────────────────────────────────────────────────────────
{
  const ago = (ms) => H.snAgo(new Date(Date.now() - ms), T);
  ok(ago(30e3) === "now" && ago(5 * 60e3) === "5 min ago", "under an hour: now / N min");
  ok(/^1 h ago · \d\d:\d\d$/.test(ago(90 * 60e3)), "under a day: hours and the time");
  ok(/^\d\d\/\d\d \d\d:\d\d$/.test(ago(2 * 86400e3)), "older: day/month and the time");
}

// ── 6. titles and Python-like helpers ──────────────────────────────────────
ok(H.snTitleShow("*Bold* title") === "Bold title" && H.snTitleShow("_soft_ word") === "soft word", "Telegram *bold* and _italic_ marks go");
ok(H.snTitleShow("file_name_x") === "file_name_x", "underscores inside a word stay");
ok(H.snTitleShow("⚠️ Battery low ⚠️") === "⚠️ Battery low" && H.snTitleShow("⚠️") === "⚠️", "an emoji opening and closing the title is shown once");
ok(H.snTitleShow(null) === "" && H.snTitleShow("  ") === "", "no title");
ok(H.snPyJson({ a: [1, "x"], b: null, c: { d: true }, e: undefined }) === '{"a": [1, "x"], "b": null, "c": {"d": true}, "e": null}',
  "json.dumps spacing, undefined as null");
ok([[], "", {}, 0, null, undefined, false].every((v) => !H.snTruthy(v)) && [[0], "a", { a: 0 }, 1, true].every((v) => H.snTruthy(v)),
  "Python truthiness");
ok(H.snLen("👍a") === 2 && H.snCut("👍ab", 2) === "👍a", "length and slice by code point");
ok(H.snJoinMax(["a", "b", "c"], 2) === "a, b +1" && H.snJoinMax(["a"], 2) === "a" && H.snJoinMax([], 2) === "", "first N, then +rest");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
