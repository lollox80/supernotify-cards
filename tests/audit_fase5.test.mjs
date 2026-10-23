// 1.0.0 (audit, phase 5): SuperNotify 2.13 and Home Assistant 2026.2 minimum - the code for older
// versions is gone. The cards work on a "2.13" hass (its actions and entities only), the options of
// the removed paths are ignored by setConfig, and the old stats cache is freed.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync(process.env.SN_SRC || "dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
dom.window.confirm = () => true;
// the cache of the per-notification stats rows of before `verbosity: daily`, left by an older version
dom.window.localStorage.setItem("supernotify-stats-archive", JSON.stringify({ v: 1, rows: [[1, "medium"]] }));
const errors = [];
dom.window.addEventListener("error", (e) => errors.push(String(e.message)));
const G = new dom.window.Function(SRC + "\nreturn { snSnoozeCall, snNativePause, snToggle, snEntityRows, snDeliveryAlias, snIsManualScenario, snDryAvailable, snFeatureEntity };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the old stats cache is removed once, at load ────────────────────────────
ok(dom.window.localStorage.getItem("supernotify-stats-archive") === null, "localStorage supernotify-stats-archive rimosso all'avvio");

// ── a SuperNotify 2.13 installation: its actions (services.yaml of v2.13.0) and entities ──
const ACTIONS = ["reload", "notify", "enquire_configuration", "enquire_deliveries_by_scenario", "enquire_implicit_deliveries",
  "enquire_archive", "enquire_last_notification", "enquire_recipients", "enquire_scenarios", "enquire_active_scenarios",
  "enquire_occupancy", "enquire_snoozes", "refresh_entities", "reset_overrides", "clear_snoozes", "snooze", "silence",
  "unsnooze", "purge_media", "purge_archive"];
const services = { supernotify: Object.fromEntries(ACTIONS.map((a) => [a, a === "notify" ? { response: { optional: true } } : {}])) };
services.supernotify.enquire_archive.fields = { id: {}, limit: {}, after: {}, before: {}, outcome: {}, period: {}, verbosity: {} };
const S = (state, attributes = {}) => ({ state, attributes, last_changed: "2026-10-23T08:00:00Z", last_updated: "2026-10-23T08:00:00Z" });
const del = (name, alias, on = "on", extra = {}) => S(on, { name, enabled: on === "on", transport: "mobile_push", inclusion: ["default"],
  transport_enabled: true, overridden: false, friendly_name: `SuperNotify Delivery ${alias} abilitata`, ...extra });
const states = {
  "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono"),
  "switch.supernotify_delivery_email": del("email", "Email", "off", { overridden: true, transport: "email" }),
  "switch.supernotify_transport_mobile_push": S("on", { name: "mobile_push", error_count: 0, overridden: false }),
  "switch.supernotify_transport_email": S("on", { name: "email", error_count: 0, overridden: false }),
  "switch.supernotify_recipient_lorenzo": S("on", { entity_id: "person.lorenzo", friendly_name: "SuperNotify Recipient Lorenzo Enabled" }),
  "switch.supernotify_scenario_morning": S("on", { name: "morning", enabled: true, delivery: {}, friendly_name: "SuperNotify Scenario Mattina" }),
  "binary_sensor.supernotify_scenario_morning": S("unknown", { name: "morning" }), // scenario_control refresh off
  "switch.supernotify_scenario_ospiti": S("on", { name: "ospiti", enabled: true, delivery: {}, friendly_name: "SuperNotify Scenario Ospiti" }),
  "binary_sensor.supernotify_scenario_ospiti": S("off", { name: "ospiti" }),
  "sensor.supernotify_notifications": S("12"),
  "sensor.supernotify_failures": S("0"),
  "notify.recipient_lorenzo": S("unknown"),
  "person.lorenzo": S("home", { user_id: "u1", friendly_name: "Lorenzo" }),
  "update.supernotify_update": S("off", { installed_version: "v2.13.0" }),
};
const entities = {
  "binary_sensor.supernotify_scenario_morning": { platform: "supernotify", translation_key: "scenario" },
  "binary_sensor.supernotify_scenario_ospiti": { platform: "supernotify", translation_key: "scenario_manual" },
};
const today = new Date().toLocaleDateString("sv");
const DOC = { id: "aaaa1111-2222", created: new Date(Date.now() - 300000).toISOString(), message: "Porta\nAperta", priority: "high",
  outcome: "success", delivered: 1, deliveries: { mobile_push: { success: [{}] } } };
const calls = [];
const mkHass = (extra = {}) => ({
  language: "it", themes: { darkMode: false }, entities, services, states, config: { version: "2026.2.0" },
  user: { id: "u1", is_admin: false },
  callService: async (d, s, data) => { calls.push(["svc", `${d}.${s}`, data]); },
  callApi: async (m, p, d) => { calls.push(["api", p, d]); },
  callWS: async (m) => {
    calls.push(["ws", m.service || m.type, m.service_data]);
    const d = m.service_data || {};
    if (m.service === "enquire_archive") {
      if (d.verbosity === "daily") return { response: { days: [{ date: today, count: 3, outcome: { success: 3 }, priority: { high: 1, medium: 2 },
        hour: new Array(24).fill(0).map((_, h) => (h === 9 ? 3 : 0)), deliveries: { mobile_push: { success: 3, failed: 0 } }, scenarios: { morning: 3 } }] } };
      if (d.id) return { response: DOC };
      return { response: { notifications: [DOC], count: 1 } };
    }
    if (m.service === "enquire_active_scenarios") return { response: { scenarios: ["morning"] } };
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    if (m.service === "enquire_last_notification") return { response: DOC };
    if (m.service === "enquire_occupancy") return { response: {} };
    if (m.service === "notify") return { response: { ...DOC, id: "dry" } };
    if (m.type && m.type !== "call_service") return m.type.includes("config_entries") || m.type.includes("logbook") ? [] : {};
    return { response: {} };
  },
  ...extra,
});

// ── every card mounts on 2.13 without errors, with the options of the removed paths in its config ──
const REMOVED = {
  // archive / why / recipients: the sensor + shell_command bridge (before 2.10)
  source: "sensor", entity: "sensor.supernotify_archivio", service: "shell_command.sn_archive_detail", archive_entity: "sensor.supernotify_archivio",
  // stats / overview: helpers and counters of before 2.12.1
  time_entity: "input_datetime.supernotify_last_time", priority_entity: "input_text.supernotify_last_priority",
  channels_entity: "input_text.supernotify_last_channels", period_entity: "input_text.supernotify_last_day_period",
  sent_today_entity: "sensor.supernotify_inviate_oggi", count_entity: "sensor.supernotify_notifications", daily: false, stats: "full",
  // composer: the version no longer decides
  update_entity: "update.non_esiste",
};
const TAGS = ["control", "overview", "bands", "deliveries", "transports", "recipients", "scenarios", "simulator", "composer",
  "automations", "stats", "archive", "why", "tools", "appliances"].map((t) => `supernotify-${t}-card`);
const hass = mkHass();
const cards = {};
for (const tag of TAGS) {
  let threw = null;
  const el = document.createElement(tag);
  try { el.setConfig({ ...REMOVED }); document.body.appendChild(el); el.hass = hass; } catch (e) { threw = e; }
  cards[tag] = el;
  ok(!threw && el.shadowRoot && el.shadowRoot.innerHTML.length > 0, `${tag}: setConfig con le opzioni rimosse e disegno su 2.13 (${threw && threw.message})`);
}
await wait(150);
for (const tag of TAGS) cards[tag].hass = { ...hass };
await wait(150);
ok(!errors.length, `nessun errore nella pagina (${errors.join(" | ")})`);

// archive: from enquire_archive even with `source: sensor` (the option is ignored)
const ar = cards["supernotify-archive-card"];
ok(!calls.some((c) => c[1] === "shell_command" || (c[2] && c[2].entity_id === "sensor.supernotify_archivio")), "archivio: niente shell_command né sensore ponte");
ok(calls.some((c) => c[1] === "enquire_archive"), "archivio: enquire_archive");
ok(/Porta/.test(ar.shadowRoot.getElementById("list").textContent), `archivio: la notifica dall'archivio nativo (${ar.shadowRoot.getElementById("list").textContent.slice(0, 80)})`);
ok(!("entity" in ar._config) || ar._config.entity === REMOVED.entity, "archivio: nessun default `entity` aggiunto");
ok(!("service" in customElements.get("supernotify-archive-card").prototype), "archivio: niente ramo shell_command");

// stats: one daily call, never the helpers' history, even with the helpers set
const st = cards["supernotify-stats-card"];
ok(!calls.some((c) => c[1] === "history/history_during_period" || c[1] === "recorder/statistics_during_period"), "stats: niente cronologia né statistiche degli helper");
ok(calls.some((c) => c[1] === "enquire_archive" && c[2].verbosity === "daily"), "stats: verbosity daily (anche con `daily: false`)");
ok(!calls.some((c) => c[1] === "enquire_archive" && c[2].verbosity === "summary" && c[2].before && !(c[2].after && c[2].limit === 5000)),
  "stats: mai giorno per giorno (snStatsArchive rimosso)");
// kept: 2.13's enquire_archive has no `priority` filter (it comes in 2.14), so Critical / High read the days that have some
ok(calls.some((c) => c[1] === "enquire_archive" && c[2].verbosity === "summary" && c[2].before && c[2].limit === 5000 && !c[2].priority),
  "tenuto: filtri Critiche/Alte giorno per giorno su 2.13 (priority solo dalla 2.14)");
ok(st._data && st._data.total === 3 && st._data.perHour[9] === 3, `stats: numeri dai totali giornalieri (${st._data && st._data.total})`);
ok(!("time_entity" in st._config) || st._config.time_entity === REMOVED.time_entity, "stats: nessun default degli helper");

// overview: always the archive's four numbers
const ov = cards["supernotify-overview-card"];
ok(ov.shadowRoot.querySelectorAll(".stat").length === 4, `overview: quattro numeri (${ov.shadowRoot.querySelectorAll(".stat").length})`);
ok(/Oggi/.test(ov.shadowRoot.getElementById("stats").textContent), "overview: Oggi dall'archivio");

// composer: dry run shown without reading the update entity; a channel without text goes
const cp = cards["supernotify-composer-card"];
ok(cp.shadowRoot.getElementById("dry").style.display === "", "composer: Prova senza inviare su 2.13, senza entità update");
calls.length = 0;
cp.shadowRoot.getElementById("m").value = "Ciao";
await cp._dryRun();
const dr = calls.find((c) => c[1] === "notify");
ok(dr && dr[2].dry_run === "simulate" && !("force_resend" in dr[2]), "composer: dry run con il controllo doppioni (cache separata in 2.13)");

// simulator: SuperNotify's dry run; `dry_run: false` keeps the estimate (documented option)
ok(G.snDryAvailable(hass, {}) === true && G.snDryAvailable(hass, { dry_run: false }) === false, "snDryAvailable: sempre su 2.13, false con dry_run: false");
const sim2 = document.createElement("supernotify-simulator-card");
sim2.setConfig({ dry_run: false }); document.body.appendChild(sim2); sim2.hass = hass;
// 1.0.0 (phase 4): the simulator asks snDryAvailable with its own config (no _dryMode any more)
const simDry = (c) => G.snDryAvailable(c._hass, c._config);
ok(simDry(sim2) === false && simDry(cards["supernotify-simulator-card"]) === true, "simulatore: dry run di SuperNotify, stima con dry_run: false");

// ── 2.13 actions: snooze / silence / unsnooze, no `command`, for any user ──
calls.length = 0;
await G.snSnoozeCall(hass, { command: "snooze", scope: "noncritical", minutes: 30 });
await G.snSnoozeCall(hass, { command: "silence", scope: "everything", minutes: 30 });
await G.snSnoozeCall(hass, { command: "resume", scope: "delivery", name: "email" });
const sz = calls.filter((c) => c[0] === "ws").map((c) => [c[1], c[2]]);
ok(sz[0][0] === "snooze" && sz[0][1].minutes === 30 && !("command" in sz[0][1]), "snooze: supernotify.snooze con i minuti");
ok(sz[1][0] === "silence" && !("minutes" in sz[1][1]) && !("command" in sz[1][1]), "silence: supernotify.silence senza minuti");
ok(sz[2][0] === "unsnooze" && !("reason" in sz[2][1]) && sz[2][1].name === "email", "resume: supernotify.unsnooze");
calls.length = 0;
await G.snNativePause(hass, 60);
ok(calls.some((c) => c[1] === "snooze") && !calls.some((c) => c[0] === "api" || c[1] === "conversation/process"), "pausa delle tile: supernotify.snooze anche non admin, niente evento né comandi vocali");

// ── switches: rows, toggles, aliases; the deprecated binary_sensor mirror is ignored ──
const mirror = { ...states, "binary_sensor.supernotify_delivery_mobile_push": S("off", { name: "mobile_push", friendly_name: "Vecchio" }),
  "binary_sensor.supernotify_delivery_vecchia": S("on", { name: "vecchia" }) };
const rows = G.snEntityRows({ states: mirror }, "delivery");
ok(rows.length === 2 && rows.every((r) => r.id.startsWith("switch.")), `righe delivery: solo gli switch (${rows.map((r) => r.id).join(", ")})`);
ok(G.snDeliveryAlias({ states: mirror }, "mobile_push") === "Notifica sul telefono", "alias dallo switch");
calls.length = 0;
await G.snToggle(hass, "switch.supernotify_delivery_email", true);
ok(calls.length === 1 && calls[0][1] === "switch.turn_on", "toggle: servizio switch");
calls.length = 0;
await G.snToggle(hass, "binary_sensor.supernotify_scenario_ospiti", true);
ok(calls.length === 1 && calls[0][1] === "states/binary_sensor.supernotify_scenario_ospiti" && calls[0][2].state === "on",
  "scenario manuale: scrittura dello stato (l'unica rimasta, SupernotifyScenarioManualBinarySensor)");
ok(G.snIsManualScenario(hass, "binary_sensor.supernotify_scenario_ospiti") && !G.snIsManualScenario(hass, "binary_sensor.supernotify_scenario_morning"),
  "manuale dal translation_key del registro");
ok(!G.snIsManualScenario({ entities: {}, states: { "binary_sensor.supernotify_scenario_x": S("on", { friendly_name: "SuperNotify Scenario manuale X" }) } }, "binary_sensor.supernotify_scenario_x"),
  "niente ripiego sul friendly_name");

// ── HA 2026.2: tile features read context; strategy tabs with icon + name ──
ok(G.snFeatureEntity({ context: { entity_id: "sensor.supernotify_notifications" } }) === "sensor.supernotify_notifications"
  && G.snFeatureEntity({ stateObj: { entity_id: "sensor.supernotify_notifications" } }) === "", "feature: entità dal context (HA 2026.2)");
const feat = window.customCardFeatures.find((x) => x.type === "supernotify-pause");
ok(feat.supported({ entity_id: "sensor.supernotify_notifications" }), "feature.supported(stateObj): come la chiama ancora HA 2026.2");
const Strat = customElements.get("ll-strategy-dashboard-supernotify");
const views = (await Strat.generate({ type: "custom:supernotify" }, { language: "it", states: {}, user: { is_admin: true }, config: {} })).views;
ok(views.every((v) => /^mdi:/.test(v.icon) && v.show_icon_and_title === true), "strategia: icona + nome anche senza versione HA");

// ── nothing of the removed code is left in the bundle ──
for (const name of ["snSetBinaryState", "snSupernotifyAtLeast", "snStatsArchive", "snDailyCounts", "snTabsBoth", "snArchiveNative",
  "_historyEvents", "_parseChannels", "_rowDetail", "_dryKey", "lightOk", "sn_archive_detail", "supernotify_archivio",
  "mobile_app_notification_action\", { action: `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_${minutes}`"]) {
  ok(!SRC.includes(name), `rimosso dal bundle: ${name}`);
}
ok(!fs.existsSync("tools/sn_archive_index.py"), "tools/sn_archive_index.py rimosso");
// kept on purpose: still needed on 2.13
ok(SRC.includes('snEnquire(hass, "enquire_active_scenarios")'), "tenuto: poll enquire_active_scenarios (scenario_control refresh spento -> sensori unknown)");
ok(/snooze_action/.test(SRC) && /mobile_app_notification_action/.test(SRC), "tenuto: snooze_action del control (deprecazione futura)");
ok(/last_notification_entity/.test(SRC), "tenuto: last_notification_entity del control (deprecazione futura)");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
