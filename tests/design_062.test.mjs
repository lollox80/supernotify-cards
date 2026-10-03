// v0.62.0: card Strumenti, destinatari con prova e dispositivi, compositore con opzioni avanzate.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ws = [], svc = [];
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: true },
  services: { supernotify: { notify: { response: { optional: true } } } },
  states: {
    "switch.supernotify_recipient_lorenzo": { state: "on", attributes: { entity_id: "person.lorenzo", friendly_name: "SuperNotify Recipient Lorenzo",
      mobile_devices: [{ device_name: "S948B", manufacturer: "samsung", model: "SM-S948B", os_name: "Android", os_version: "16", app_version: "2026.9.1", mobile_app_id: "s948b" }] } },
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo" } },
    "notify.recipient_lorenzo": { state: "2026-10-04T08:00:00+00:00", attributes: {} },
    "switch.supernotify_scenario_morning": { state: "on", attributes: { name: "morning" } },
    "switch.supernotify_scenario_night": { state: "on", attributes: { name: "night" } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push" } },
  },
  callService: async (d, s, data) => { svc.push([d, s, data]); },
  callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m);
    const r = (x) => ({ response: x });
    if (m.service === "clear_snoozes") return r({ cleared: 2 });
    if (m.service === "purge_archive") return r({ purged: 312, remaining: 2910, days: m.service_data.days });
    if (m.service === "reset_overrides") return r({ reset: { delivery: ["tts"], scenario: [] } });
    if (m.service === "enquire_configuration") throw { code: "unknown_error", message: "Unable to serialize to JSON" };
    if (m.service === "enquire_occupancy") return r({ scenarios: { home: [{ person: "person.lorenzo", enabled: true }], not_home: [] } });
    if (m.service === "refresh_entities") return {};
    return r({});
  },
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); c.hass = hass; document.body.appendChild(c); return c; };
const $ = (c, id) => c.shadowRoot.getElementById(id);

// ── (1) tools ──
const tc = mount("supernotify-tools-card");
ok(window.customCards.some((c) => c.type === "supernotify-tools-card" && c.preview), "card Strumenti registrata con anteprima");
$(tc, "refresh").click(); await wait(10);
const rf = ws.find((m) => m.service === "refresh_entities");
ok(rf && !("return_response" in rf), "aggiorna entità: senza risposta (il servizio non ne ha)");
$(tc, "clear").click(); await wait(10);
ok(/2 pause riprese/.test($(tc, "r_clear").textContent), `annulla pause con il conteggio (${$(tc, "r_clear").textContent})`);
$(tc, "dArch").value = "20";
$(tc, "purgeArch").click(); await wait(10);
ok(!ws.some((m) => m.service === "purge_archive") && /Tocca ancora/.test($(tc, "purgeArch").textContent), "pulizia: il primo tocco chiede conferma");
$(tc, "purgeArch").click(); await wait(10);
const pa = ws.find((m) => m.service === "purge_archive");
ok(pa && pa.service_data.days === 20 && /312 cancellati · 2910 rimasti/.test($(tc, "r_purgeArch").textContent), `pulizia archivio a 20 giorni con l'esito (${$(tc, "r_purgeArch").textContent})`);
$(tc, "kind").value = "delivery";
$(tc, "reset").click(); $(tc, "reset").click(); await wait(10);
const ro = ws.find((m) => m.service === "reset_overrides");
ok(ro && ro.service_data.kind === "delivery" && /canali: tts/.test($(tc, "r_reset").textContent), `ripristino per tipo con l'elenco (${$(tc, "r_reset").textContent})`);
tc.shadowRoot.querySelector('.q[data-q="enquire_occupancy"]').click(); await wait(10);
ok(/Chi è in casa/.test($(tc, "out").textContent) && /person\.lorenzo/.test($(tc, "out").textContent), "interrogazione mostrata come albero");
tc.shadowRoot.querySelector('.q[data-q="enquire_configuration"]').click(); await wait(10);
ok(/#241/.test($(tc, "out").textContent), "configurazione: errore spiegato (bug #241)");

// ── (3) recipients ──
const rc = mount("supernotify-recipients-card");
await wait(20);
const devb = rc.shadowRoot.querySelector(".devb");
ok(devb && /1 dispositivo/.test(devb.textContent), "chip dispositivi cliccabile");
devb.click(); await wait(10);
ok(/S948B/.test(rc.shadowRoot.textContent) && /samsung SM-S948B · Android 16 · app 2026\.9\.1/.test(rc.shadowRoot.textContent), "dispositivi: modello, sistema, versione app");
let tst = rc.shadowRoot.querySelector(".tst");
tst.click(); await wait(10);
ok(!svc.some((x) => x[1] === "send_message") && /Tocca ancora/.test(rc.shadowRoot.querySelector(".tst").textContent), "prova: il primo tocco chiede conferma");
rc.shadowRoot.querySelector(".tst").click(); await wait(10);
const sm = svc.find((x) => x[0] === "notify" && x[1] === "send_message");
ok(sm && sm[2].entity_id === "notify.recipient_lorenzo" && sm[2].title === "Prova SuperNotify", "prova inviata via notify.recipient_lorenzo");

// ── (4) composer ──
const cc = mount("supernotify-composer-card");
await wait(10);
const sr = cc.shadowRoot;
sr.getElementById("m").value = "Ciao";
sr.getElementById("spk").value = "Ciao a tutti";
sr.querySelector('.achips[data-k="apply_scenarios"] .chip[data-s="night"]').click();
sr.querySelector('.achips[data-k="require_scenarios"] .chip[data-s="morning"]').click();
sr.getElementById("snapUrl").value = "https://x/y.jpg";
sr.getElementById("dbg").checked = true;
const pl = cc._payload();
ok(pl.spoken_message === "Ciao a tutti" && pl.apply_scenarios.join() === "night" && pl.require_scenarios.join() === "morning" && pl.snapshot_url === "https://x/y.jpg" && pl.debug === true && !pl.constrain_scenarios,
  `compositore: opzioni avanzate nel payload (${JSON.stringify(pl)})`);

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
