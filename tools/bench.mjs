// tools/bench.mjs - performance benchmark for the SuperNotify Lovelace card bundle (no build, jsdom).
// Loads the bundle with a synthetic 3000-entity house plus SuperNotify entities and measures:
// bundle eval, per-card first render, 200 hass updates (unrelated sensor / relevant SuperNotify
// entity), card-picker previews (stub config + hass), strategy generate, and one page with every card.
// Timings use performance.now(); "total" adds time spent in the bundle's setTimeout/rAF callbacks.
// 1.0.0: two scenarios more - "archive" (a 200-row archive: cost of a supernotify-archive event after the
// first render, list redraws and callWS per new notification) and "appliances" (3 appliances, one plug whose
// power changes on every update: cost per update, body / panel rebuilds, callWS).
// Usage: node tools/bench.mjs [bundlePath] [--json out.json] [--quick] [--only archive,appliances]
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "fs";
import { performance } from "perf_hooks";

const args = process.argv.slice(2);
const jsonIdx = args.indexOf("--json");
const JSON_OUT = jsonIdx >= 0 ? args[jsonIdx + 1] : null;
const QUICK = args.includes("--quick");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? new Set(String(args[onlyIdx + 1] || "").split(",")) : null;
const BUNDLE = args.find((a, i) => !a.startsWith("--") && (jsonIdx < 0 || i !== jsonIdx + 1) && (onlyIdx < 0 || i !== onlyIdx + 1)) || "dist/supernotify-control-card.js";
const SRC = fs.readFileSync(BUNDLE, "utf8");
const BYTES = Buffer.byteLength(SRC);
const UPDATES = QUICK ? 40 : 200, WARM = QUICK ? 5 : 20, RUNS = QUICK ? 1 : 3, EVAL_RUNS = 5;

const med = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const r2 = (x) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : null);
// window.Function is Node's own Function (no runScripts), so the bundle's bare globals are Node's:
// keep Node's timers for the bench itself, makeEnv() swaps instrumented ones in for the bundle.
const NODE = { setTimeout: globalThis.setTimeout, setInterval: globalThis.setInterval, clearTimeout: globalThis.clearTimeout,
  clearInterval: globalThis.clearInterval, console: globalThis.console };
const nodeTick = (ms = 0) => new Promise((r) => NODE.setTimeout(r, ms));
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
const settle = async (ms = 60) => { await flush(); for (let t = 0; t < ms; t += 20) { await nodeTick(20); await flush(); } };
const pad = (n) => String(n).padStart(4, "0");

// ── synthetic Home Assistant ────────────────────────────────────────────────
const NOW = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const S = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes,
  last_changed: iso(NOW - 3600e3), last_updated: iso(NOW - 3600e3), context: { id: "ctx" } });
const DELIVERIES = [["mobile_push", "mobile_push"], ["email", "email"], ["alexa_announce", "alexa_devices"],
  ["tts_casa", "tts"], ["sms_fallback", "sms"], ["telegram", "telegram"]];
const TRANSPORTS = ["mobile_push", "email", "alexa_devices", "tts", "sms", "telegram"];
const SCENARIOS = ["morning", "late_night", "ospiti", "casa_vuota", "multi_home", "notte"];
const PEOPLE = ["lorenzo", "anna", "zeno"];

function supernotifyStates() {
  const s = {};
  const add = (id, st, at) => { s[id] = S(id, st, at); };
  for (const [n, t] of DELIVERIES) add(`switch.supernotify_delivery_${n}`, "on", { name: n, transport: t, friendly_name: `SuperNotify Delivery ${n} abilitata` });
  for (const t of TRANSPORTS) {
    add(`switch.supernotify_transport_${t}`, "on", { name: t, friendly_name: `SuperNotify Transport ${t}` });
    add(`binary_sensor.supernotify_transport_${t}`, "off", { friendly_name: `SuperNotify Transport ${t} problem` });
  }
  for (const n of SCENARIOS) {
    add(`switch.supernotify_scenario_${n}`, "on", { name: n, friendly_name: `SuperNotify Scenario ${n} abilitato` });
    add(`binary_sensor.supernotify_scenario_${n}`, n === "morning" ? "on" : "off", { name: n });
  }
  for (const p of PEOPLE) {
    add(`person.${p}`, "home", { friendly_name: p, user_id: p === "lorenzo" ? "u1" : `u_${p}` });
    add(`switch.supernotify_recipient_${p}`, "on", { entity_id: `person.${p}`, mobile_devices: [{}], email: `${p}@example.com`, friendly_name: `SuperNotify Recipient ${p} abilitato` });
    add(`notify.recipient_${p}`, "unknown", { friendly_name: `Recipient ${p}` });
  }
  add("sensor.supernotify_notifications", "40", { friendly_name: "SuperNotify notifications" });
  add("sensor.supernotify_failures", "0", {});
  add("update.supernotify_update", "off", { installed_version: "v2.12.3", latest_version: "v2.12.3" });
  add("update.supernotify_cards_update", "off", { installed_version: "v0.91.0", latest_version: "v0.91.0" });
  add("button.supernotify_reset_overrides", "unknown", {});
  add("camera.ingresso", "idle", { friendly_name: "Ingresso" });
  return s;
}
function houseStates(n = 3000) {
  const s = {};
  const doms = ["sensor", "light", "switch", "binary_sensor", "cover", "climate", "media_player", "automation"];
  for (let i = 0; i < n; i++) {
    const d = doms[i % doms.length], id = `${d}.house_${pad(i)}`;
    s[id] = S(id, d === "sensor" ? String(20 + (i % 10)) : i % 3 ? "off" : "on", { friendly_name: `House ${d} ${i}`,
      ...(d === "sensor" ? { unit_of_measurement: "°C", device_class: "temperature", state_class: "measurement" } : {}) });
  }
  return s;
}
const BASE_STATES = { ...houseStates(), ...supernotifyStates() };
const ENTITIES = Object.fromEntries(Object.keys(BASE_STATES).map((id) => [id, { entity_id: id, device_id: null,
  platform: id.includes("supernotify") ? "supernotify" : "demo", entity_category: null, hidden: false }]));

const DOCS = Array.from({ length: 60 }, (_, i) => ({
  id: `n${pad(i)}-0000-0000`, created: iso(NOW - i * 37 * 60e3), message: `Notifica ${i}`, title: `Titolo ${i}`,
  priority: ["low", "medium", "high", "critical"][i % 4], outcome: i % 9 === 0 ? "partial_delivery" : "success",
  delivered: 1, failed: 0, skipped: i % 9 === 0 ? 1 : 0, missed: 0,
  deliveries: { mobile_push: { success: [{ calls: [{}] }] }, ...(i % 9 === 0 ? { email: { skipped: { suppression_reason: "NO_TARGET" } } } : {}) },
  condition_variables: { notification_title: `Titolo ${i}` }, extra_data: {}, actions: [],
}));
function daily(afterIso) {
  const out = [];
  const a = afterIso ? Date.parse(afterIso) : NOW - 30 * 864e5;
  for (let t = a; t <= NOW; t += 864e5) {
    const d = new Date(t);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const hour = Array(24).fill(0); hour[8] = 4; hour[20] = 6;
    out.push({ date: k, count: 10, outcome: { success: 9, partial_delivery: 1 }, priority: { medium: 7, high: 3 }, hour,
      deliveries: { mobile_push: 10 }, scenarios: { morning: 4 } });
  }
  return out;
}
const SVC = Object.fromEntries(["enquire_archive", "enquire_snoozes", "enquire_last_notification", "enquire_active_scenarios",
  "enquire_occupancy", "enquire_implicit_deliveries", "enquire_deliveries_by_scenario", "enquire_configuration",
  "enquire_scenarios", "enquire_recipients", "enquire_dry_run", "snooze", "clear_snoozes", "notify"].map((k) => [k, {}]));

function wsAnswer(m, env) {
  const sd = m.service_data || {};
  const docs = (env && env.docs) || DOCS;
  if (env && env.answer) { const r = env.answer(m); if (r !== undefined) return r; }
  if (m.type === "call_service") {
    switch (m.service) {
      case "enquire_archive": {
        if (sd.verbosity === "daily") return { response: { days: daily(sd.after), count: 0 } };
        if (sd.id) return { response: docs.find((d) => d.id === sd.id) || docs[0] };
        const after = sd.after ? Date.parse(sd.after) : 0;
        const list = docs.filter((d) => !after || Date.parse(d.created) >= after).slice(0, sd.limit || 20);
        return { response: { notifications: list, count: list.length } };
      }
      case "enquire_snoozes": return { response: { snoozes: [] } };
      case "enquire_last_notification": return { response: DOCS[0] };
      case "enquire_active_scenarios": return { response: { scenarios: ["morning"] } };
      case "enquire_occupancy": return { response: { scenarios: { home: PEOPLE.map((p) => ({ person: `person.${p}`, enabled: true })), not_home: [] } } };
      case "enquire_implicit_deliveries": return { response: { default: ["mobile_push", "email"] } };
      case "enquire_deliveries_by_scenario": return { response: { morning: { enabled: ["mobile_push"], disabled: [] }, ospiti: { enabled: [], disabled: ["tts_casa"] } } };
      default: return { response: {} };
    }
  }
  if (m.type === "config_entries/get" || m.type === "config_entries/flow/progress" || m.type === "logbook/get_events") return [];
  if (m.type === "repairs/list_issues") return { issues: [] };
  if (m.type === "lovelace/config") return { views: [] };
  return {};
}

// ── instrumented jsdom environment: one bundle per env, counters per env ─────
let CUR = null;
process.on("unhandledRejection", (e) => { if (CUR) CUR.errors.push("unhandled: " + String((e && e.message) || e).slice(0, 160)); });
function makeEnv() {
  const env = { ws: 0, svc: 0, intervals: 0, timeouts: 0, timerMs: 0, moCalls: 0, moMs: 0, renders: 0, html: 0, wsTypes: {}, errors: [], defs: [] };
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => env.errors.push(String((e && ((e.detail && e.detail.message) || e.message)) || e).slice(0, 160)));
  vc.on("error", (...a) => env.errors.push("console.error: " + a.map((x) => String((x && x.message) || x)).join(" ").slice(0, 160)));
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/lovelace/0", virtualConsole: vc });
  const w = dom.window;
  global.window = w; global.document = w.document; global.CustomEvent = w.CustomEvent;
  global.HTMLElement = w.HTMLElement; global.customElements = w.customElements;
  w.customCards = []; w.confirm = () => true; w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => "" });
  if (!w.CSS) w.CSS = { escape: (x) => String(x) };
  const timed = (fn) => function (...a) { const t = performance.now(); try { return fn.apply(this, a); } finally { env.timerMs += performance.now() - t; } };
  // jsdom's window.setTimeout calls the global setTimeout at call time, so only the Node globals are
  // wrapped (window.setTimeout then goes through them too); handles are kept to clear them on close
  env.handles = new Set();
  const keep = (h) => { env.handles.add(h); if (h && h.unref) h.unref(); return h; };
  const MO = w.MutationObserver;
  const G = {
    setInterval: (fn, ms, ...a) => { env.intervals++; return keep(NODE.setInterval(typeof fn === "function" ? timed(fn) : fn, ms, ...a)); },
    setTimeout: (fn, ms, ...a) => { env.timeouts++; return keep(NODE.setTimeout(typeof fn === "function" ? timed(fn) : fn, ms, ...a)); },
    requestAnimationFrame: (fn) => keep(NODE.setTimeout(() => timed(fn)(performance.now()), 16)),
    cancelAnimationFrame: (h) => NODE.clearTimeout(h),
    clearTimeout: (h) => NODE.clearTimeout(h), clearInterval: (h) => NODE.clearInterval(h),
    MutationObserver: class extends MO {
      constructor(cb) { super(function (...a) { env.moCalls++; const t = performance.now(); try { return cb.apply(this, a); } finally { env.moMs += performance.now() - t; } }); }
    },
    fetch: w.fetch, localStorage: w.localStorage, sessionStorage: w.sessionStorage, Node: w.Node, Event: w.Event,
    console: { log() {}, info() {}, debug() {}, warn() {}, error: (...a) => env.errors.push("console.error: " + a.map((x) => String((x && x.message) || x)).join(" ").slice(0, 160)) },
  };
  // the browser has all of these as globals; the bundle (Node realm) and window both see the instrumented ones
  for (const [k, v] of Object.entries(G)) {
    try { Object.defineProperty(w, k, { value: v, writable: true, configurable: true }); } catch (e) { /* ignore */ }
    Object.defineProperty(globalThis, k, { value: v, writable: true, configurable: true });
  }
  // innerHTML assignments (every rebuild of a piece of a card)
  for (const P of [w.Element.prototype, w.ShadowRoot.prototype]) {
    const d = Object.getOwnPropertyDescriptor(P, "innerHTML");
    if (d && d.set) Object.defineProperty(P, "innerHTML", { ...d, set(v) { env.html++; return d.set.call(this, v); } });
  }
  const def = w.customElements.define.bind(w.customElements);
  w.customElements.define = (tag, cls, o) => { env.defs.push([tag, cls]); return def(tag, cls, o); };
  env.dom = dom; env.w = w; CUR = env;
  return env;
}

let EVALS = 0;
function evalBundle(env) {
  const t = performance.now();
  // unique tail: V8 caches Function() compilations by source, which would hide the parse cost
  // the tail hands the bench two shared stores (appliances scenario), nothing the cards see
  new env.w.Function(`${SRC}\ntry { window.__snBench = { snAppl }; } catch (e) {}\n//# bench ${++EVALS}`)();
  const ms = performance.now() - t;
  // count draws: outermost call of _render/_update/_draw/_paint on every defined element class
  const seen = new Set(); let depth = 0;
  for (const [, cls] of env.defs) {
    for (let p = cls.prototype; p && p !== env.w.HTMLElement.prototype; p = Object.getPrototypeOf(p)) {
      if (seen.has(p)) continue; seen.add(p);
      for (const m of ["_render", "_update", "_draw", "_paint"]) {
        const d = Object.getOwnPropertyDescriptor(p, m);
        if (!d || typeof d.value !== "function") continue;
        const orig = d.value;
        p[m] = function (...a) { if (depth++ === 0) env.renders++; try { return orig.apply(this, a); } finally { depth--; } };
      }
    }
  }
  return ms;
}
function closeEnv(env) {
  for (const h of env.handles) { NODE.clearTimeout(h); NODE.clearInterval(h); }
  try { env.w.close(); } catch (e) { /* ignore */ }
  if (CUR === env) CUR = null;
}

function hassFactory(env) {
  const shared = { language: "it", locale: { language: "it", number_format: "language", time_format: "24" },
    themes: { darkMode: false, theme: "default" }, entities: ENTITIES, devices: {}, areas: {},
    services: { supernotify: SVC, notify: { send_message: {} }, homeassistant: {}, script: {} },
    user: { id: "u1", is_admin: true, name: "Lorenzo" }, panels: {},
    config: { version: "2026.10.1", currency: "EUR", time_zone: "Europe/Rome", components: ["supernotify"] },
    connection: { subscribeMessage: async () => () => {}, subscribeEvents: async (cb, type) => { (env.subs = env.subs || []).push([type, cb]); return () => {}; } } };
  if (env.hassExtra) Object.assign(shared, env.hassExtra);
  const callWS = async (m) => { env.ws++; const k = m.type === "call_service" ? m.service : m.type; env.wsTypes[k] = (env.wsTypes[k] || 0) + 1; return wsAnswer(m, env); };
  const callService = async () => { env.svc++; };
  const callApi = async () => ({});
  return (states) => ({ ...shared, states, callWS, callService, callApi, formatEntityState: (s) => (s ? s.state : ""), localize: (k) => k });
}

function countNodes(root) {
  if (!root) return 0;
  let n = 0;
  for (const el of root.querySelectorAll("*")) { n++; if (el.shadowRoot) n += countNodes(el.shadowRoot); }
  return n;
}
const FEATURES = new Set(["supernotify-pause", "supernotify-test", "supernotify-last"]);
function create(env, tag, hass) {
  const cls = env.w.customElements.get(tag);
  const el = env.w.document.createElement(tag);
  let cfg = { type: `custom:${tag}` };
  if (cls && typeof cls.getStubConfig === "function") cfg = { ...cfg, ...(cls.getStubConfig(hass) || {}) };
  if (FEATURES.has(tag)) {
    const id = tag === "supernotify-test" ? "notify.recipient_lorenzo" : "sensor.supernotify_notifications";
    el.context = { entity_id: id }; el.stateObj = hass.states[id];
  }
  if (typeof el.setConfig === "function") el.setConfig(cfg);
  return el;
}
const replace = (st, id, state) => ({ ...st, [id]: S(id, state, st[id].attributes) });
const UNRELATED = (st, i) => replace(st, "sensor.house_0000", String(20 + (i % 50) / 10));
const RELEVANT = [ // one SuperNotify entity per update, rotating
  (st, i) => replace(st, "sensor.supernotify_notifications", String(41 + i)),
  (st) => replace(st, "switch.supernotify_delivery_email", st["switch.supernotify_delivery_email"].state === "on" ? "off" : "on"),
  (st) => replace(st, "binary_sensor.supernotify_scenario_ospiti", st["binary_sensor.supernotify_scenario_ospiti"].state === "on" ? "off" : "on"),
  (st) => replace(st, "switch.supernotify_transport_telegram", st["switch.supernotify_transport_telegram"].state === "on" ? "off" : "on"),
];
const RELEVANT_MUT = (st, i) => RELEVANT[i % RELEVANT.length](st, i);

/** WARM + n hass updates on `els`; per update: setter + microtasks (sync) + bundle timer callbacks. */
async function updates(env, els, mk, start, mutate, n) {
  let st = start;
  const samples = [];
  let r0 = 0, mo0 = 0, ws0 = 0, to0 = 0, mom0 = 0;
  for (let i = 0; i < WARM + n; i++) {
    if (i === WARM) { await settle(40); r0 = env.renders; mo0 = env.moCalls; ws0 = env.ws; to0 = env.timeouts; mom0 = env.moMs; }
    st = mutate(st, i);
    const h = mk(st);
    const tm0 = env.timerMs;
    const t = performance.now();
    for (const el of els) { try { el.hass = h; } catch (e) { env.errors.push("set hass: " + e.message); } }
    await flush();
    const sync = performance.now() - t;
    await nodeTick(0);
    if (i >= WARM) samples.push(sync + (env.timerMs - tm0));
  }
  await settle(40);
  return { ms_med: r2(med(samples)), ms_mean: r2(mean(samples)), renders: env.renders - r0, mo_calls: env.moCalls - mo0,
    mo_ms: r2(env.moMs - mom0), ws: env.ws - ws0, timeouts: env.timeouts - to0, states: st };
}

async function mountFirst(env, tag, mk, states) {
  const h = mk(states);
  const iv0 = env.intervals, ws0 = env.ws, tm0 = env.timerMs, r0 = env.renders;
  const t = performance.now();
  const el = create(env, tag, h);
  env.w.document.body.appendChild(el);
  el.hass = h;
  await flush();
  const sync = performance.now() - t;
  const tm1 = env.timerMs;
  await settle(80);
  return { el, sync, total: sync + (env.timerMs - tm0), timers_ms: env.timerMs - tm1, nodes: countNodes(el.shadowRoot || el),
    intervals: env.intervals - iv0, ws: env.ws - ws0, renders: env.renders - r0 };
}

async function benchCard(tag) {
  const runs = [];
  let errors = [];
  for (let r = 0; r < RUNS + 1; r++) { // run 0 = warm-up, discarded
    const env = makeEnv();
    try {
      evalBundle(env);
      const mk = hassFactory(env);
      const f = await mountFirst(env, tag, mk, BASE_STATES);
      const u = await updates(env, [f.el], mk, BASE_STATES, UNRELATED, UPDATES);
      const v = await updates(env, [f.el], mk, u.states, RELEVANT_MUT, UPDATES);
      delete u.states; delete v.states;
      if (r > 0) runs.push({ f, u, v });
    } catch (e) { env.errors.push("threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e)); }
    errors = errors.concat(env.errors);
    closeEnv(env);
  }
  return { runs, errors: [...new Set(errors)] };
}

function summarizeCard(res) {
  const R = res.runs;
  if (!R.length) return { failed: true, errors: res.errors };
  const pick = (fn) => r2(med(R.map(fn)));
  const max = (fn) => Math.max(...R.map(fn));
  return {
    first_render_ms: pick((x) => x.f.sync), first_render_total_ms: pick((x) => x.f.total), nodes: max((x) => x.f.nodes),
    first_intervals: max((x) => x.f.intervals), first_ws: max((x) => x.f.ws), first_renders: max((x) => x.f.renders),
    unrelated: { ms_per_update: pick((x) => x.u.ms_med), ms_mean: pick((x) => x.u.ms_mean), renders: max((x) => x.u.renders),
      mo_calls: max((x) => x.u.mo_calls), ws: max((x) => x.u.ws), timeouts: max((x) => x.u.timeouts) },
    relevant: { ms_per_update: pick((x) => x.v.ms_med), ms_mean: pick((x) => x.v.ms_mean), renders: max((x) => x.v.renders),
      mo_calls: max((x) => x.v.mo_calls), ws: max((x) => x.v.ws), timeouts: max((x) => x.v.timeouts) },
    errors: res.errors,
  };
}

async function benchEval() {
  const times = [];
  let tags = [], cards = 0, cold = 0;
  for (let i = 0; i < EVAL_RUNS + 1; i++) {
    const env = makeEnv();
    const ms = evalBundle(env);
    if (i > 0) times.push(ms); else cold = ms;
    tags = env.defs.map(([t]) => t); cards = env.w.customCards.length;
    closeEnv(env);
    await nodeTick(0);
  }
  return { eval_ms: r2(med(times)), eval_cold_ms: r2(cold), eval_runs: times.map(r2), tags, customCards: cards };
}

/** Card picker: HA builds a preview of every window.customCards entry with getStubConfig(hass). */
async function benchPicker() {
  const runs = [];
  let detail = [], strategy = null, errors = [];
  for (let r = 0; r < RUNS + 1; r++) {
    const env = makeEnv();
    try {
      evalBundle(env);
      const mk = hassFactory(env);
      const h = mk(BASE_STATES);
      const box = env.w.document.createElement("div");
      env.w.document.body.appendChild(box);
      const iv0 = env.intervals, ws0 = env.ws, tm0 = env.timerMs;
      const per = [];
      const t = performance.now();
      for (const entry of env.w.customCards) {
        const tag = String(entry.type || "").replace(/^custom:/, "");
        const e0 = performance.now(), i0 = env.intervals, w0 = env.ws;
        let el = null;
        try { el = create(env, tag, h); box.appendChild(el); el.hass = h; } catch (e) { env.errors.push(`picker ${tag}: ${e.message}`); }
        per.push({ tag, el, ms: performance.now() - e0, intervals: env.intervals - i0, ws_sync: env.ws - w0 });
      }
      await flush();
      const sync = performance.now() - t;
      await settle(150);
      const nodes = per.reduce((n, p) => n + (p.el ? countNodes(p.el.shadowRoot || p.el) : 0), 0);
      runs.push({ sync, total: sync + (env.timerMs - tm0), nodes, intervals: env.intervals - iv0, ws: env.ws - ws0 });
      if (r === RUNS) detail = per.map((p) => ({ tag: p.tag, ms: r2(p.ms), nodes: p.el ? countNodes(p.el.shadowRoot || p.el) : 0, intervals: p.intervals, ws_sync: p.ws_sync }));
      if (r === RUNS) strategy = await benchStrategy(env, mk);
    } catch (e) { env.errors.push("picker threw: " + e.message); }
    errors = errors.concat(env.errors);
    closeEnv(env);
  }
  const R = runs.slice(1);
  return { entries: detail.length, ms: r2(med(R.map((x) => x.sync))), total_ms: r2(med(R.map((x) => x.total))),
    nodes: Math.max(0, ...R.map((x) => x.nodes)), intervals: Math.max(0, ...R.map((x) => x.intervals)),
    ws: Math.max(0, ...R.map((x) => x.ws)), detail, strategy, errors: [...new Set(errors)] };
}

async function benchStrategy(env, mk) {
  const cls = env.w.customElements.get("ll-strategy-dashboard-supernotify");
  if (!cls || typeof cls.generate !== "function") return null;
  const times = [];
  let out = null;
  const ws0 = env.ws;
  for (let i = 0; i < 6; i++) {
    const t = performance.now();
    out = await cls.generate({ type: "custom:supernotify" }, mk(BASE_STATES));
    if (i > 0) times.push(performance.now() - t);
  }
  const views = (out && out.views) || [];
  const cards = views.reduce((n, v) => n + (v.sections || []).reduce((m, s) => m + (s.cards || []).length, 0), 0);
  return { ms: r2(med(times)), views: views.length, cards, ws_per_call: r2((env.ws - ws0) / 6) };
}

/** Every card on one page, then unrelated updates pushed to all of them (as HA does). */
async function benchPage(tags) {
  const runs = [];
  let errors = [];
  for (let r = 0; r < RUNS + 1; r++) {
    const env = makeEnv();
    try {
      evalBundle(env);
      const mk = hassFactory(env);
      const h = mk(BASE_STATES);
      const iv0 = env.intervals, tm0 = env.timerMs;
      const t = performance.now();
      const els = [];
      for (const tag of tags) {
        try { const el = create(env, tag, h); env.w.document.body.appendChild(el); el.hass = h; els.push(el); }
        catch (e) { env.errors.push(`page ${tag}: ${e.message}`); }
      }
      await flush();
      const mount = performance.now() - t;
      await settle(200);
      const nodes = els.reduce((n, el) => n + countNodes(el.shadowRoot || el), 0);
      const mountTotal = mount + (env.timerMs - tm0), intervals = env.intervals - iv0, ws = env.ws;
      const u = await updates(env, els, mk, BASE_STATES, UNRELATED, UPDATES);
      delete u.states;
      if (r > 0) runs.push({ mount, mountTotal, nodes, intervals, ws, u });
    } catch (e) { env.errors.push("page threw: " + e.message); }
    errors = errors.concat(env.errors);
    closeEnv(env);
  }
  const p = (fn) => r2(med(runs.map(fn)));
  return { cards: tags.length, mount_ms: p((x) => x.mount), mount_total_ms: p((x) => x.mountTotal), nodes: p((x) => x.nodes),
    intervals: p((x) => x.intervals), ws_at_mount: p((x) => x.ws), unrelated_ms_per_update: p((x) => x.u.ms_med),
    unrelated_ms_mean: p((x) => x.u.ms_mean), unrelated_renders: p((x) => x.u.renders), unrelated_mo_calls: p((x) => x.u.mo_calls),
    unrelated_ws: p((x) => x.u.ws), errors: [...new Set(errors)] };
}

// ── 1.0.0: archive scenario ─────────────────────────────────────────────────
/** Counts the calls of one prototype method (outermost only) into env[key]. */
function countMethod(env, tag, m, key) {
  const p = env.w.customElements.get(tag).prototype;
  const orig = p[m];
  let depth = 0;
  env[key] = 0;
  p[m] = function (...a) { if (depth++ === 0) env[key]++; try { return orig.apply(this, a); } finally { depth--; } };
}
const archDoc = (i, t) => ({
  id: `a${pad(i)}${String(t).slice(-6)}-0000-0000`, created: iso(t), message: `Messaggio ${i}`, title: `Titolo ${i % 40}`,
  priority: ["low", "medium", "high", "critical"][i % 4], outcome: i % 11 === 0 ? "partial_delivery" : "success",
  delivered: 1, failed: 0, skipped: i % 11 === 0 ? 1 : 0, missed: 0,
  deliveries: { mobile_push: { success: [{ calls: [{}] }] }, ...(i % 11 === 0 ? { email: { skipped: { suppression_reason: "NO_TARGET" } } } : {}) },
  condition_variables: { notification_title: `Titolo ${i % 40}` }, extra_data: {}, actions: [],
});
async function benchArchive() {
  const EVENTS = QUICK ? 20 : 100, NEWN = QUICK ? 5 : 20;
  const runs = [];
  let errors = [];
  for (let r = 0; r < RUNS + 1; r++) {
    const env = makeEnv();
    try {
      env.docs = Array.from({ length: 200 }, (_, i) => archDoc(i, NOW - i * 23 * 60e3));
      evalBundle(env);
      countMethod(env, "supernotify-archive-card", "_renderList", "lists");
      const mk = hassFactory(env);
      let st = BASE_STATES;
      const el = create(env, "supernotify-archive-card", mk(st));
      env.w.document.body.appendChild(el);
      el.hass = mk(st);
      await settle(200);
      const rows = el.shadowRoot.querySelectorAll("#list .it").length;
      // a supernotify-archive event with nothing new (another card's read, the priority counts)
      const l0 = env.lists, h0 = env.html, tm0 = env.timerMs;
      const t0 = performance.now();
      for (let i = 0; i < EVENTS; i++) { env.w.dispatchEvent(new env.w.CustomEvent("supernotify-archive")); await flush(); }
      const evSync = performance.now() - t0;
      await settle(60);
      const ev = { ms_per_event: r2((evSync + env.timerMs - tm0) / EVENTS), lists_per_event: r2((env.lists - l0) / EVENTS), html_per_event: r2((env.html - h0) / EVENTS) };
      // a new notification: the counter moves and SuperNotify fires supernotify_notification
      const live = (env.subs || []).find(([type]) => type === "supernotify_notification");
      const l1 = env.lists, h1 = env.html, w1 = env.ws, tm1 = env.timerMs;
      let busy = 0;
      for (let i = 0; i < NEWN; i++) {
        env.docs.unshift(archDoc(1000 + i, Date.now()));
        st = replace(st, "sensor.supernotify_notifications", String(100 + i));
        st["sensor.supernotify_notifications"].last_updated = iso(Date.now() + i);
        const t1 = performance.now();
        el.hass = mk(st);
        if (live) live[1]({ event_type: "supernotify_notification" });
        await flush();
        busy += performance.now() - t1;
        await settle(400);
      }
      busy += env.timerMs - tm1;
      const nn = { ms_per_new: r2(busy / NEWN), lists_per_new: r2((env.lists - l1) / NEWN),
        html_per_new: r2((env.html - h1) / NEWN), ws_per_new: r2((env.ws - w1) / NEWN), live: !!live };
      if (r > 0) runs.push({ rows, ev, nn });
    } catch (e) { env.errors.push("archive threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e)); }
    errors = errors.concat(env.errors);
    closeEnv(env);
  }
  const p = (fn) => r2(med(runs.map(fn)));
  return { rows: p((x) => x.rows), ms_per_event: p((x) => x.ev.ms_per_event), lists_per_event: p((x) => x.ev.lists_per_event),
    html_per_event: p((x) => x.ev.html_per_event), ms_per_new: p((x) => x.nn.ms_per_new), lists_per_new: p((x) => x.nn.lists_per_new),
    html_per_new: p((x) => x.nn.html_per_new), ws_per_new: p((x) => x.nn.ws_per_new), errors: [...new Set(errors)] };
}

// ── 1.0.0: appliances scenario ──────────────────────────────────────────────
const APPL = [["e_lav", "Lavatrice", "lavatrice"], ["e_lst", "Lavastoviglie", "lavastoviglie"], ["e_asc", "Asciugatrice", "asciugatrice"]];
function applStates(w) {
  const s = {};
  for (const [, title, slug] of APPL) {
    s[`sensor.${slug}_power`] = S(`sensor.${slug}_power`, slug === "lavatrice" ? String(w) : "0.4", { friendly_name: `${title} Power`, device_class: "power", state_class: "measurement", unit_of_measurement: "W" });
    s[`switch.${slug}_plug`] = S(`switch.${slug}_plug`, "on", { friendly_name: `${title} Plug` });
  }
  return s;
}
function applStats(m) {
  const out = {};
  const from = Date.parse(m.start_time), to = Date.parse(m.end_time);
  const dt = m.period === "hour" ? 3600e3 : 300e3;
  for (const id of m.statistic_ids || []) {
    const rows = [];
    for (let t = Math.ceil(from / dt) * dt; t < to; t += dt) {
      const h = new Date(t).getHours();
      const on = (h === 9 || h === 20) && new Date(t).getMinutes() < 50; // two cycles a day
      rows.push({ start: t, end: t + dt, mean: on ? 600 : 0.5, max: on ? 2000 : 1 });
    }
    out[id] = rows;
  }
  return out;
}
async function benchAppliances() {
  const runs = [];
  let errors = [];
  for (let r = 0; r < RUNS + 1; r++) {
    const env = makeEnv();
    try {
      const ents = { ...ENTITIES }, devs = {};
      for (const [, title, slug] of APPL) {
        devs[`d_${slug}`] = { id: `d_${slug}`, name: `${title} Plug` };
        for (const id of [`sensor.${slug}_power`, `switch.${slug}_plug`]) ents[id] = { entity_id: id, device_id: `d_${slug}`, platform: "shelly", entity_category: null, hidden: false };
      }
      env.hassExtra = { entities: ents, devices: devs };
      env.answer = (m) => {
        if (m.type === "config_entries/get") return APPL.map(([entry_id, title]) => ({ entry_id, title, domain: "appliance_autonotify", source: "user" }));
        if (m.type === "recorder/statistics_during_period") return applStats(m);
        return undefined;
      };
      evalBundle(env);
      countMethod(env, "supernotify-appliances-card", "_renderPanel", "panels");
      const mk = hassFactory(env);
      let st = { ...BASE_STATES, ...applStates(1500) };
      const el = create(env, "supernotify-appliances-card", mk(st));
      env.w.document.body.appendChild(el);
      el.hass = mk(st);
      await settle(300);
      const ws0 = env.ws;
      const power = (i) => (stt) => { const n = replace(stt, "sensor.lavatrice_power", String(1500 + (i % 50) * 7)); n["sensor.lavatrice_power"].last_changed = iso(NOW - 30 * 60e3); return n; };
      const run = async (label) => {
        const h0 = env.html, w0 = env.ws, r0 = env.renders;
        const u = await updates(env, [el], mk, st, (stt, i) => power(i)(stt), UPDATES);
        st = u.states;
        return { label, ms_per_update: u.ms_med, ms_mean: u.ms_mean, renders: u.renders, html: env.html - h0, ws: env.ws - w0 };
      };
      const list = await run("list");
      el._openPanel("e_lav");
      await settle(100);
      const panel = await run("panel");
      // a refresh of the statistics (every 10 min in the page): 5-minute rows read again, and duplicate reads
      const A = env.w.__snBench && env.w.__snBench.snAppl;
      let refresh = null;
      if (A) {
        let rowsRead = 0, calls = 0;
        const prev = env.answer;
        env.answer = (m) => {
          if (m.type === "recorder/statistics_during_period") { const o = applStats(m); calls++; rowsRead += Object.values(o).reduce((n, x) => n + x.length, 0); return o; }
          return prev(m);
        };
        const h = mk(st);
        const aps = A.appliances(h, el._config);
        for (const e of A.stats.values()) e.at = 0;
        for (const ap of aps) { A.loadStats(h, ap); A.loadStats(h, ap); } // twice: the second must not read again
        await settle(100);
        refresh = { calls, rows: rowsRead };
        env.answer = prev;
      }
      if (r > 0) runs.push({ list, panel, ws_first: ws0, refresh });
    } catch (e) { env.errors.push("appliances threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" | ") : e)); }
    errors = errors.concat(env.errors);
    closeEnv(env);
  }
  const p = (fn) => r2(med(runs.map(fn)));
  const side = (k) => ({ ms_per_update: p((x) => x[k].ms_per_update), ms_mean: p((x) => x[k].ms_mean), renders: p((x) => x[k].renders),
    html: p((x) => x[k].html), ws: p((x) => x[k].ws) });
  return { ws_first: p((x) => x.ws_first), list: side("list"), panel: side("panel"),
    refresh_calls: p((x) => (x.refresh ? x.refresh.calls : NaN)), refresh_rows: p((x) => (x.refresh ? x.refresh.rows : NaN)), errors: [...new Set(errors)] };
}

// ── main ────────────────────────────────────────────────────────────────────
const T0 = performance.now();
const out = { bundle: BUNDLE, bytes: BYTES, lines: SRC.split("\n").length, node: process.version, date: new Date().toISOString(),
  config: { entities: Object.keys(BASE_STATES).length, updates: UPDATES, warmup: WARM, runs: RUNS } };
const want = (k) => !ONLY || ONLY.has(k);
const ev = await benchEval();
Object.assign(out, { eval_ms: ev.eval_ms, eval_cold_ms: ev.eval_cold_ms, eval_runs: ev.eval_runs, customCards: ev.customCards });
const tags = ev.tags.filter((t) => t.startsWith("supernotify-"));
out.cards = {};
for (const tag of want("cards") ? tags : []) {
  process.stderr.write(`  bench ${tag}...\n`);
  out.cards[tag] = summarizeCard(await benchCard(tag));
}
if (want("picker")) {
  process.stderr.write("  bench picker + strategy...\n");
  out.picker = await benchPicker();
  out.strategy = out.picker.strategy; delete out.picker.strategy;
}
if (want("page")) {
  process.stderr.write("  bench page...\n");
  out.page = await benchPage(tags);
}
if (want("archive")) {
  process.stderr.write("  bench archive...\n");
  out.archive = await benchArchive();
}
if (want("appliances")) {
  process.stderr.write("  bench appliances...\n");
  out.appliances = await benchAppliances();
}
out.wall_s = r2((performance.now() - T0) / 1000);

const col = (v, w) => String(v ?? "-").padStart(w);
const L = [];
L.push(`SuperNotify bench - ${BUNDLE} (${(BYTES / 1024).toFixed(0)} KB, ${out.lines} lines), ${out.config.entities} entities, node ${process.version}`);
L.push(`eval: ${out.eval_ms} ms median of ${EVAL_RUNS} fresh JSDOMs (first, cold process: ${out.eval_cold_ms} ms); ${out.customCards} customCards entries; ${tags.length} supernotify-* elements`);
L.push("");
L.push("card                         first  1st+tmr  nodes iv ws | unrel ms/upd rnd   MO  ws | relev ms/upd rnd   MO  ws | err");
for (const [tag, c] of Object.entries(out.cards)) {
  if (c.failed) { L.push(`${tag.padEnd(27)} FAILED ${c.errors.length} errors`); continue; }
  const u = c.unrelated, v = c.relevant;
  L.push(`${tag.replace(/^supernotify-/, "").padEnd(27)}${col(c.first_render_ms, 6)}${col(c.first_render_total_ms, 9)}${col(c.nodes, 7)}${col(c.first_intervals, 3)}${col(c.first_ws, 3)} |` +
    `${col(u.ms_per_update, 13)}${col(u.renders, 4)}${col(u.mo_calls, 5)}${col(u.ws, 4)} |${col(v.ms_per_update, 13)}${col(v.renders, 4)}${col(v.mo_calls, 5)}${col(v.ws, 4)} |${col(c.errors.length, 4)}`);
}
L.push(`  (ms = median; first = create+setConfig+append+hass sync; 1st+tmr adds timer callbacks while settling; iv = setInterval started;`);
L.push(`   ws = callWS calls; rnd = _render/_update/_draw/_paint calls over ${UPDATES} updates; MO = MutationObserver callbacks)`);
L.push("");
const pk = out.picker || { entries: 0, detail: [], errors: [] };
if (out.picker) L.push(`picker: ${pk.entries} previews  ${pk.ms} ms sync / ${pk.total_ms} ms incl. timers  nodes ${pk.nodes}  setInterval ${pk.intervals}  callWS ${pk.ws}  errors ${pk.errors.length}`);
for (const d of pk.detail || []) L.push(`   ${d.tag.replace(/^supernotify-/, "").padEnd(24)}${col(d.ms, 8)} ms${col(d.nodes, 7)} nodes  iv ${d.intervals}  ws(sync) ${d.ws_sync}`);
const sg = out.strategy;
if (out.picker) L.push(sg ? `strategy generate: ${sg.ms} ms median, ${sg.views} views, ${sg.cards} cards, ${sg.ws_per_call} callWS/call` : "strategy: not found");
const pg = out.page || { errors: [] };
if (out.page) L.push(`page (${pg.cards} elements): mount ${pg.mount_ms} ms sync / ${pg.mount_total_ms} ms incl. timers, nodes ${pg.nodes}, setInterval ${pg.intervals}, callWS ${pg.ws_at_mount}`);
if (out.page) L.push(`   ${UPDATES} unrelated updates: ${pg.unrelated_ms_per_update} ms/update median (${pg.unrelated_ms_mean} mean), renders ${pg.unrelated_renders}, MO ${pg.unrelated_mo_calls}, callWS ${pg.unrelated_ws}, errors ${pg.errors.length}`);
const ar = out.archive;
if (ar) {
  L.push(`archive (${ar.rows} rows drawn): supernotify-archive event with nothing new ${ar.ms_per_event} ms, ${ar.lists_per_event} list redraws, ${ar.html_per_event} innerHTML`);
  L.push(`   per new notification: ${ar.ms_per_new} ms (setter + timers), ${ar.lists_per_new} list redraws, ${ar.html_per_new} innerHTML, ${ar.ws_per_new} callWS`);
}
const apl = out.appliances;
if (apl) {
  for (const k of ["list", "panel"]) {
    const x = apl[k];
    L.push(`appliances ${k.padEnd(5)} (${UPDATES} power changes): ${x.ms_per_update} ms/update median (${x.ms_mean} mean), renders ${x.renders}, innerHTML ${x.html}, callWS ${x.ws}`);
  }
  L.push(`   statistics refresh of 3 plugs (loadStats twice each): ${apl.refresh_calls} reads, ${apl.refresh_rows} rows`);
}
const errs = Object.entries(out.cards).filter(([, c]) => c.errors && c.errors.length);
const extraErr = [...((ar && ar.errors) || []).map((e) => "archive: " + e), ...((apl && apl.errors) || []).map((e) => "appliances: " + e)];
if (errs.length || pk.errors.length || pg.errors.length || extraErr.length) {
  L.push("", "errors:");
  for (const [tag, c] of errs) for (const e of c.errors.slice(0, 4)) L.push(`   ${tag}: ${e}`);
  for (const e of pk.errors.slice(0, 6)) L.push(`   picker: ${e}`);
  for (const e of pg.errors.slice(0, 6)) L.push(`   page: ${e}`);
  for (const e of extraErr.slice(0, 8)) L.push(`   ${e}`);
}
L.push("", `wall time ${out.wall_s} s`);
NODE.console.log(L.join("\n"));
if (JSON_OUT) { fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 2)); NODE.console.log(`JSON written to ${JSON_OUT}`); }
process.exit(0);
