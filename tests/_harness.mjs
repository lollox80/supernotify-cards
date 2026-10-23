// tests/_harness.mjs - the prologue the jsdom tests share (1.0.0). Not a test itself: tools/run_tests.mjs runs
// *.test.mjs only. boot() makes a fresh JSDOM and its globals, load() runs the bundle in it (SN_SRC, else dist)
// and returns what `extraReturn` names; ok() counts failures in `fail` (a live binding: read it at the end).
import { JSDOM } from "jsdom";
import fs from "fs";

export const SRC = fs.readFileSync(process.env.SN_SRC || "dist/supernotify-control-card.js", "utf8");
export let dom = null;
export let fail = 0;

/** opts: url (location of the page), scroll (a no-op scrollIntoView, jsdom has none). */
export function boot(opts = {}) {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, ...(opts.url ? { url: opts.url } : {}) });
  global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
  global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
  dom.window.customCards = [];
  if (opts.scroll) dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  return dom;
}

/** Run the bundle; `extraReturn` ("snA, snB") is returned as an object. */
export function load(extraReturn) {
  return new dom.window.Function(SRC + (extraReturn ? `\nreturn { ${extraReturn} };` : ""))();
}

export const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
