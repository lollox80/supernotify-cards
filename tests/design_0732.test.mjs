// v0.73.2: correzioni dal giro su tutte le viste del 04/10.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/lovelace/0" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const G = new dom.window.Function(SRC + "\nreturn { snPlainMsg, SN_STRINGS };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

ok(G.snPlainMsg("Ci sono 4 aggiornamenti. [Aegis for Ajax Update](https://github.com/x/y/rel") === "Ci sono 4 aggiornamenti. Aegis for Ajax Update", "link tagliato a metà: resta il testo");
ok(G.snPlainMsg("[Clock](https://a/b) ok") === "Clock ok", "link intero come prima");
ok(G.SN_STRINGS.it.snooze === "Pausa", "italiano: Pausa");

// strategy: niente icone, una sezione = tutta la larghezza
const Strat = customElements.get("ll-strategy-dashboard-supernotify");
const d = await Strat.generate({ type: "custom:supernotify" }, { language: "it", states: {}, user: { is_admin: true } });
ok(d.views.every((v) => !v.icon), "viste senza icona (si vede il nome)");
const st = d.views.find((v) => v.path === "stats");
ok(st.max_columns === 2 && st.sections[0].column_span === 2, "Statistiche a tutta larghezza");

// overview: ignore
const S = (state, attributes) => ({ state, attributes });
const states = {
  "switch.supernotify_delivery_sms_fallback": S("off", { name: "sms_fallback" }),
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push" }),
  "sensor.supernotify_notifications": S("3", {}),
};
const hass = { language: "it", themes: { darkMode: false }, entities: {}, services: {}, user: { id: "u", is_admin: true }, states,
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }) };
const mk = (cfg) => { const e = document.createElement("supernotify-overview-card"); e.setConfig(cfg); document.body.appendChild(e); e.hass = hass; return e; };
const o1 = mk({}); const o2 = mk({ ignore: ["sms_fallback"] });
await wait(80);
ok(/canale spento/.test(o1.shadowRoot.textContent), "overview: canale spento segnalato");
ok(!/canale spento/.test(o2.shadowRoot.textContent), "overview: ignore lo toglie");

// why: nessun target su un canale automatico = routine; chiesto per nome = problema
const why = document.createElement("supernotify-why-card");
why.setConfig({ auto_select: false }); document.body.appendChild(why); why.hass = hass;
await wait(60);
const det = (ov) => {
  why._sel = "x";
  why._loading = null;
  why._cache.set("x", { ok: true, n: { id: "x", ti: "T", dl: [{ n: "notify_entity", r: "skip", why: "NO_TARGET", tr: "always" }, { n: "mobile_push", r: "ok" }], ov } });
  why._renderDetail();
  return why.shadowRoot.getElementById("det").textContent;
};
ok(!/chiesto ma non partito/.test(det(undefined)), "why: canale automatico senza target non è un problema");
ok(/chiesto ma non partito/.test(det({ notify_entity: { en: true } })), "why: chiesto per nome e senza target = problema");

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
