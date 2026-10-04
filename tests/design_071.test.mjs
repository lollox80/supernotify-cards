// v0.71.0: dashboard strategy custom:supernotify - viste generate dall'installazione.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/supernotify-auto/home" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
let manifestOk = true;
dom.window.fetch = async (url) => ({ ok: manifestOk && String(url).endsWith("automations.json") });
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const S = (state = "on", attributes = {}) => ({ state, attributes });
const fullStates = {
  "switch.supernotify_delivery_mobile_push": S(),
  "switch.supernotify_transport_mobile_push": S(),
  "switch.supernotify_scenario_night": S(),
  "switch.supernotify_recipient_lorenzo": S(),
  "input_datetime.notifier_start_morning": S("07:00:00"),
  "input_number.notifier_morning_volume": S("0.5"),
  "sensor.supernotify_notifications": S("10"),
};
const hass = (states, isAdmin = true, language = "it") => ({ language, states, user: { id: "u1", is_admin: isAdmin }, callWS: async () => ({}) });
const Strat = customElements.get("ll-strategy-dashboard-supernotify");
ok(!!Strat && typeof Strat.generate === "function", "strategy registrata come ll-strategy-dashboard-supernotify");
ok(window.customStrategies.some((x) => x.type === "supernotify" && x.strategyType === "dashboard"), "elencata in window.customStrategies");

const kinds = (d) => d.views.map((v) => `${v.path}:` + v.sections.map((s) => s.cards.map((c) => c.type.replace(/^custom:supernotify-|-card$/g, "")).join("+")).join("|"));

// installazione completa, admin
const d1 = await Strat.generate({ type: "custom:supernotify" }, hass(fullStates));
console.log("    ", kinds(d1).join("  "));
ok(d1.views.map((v) => v.path).join(",") === "home,send,setup,stats,tools", "5 viste per un admin");
ok(d1.views[0].title === "Casa" && d1.title === "SuperNotify", "titoli in italiano");
const setup = d1.views.find((v) => v.path === "setup");
const bands = setup.sections.flatMap((s) => s.cards).find((c) => c.type === "custom:supernotify-bands-card");
ok(bands && bands.bands && bands.bands.morning && bands.bands.morning.volume === "input_number.notifier_morning_volume", "fasce prese dagli helper (getStubConfig)");
ok(setup.sections.flatMap((s) => s.cards).some((c) => c.type === "custom:supernotify-automations-card"), "automazioni quando il manifest c'è");
ok(d1.views.every((v) => v.type === "sections" && v.max_columns >= 1), "viste a sezioni");

// utente non admin, installazione minima, niente manifest
manifestOk = false;
const d2 = await Strat.generate({ type: "custom:supernotify" }, hass({ "switch.supernotify_delivery_email": S() }, false, "en"));
console.log("    ", kinds(d2).join("  "));
ok(!d2.views.some((v) => v.path === "tools"), "niente Strumenti per chi non è admin");
const setup2 = d2.views.find((v) => v.path === "setup");
const k2 = setup2.sections.flatMap((s) => s.cards).map((c) => c.type);
ok(k2.join() === "custom:supernotify-deliveries-card", `setup minimo: solo canali (${k2.join()})`);
ok(setup2.max_columns === 2 && setup2.sections[0].column_span === 2, "una sola sezione: tutta la larghezza (0.73.2)");
ok(d2.views[0].title === "Home", "titoli in inglese");

// opzioni: views, hide, cards, title
manifestOk = true;
const d3 = await Strat.generate({ type: "custom:supernotify", title: "Notifiche", views: ["stats", "home"], hide: ["archive"],
  cards: { control: { tiles: ["dnd", "snooze"] } } }, hass(fullStates));
ok(d3.title === "Notifiche" && d3.views.map((v) => v.path).join() === "stats,home", "views sceglie e ordina, title");
const home3 = d3.views.find((v) => v.path === "home").sections.flatMap((s) => s.cards);
ok(!home3.some((c) => c.type === "custom:supernotify-archive-card"), "hide toglie una card");
ok(JSON.stringify(home3.find((c) => c.type === "custom:supernotify-control-card").tiles) === '["dnd","snooze"]', "cards aggiunge configurazione per tipo");

// link tra viste: lovelace/config di una dashboard strategy -> viste generate
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
const ws = [];
const st4 = { ...fullStates, "switch.supernotify_transport_telegram": S("on", { name: "telegram", error_count: 2, last_error_message: "chat not found" }) };
const h4 = { ...hass(st4), themes: { darkMode: false }, entities: {}, services: { supernotify: {} }, callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => { ws.push(m); return m.type === "lovelace/config" ? { strategy: { type: "custom:supernotify" } } : { response: {} }; } };
const ov = document.createElement("supernotify-overview-card");
ov.setConfig({}); document.body.appendChild(ov); ov.hass = h4;
await new Promise((r) => setTimeout(r, 120)); ov.hass = { ...h4 }; await new Promise((r) => setTimeout(r, 60));
ok(ws.some((m) => m.type === "lovelace/config" && m.url_path === "supernotify-auto"), "configurazione della dashboard letta");
const goBtn = [...ov.shadowRoot.querySelectorAll("#health [data-go]")].find((b) => /transport/i.test(b.closest(".hr").textContent));
ok(!!goBtn, "Mostra › verso la card Transport della vista generata");
goBtn && goBtn.click(); await new Promise((r) => setTimeout(r, 20));
ok(window.location.pathname === "/supernotify-auto/setup", `naviga alla vista Configurazione generata (${window.location.pathname})`);

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
