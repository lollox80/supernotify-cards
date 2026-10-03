// v0.60.0: dati veri - scenari attivi da SuperNotify, titolo, fallimenti reali, toggle, niente doppioni.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const today = new Date(); today.setHours(9, 0, 0, 0);
const yest = new Date(today.getTime() - 86400000);
// the real 2.12.0 document: no top-level title
const LAST = { id: "n1", message: "Proxmox: backup finito", priority: "medium", created: new Date().toISOString(), delivered: 1, failed: 0,
  condition_variables: { notification_title: "Proxmox" }, deliveries: { mobile_push: { success: [{ title: "Proxmox", calls: [{}] }] } } };
const DOCS = [
  { id: "a", created: today.toISOString(), failed: 2, delivered: 1 },
  { id: "b", created: today.toISOString(), failed: 1, delivered: 0 },
  { id: "c", created: yest.toISOString(), failed: 5, delivered: 0 },
];
const calls = [];
const st = (s, a = {}) => ({ state: s, attributes: a });
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: { enquire_archive: {}, enquire_active_scenarios: {} } },
  states: {
    // stale binary_sensors (as on the real install): afternoon still on, late_night off
    "binary_sensor.supernotify_scenario_afternoon": st("on", { name: "afternoon" }),
    "binary_sensor.supernotify_scenario_late_night": st("off", { name: "late_night" }),
    "switch.supernotify_scenario_afternoon": st("on", { name: "afternoon" }),
    "switch.supernotify_scenario_late_night": st("on", { name: "late_night" }),
    "sensor.supernotify_failures": st("0"),
    // a delivery with both the switch and the deprecated binary_sensor
    "switch.supernotify_delivery_mobile_push": st("on", { name: "mobile_push", transport: "mobile_push" }),
    "binary_sensor.supernotify_delivery_mobile_push": st("on", { name: "mobile_push", transport: "mobile_push" }),
    "switch.supernotify_delivery_alexa_announce": st("off", { name: "alexa_announce", transport: "alexa_media_player" }),
    "switch.mio_dnd": st("off"),
  },
  callService: async (d, s, data) => { calls.push([d, s, data && data.entity_id]); }, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["late_night", "multi_home"] } };
    if (m.service === "enquire_last_notification") return { response: LAST };
    if (m.service === "enquire_archive") return { response: { notifications: DOCS, count: 3 } };
    return { response: {} };
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// A1 scenarios: SuperNotify's answer wins over stale binary_sensors
const sc = mount("supernotify-scenarios-card");
await wait(60); sc.hass = { ...hass }; await wait(30);
const act = [...sc.shadowRoot.querySelectorAll(".row")].filter((r) => /attivo ora/.test(r.textContent)).map((r) => r.textContent);
ok(act.length === 1 && /late/i.test(act[0]), `scenari: attivo late_night, non afternoon (${act.length})`);

// A2 + A3 + A9 overview
const ov = mount("supernotify-overview-card", { stats: "full" });
await wait(80); ov.hass = { ...hass }; await wait(40);
const last = ov.shadowRoot.getElementById("last");
ok(last && last.querySelector(".lt") && last.querySelector(".lt").textContent === "Proxmox", "overview: titolo da condition_variables");
const stats = ov.shadowRoot.getElementById("stats").textContent.replace(/\s+/g, " ");
ok(/FALLIMENTI|Fallimenti/i.test(stats) && /Fallimenti\s*3/i.test(stats) && /invii falliti oggi/.test(stats), `overview: 3 invii falliti oggi, non lo 0 del sensore (${stats.slice(0, 160)})`);
ok(/1\/2/.test(stats), `overview: canali 1/2, niente doppione switch+binary_sensor (${stats.match(/\d+\/\d+/)})`);

// A2 control
const cc = document.createElement("supernotify-control-card");
cc.setConfig({ last_notification: true, dnd_entity: "switch.mio_dnd", tiles: ["dnd"] });
cc.hass = hass; document.body.appendChild(cc);
await wait(80);
const lt = cc.shadowRoot.querySelector(".lastn .lt");
ok(lt && lt.textContent.trim() === "Proxmox", `control: titolo (${lt && lt.textContent.trim()})`);
// A8 toggle of a switch
const tile = [...cc.shadowRoot.querySelectorAll(".ctile")].find((t) => /disturbare/i.test(t.textContent));
if (tile) tile.click();
ok(calls.some((c) => c[0] === "switch" && c[1] === "toggle" && c[2] === "switch.mio_dnd"), `control: DND switch.* comandato con switch.toggle (${JSON.stringify(calls)})`);

// A9 composer
const co = mount("supernotify-composer-card");
await wait(30);
const chips = [...co.shadowRoot.querySelectorAll("#chips .chip")].map((c) => c.dataset.d);
ok(chips.filter((x) => x === "mobile_push").length === 1, `composer: un chip per delivery (${chips})`);

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
