// CHANGELOG
// 2026-10-04 v0.74.0: pronte per supernotify.snooze, l'attributo overridden e enquire_archive daily;
//   automazioni senza intestazioni ripetute, composer senza canali spenti, control status: false.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/lovelace/0" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const G = new dom.window.Function(SRC + "\nreturn { snNativeHealth, snNativePause, snChannelsOff, snStatsDaily };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const S = (state, attributes = {}) => ({ state, attributes, last_changed: "2026-10-04T10:00:00Z" });

let snoozes = [];
const calls = [];
const mk = ({ states, snooze = true, admin = true, daily = null }) => ({
  language: "it", themes: { darkMode: false }, entities: {}, states,
  services: { supernotify: { enquire_archive: {}, clear_snoozes: {}, ...(snooze ? { snooze: {} } : {}) } },
  user: { id: "u1", is_admin: admin },
  callService: async (d, s, data) => { calls.push(["svc", `${d}.${s}`, data]); },
  callApi: async (m, p, d) => { calls.push(["api", p, d]); },
  callWS: async (m) => {
    calls.push(["ws", m.service || m.type, m.service_data]);
    if (m.service === "enquire_snoozes") return { response: { snoozes } };
    if (m.service === "enquire_archive" && m.service_data.verbosity === "daily") {
      if (!daily) throw new Error("value must be one of ['summary', 'standard', 'full']");
      return { response: { days: daily, count: 0 } };
    }
    return { response: {} };
  },
});
const base = {
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push", transport: "mobile_push" }),
  "switch.supernotify_delivery_sms_fallback": S("off", { name: "sms_fallback", transport: "sms" }),
  "switch.supernotify_delivery_alexa_announce": S("on", { name: "alexa_announce", transport: "alexa_devices" }),
  "switch.supernotify_transport_alexa_devices": S("off", { name: "alexa_devices" }),
  "switch.supernotify_transport_mobile_push": S("on", { name: "mobile_push" }),
  "person.lorenzo": S("home", { user_id: "u1", friendly_name: "Lorenzo" }),
};

// (1) canali spenti: senza overridden tutti, con overridden solo quelli spenti a mano
ok(G.snNativeHealth(mk({ states: base }), [], {}).some((x) => x.k === "off"), "senza overridden: canale spento segnalato (come prima)");
const ov = { ...base,
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push", overridden: false }),
  "switch.supernotify_delivery_sms_fallback": S("off", { name: "sms_fallback", overridden: false }) };
ok(!G.snNativeHealth(mk({ states: ov }), [], {}).some((x) => x.k === "off"), "con overridden: spento da YAML non conta");
const ov2 = { ...ov, "switch.supernotify_delivery_mobile_push": S("off", { name: "mobile_push", overridden: true }) };
const h2 = G.snNativeHealth(mk({ states: ov2 }), [], {}).find((x) => x.k === "off");
ok(h2 && h2.n === 1, "con overridden: conta solo quello spento a mano");
ok(G.snChannelsOff(mk({ states: base }), [{ id: "x", name: "mobile_push", state: "unavailable" }], []).length === 0, "unavailable non è spento");

// overview: stessa regola
const o = document.createElement("supernotify-overview-card");
o.setConfig({}); document.body.appendChild(o); o.hass = mk({ states: ov });
await wait(80);
ok(!/canale spento/.test(o.shadowRoot.textContent), "overview: spento da YAML non segnalato");

// (2) pausa: tile feature con l'azione, anche non admin
calls.length = 0;
await G.snNativePause(mk({ states: base, admin: false }), 60);
const sc = calls.find((c) => c[1] === "snooze");
ok(sc && sc[2].command === "snooze" && sc[2].scope === "noncritical" && sc[2].minutes === 60 && sc[2].reason === "Dashboard", "feature: supernotify.snooze noncritical 60");
ok(!calls.some((c) => c[1] === "conversation/process" || c[0] === "api"), "feature: niente comandi vocali né evento");
calls.length = 0;
await G.snNativePause(mk({ states: base, admin: false, snooze: false }), 30);
ok(calls.some((c) => c[1] === "conversation/process"), "feature senza azione: comandi vocali come prima");

// (3) pannello pause del control, utente non admin
const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ tiles: ["snooze"], occupancy: false });
document.body.appendChild(ctl);
ctl.hass = mk({ states: base, admin: false });
await wait(60);
ctl._snzOpen = true; ctl._renderSnz();
const sr = ctl.shadowRoot;
ok(!!sr.querySelector('.sc[data-g="what"]'), "non admin con l'azione: pannello completo (cosa, per chi)");
sr.querySelector('.sc[data-g="what"][data-v="DELIVERY"]').click();
sr.querySelector('.sc[data-g="who"][data-v="USER"]').click();
sr.querySelector('.sc[data-g="min"][data-v="120"]').click();
calls.length = 0;
sr.querySelector("#snzGo").click(); await wait(30);
const p1 = (calls.find((c) => c[1] === "snooze") || [])[2] || {};
ok(p1.command === "snooze" && p1.scope === "delivery" && p1.name && p1.person === "person.lorenzo" && p1.minutes === 120,
  `pannello: snooze delivery per me 120 min (${JSON.stringify(p1)})`);
// silenzio fino a nuovo ordine
sr.querySelector('.sc[data-g="what"][data-v="EVERYTHING"]').click();
sr.querySelector('.sc[data-g="who"][data-v="EVERYONE"]').click();
sr.querySelector('.sc[data-g="min"][data-v="0"]').click();
calls.length = 0;
sr.querySelector("#snzGo").click(); await wait(30);
const p2 = (calls.find((c) => c[1] === "snooze") || [])[2] || {};
ok(p2.command === "silence" && p2.scope === "everything" && !("minutes" in p2) && !("name" in p2), `pannello: silence everything (${JSON.stringify(p2)})`);
// riprendi una pausa in corso
ctl._snoozes = [{ target_type: "DELIVERY", target: "alexa_announce", recipient_type: "USER", recipient: "person.lorenzo",
  snooze_until: new Date(Date.now() + 3600000).toISOString(), snoozed_at: new Date().toISOString() }];
ctl._renderSnz();
calls.length = 0;
const rb = sr.querySelector(".sb[data-r]");
ok(!!rb, "pausa in corso: pulsante Riprendi anche per chi non è admin");
rb && rb.click(); await wait(30);
const p3 = (calls.find((c) => c[1] === "snooze") || [])[2] || {};
ok(p3.command === "resume" && p3.scope === "delivery" && p3.name === "alexa_announce" && p3.person === "person.lorenzo" && !p3.reason,
  `Riprendi: resume con lo stesso ambito (${JSON.stringify(p3)})`);
// snooze_via: event lo forza
const ctl2 = document.createElement("supernotify-control-card");
ctl2.setConfig({ tiles: ["snooze"], occupancy: false, snooze_via: "event", snooze_panel: false });
document.body.appendChild(ctl2); ctl2.hass = mk({ states: base });
await wait(40);
calls.length = 0;
await ctl2._snooze(); await wait(20);
ok(calls.some((c) => c[0] === "api" && /SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_30/.test(c[2].action)) && !calls.some((c) => c[1] === "snooze"),
  "snooze_via: event: evento come prima");
const ctl3 = document.createElement("supernotify-control-card");
ctl3.setConfig({ tiles: ["snooze"], occupancy: false, snooze_panel: false });
document.body.appendChild(ctl3); ctl3.hass = mk({ states: base });
await wait(40);
calls.length = 0;
await ctl3._snooze(); await wait(20);
ok(calls.some((c) => c[1] === "snooze" && c[2].minutes === 30), "tile a un tocco: supernotify.snooze 30 min");

// (4) control status: false
const ctl4 = document.createElement("supernotify-control-card");
ctl4.setConfig({ status: false, dnd_entity: "input_boolean.dnd", tiles: [] });
document.body.appendChild(ctl4); ctl4.hass = mk({ states: { ...base, "input_boolean.dnd": S("off") } });
await wait(40);
ok(ctl4.shadowRoot.getElementById("statusbar").style.display === "none" && !ctl4.shadowRoot.getElementById("statusbar").innerHTML, "status: false nasconde la riga di stato");
const ctl5 = document.createElement("supernotify-control-card");
ctl5.setConfig({ dnd_entity: "input_boolean.dnd", tiles: [] });
document.body.appendChild(ctl5); ctl5.hass = mk({ states: { ...base, "input_boolean.dnd": S("off") } });
await wait(40);
ok(ctl5.shadowRoot.getElementById("statusbar").style.display !== "none", "senza status: la riga c'è come prima");

// (5) composer: niente canali spenti o col transport spento
const cmp = document.createElement("supernotify-composer-card");
cmp.setConfig({}); document.body.appendChild(cmp); cmp.hass = mk({ states: base });
await wait(40);
const names = cmp._deliveries().map((d) => d.name);
ok(names.join() === "mobile_push", `composer: solo i canali che possono partire (${names.join()})`);
const cmp2 = document.createElement("supernotify-composer-card");
cmp2.setConfig({ show_off: true }); document.body.appendChild(cmp2); cmp2.hass = mk({ states: base });
await wait(40);
ok(cmp2._deliveries().length === 3, "composer show_off: tutti");

// (6) automazioni: una intestazione per categoria
const au = document.createElement("supernotify-automations-card");
au.setConfig({}); document.body.appendChild(au);
au.hass = mk({ states: { "automation.a": S("on"), "automation.b": S("on"), "automation.c": S("on"), "automation.d": S("on") } });
await wait(40);
au._manifest = { automations: [{ e: "automation.a", n: "A", c: "Casa" }, { e: "automation.b", n: "B", c: "Allarme" },
  { e: "automation.c", n: "C", c: "Casa" }, { e: "automation.d", n: "D", c: "Allarme" }] };
au._err = null; au._render();
const grp = [...au.shadowRoot.querySelectorAll(".grp")].map((g) => g.textContent);
const order = [...au.shadowRoot.querySelectorAll(".row .nm")].map((g) => g.textContent).join("");
ok(grp.join() === "Casa,Allarme" && order === "ACBD", `automazioni: ${grp.join()} / ${order}`);

// (7) statistiche dai conteggi giornalieri
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daily = [];
for (let i = 3; i >= 0; i--) {
  const d = new Date(Date.now() - i * 86400000);
  const hour = new Array(24).fill(0); hour[9] = 4; hour[21] = 6;
  daily.push({ date: iso(d), count: 10, outcome: { success: 9, dupe: 1 }, priority: { medium: 7, low: 3 }, hour,
    deliveries: { mobile_push: { success: 9, failed: 0 }, alexa_announce: { success: 5, failed: 1 } },
    scenarios: { morning: 4, evening: 6, multi_home: 10 } });
}
dom.window.localStorage.clear();
calls.length = 0;
const st = document.createElement("supernotify-stats-card");
st.setConfig({ days: 7, source: "archive" }); document.body.appendChild(st);
st.hass = mk({ states: base, daily });
await wait(150);
const D = st._data || {};
const archCalls = calls.filter((c) => c[1] === "enquire_archive");
ok(D.daily && archCalls.length === 1 && archCalls[0][2].verbosity === "daily", `stats: una chiamata daily (${archCalls.length})`);
ok(D.perHour[9] === 16 && D.perHour[21] === 24, `stats: ore (${D.perHour[9]}, ${D.perHour[21]})`);
ok(D.perDay.slice(-4).every((x) => x.n === 9), `stats: giorni senza doppioni (${D.perDay.slice(-4).map((x) => x.n)})`);
ok(D.prioCount.medium === 28 && D.prioCount.low === 12, "stats: priorità");
ok(D.periodCount.morning === 16 && D.periodCount.evening === 24 && !D.periodCount.multi_home, "stats: fasce (solo scenari-fascia)");
const ch = Object.fromEntries(D.channels.map((x) => [x.name, x]));
ok(ch.mobile_push.ok === 36 && ch.alexa_announce.ko === 4 && D.chanKnown === 36 && D.chanUnknown === 0, "stats: canali");
ok(D.spineCount === 40, `stats: totale notifiche (${D.spineCount})`);

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
