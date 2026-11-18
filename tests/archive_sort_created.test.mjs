// snByCreatedDesc orders the archive newest first by `created`, which SuperNotify writes as a local ISO
// time with its offset (Python isoformat: microseconds only when not zero). As text that order breaks when
// the offset changes (end of summer time: 02:30+02:00 is before 02:10+01:00) and inside one second
// (localeCompare puts "." before "+", so 10:00:00.5 came after 10:00:00). Runs without jsdom.
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const fnStart = src.indexOf("function snByCreatedDesc(");
const fnEnd = src.indexOf("\n}\n", fnStart) + 3;
const snByCreatedDesc = new Function(src.slice(fnStart, fnEnd) + "return snByCreatedDesc;")();
const order = (list) => list.map((created) => ({ created })).sort(snByCreatedDesc).map((d) => d.created);

// end of summer time (Europe/Rome, 2026-10-25): the second 02:xx is an hour later
assert.deepStrictEqual(order(["2026-10-25T02:30:00+02:00", "2026-10-25T02:10:00+01:00"]),
  ["2026-10-25T02:10:00+01:00", "2026-10-25T02:30:00+02:00"], "across the change of offset");
// microseconds within the same second
assert.deepStrictEqual(order(["2026-11-18T10:00:00+01:00", "2026-11-18T10:00:00.500000+01:00"]),
  ["2026-11-18T10:00:00.500000+01:00", "2026-11-18T10:00:00+01:00"], "same second, with microseconds");
// UTC and local of the same kind of list still ordered by the moment
assert.deepStrictEqual(order(["2026-11-18T09:30:00+00:00", "2026-11-18T10:15:00+01:00", "2026-11-18T09:20:00Z"]),
  ["2026-11-18T09:30:00+00:00", "2026-11-18T09:20:00Z", "2026-11-18T10:15:00+01:00"], "mixed offsets (10:15+01:00 = 09:15Z)");
// what the other tests use (toISOString) keeps its order; a missing or broken time goes last
assert.deepStrictEqual(order(["2026-11-17T08:00:00.000Z", undefined, "2026-11-18T08:00:00.000Z", "garbage"]),
  ["2026-11-18T08:00:00.000Z", "2026-11-17T08:00:00.000Z", "garbage", undefined], "ISO Z, missing and broken");
console.log("archive_sort_created: 4 ok");
