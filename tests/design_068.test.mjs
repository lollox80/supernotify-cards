// CHANGELOG
// 2026-10-04 v0.68.0: telefono e accessibilità - tastiera, ruoli, nomi, aria-live, CSS tocco.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
global.MutationObserver = dom.window.MutationObserver;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u", is_admin: true },
  services: { supernotify: { notify: { response: { optional: true } }, enquire_active_scenarios: {} } },
  states: {
    "switch.supernotify_scenario_guests": { state: "on", attributes: { name: "guests", friendly_name: "SuperNotify Scenario Ospiti" } },
    "binary_sensor.supernotify_scenario_guests": { state: "off", attributes: {} },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push", friendly_name: "SuperNotify Delivery Telefono abilitata" } },
    "switch.supernotify_delivery_alexa": { state: "off", attributes: { name: "alexa", transport: "alexa_media_player", friendly_name: "SuperNotify Delivery Alexa abilitata" } },
  },
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }),
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

const KINDS = ["control", "overview", "bands", "deliveries", "transports", "recipients", "scenarios",
  "simulator", "composer", "automations", "stats", "archive", "tools", "why"];
const cards = {};
for (const k of KINDS) { try { cards[k] = mount(`supernotify-${k}-card`, k === "control" ? { snooze_announce: true } : {}); } catch (e) { ok(false, `${k}: mount ${e.message}`); } }
await wait(80);
for (const k of KINDS) { if (cards[k]) cards[k].hass = { ...hass }; }
await wait(40);

const NATIVE = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION|HA-CARD)$/;
for (const k of KINDS) {
  const r = cards[k] && cards[k].shadowRoot;
  if (!r) continue;
  const css = r.querySelector("style[data-sn-a11y-css]");
  const loose = [...r.querySelectorAll("*")].filter((el) => el.onclick && !NATIVE.test(el.tagName)
    && !(el.tagName.includes("-") && el.tagName !== "HA-ICON") && !(el.getAttribute("tabindex") === "0" && el.getAttribute("role")));
  ok(css && loose.length === 0, `${k}: CSS accessibilità e nessun elemento toccabile fuori dalla tastiera (${loose.map((e) => e.className || e.tagName).slice(0, 4)})`);
}

// Enter apre come il tocco
const del = cards.deliveries.shadowRoot;
const drow = del.querySelector('[data-sn-a11y="row"]');
ok(drow && drow.getAttribute("role") === "button", "deliveries: la riga è un pulsante raggiungibile");
let clicked = 0; const pc = dom.window.HTMLElement.prototype.click;
dom.window.HTMLElement.prototype.click = function () { clicked++; return pc.call(this); };
const key = (k) => { const el = del.querySelector('[data-sn-a11y="row"]'); el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true, composed: true })); };
key("Enter"); await wait(5); key(" "); await wait(5); key("a"); await wait(5);
dom.window.HTMLElement.prototype.click = pc;
ok(clicked === 2, `Invio e Spazio cliccano, le altre lettere no (${clicked})`);

// interruttori con il nome della riga
const sw = [...del.querySelectorAll('.sw input[type="checkbox"]')];
ok(sw.length && sw.every((i) => (i.getAttribute("aria-label") || "").length > 2), `interruttori con un nome (${sw.map((i) => i.getAttribute("aria-label")).join(" | ")})`);

// toast annunciato, icone decorative nascoste
ok(cards.control.shadowRoot.getElementById("toast").getAttribute("aria-live") === "polite", "control: il toast viene letto");
const icons = [...cards.control.shadowRoot.querySelectorAll("ha-icon.sn-i")];
ok(icons.length && icons.every((i) => i.getAttribute("aria-hidden") === "true"), `icone da emoji nascoste al lettore (${icons.length})`);

// dopo un nuovo disegno resta tutto (MutationObserver)
cards.deliveries._render(); await wait(10);
ok(del.querySelector("style[data-sn-a11y-css]") && del.querySelector('[data-sn-a11y="row"][tabindex="0"]'), "ridisegnata: CSS e tastiera rimessi");

// tocco: 48 px solo con dito, e niente animazioni se richiesto
const CSS = del.querySelector("style[data-sn-a11y-css]").textContent;
ok(/@media \(pointer: coarse\)[\s\S]*min-height: 48px/.test(CSS) && /prefers-reduced-motion: reduce/.test(CSS), "CSS: righe 48 px al tocco, movimento ridotto");
ok(!/,\s*\.sw:has/.test(CSS), ":has in una regola a sé (un browser vecchio non perde le altre)");

if (fail) { console.log(`${fail} FAIL`); process.exit(1); }
console.log("design_068 ok");
process.exit(0);
