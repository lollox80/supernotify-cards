// v0.69.0: conteggi giornalieri dalle statistiche a lungo termine del contatore di SuperNotify
// (sensor.supernotify_notifications, total_increasing), senza utility_meter.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 60));
const day = 86400000;
const midnight = (back) => { const d = new Date(Date.now() - back * day); d.setHours(0, 0, 0, 0); return d.getTime(); };
const key = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// contatore nativo: 3 giorni completi (10, 20, 30) + oggi compilato solo in parte (4)
const native = [
  { start: midnight(3), change: 10, state: 1010 },
  { start: midnight(2), change: 20, state: 1030 },
  { start: midnight(1), change: 30, state: 1060 },
  { start: midnight(0), change: 4, state: 1064 },
];
// utility meter: solo l'altro ieri (prevale sul nativo per quel giorno)
const meter = [{ start: midnight(2), change: 21 }];
const asked = [];
const mkHass = (withMeter) => ({
  language: "it", themes: { darkMode: false }, entities: {}, services: { supernotify: { notify: {} } },
  states: {
    "sensor.supernotify_notifications": { state: "1067", attributes: {} },
    ...(withMeter ? { "sensor.supernotify_inviate_oggi": { state: "8", attributes: { last_period: "30" } } } : {}),
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.type === "recorder/statistics_during_period") {
      asked.push(m.statistic_ids.join(","));
      const out = {};
      if (m.statistic_ids.includes("sensor.supernotify_notifications")) out["sensor.supernotify_notifications"] = native;
      if (withMeter && m.statistic_ids.includes("sensor.supernotify_inviate_oggi")) out["sensor.supernotify_inviate_oggi"] = meter;
      return out;
    }
    if (m.type === "history/history_during_period") return {};
    return { response: {} };
  },
});
const mount = (tag, cfg, hass) => { const el = document.createElement(tag); el.setConfig(cfg); document.body.appendChild(el); el.hass = hass; return el; };

// ── stats senza utility meter ─────────────────────────────────────────────
const h1 = mkHass(false);
const s1 = mount("supernotify-stats-card", { days: 7, sent_today_entity: "" }, h1);
await tick(); await tick();
const d1 = s1._data;
const byKey = Object.fromEntries((d1 && d1.perDay || []).map((x) => [x.key, x.n]));
ok(byKey[key(midnight(3))] === 10 && byKey[key(midnight(2))] === 20 && byKey[key(midnight(1))] === 30,
  `giorni completi dal contatore nativo (${JSON.stringify(byKey)})`);
ok(byKey[key(midnight(0))] === 7, "oggi = stato attuale (1067) meno la mezzanotte (1060), non il 4 compilato");
ok(asked.includes("sensor.supernotify_notifications"), "chiede le statistiche del contatore nativo");

// ── stats con utility meter: il meter vince dove c'è, il nativo copre il resto ─────
asked.length = 0;
const h2 = mkHass(true);
const s2 = mount("supernotify-stats-card", { days: 7 }, h2);
await tick(); await tick();
const k2 = Object.fromEntries((s2._data && s2._data.perDay || []).map((x) => [x.key, x.n]));
ok(k2[key(midnight(2))] === 21, "il giorno coperto dal meter usa il meter");
ok(k2[key(midnight(3))] === 10 && k2[key(midnight(1))] === 30, "i giorni senza meter li riempie il nativo");
ok(k2[key(midnight(0))] === 8, "oggi dal meter (8), non dal nativo (7)");

// ── stats con count_entity spento: comportamento di prima ──────────────────
const s3 = mount("supernotify-stats-card", { days: 7, count_entity: "" }, mkHass(true));
await tick(); await tick();
const k3 = Object.fromEntries((s3._data && s3._data.perDay || []).map((x) => [x.key, x.n]));
ok(k3[key(midnight(3))] === 0, "count_entity: \"\" = solo meter e cronologia, come prima");

// ── overview senza meter: Inviate oggi + ieri ──────────────────────────────
const o = mount("supernotify-overview-card", { stats: "full", sent_today_entity: "" }, mkHass(false));
await tick(); o.hass = { ...mkHass(false) }; await tick(); await tick();
const stats = [...o.shadowRoot.querySelectorAll(".stat")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
console.log("    numeri:", stats.join(" | "));
ok(stats.some((t) => /Inviate oggi\s*7/i.test(t) && /ieri: 30/.test(t)), "overview: inviate oggi 7, ieri 30, senza utility meter");

// ── overview con meter: invariata ──────────────────────────────────────────
const o2 = mount("supernotify-overview-card", { stats: "full" }, mkHass(true));
await tick(); o2.hass = { ...mkHass(true) }; await tick(); await tick();
const st2 = [...o2.shadowRoot.querySelectorAll(".stat")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
ok(st2.some((t) => /Inviate oggi/i.test(t) && /ieri: 30/.test(t)), "overview con meter: last_period del meter come prima");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
