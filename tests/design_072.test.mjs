// v0.72.0: badge di stato e feature per le tile native di HA.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/lovelace/0" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const S = (state = "on", attributes = {}) => ({ state, attributes, last_changed: "2026-10-04T10:00:00Z" });
let snoozes = [];
const calls = [];
const mk = (states, isAdmin = true) => ({
  language: "it", states, user: { id: "u", is_admin: isAdmin },
  callApi: async (m, p, d) => { calls.push(["api", p, d]); },
  callService: async (d, s, data) => { calls.push(["svc", `${d}.${s}`, data]); },
  callWS: async (m) => {
    calls.push(["ws", m.type, m.service || m.text]);
    if (m.service === "enquire_snoozes") return { response: { snoozes } };
    if (m.service === "enquire_last_notification")
      return { response: { title: "Porta", message: "Qualcuno alla porta", created: new Date(Date.now() - 5 * 60000).toISOString() } };
    return { response: {} };
  },
});
const healthy = {
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push" }),
  "switch.supernotify_delivery_default_email": S("off", { name: "DEFAULT_email" }),
  "switch.supernotify_transport_telegram": S("on", { name: "telegram", error_count: 0 }),
  "sensor.supernotify_notifications": S("12"),
  "notify.recipient_lorenzo": S("unknown"),
};

// registrazioni
ok(window.customBadges.some((b) => b.type === "supernotify-status-badge"), "badge in window.customBadges");
const feats = Object.fromEntries(window.customCardFeatures.map((x) => [x.type, x]));
ok(feats["supernotify-pause"] && feats["supernotify-test"] && feats["supernotify-last"], "tre feature in window.customCardFeatures");
ok(feats["supernotify-pause"].supported({ entity_id: "sensor.supernotify_notifications" }), "supported: API vecchia (stateObj)");
ok(feats["supernotify-pause"].supported({ states: {} }, { entity_id: "sensor.supernotify_notifications" }), "supported: API nuova (hass, context)");
ok(!feats["supernotify-pause"].supported({ entity_id: "light.x" }), "non su altre entità");
ok(feats["supernotify-test"].supported({}, { entity_id: "notify.recipient_lorenzo" }) && !feats["supernotify-test"].supported({}, { entity_id: "notify.mobile" }), "test solo sui notify.recipient_");

// badge: tutto ok (DEFAULT_ spento non conta)
const badge = document.createElement("supernotify-status-badge");
badge.setConfig({}); document.body.appendChild(badge); badge.hass = mk(healthy);
await wait(30);
const txt = () => badge.shadowRoot.querySelector(".c").textContent;
ok(txt() === "Tutto ok", `badge: tutto ok (${txt()})`);

// badge: transport in errore + canale spento + pausa
snoozes = [{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 3600000).toISOString() }];
const bad = { ...healthy,
  "switch.supernotify_transport_telegram": S("on", { name: "telegram", error_count: 2, last_error_message: "chat not found" }),
  "switch.supernotify_delivery_sms": S("off", { name: "sms" }) };
await wait(2700); // the shared enquire cache keeps a reply 2.5 s
const b2 = document.createElement("supernotify-status-badge");
b2.setConfig({ navigation_path: "/supernotify-auto/home" }); document.body.appendChild(b2); b2.hass = mk(bad);
await wait(30);
const c2 = b2.shadowRoot.querySelector(".c").textContent;
ok(/1 transport con errori \+2/.test(c2), `badge: il peggiore + quanti altri (${c2})`);
const tip = b2.shadowRoot.querySelector(".b").title;
ok(/chat not found/.test(tip) && /canali spenti/.test(tip) && /In pausa fino alle/.test(tip), "tooltip con il dettaglio");
ok(b2.shadowRoot.querySelector("ha-icon").getAttribute("icon") === "mdi:bell-alert", "icona di allarme");
b2.shadowRoot.querySelector(".b").click();
ok(window.location.pathname === "/supernotify-auto/home", "tap: navigation_path");

// 0.73.1: ignore e channels_off; canali spenti da soli in grigio
await wait(2700); snoozes = [];
const offOnly = { ...healthy, "switch.supernotify_delivery_sms": S("off", { name: "sms" }), "switch.supernotify_delivery_tts": S("off", { name: "tts" }) };
const b3 = document.createElement("supernotify-status-badge");
b3.setConfig({}); document.body.appendChild(b3); b3.hass = mk(offOnly); await wait(30);
ok(/2 canali spenti/.test(b3.shadowRoot.querySelector(".c").textContent) && /secondary-text-color/.test(b3.shadowRoot.innerHTML), "canali spenti: grigio, non avviso");
const b4 = document.createElement("supernotify-status-badge");
b4.setConfig({ ignore: ["sms", "TTS"] }); document.body.appendChild(b4); b4.hass = mk(offOnly); await wait(30);
ok(b4.shadowRoot.querySelector(".c").textContent === "Tutto ok", "ignore: canali spenti apposta non contano");
const b5 = document.createElement("supernotify-status-badge");
b5.setConfig({ channels_off: false }); document.body.appendChild(b5); b5.hass = mk(offOnly); await wait(30);
ok(b5.shadowRoot.querySelector(".c").textContent === "Tutto ok", "channels_off: false");

// feature pausa
snoozes = [];
await wait(2700);
calls.length = 0;
const p = document.createElement("supernotify-pause");
p.setConfig({ type: "custom:supernotify-pause" }); document.body.appendChild(p);
p.context = { entity_id: "sensor.supernotify_notifications" }; p.hass = mk(healthy);
await wait(30);
const bt = [...p.shadowRoot.querySelectorAll("button")];
ok(bt.map((b) => b.textContent).join("|") === "30 min|1 h|2 h", `pulsanti di pausa (${bt.map((b) => b.textContent).join("|")})`);
bt[1].click(); await wait(20);
ok(calls.some((c) => c[0] === "api" && c[2] && c[2].action === "SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_60"), "admin: evento SUPERNOTIFY_SNOOZE_..._60");
// non admin: comandi vocali
calls.length = 0;
const p2 = document.createElement("supernotify-pause");
p2.setConfig({ type: "custom:supernotify-pause", minutes: [15] }); document.body.appendChild(p2);
p2.stateObj = { entity_id: "sensor.supernotify_notifications" }; p2.hass = mk(healthy, false);
await wait(30);
p2.shadowRoot.querySelector("button").click(); await wait(20);
ok(calls.some((c) => c[1] === "conversation/process" && /15 minuti/.test(c[2])), "non admin: conversation/process");
// in pausa: Riprendi
snoozes = [{ target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: new Date(Date.now() + 1800000).toISOString() }];
const p3 = document.createElement("supernotify-pause");
p3.setConfig({ type: "custom:supernotify-pause" }); document.body.appendChild(p3);
p3.context = { entity_id: "sensor.supernotify_notifications" }; await wait(2700); p3.hass = mk(healthy);
await wait(30);
const r = p3.shadowRoot.querySelector("button");
ok(r && /Riprendi/.test(r.textContent) && /fino alle/.test(r.textContent), `in pausa: Riprendi (${r && r.textContent})`);
calls.length = 0;
r.click(); await wait(20);
ok(calls.some((c) => c[0] === "ws" && c[2] === "clear_snoozes"), "Riprendi: clear_snoozes");

// feature prova destinatario: due tocchi
calls.length = 0;
const t = document.createElement("supernotify-test");
t.setConfig({ type: "custom:supernotify-test" }); document.body.appendChild(t);
t.context = { entity_id: "notify.recipient_lorenzo" }; t.hass = mk(healthy);
await wait(10);
t.shadowRoot.querySelector("button").click(); await wait(10);
ok(/Tocca di nuovo/.test(t.shadowRoot.querySelector("button").textContent) && !calls.some((c) => c[0] === "svc"), "primo tocco: chiede conferma");
t.shadowRoot.querySelector("button").click(); await wait(20);
ok(calls.some((c) => c[1] === "notify.send_message" && c[2].entity_id === "notify.recipient_lorenzo"), "secondo tocco: notify.send_message sul destinatario");
ok(/Inviata/.test(t.shadowRoot.querySelector("button").textContent), "conferma inviata");

// feature ultima notifica
const l = document.createElement("supernotify-last");
l.setConfig({ type: "custom:supernotify-last" }); document.body.appendChild(l);
l.context = { entity_id: "sensor.supernotify_notifications" }; l.hass = mk(healthy);
await wait(3000);
const lt = l.shadowRoot.querySelector(".txt").textContent.replace(/\s+/g, " ");
ok(/Ultima: Porta/.test(lt) && /5 min fa/.test(lt), `ultima notifica (${lt.trim()})`);

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
