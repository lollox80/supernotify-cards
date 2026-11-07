// The archive reads a delivery's errors from failed_calls, falling back to the older failedcalls.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.CustomEvent = dom.window.CustomEvent;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
dom.window.customCards = [];
const G = new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8") + "\nreturn { snArchiveDelivery };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

const current = G.snArchiveDelivery("telegram", { error: [{ calls: [], failed_calls: [{ exception: "chat not found" }] }] });
ok(JSON.stringify(current.err) === JSON.stringify(["chat not found"]), "error read from failed_calls");

const older = G.snArchiveDelivery("telegram", { error: [{ calls: [], failedcalls: [{ exception: "timeout" }] }] });
ok(JSON.stringify(older.err) === JSON.stringify(["timeout"]), "error still read from failedcalls without failed_calls");

const both = G.snArchiveDelivery("telegram", {
  error: [{ calls: [], failed_calls: [{ exception: "sanitised" }], failedcalls: [{ exception: "raw" }] }],
});
ok(JSON.stringify(both.err) === JSON.stringify(["sanitised"]), "failed_calls preferred when both are there");

process.exit(fail ? 1 : 0);
