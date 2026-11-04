// appliances 0.2.24: the end of a cycle with a title of its own ("🧺 Bucato pronto", no appliance's name in
// it) is found however many notifications without a name came after it. A washer started at 21:08, ended at
// 22:25 with "🧺 Bucato pronto"; then 120 other notifications with no appliance's name (batteries, servers...).
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const { snAppl, snArchiveStore } = new dom.window.Function(SRC + "\nreturn { snAppl, snArchiveStore };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const MIN = 60000;
const T0 = Date.parse("2026-10-20T19:08:00Z");
const iso = (t) => new Date(t).toISOString();

const E = "01m4jsk6q7sd8rs3r4akt2ekp6";
const docs = {};
const rows = [];
const add = (id, t, title, extra) => { rows.push({ id, created: iso(t), title, message: "" }); docs[id] = { id, created: iso(t), title, message: "", extra_data: extra }; };
add("start", T0, "🧺 Lavatrice", { mobile_push_notification_tag: `appliance_${E}`, live_update: true });
add("end", T0 + 77 * MIN, "🧺 Bucato pronto", { mobile_push_notification_tag: `appliance_${E}_end` });
for (let k = 0; k < 120; k++) add(`other${k}`, T0 + 80 * MIN + k * 5 * MIN, "⚠️ Stato Batterie Critico ⚠️", {});
rows.sort((a, b) => String(b.created).localeCompare(String(a.created)));

let reads = 0;
snArchiveStore.doc = async (hass, id) => { reads++; return docs[id] || null; };
snAppl.entries = [{ entry_id: E, title: "Lavatrice" }];
snAppl.rows = rows;
snAppl.docs = new Map();
snAppl.events = new Map();

await snAppl._classify({});
const ev = snAppl.events.get(E) || [];
ok(ev.length > 0, `events found (${ev.length})`);
ok(ev[0] && ev[0].kind === "end", `newest event is the end "Bucato pronto" (got ${ev[0] && ev[0].kind})`);
ok(ev.some((x) => x.kind === "live"), "the start live is still there, behind the end");
ok(reads <= 40 + 2 + 120, `rows read in full: ${reads}`);

// a second refresh: everything read is kept, nothing is read again
const before = reads;
await snAppl._classify({});
ok(reads === before, `second pass reads nothing more (read ${reads - before})`);

// a cycle under way with no end yet: the search stops at the end of the rows, the live stays newest
snAppl.rows = rows.filter((r) => r.id !== "end");
snAppl.docs = new Map(); snAppl.events = new Map();
await snAppl._classify({});
const ev2 = snAppl.events.get(E) || [];
ok(ev2[0] && ev2[0].kind === "live", `no end in the archive -> still live (got ${ev2[0] && ev2[0].kind})`);

// a cycle under way, its "live" 20 minutes old: no search past the newest 40 rows (it held up the statistics)
const NOWL = Date.now();
const rows3 = [];
const add3 = (id, tt, title, extra) => { rows3.push({ id, created: iso(tt), title, message: "" }); docs[id] = { id, created: iso(tt), title, message: "", extra_data: extra }; };
add3("start3", NOWL - 20 * MIN, "🧺 Lavatrice", { mobile_push_notification_tag: `appliance_${E}`, live_update: true });
for (let k = 0; k < 120; k++) add3(`n3_${k}`, NOWL - 19 * MIN + k * 1000, "Server", {});
rows3.sort((x, y) => String(y.created).localeCompare(String(x.created)));
snAppl.rows = rows3; snAppl.docs = new Map(); snAppl.events = new Map();
reads = 0;
await snAppl._classify({});
ok(reads <= 41, `recent live: at most the newest 40 + its own row read (read ${reads})`);
ok((snAppl.events.get(E) || [])[0].kind === "live", "recent live: still under way");

console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
