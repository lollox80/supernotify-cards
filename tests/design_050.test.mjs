// v0.50.0: icone di Home Assistant (ha-icon mdi) al posto delle emoji.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
// snIconify is a bundle-internal helper: expose it for the unit checks below
new dom.window.Function(SRC + "\nwindow.__snIconify = snIconify; window.__snEmoji = SN_EMOJI_MDI;")();
const snIconify = dom.window.__snIconify;

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const tick = () => new Promise((r) => setTimeout(r, 30));

// ── 1. snIconify ────────────────────────────────────────────────────────────
const h = snIconify('<div class="a">📤 Canali <b>✔ ok</b> ⚠️ attenzione</div>');
ok(/<ha-icon[^>]*icon="mdi:send-outline"/.test(h) && /icon="mdi:check-circle"/.test(h) && /icon="mdi:alert"/.test(h), "emoji nel testo -> ha-icon");
ok(!/[📤✔⚠]/u.test(h) && !/️/.test(h), "nessuna emoji rimasta, nemmeno il selettore FE0F");
ok(snIconify('<input placeholder="📷 foto" title="✔">') === '<input placeholder="📷 foto" title="✔">', "attributi lasciati stare");
const opt = snIconify('<select><option>📷 Ingresso</option></select> 📷');
ok(/<option>📷 Ingresso<\/option>/.test(opt) && /icon="mdi:camera-outline"/.test(opt), "dentro <option> resta l'emoji, fuori diventa icona");
ok(/<style>\.x::before\{content:"✔"\}<\/style>/.test(snIconify('<style>.x::before{content:"✔"}</style>')), "<style> non toccato");
ok(/<svg><text>📤<\/text><\/svg>/.test(snIconify("<svg><text>📤</text></svg>")), "<svg> non toccato");
ok(snIconify("✔ fatto", { icons: "emoji" }) === "✔ fatto", "icons: emoji mantiene le emoji");
ok(snIconify("🛏️ letto") === "🛏️ letto", "emoji fuori tabella (config dell'utente) restano");
ok(/icon="mdi:account-group"/.test(snIconify("👨‍👩‍👧 famiglia")), "sequenza ZWJ trattata come un'icona sola");
ok(snIconify("") === "" && snIconify(null) === null, "valori vuoti invariati");

// ── 2. card vere: niente emoji della tabella nel DOM ───────────────────────
const EMO = new RegExp(dom.window.__snEmoji.map(([e]) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "u");
const del = (name, fn, transport) => ({ state: "on", attributes: { name, enabled: true, transport, inclusion: ["default"], transport_enabled: true,
  friendly_name: `SuperNotify Delivery ${fn} abilitata` } });
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: { notify: {} } },
  states: {
    "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono", "mobile_push"),
    "switch.supernotify_delivery_email": del("email", "Email", "email"),
    "switch.supernotify_recipient_lorenzo": { state: "on", attributes: { entity_id: "person.lorenzo", email: "a@b.c", friendly_name: "SuperNotify Recipient Lorenzo abilitato" } },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo" } },
    "input_boolean.notifier_dnd": { state: "off", attributes: {} },
    "switch.supernotify_transport_mobile_push": { state: "on", attributes: { name: "mobile_push", friendly_name: "SuperNotify Transport mobile_push abilitato" } },
  },
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }),
};
// text outside <select>/<option> (the camera picker keeps its emoji, as a native control can)
const visibleText = (root) => {
  const c = document.createElement("div");
  for (const n of root.childNodes) c.appendChild(n.cloneNode(true));
  c.querySelectorAll("select, option, style, svg, textarea").forEach((n) => n.remove());
  return c.textContent;
};
for (const [tag, cfg] of [["supernotify-control-card", { dnd_entity: "input_boolean.notifier_dnd", tiles: ["dnd", "snooze", "announce"] }],
  ["supernotify-overview-card", {}], ["supernotify-deliveries-card", {}], ["supernotify-recipients-card", {}],
  ["supernotify-composer-card", {}], ["supernotify-transports-card", {}]]) {
  const el = document.createElement(tag); el.setConfig(cfg); document.body.appendChild(el); el.hass = hass;
  await tick(); el.hass = { ...hass }; await tick();
  const txt = visibleText(el.shadowRoot);
  const left = txt.match(EMO);
  ok(!left, `${tag}: nessuna emoji della tabella nel testo${left ? " (trovata " + left[0] + ")" : ""}`);
  ok(el.shadowRoot.querySelectorAll("ha-icon").length > 0, `${tag}: usa ha-icon`);
}
const old = document.createElement("supernotify-deliveries-card"); old.setConfig({ icons: "emoji" }); document.body.appendChild(old); old.hass = hass;
ok(/📱/u.test(old.shadowRoot.textContent), "deliveries con icons: emoji mostra ancora le emoji");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
