// v0.61.0: pause mirate nella control, aggiornamento istantaneo, Perché più completo.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const now = new Date();
const hms = (d) => d.toTimeString().slice(0, 8);
const SNOOZES = [
  { target_type: "DELIVERY", target: "alexa_announce", recipient_type: "EVERYONE", recipient: null, snoozed_at: hms(now), snooze_until: hms(new Date(now.getTime() + 3600e3)) },
  { target_type: "NONCRITICAL", target: null, recipient_type: "USER", recipient: "person.jessica", snoozed_at: hms(now), snooze_until: hms(new Date(now.getTime() + 600e3)) },
];
const DOC = { id: "abc-1", created: now.toISOString(), message: "Backup finito", priority: "medium", outcome: "success", delivered: 1,
  condition_variables: { notification_title: "Proxmox" }, deliveries: { mobile_push: { success: [{ title: "Proxmox", calls: [{}] }] } },
  unassigned_targets: { entity_id: ["media_player.ufficio"] }, stats: { total_duration_ms: 4.9, slowest_delivery: "mobile_push", delivery_success_rate: 0.5 },
  original_context: { id: "CTX1", parent_id: "P1", user_id: null } };
const api = [], ws = [];
let liveCb = null, subs = 0;
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u-lorenzo", is_admin: true },
  services: { supernotify: { enquire_archive: {}, clear_snoozes: {} } },
  connection: { subscribeEvents: (cb, type) => { subs++; ok(type === "supernotify_notification", "iscrizione all'evento supernotify_notification"); liveCb = cb; return Promise.resolve(() => {}); } },
  states: {
    "person.lorenzo": { state: "home", attributes: { user_id: "u-lorenzo", friendly_name: "Lorenzo" } },
    "person.jessica": { state: "home", attributes: { user_id: "u-jessica", friendly_name: "Jessica" } },
    "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { name: "alexa_announce", transport: "alexa_media_player", friendly_name: "SuperNotify Delivery Annuncio Alexa abilitata" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push" } },
    "sensor.supernotify_notifications": { state: "5", attributes: {}, last_updated: "x" },
    "automation.backup_proxmox": { state: "on", attributes: { friendly_name: "Backup Proxmox" } },
  },
  callService: async () => {},
  callApi: async (m, path, body) => { api.push([m, path, body && body.action]); return {}; },
  callWS: async (m) => {
    ws.push(m.type === "call_service" ? m.service : m.type);
    if (m.service === "enquire_snoozes") return { response: { snoozes: SNOOZES } };
    if (m.service === "enquire_archive") return { response: m.service_data && m.service_data.id ? DOC : { notifications: [DOC], count: 1 } };
    if (m.type === "logbook/get_events") return [{ entity_id: "automation.backup_proxmox", name: "Backup Proxmox", context_id: "CTX1", message: "triggered" }];
    return { response: {} };
  },
};
const mount = (tag, cfg) => { const c = document.createElement(tag); c.setConfig(cfg); c.hass = hass; document.body.appendChild(c); return c; };

// ── B1 pause panel ──
const cc = mount("supernotify-control-card", { tiles: ["snooze"] });
await wait(60); cc.hass = { ...hass }; await wait(30);
const tile = cc.shadowRoot.querySelector(".ctile");
tile.click(); await wait(10);
const panel = cc.shadowRoot.getElementById("snzp");
ok(panel && !panel.hidden && /Metti in pausa le notifiche/.test(panel.textContent), "il riquadro pausa apre il pannello");
const click = (g, v) => { const b = [...panel.querySelectorAll(".sc")].find((x) => x.dataset.g === g && x.dataset.v === String(v)); b.click(); };
click("what", "DELIVERY");
const sel = panel.querySelector("#snzT");
ok(sel && [...sel.options].some((o) => o.textContent === "Annuncio Alexa"), "canali col nome leggibile");
sel.value = "alexa_announce"; sel.dispatchEvent(new dom.window.Event("change"));
click("who", "USER"); click("min", 60);
panel.querySelector("#snzGo").click(); await wait(10);
ok(api.some((a) => a[2] === "SUPERNOTIFY_SNOOZE_USER_DELIVERY_alexa_announce_60"), `pausa: canale, solo io, 1 h (${api.map((a) => a[2])})`);
click("what", "NONCRITICAL"); click("who", "EVERYONE"); click("min", 0);
panel.querySelector("#snzGo").click(); await wait(10);
ok(api.some((a) => a[2] === "SUPERNOTIFY_SILENCE_EVERYONE_NONCRITICAL"), "finché non riprendo = SILENCE senza minuti");
const rows = [...panel.querySelectorAll(".slist .sr")];
ok(rows.length === 2, `2 pause in corso (${rows.length})`);
const resumeBtns = [...panel.querySelectorAll(".sb[data-r]")];
ok(resumeBtns.length === 1, "si può riprendere solo la pausa di tutti, non quella di Jessica");
resumeBtns[0].click(); await wait(10);
ok(api.some((a) => a[2] === "SUPERNOTIFY_NORMAL_EVERYONE_DELIVERY_alexa_announce"), "Riprendi = NORMAL sullo stesso bersaglio");
const c2 = mount("supernotify-control-card", { tiles: ["snooze"], snooze_panel: false, snooze_minutes: 30 });
await wait(60); c2.hass = { ...hass, }; await wait(30);
api.length = 0;
SNOOZES.length = 0; c2._snoozes = [];
c2.shadowRoot.querySelector(".ctile").click(); await wait(10);
ok(api.some((a) => a[2] === "SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_30"), "snooze_panel: false = pausa con un tocco come prima");

// ── B2 live ──
ok(subs === 1, `una sola iscrizione per pagina (${subs})`);
const ar = mount("supernotify-archive-card", {});
await wait(60);
const before = ws.filter((x) => x === "enquire_archive").length;
liveCb && liveCb({ data: { notification_id: "abc-2" } });
await wait(40);
ok(ws.filter((x) => x === "enquire_archive").length > before, "evento: l'archivio rilegge subito");

// ── C why ──
dom.window.__snWhyCards = 0;
const wc = mount("supernotify-why-card", {});
await wait(150); wc.hass = { ...hass }; await wait(150);
const txt = wc.shadowRoot.textContent.replace(/\s+/g, " ");
ok(/Inviata da automazione Backup Proxmox/.test(txt), `inviata da (${(txt.match(/Inviata[^.]{0,60}/) || [""])[0]})`);
ok(/Destinatari che nessun canale ha preso/.test(txt) && /media_player\.ufficio/.test(txt), "destinatari non presi");
ok(/durata 4\.9 ms/.test(txt) && /50% dei canali riusciti/.test(txt), "tempi");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
