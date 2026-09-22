// v0.40.0: card Delivery/Transport pronte per gli switch della PR #207, ultimo avviso
// nella card Destinatari, nuova card "Perché?" alimentata da shell_command.
import { JSDOM } from "jsdom";
import fs from "fs";
import assert from "assert";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

// Dati sintetici con la stessa forma di tools/sn_archive_index.py (indice e --detail)
const T0 = Math.floor(Date.now() / 1000) - 600;
const IDX = {
  count: 2, chan: ["html5", "mobile_push"], scen: ["afternoon"],
  items: [
    { id: "1bf885a2", t: T0, ti: "Batteria scarica", m: "Sensore corridoio 1%", o: "partial_delivery", d: 1, s: 1,
      c: [[0, "s", "nessun target"], 1], sc: [0] },
    { id: "46b4982c", t: T0 - 300, ti: "Movimento", o: "dupe", s: 2, c: [[0, "s", "nessun target"], [1, "s", "doppione"]] },
  ],
};
let DET = JSON.stringify({ ok: true, n: {
  id: "1bf885a2-b66f-11f1-90a2-46ffb2cb0bcb", t: T0, ti: "Batteria scarica", m: "Sensore corridoio 1%",
  p: "medium", o: "partial_delivery", sel: "implicit", v: "2.7.0",
  sc: { on: ["multi_home", "afternoon"], sel: ["multi_home", "afternoon"] },
  occ: { home: ["person.lorenzo"], away: [], flags: ["ALL_HOME"] },
  ov: { mobile_push: { en: true, tg: { mobile_app_id: ["mobile_app_phone"] } } },
  dl: [
    { n: "html5", r: "skip", why: "NO_TARGET", tr: "always" },
    { n: "mobile_push", r: "ok", tg: { mobile_app_id: ["mobile_app_phone"] }, calls: 1 },
  ],
  ctx: { id: "01ABC" },
} });
const calls = [];
const del = (name, extra = {}) => ({ name, enabled: true, transport: "mobile_push", inclusion: ["default"], ...extra });
const now = new Date();
const hass = {
  language: "it", themes: { darkMode: false },
  services: { shell_command: { sn_archive_detail: {} }, switch: {}, button: {} },
  states: {
    // PR #207: switch + binary_sensor mirror for the same delivery -> one row
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { ...del("mobile_push"), transport_enabled: true, friendly_name: "SuperNotify Delivery Notifica sul telefono abilitata" } },
    "binary_sensor.supernotify_delivery_mobile_push": { state: "on", attributes: { ...del("mobile_push"), friendly_name: "SuperNotify Delivery Notifica sul telefono" } },
    "switch.supernotify_delivery_alexa_announce": { state: "on", attributes: { ...del("alexa_announce", { transport: "alexa_media_player" }), transport_enabled: false, friendly_name: "SuperNotify Delivery Annuncio vocale Alexa abilitata" } },
    // old style only (no switch)
    "binary_sensor.supernotify_delivery_tts": { state: "off", attributes: { ...del("tts", { transport: "tts" }), friendly_name: "Voce (TTS)" } },
    "binary_sensor.supernotify_delivery_sirena": { state: "on", attributes: { ...del("sirena", { transport: "generic", inclusion: ["explicit"] }) } },
    "switch.supernotify_transport_mobile_push": { state: "on", attributes: { name: "mobile_push", friendly_name: "SuperNotify Transport mobile_push abilitato" } },
    "binary_sensor.supernotify_transport_mobile_push": { state: "on", attributes: { name: "mobile_push" } },
    "button.supernotify_reset_overrides": { state: "unknown", attributes: {} },
    "switch.supernotify_recipient_lorenzo": { state: "on", attributes: { entity_id: "person.lorenzo", friendly_name: "SuperNotify Recipient Lorenzo (admin) abilitato" } },
    "switch.supernotify_recipient_jessica": { state: "off", attributes: { entity_id: "person.jessica", friendly_name: "SuperNotify Recipient Jessica abilitato" } },
    "notify.recipient_lorenzo": { state: new Date(IDX.items[0].t * 1000 + 3000).toISOString(), attributes: {} },
    "notify.recipient_jessica": { state: "unknown", attributes: {} },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo" } },
    "switch.supernotify_scenario_afternoon": { state: "on", attributes: { name: "afternoon", delivery: { tts: { enabled: false } }, friendly_name: "SuperNotify Scenario Afternoon" } },
    "switch.supernotify_scenario_multi_home": { state: "on", attributes: { name: "multi_home", delivery: { mobile_push: { enabled: true } }, friendly_name: "SuperNotify Scenario Persone a casa" } },
    "sensor.supernotify_archivio": { state: String(IDX.count), attributes: IDX, last_updated: "x" },
  },
  callService: (d, s, data) => { calls.push(["svc", d, s, data.entity_id]); return Promise.resolve(); },
  callApi: (m, path, body) => { calls.push(["api", m, path, body.state]); return Promise.resolve(); },
  callWS: async (msg) => {
    calls.push(["ws", msg.domain, msg.service, msg.service_data && msg.service_data.id]);
    if (msg.domain === "shell_command") return { response: { stdout: DET, stderr: "", returncode: 0 } };
    return { response: {} };
  },
};
const mount = (tag, cfg = {}) => {
  const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c;
};
const flush = () => new Promise((r) => setTimeout(r, 20));

// ---- deliveries ----
const dc = mount("supernotify-deliveries-card");
let rows = [...dc.shadowRoot.querySelectorAll(".row")];
assert.strictEqual(rows.length, 4, "una riga per delivery (switch + mirror unite)");
const mp = rows.find((r) => r.textContent.includes("mobile_push"));
assert.ok(mp.textContent.includes("Notifica sul telefono"), "alias pulito dallo switch");
assert.ok(!mp.textContent.includes("SuperNotify Delivery"));
assert.ok(rows.find((r) => r.textContent.includes("alexa_announce")).textContent.includes("transport spento"));
mp.querySelector(".sw input").checked = false; mp.querySelector(".sw input").dispatchEvent(new dom.window.Event("change"));
const tts = rows.find((r) => r.textContent.includes("tts"));
tts.querySelector(".sw input").checked = true; tts.querySelector(".sw input").dispatchEvent(new dom.window.Event("change"));
dc.shadowRoot.querySelector(".rstb").click();
assert.deepStrictEqual(calls.splice(0), [
  ["svc", "switch", "turn_off", "switch.supernotify_delivery_mobile_push"],
  ["api", "POST", "states/binary_sensor.supernotify_delivery_tts", "on"],
  ["svc", "button", "press", "button.supernotify_reset_overrides"],
]);

// ---- transports ----
const tc = mount("supernotify-transports-card");
rows = [...tc.shadowRoot.querySelectorAll(".row")];
assert.strictEqual(rows.length, 1);
rows[0].querySelector(".sw input").checked = false; rows[0].querySelector(".sw input").dispatchEvent(new dom.window.Event("change"));
assert.deepStrictEqual(calls.splice(0), [["svc", "switch", "turn_off", "switch.supernotify_transport_mobile_push"]]);
assert.ok(tc.shadowRoot.querySelector(".rstb"));

// ---- why card + recipients ----
const wc = mount("supernotify-why-card");
assert.strictEqual(dom.window.__snWhyCards, 1);
assert.ok(wc.shadowRoot.querySelectorAll(".it").length > 0, "elenco notifiche");
await flush();
// si apre da sola sull'ultima notifica
assert.deepStrictEqual(calls.splice(0), [["ws", "shell_command", "sn_archive_detail", IDX.items[0].id]]);
const rc = mount("supernotify-recipients-card");
const lor = [...rc.shadowRoot.querySelectorAll(".row")].find((r) => r.textContent.includes("Lorenzo"));
const last = lor.querySelector(".last");
assert.ok(last && last.textContent.includes("ultimo avviso"), "ultimo avviso");
assert.ok(last.textContent.includes(IDX.items[0].ti), "titolo dall'archivio");
const jes = [...rc.shadowRoot.querySelectorAll(".row")].find((r) => r.textContent.includes("Jessica"));
assert.ok(jes.textContent.includes("nessun avviso"));
last.click();               // -> evento -> la card Perché? mostra il dettaglio (già in cache)
await flush();
assert.deepStrictEqual(calls.splice(0), []);
const det = wc.shadowRoot.getElementById("det").textContent;
assert.ok(det.includes("Scenari in vigore") && det.includes("Persone a casa"), "scenari con nome pulito");
assert.ok(det.includes("in casa") && det.includes("Lorenzo"), "presenza");
assert.ok(det.includes("mobile_push") && det.includes("consegnata"), "canale consegnato");
assert.ok(det.includes("nessun destinatario utilizzabile"), "motivo tradotto");
assert.ok(det.includes("scelto da") && det.includes("sempre attivo"), "chi l'ha scelto");
assert.ok(det.includes("Canali che non sono partiti"), "sezione non partiti");
assert.ok(/tts[\s\S]*spento/.test(det), "tts spento");
assert.ok(/sirena[\s\S]*solo se chiesto per nome/.test(det), "sirena solo esplicita");
assert.ok(det.includes("diagnostica"), "nota sul trace");
// cache: secondo click non richiama il servizio
last.click(); await flush();
assert.deepStrictEqual(calls.splice(0), []);

// ---- archive card: link Perché? ----
const ac = mount("supernotify-archive-card");
const firstRow = ac.shadowRoot.querySelector(".row");
firstRow.click();
const why = ac.shadowRoot.querySelector(".why");
assert.ok(why, "link Perché? con la why-card presente");

// ---- trace con delivery_provenance: vince sulla ricostruzione ----
const withProv = JSON.parse(DET);
withProv.n.trace = { prov: {
  mobile_push: { enabled_by: ["scenario:multi_home", "default"] },
  tts: { enabled_by: ["default"], disabled_by: ["scenario:afternoon"] },
} };
DET = JSON.stringify(withProv);
wc._cache.clear();
await wc._select(IDX.items[0].id);
const det2 = wc.shadowRoot.getElementById("det").textContent;
assert.ok(/mobile_push[\s\S]*scelto da: scenario Persone a casa · sempre attivo/.test(det2), "fonti dal trace");
assert.ok(/tts[\s\S]*spento da: scenario Afternoon/.test(det2), "spento da scenario (trace)");
assert.ok(det2.includes("trace di selezione archiviato"), "nota: dal trace");

// ---- servizio mancante ----
delete hass.services.shell_command;
wc._cache.clear();
await wc._select(IDX.items[1].id);
assert.ok(wc.shadowRoot.getElementById("det").textContent.includes("Manca il servizio"));
console.log("why_and_switches: OK");
process.exit(0);
