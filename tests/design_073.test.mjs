// v0.73.0: undici lingue (le stesse di SuperNotify), unite all'inglese al caricamento.
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
const errors = [];
dom.window.addEventListener("error", (e) => errors.push(String(e.message)));
const G = new dom.window.Function(SRC + "\nreturn { SN_STRINGS, SN_I18N_EXTRA, snT, SN_FORM_LABELS, SN_STATS_STRINGS };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LANGS = ["de", "es", "fr", "nl", "pl", "pt", "ja", "zh", "hi"];

ok(LANGS.every((l) => G.SN_STRINGS[l] && Object.keys(G.SN_STRINGS[l]).length === Object.keys(G.SN_STRINGS.en).length), "SN_STRINGS: tutte le lingue con tutte le chiavi");
ok(G.snT({}, { language: "de" }).sent_today === G.SN_I18N_EXTRA.de.SN_STRINGS.sent_today, "de da hass.language");
ok(G.snT({}, { language: "zh-Hans" }) === G.SN_STRINGS.zh, "zh-Hans -> zh");
ok(G.snT({}, { language: "pt-BR" }) === G.SN_STRINGS.pt, "pt-BR -> pt");
ok(G.snT({ language: "fr" }, { language: "it" }) === G.SN_STRINGS.fr, "language: nella card vince");
ok(G.snT({}, { language: "sv" }) === G.SN_STRINGS.en, "lingua assente: inglese");
ok(G.SN_STRINGS.it.sent_today === "Inviate oggi", "italiano intatto (non sovrascritto)");
ok(LANGS.every((l) => G.SN_FORM_LABELS[l] && G.SN_STATS_STRINGS[l]), "editor e statistiche tradotti");

// ogni card si disegna in ogni lingua senza errori
const S = (state = "on", attributes = {}) => ({ state, attributes, last_changed: "2026-10-04T10:00:00Z" });
const states = {
  "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push", transport: "mobile_push", inclusion: ["default"] }),
  "switch.supernotify_transport_mobile_push": S("on", { name: "mobile_push", error_count: 0 }),
  "switch.supernotify_scenario_night": S("on", { name: "night" }),
  "switch.supernotify_recipient_lorenzo": S("on", { name: "lorenzo" }),
  "sensor.supernotify_notifications": S("12"),
};
const tags = ["control", "overview", "deliveries", "transports", "recipients", "scenarios", "bands", "composer", "simulator",
  "stats", "archive", "why", "tools", "automations"];
for (const language of [...LANGS, "zh-Hans"]) {
  const hass = { language, themes: { darkMode: false }, entities: {}, services: { supernotify: { notify: {} } }, user: { id: "u", is_admin: true },
    states, callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }) };
  const bad = [];
  for (const t of tags) {
    try {
      const el = document.createElement(`supernotify-${t}-card`);
      el.setConfig(t === "bands" ? { bands: {} } : {});
      document.body.appendChild(el);
      el.hass = hass;
      await wait(5);
      if (!el.shadowRoot || !el.shadowRoot.innerHTML.length) bad.push(t);
      el.remove();
    } catch (e) { bad.push(`${t}: ${e.message}`); }
  }
  ok(!bad.length, `${language}: 14 card disegnate ${bad.length ? bad.join(", ") : ""}`);
}
const de = document.createElement("supernotify-control-card");
de.setConfig({}); document.body.appendChild(de);
de.hass = { language: "de", themes: { darkMode: false }, entities: {}, services: {}, user: { id: "u", is_admin: true }, states,
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }) };
await wait(40);
ok(de.shadowRoot.innerHTML.includes(G.SN_I18N_EXTRA.de.SN_STRINGS.act_scen), `control in tedesco ("${G.SN_I18N_EXTRA.de.SN_STRINGS.act_scen}")`);
ok(!errors.length, `nessun errore di pagina ${errors.slice(0, 3).join(" | ")}`);

if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
