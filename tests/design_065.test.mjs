// CHANGELOG
// 2026-10-04 v0.65.0: card collegate, ultima notifica una volta sola, ripristino solo in Strumenti,
//   simulatore con la prova vera di SuperNotify.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
global.CSS = dom.window.CSS || { escape: (x) => String(x).replace(/["\\]/g, "\\$&") };
dom.window.CSS = global.CSS;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ws = [];
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  services: { supernotify: { notify: { response: { optional: true } } } },
  states: {
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo", user_id: "u1" } },
    "switch.supernotify_recipient_lorenzo": { state: "on", attributes: { entity_id: "person.lorenzo", friendly_name: "SuperNotify Recipient Lorenzo" } },
    "switch.supernotify_transport_telegram": { state: "on", attributes: { name: "telegram", error_count: 2, last_error_message: "chat not found" } },
    "switch.supernotify_delivery_sms": { state: "off", attributes: { name: "sms", transport: "sms" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push" } },
    "binary_sensor.supernotify_scenario_morning": { state: "on", attributes: {} },
    "switch.supernotify_scenario_morning": { state: "on", attributes: { name: "morning", friendly_name: "SuperNotify Scenario Mattina" } },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m);
    const r = (x) => ({ response: x });
    if (m.service === "enquire_occupancy") return r({ scenarios: { home: [{ person: "person.lorenzo", enabled: true }], not_home: [] } });
    if (m.service === "enquire_snoozes") return r({ snoozes: [{ target_type: "EVERYTHING", recipient_type: "EVERYONE", snooze_until: null }] });
    if (m.service === "enquire_last_notification") return r({ id: "abc", message: "Ciao", deliveries: { mobile_push: { success: [{}] } } });
    if (m.service === "enquire_active_scenarios") return r({ scenarios: ["morning"] });
    if (m.service === "enquire_deliveries_by_scenario") return r({ morning: { enabled: ["mobile_push"], disabled: [] } });
    if (m.service === "enquire_implicit_deliveries") return r({ default: ["mobile_push"] });
    if (m.service === "notify" && m.service_data.dry_run) return r({ id: "d1", outcome: "success", priority: m.service_data.priority,
      deliveries: { mobile_push: { success: [{ target: { mobile_app_id: ["phone"] }, calls: [] }] } } });
    return r({});
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// overview alone: last notification shown
const ov = mount("supernotify-overview-card");
await wait(40); ov.hass = { ...hass };
ok(!!ov.shadowRoot.getElementById("last"), "overview da sola: ultima notifica presente");
// cards arrive
const cc = mount("supernotify-control-card", { tiles: ["snooze"], last_notification: true });
const tr = mount("supernotify-transports-card");
const dl = mount("supernotify-deliveries-card");
const sc = mount("supernotify-scenarios-card");
const rc = mount("supernotify-recipients-card");
await wait(80); ov.hass = { ...hass }; cc.hass = { ...hass }; await wait(20);
ok(!ov.shadowRoot.getElementById("last"), "con la control sulla pagina l'overview non ripete l'ultima notifica");
ok(!!cc.shadowRoot.getElementById("lastn"), "la control la mostra");
const ov2 = document.createElement("supernotify-overview-card"); ov2.setConfig({ last_notification: true }); document.body.appendChild(ov2); ov2.hass = hass;
ok(!!ov2.shadowRoot.getElementById("last"), "last_notification: true la forza");

// links from the health list
const goBtns = [...ov.shadowRoot.querySelectorAll("#health [data-go]")];
ok(goBtns.length >= 3, `salute: ${goBtns.length} righe con Mostra ›`);
const trBtn = goBtns.find((b) => /transport/.test(b.closest(".hr").textContent));
trBtn.click(); await wait(10);
ok(tr._open && tr._open.has("switch.supernotify_transport_telegram") && tr.shadowRoot.querySelector('.row[aria-expanded="true"]'), "transport con errori: apre la card Transport su quella riga");
goBtns.find((b) => /spent/.test(b.closest(".hr").textContent)).click(); await wait(10);
ok(dl._open && dl._open.has("switch.supernotify_delivery_sms"), "canali spenti: apre la card Canali sulla riga");
goBtns.find((b) => /pausa|Snooz|In pausa/i.test(b.closest(".hr").textContent)).click(); await wait(10);
ok(cc._snzOpen === true && !cc.shadowRoot.getElementById("snzp").hidden, "pausa: apre il pannello pause della control");
// chips
const pchip = ov.shadowRoot.querySelector("#occ [data-gor]");
let flashed = null; const orig = rc._focus.bind(rc); rc._focus = (d) => { flashed = d; orig(d); };
pchip.click();
ok(flashed && flashed.persons.includes("person.lorenzo"), "persona: apre la card Destinatari");
const schip = ov.shadowRoot.querySelector("#scen [data-gos]");
let sf = null; const os = sc._focus.bind(sc); sc._focus = (d) => { sf = d; os(d); };
schip.click();
ok(sf && sf.names[0] === "morning", "scenario: apre la card Scenari");
// control status
const seg = cc.shadowRoot.querySelector('#statusbar [data-go="scenarios"]');
ok(!!seg, "control: scenari attivi cliccabili");

// reset overrides only in tools
ok(!tr.shadowRoot.querySelector(".rstb") && !dl.shadowRoot.querySelector(".rstb"), "niente ripristino in Transport e Canali");

// simulator: dry run
const sim = mount("supernotify-simulator-card");
await wait(400);
const dry = ws.filter((m) => m.service === "notify" && m.service_data.dry_run === "simulate").pop();
ok(dry && dry.service_data.apply_scenarios.join() === "morning" && dry.service_data.constrain_scenarios.join() === "morning" && dry.service_data.force_resend === true,
  "simulatore: prova vera con gli scenari scelti, e solo quelli");
console.log("   result:", sim.shadowRoot.getElementById("result").textContent.replace(/\s+/g," ").slice(0,200));
ok(/phone|mobile/i.test(sim.shadowRoot.getElementById("result").textContent), "simulatore: stessa vista del composer");
sim.shadowRoot.querySelector(".chip").click(); await wait(400);
const dry2 = ws.filter((m) => m.service === "notify" && m.service_data.dry_run).pop();
ok(dry2.service_data.apply_scenarios.length === 0 && dry2.service_data.constrain_scenarios[0] === "__simulator_none__", "nessuno scenario scelto: nessuno considerato");
const sp = sim.shadowRoot.getElementById("sprio"); sp.value = "critical"; sp.dispatchEvent(new window.Event("change")); await wait(400);
ok(ws.filter((m) => m.service === "notify" && m.service_data.dry_run).pop().service_data.priority === "critical", "simulatore: priorità scelta");
const est = document.createElement("supernotify-simulator-card"); est.setConfig({ dry_run: false }); document.body.appendChild(est); est.hass = hass; await wait(80);
ok(/Partirebbero|Would go out/.test(est.shadowRoot.getElementById("result").textContent), "dry_run: false tiene la stima");

console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
