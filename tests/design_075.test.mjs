// CHANGELOG
// 2026-10-05 v0.75.0: "modificato a mano" sulle righe dall'attributo overridden degli switch.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const S = (state, attributes = {}) => ({ state, attributes, last_changed: "2026-10-05T08:00:00Z" });
const mk = (states) => ({ language: "it", themes: { darkMode: false }, entities: {}, services: { supernotify: {} }, states,
  user: { id: "u", is_admin: true }, callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }) });
const card = async (tag, states) => {
  const el = document.createElement(tag); el.setConfig({}); document.body.appendChild(el); el.hass = mk(states); await wait(40);
  return el.shadowRoot.textContent;
};

const withOv = {
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push", transport: "mobile_push", overridden: true }),
  "switch.supernotify_delivery_sms": S("off", { name: "sms", transport: "sms", overridden: false }),
  "switch.supernotify_delivery_mail": S("off", { name: "mail", transport: "email", overridden: true }),
  "switch.supernotify_transport_email": S("on", { name: "email", overridden: true }),
  "switch.supernotify_transport_sms": S("on", { name: "sms", overridden: false }),
  "switch.supernotify_recipient_lorenzo": S("off", { overridden: true, email: "a@b.c" }),
  "switch.supernotify_scenario_night": S("off", { name: "night", overridden: true }),
};
const d = await card("supernotify-deliveries-card", withOv);
ok(/spento da configurazione/.test(d), "canali: spento in configurazione");
ok(/spento a mano/.test(d), "canali: spento a mano");
ok((d.match(/modificato a mano/g) || []).length === 1, "canali: acceso a mano = etichetta");
const t = await card("supernotify-transports-card", withOv);
ok((t.match(/modificato a mano/g) || []).length === 1, "transport: una etichetta");
const r = await card("supernotify-recipients-card", withOv);
ok(/modificato a mano/.test(r), "destinatari: etichetta");
const sc = await card("supernotify-scenarios-card", withOv);
ok(/modificato a mano/.test(sc), "scenari: etichetta");

// senza l'attributo (SuperNotify di oggi): come prima
const old = Object.fromEntries(Object.entries(withOv).map(([k, v]) => { const a = { ...v.attributes }; delete a.overridden; return [k, S(v.state, a)]; }));
const d2 = await card("supernotify-deliveries-card", old);
ok(!/modificato a mano|da configurazione/.test(d2) && /spento a mano/.test(d2), "senza overridden: come prima");
ok(!/modificato a mano/.test(await card("supernotify-scenarios-card", old)), "scenari senza overridden: nessuna etichetta");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
