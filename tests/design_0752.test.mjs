// CHANGELOG
// 2026-10-05 v0.75.2: conteggi giornalieri tenuti nel browser, poi solo i giorni nuovi.
// 2026-10-23 v1.0.0: le letture qui verificano la cache del browser: la memoria di 60 s (fase 3) va azzerata prima di ognuna.
import { boot, load, ok, dom, fail } from "./_harness.mjs";

boot({ url: "http://ha.local/" });
const G = load("snStatsDaily");

const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const asks = [];
const hass = { callWS: async (m) => {
  const after = Date.parse(m.service_data.after); asks.push(after);
  const days = [];
  for (let t = after; t <= Date.now(); t += 86400000) days.push({ date: key(new Date(t)), count: 5, hour: new Array(24).fill(0) });
  return { response: { days } };
} };
dom.window.localStorage.clear();
const start = new Date(Date.now() - 14 * 86400000); start.setHours(0, 0, 0, 0);
const d1 = await G.snStatsDaily.get(hass, start.getTime());
ok(d1.length === 15 && asks[0] === start.getTime(), `prima volta: tutto il periodo (${d1.length} giorni)`);
G.snStatsDaily.memo = null;
const d2 = await G.snStatsDaily.get(hass, start.getTime());
const today = new Date(); today.setHours(0, 0, 0, 0);
ok(asks[1] === today.getTime() && d2.length === 15, "seconda volta: solo da oggi, stessi giorni");
const s7 = new Date(Date.now() - 7 * 86400000); s7.setHours(0, 0, 0, 0);
G.snStatsDaily.memo = null;
const d3 = await G.snStatsDaily.get(hass, s7.getTime());
ok(asks[2] === today.getTime() && d3.length === 8 && d3[0].date === key(s7), "finestra più corta: dalla cache");
const s30 = new Date(Date.now() - 30 * 86400000); s30.setHours(0, 0, 0, 0);
G.snStatsDaily.memo = null;
await G.snStatsDaily.get(hass, s30.getTime());
ok(asks[3] === s30.getTime(), "finestra più lunga: rilegge tutto il periodo");
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
