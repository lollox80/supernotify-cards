// CHANGELOG
// 2026-10-05 v0.76.1: le letture hanno un tempo massimo, così una richiesta mai risposta non blocca la card.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
const G = new dom.window.Function(SRC + "\nreturn { snWS };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const never = { callWS: () => new Promise(() => {}) };
let err = null;
try { await G.snWS(never, { type: "x" }, 50); } catch (e) { err = e; }
ok(err && /timeout/.test(err.message), "una richiesta senza risposta fallisce dopo il tempo massimo");
ok(await G.snWS({ callWS: async () => 42 }, { type: "x" }, 50) === 42, "una risposta normale passa");
let rej = null;
try { await G.snWS({ callWS: async () => { throw new Error("boom"); } }, { type: "x" }, 50); } catch (e) { rej = e; }
ok(rej && rej.message === "boom", "un errore resta l'errore");
const reads = (SRC.match(/hass\.callWS\(\{\s*type: "call_service", domain: "supernotify", service: "enquire_/g) || []).length;
ok(reads === 0, `nessuna enquire_* senza tempo massimo (${reads})`);
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
