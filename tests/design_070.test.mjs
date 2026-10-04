// CHANGELOG
// 2026-10-04 v0.70.0: statistiche dall'archivio (SuperNotify 2.12.1), cache nel browser, composer senza force_resend.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const day = 86400000;
// archive: 3 notifications per day for 40 days, at 9:00, 13:00, 21:30; one dupe per day
const ARCH = [];
for (let i = 0; i < 40; i++) {
  const base = new Date(Date.now() - i * day); base.setSeconds(0, 0);
  for (const [h, m, prio, band, out] of [[9, 0, "medium", "morning", "success"], [13, 0, "high", "afternoon", "partial_delivery"], [21, 30, "low", "evening", "success"], [21, 31, "low", "evening", "dupe"]]) {
    const d = new Date(base); d.setHours(h, m, 0, 0);
    if (d.getTime() > Date.now()) continue;
    ARCH.push({ id: `n${i}-${h}-${m}`, created: d.toISOString(), outcome: out, priority: prio,
      // older archive files: scenarios as an object keyed by name
      scenarios: i % 5 === 4 ? { multi_home: { name: "multi_home" }, [band]: { name: band } } : ["multi_home", band], deliveries: out === "dupe" ? {} : { mobile_push: { success: 1 }, alexa_announce: h === 13 ? { failed: 1 } : { skipped: "NO_TARGET" } } });
  }
}
const asks = [];
const mkHass = (ver) => ({
  language: "it", themes: { darkMode: false },
  services: { supernotify: { enquire_archive: {}, notify: { response: { optional: true } } } },
  states: { "update.supernotify_update": { state: "off", attributes: { installed_version: ver } },
    "sensor.supernotify_inviate_oggi": { state: "999", attributes: {} } },
  callService: async () => {},
  callWS: async (m) => {
    if (m.service === "enquire_archive") {
      asks.push(m.service_data);
      const a = Date.parse(m.service_data.after), b = m.service_data.before ? Date.parse(m.service_data.before) : Infinity;
      return { response: { notifications: ARCH.filter((n) => { const t = Date.parse(n.created); return t >= a && t <= b; }), count: 0 } };
    }
    if (m.type === "history/history_during_period") { asks.push("history"); return {}; }
    if (m.service === "notify") { asks.push({ notify: m.service_data }); return { response: { id: "x", deliveries: {} } }; }
    return {};
  },
});

// (1) 2.12.1: archive, one call per day, progress, dupes left out, today from archive
dom.window.localStorage.clear();
const c = document.createElement("supernotify-stats-card");
c.setConfig({});
document.body.appendChild(c);
c.hass = mkHass("v2.12.1-beta1");
await wait(150);
const d = c._data;
ok(d && d.archive, "2.12.1: statistiche dall'archivio");
ok(!asks.includes("history"), "niente cronologia degli helper");
// 0.74.0: first a probe for verbosity daily; this SuperNotify does not answer it, so day by day
ok(asks[0].verbosity === "daily", "prima prova verbosity daily");
ok(asks.slice(1).every((a) => a.verbosity === "summary" && a.limit >= 1000), "poi verbosity summary e limit alto");
const perDayCalls = asks.filter((a) => a.before).length;
ok(perDayCalls >= 14 && perDayCalls <= 16, `un giorno per chiamata (${perDayCalls})`);
const full = d.perDay.filter((x) => !x.today);
ok(full.every((x) => x.n === 3), `3 al giorno, il doppione escluso (${full.map((x) => x.n).join(",")})`);
ok(d.perDay[d.perDay.length - 1].n !== 999, "oggi dall'archivio, non dal contatore");
ok(d.prioCount.high && d.prioCount.medium && d.prioCount.low && !d.prioCount[""], `priorità (${JSON.stringify(d.prioCount)})`);
ok(d.periodCount.morning && d.periodCount.afternoon && d.periodCount.evening && !d.periodCount.multi_home, `fascia del giorno dallo scenario (${JSON.stringify(d.periodCount)})`);
const alexa = d.channels.find((x) => x.name === "alexa_announce");
const push = d.channels.find((x) => x.name === "mobile_push");
ok(push && push.ok > 40 && alexa && alexa.ko > 10 && !alexa.ok, `canali inviati/falliti (${JSON.stringify(d.channels)})`);
ok(d.perHour[13] && d.perHour[21] && d.perHour[9], "per ora");
ok(/archivio di SuperNotify/.test(c.shadowRoot.getElementById("win").textContent), "lo dice in testa");
const cache = JSON.parse(dom.window.localStorage.getItem("supernotify-stats-archive"));
ok(cache && cache.rows.length >= 45 && cache.upto, `righe salvate nel browser (${cache && cache.rows.length})`);

// (2) second card / reload: only what came after
asks.length = 0;
const c2 = document.createElement("supernotify-stats-card");
c2.setConfig({});
document.body.appendChild(c2);
c2.hass = mkHass("v2.12.1-beta1");
await wait(100);
ok(asks.length === 1 && !asks[0].before, `riapertura: una sola chiamata per il nuovo (${asks.length})`);
ok(c2._data.perDay.filter((x) => !x.today).every((x) => x.n === 3), "stessi numeri dalla cache");

// (3) 30 days: only the older days are read
asks.length = 0;
c2._setDays(30);
await wait(150);
const older = asks.filter((a) => a.before).length;
ok(older >= 15 && older <= 17, `30 giorni: letti solo i giorni mancanti (${older})`);
ok(c2._data.perDay.length >= 30, "30 giorni nel grafico");

// (4) 2.12.0: still the helpers' history; source: archive forces it
asks.length = 0;
const c3 = document.createElement("supernotify-stats-card");
c3.setConfig({});
document.body.appendChild(c3);
c3.hass = mkHass("v2.12.0");
await wait(60);
ok(asks.includes("history") && !c3._data.archive, "2.12.0: cronologia degli helper come prima");
const c4 = document.createElement("supernotify-stats-card");
c4.setConfig({ source: "archive" });
document.body.appendChild(c4);
c4.hass = mkHass("v2.12.0");
await wait(60);
ok(c4._data && c4._data.archive, "source: archive la forza");

// (5) composer: on 2.12.1 no force_resend, dupe check on; on 2.12.0 as before
for (const [ver, fr] of [["v2.12.1-beta1", false], ["v2.12.0", true]]) {
  asks.length = 0;
  const k = document.createElement("supernotify-composer-card");
  k.setConfig({});
  document.body.appendChild(k);
  k.hass = mkHass(ver);
  k.shadowRoot.getElementById("m").value = "Porta aperta";
  await k._dryRun();
  const n = asks.find((a) => a.notify);
  ok(n && !!n.notify.force_resend === fr, `${ver}: dry run force_resend=${fr}`);
  ok(fr || !k._dryKey, `${ver}: l'invio dopo la prova non aggiunge force_resend`);
}

console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
