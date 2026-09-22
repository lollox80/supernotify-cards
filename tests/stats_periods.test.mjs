// stats-card 0.21.0: scelta 7/14/30 giorni nell'intestazione, ricordata nel browser.
import { JSDOM } from "jsdom";
import fs from "fs";
import assert from "assert";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

const starts = [];
const day = 86400000;
const hass = {
  language: "it", themes: { darkMode: false }, states: {},
  callWS: async (msg) => {
    if (msg.type === "history/history_during_period") {
      starts.push(msg.start_time);
      // cronologia solo negli ultimi 3 giorni
      const rows = [0, 1, 2].map((i) => ({ s: new Date(Date.now() - i * day).toISOString(), lu: (Date.now() - i * day) / 1000 }));
      return { "input_datetime.supernotify_last_time": rows };
    }
    return {};
  },
};
const flush = () => new Promise((r) => setTimeout(r, 30));
const c = document.createElement("supernotify-stats-card");
c.setConfig({});
document.body.appendChild(c);
c.hass = hass;
await flush();
const btns = () => [...c.shadowRoot.querySelectorAll(".pb")];
assert.deepStrictEqual(btns().map((b) => b.textContent), ["7 gg", "14 gg", "30 gg"]);
assert.ok(btns()[1].classList.contains("on"), "default 14");
const span = (iso) => Math.round((Date.now() - new Date(iso).getTime()) / day);
assert.ok(span(starts[0]) >= 14 && span(starts[0]) <= 15);
assert.ok(c.shadowRoot.getElementById("win").textContent.includes("ultimi 3 giorni"), "nota cronologia corta");

btns()[2].click();
await flush();
assert.ok(btns()[2].classList.contains("on"), "30 selezionato");
assert.ok(span(starts[starts.length - 1]) >= 30, "carica 30 giorni");
assert.strictEqual(dom.window.localStorage.getItem("supernotify-stats-days"), "30");

// una nuova card riparte dalla scelta ricordata
const c2 = document.createElement("supernotify-stats-card");
c2.setConfig({});
document.body.appendChild(c2);
c2.hass = hass;
await flush();
assert.ok([...c2.shadowRoot.querySelectorAll(".pb")][2].classList.contains("on"));
// 0.22.1: icona e alias dei canali letti dallo switch (i binary_sensor mirror sono deprecati
// e su 2.8 possono essere stati cancellati)
const hass3 = {
  ...hass,
  states: {
    "switch.supernotify_delivery_mobile_push": {
      state: "on",
      entity_id: "switch.supernotify_delivery_mobile_push",
      attributes: { name: "mobile_push", transport: "mobile_push", friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" },
    },
  },
};
const c3 = document.createElement("supernotify-stats-card");
c3.setConfig({});
document.body.appendChild(c3);
c3.hass = hass3;
await flush();
assert.strictEqual(c3._aliasFor("mobile_push"), "Notifica sul telefono", "alias dallo switch");
assert.strictEqual(c3._aliasFor("telegram"), null, "nessun alias senza entita");
assert.notStrictEqual(c3._iconFor("mobile_push"), c3._iconFor("delivery_inesistente"), "icona dal transport dello switch");

console.log("stats_periods: OK");
process.exit(0);
