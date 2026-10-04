// tools/showcase.mjs - README / docs screenshots of every card, from a demo installation.
//
// CHANGELOG
// 2026-10-03 - first version (v0.53.1): replaces the lost showcase.html harness of 0.48.4.
//
// Renders each card with invented data (English UI, no real names or addresses) in headless
// Chromium at 2x and writes docs/images/*.png. <ha-icon> is stubbed with the real Material
// Design Icons paths from @mdi/js, so icons look as they do in Home Assistant.
//
//   npm i --no-save playwright @mdi/js        (once; or set NODE_PATH to where they are)
//   node tools/showcase.mjs                    (all images)
//   node tools/showcase.mjs control why        (only some)
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const req = createRequire(path.join(ROOT, "package.json"));
const find = (mod) => {
  for (const base of [ROOT, ...(process.env.NODE_PATH || "").split(path.delimiter).filter(Boolean)]) {
    try { return createRequire(path.join(base, "x.js")).resolve(mod); } catch (e) { /* next */ }
  }
  return req.resolve(mod);
};
const pw = await import(find("playwright"));
const chromium = pw.chromium || (pw.default && pw.default.chromium);
const mdi = createRequire(import.meta.url)(find("@mdi/js"));
const BUNDLE = fs.readFileSync(path.join(ROOT, "dist/supernotify-control-card.js"), "utf8");
const OUT = path.join(ROOT, "docs/images");
const only = new Set(process.argv.slice(2));

// every mdi:* name the bundle can produce -> SVG path
const icons = {};
for (const m of BUNDLE.matchAll(/(?:"|mdi:)([a-z0-9]+(?:-[a-z0-9]+)*)"/g)) {
  const key = "mdi" + m[1].split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  if (mdi[key]) icons["mdi:" + m[1]] = mdi[key];
}

// ── the demo installation ──────────────────────────────────────────────────
const DEMO = String.raw`
const NOW = Date.now(), MIN = 60000, H = 3600000, D = 86400000;
const iso = (t) => new Date(t).toISOString();
const st = (state, attributes = {}, extra = {}) => ({ state, attributes, last_changed: iso(NOW - 3 * H), last_updated: iso(NOW - 3 * H), ...extra });
const del = (name, fn, transport, inclusion, on = true, extra = {}) =>
  st(on ? "on" : "off", { name, enabled: on, transport, inclusion, transport_enabled: true,
    friendly_name: "SuperNotify Delivery " + fn + " enabled", ...extra });
const S = {
  "switch.supernotify_delivery_mobile_push": del("mobile_push", "Phone notification", "mobile_push", ["default"]),
  "switch.supernotify_delivery_alexa_announce": del("alexa_announce", "Alexa announcement", "alexa_media_player", ["default"], true,
    { action: "notify.alexa_media", target: { entity_id: ["media_player.kitchen", "media_player.living_room"] }, target_required: "always",
      options: { simplify_text: true, strip_urls: true, media_auto_pause: true }, data: { type: "announce" } }),
  "switch.supernotify_delivery_persistent": del("persistent", "Dashboard alert", "persistent", ["default"]),
  "switch.supernotify_delivery_tts": del("tts", "Kitchen speaker", "tts", ["default"]),
  "switch.supernotify_delivery_email": del("email", "Email", "email", ["default"]),
  "switch.supernotify_delivery_telegram_family": del("telegram_family", "Family Telegram", "telegram", ["explicit"]),
  "switch.supernotify_delivery_doorbell_chime": del("doorbell_chime", "Doorbell chime", "chime", ["scenario"]),
  "switch.supernotify_delivery_sms_fallback": del("sms_fallback", "SMS fallback", "sms", ["fallback"], false),
  "switch.supernotify_transport_mobile_push": st("on", { name: "mobile_push", friendly_name: "SuperNotify Transport mobile_push enabled", error_count: 0 }),
  "switch.supernotify_transport_alexa_media_player": st("on", { name: "alexa_media_player", friendly_name: "SuperNotify Transport alexa_media_player enabled", error_count: 0 }),
  "switch.supernotify_transport_telegram": st("on", { name: "telegram", friendly_name: "SuperNotify Transport telegram enabled", error_count: 2, last_error_message: "chat not found",
    last_error_at: new Date(Date.now() - 38 * 60000).toISOString(), last_error_in: "deliver",
    delivery_defaults: { action: "telegram_bot.send_message", target_required: "always", priority: ["medium", "high", "critical"],
      options: { strip_urls: false, target_categories: ["telegram"] } } }),
  "switch.supernotify_transport_tts": st("on", { name: "tts", friendly_name: "SuperNotify Transport tts enabled", error_count: 0 }),
  "switch.supernotify_transport_email": st("on", { name: "email", friendly_name: "SuperNotify Transport email enabled", error_count: 0 }),
  "switch.supernotify_transport_chime": st("on", { name: "chime", friendly_name: "SuperNotify Transport chime enabled", error_count: 0 }),
  "switch.supernotify_transport_persistent": st("on", { name: "persistent", friendly_name: "SuperNotify Transport persistent enabled", error_count: 0 }),
  "switch.supernotify_transport_sms": st("off", { name: "sms", friendly_name: "SuperNotify Transport sms enabled", error_count: 0 }),
  "person.alex": st("home", { friendly_name: "Alex" }), "person.sam": st("home", { friendly_name: "Sam" }),
  "person.robin": st("not_home", { friendly_name: "Robin" }),
  "switch.supernotify_recipient_alex": st("on", { entity_id: "person.alex", email: "alex@example.com", phone_number: "+15550100", mobile_devices: [{}, {}], friendly_name: "SuperNotify Recipient Alex enabled" }),
  "switch.supernotify_recipient_sam": st("on", { entity_id: "person.sam", email: "sam@example.com", mobile_devices: [{}], delivery: { tts: {} }, friendly_name: "SuperNotify Recipient Sam enabled" }),
  "switch.supernotify_recipient_robin": st("off", { entity_id: "person.robin", mobile_devices: [{}], friendly_name: "SuperNotify Recipient Robin enabled" }),
  "notify.recipient_alex": st(iso(NOW - 4 * MIN)), "notify.recipient_sam": st(iso(NOW - 4 * MIN)), "notify.recipient_robin": st(iso(NOW - 2 * D)),
  "sensor.supernotify_notifications": st("1294"), "sensor.supernotify_failures": st("2"),
  "sensor.supernotify_sent_today": st("42", { last_period: 57 }),
  "update.supernotify_update": st("off", { installed_version: "v2.12.0", latest_version: "v2.12.0", entity_picture: "" }),
  "update.supernotify_cards_update": st("off", { installed_version: "v0.55.0", latest_version: "v0.55.0", entity_picture: "" }),
  "input_boolean.notifier_dnd": st("off", { friendly_name: "Do not disturb" }),
  "input_boolean.notifier_speech_notifications": st("on", { friendly_name: "Voice" }),
  "input_boolean.notifier_phone_notifications": st("on", { friendly_name: "Push" }),
  "input_boolean.bedtime": st("off", { friendly_name: "Bedtime" }), "input_boolean.guests": st("on", { friendly_name: "Guests" }),
  "input_boolean.babysitter": st("off", { friendly_name: "Babysitter" }), "input_boolean.holiday": st("off", { friendly_name: "Holiday" }),
  "camera.front_door": st("idle", { friendly_name: "Front door" }), "camera.garden": st("idle", { friendly_name: "Garden" }),
  "media_player.kitchen_echo": st("idle", { friendly_name: "Kitchen Echo" }),
  "input_datetime.supernotify_last_time": st(iso(NOW - 4 * MIN)),
};
const scen = (name, fn, on, delivery, extra = {}) => {
  S["switch.supernotify_scenario_" + name] = st("on", { name, friendly_name: "SuperNotify Scenario " + fn + " enabled", delivery, ...extra });
  S["binary_sensor.supernotify_scenario_" + name] = st(on ? "on" : "off", { friendly_name: "SuperNotify Scenario " + fn });
};
scen("people_home", "People home", true, { alexa_announce: { enabled: true }, doorbell_chime: { enabled: true } });
scen("morning", "Morning", true, { tts: { enabled: true } });
scen("voice_off_guests", "Voice off (guests)", true, { tts: { enabled: false } });
scen("night", "Night", false, { alexa_announce: { enabled: false }, tts: { enabled: false } });
scen("critical_panic", "Critical: everything", false, { sms_fallback: { enabled: true }, alexa_announce: { enabled: true } }, { action_groups: ["siren"] });
scen("guests", "Guests", false, {});
const bands = [["early_morning", "06:00", 30], ["morning", "07:30", 45], ["afternoon", "13:00", 50],
  ["evening", "19:00", 40], ["night", "22:30", 20], ["late_night", "00:30", 10]];
for (const [b, t, v] of bands) {
  S["input_datetime.notifier_start_" + b] = st(t + ":00", { has_time: true, has_date: false, hour: +t.slice(0, 2), minute: +t.slice(3) });
  S["input_number.notifier_" + b + "_volume"] = st(String(v), { min: 0, max: 100, step: 5, unit_of_measurement: "%" });
}
for (let i = 0; i < 9; i++) {
  S["automation.notify_" + i] = st(i === 4 ? "off" : "on", { friendly_name: "Notify " + i, last_triggered: iso(NOW - (i + 1) * 3 * H) });
}

// archive: compact index (sensor bridge) + detail
const T0 = Math.floor(NOW / 1000);
const IDX = { count: 6, total: 214, chan: ["mobile_push", "alexa_announce", "email", "tts", "telegram_family", "sms_fallback"], scen: ["people_home", "morning"],
  items: [
    { id: "aaaa1111", t: T0 - 240, ti: "Someone is at the front door", m: "Front door camera", p: "high", o: "partial_delivery", d: 2, s: 2, mi: 1,
      c: [0, 1, [2, "s", "nessun target"], [3, "s", "pausa"]], sc: [0, 1] },
    { id: "bbbb2222", t: T0 - 1100, ti: "The washing machine has finished", o: "success", d: 1, s: 1, c: [0, [1, "s", "scenario"]], sc: [0] },
    { id: "cccc3333", t: T0 - 6200, ti: "Garage door open for 10 minutes", p: "critical", o: "failed", f: 1, c: [[0, "e", ""]] },
    { id: "dddd4444", t: T0 - 9800, ti: "Good morning! 14°C and sunny", p: "low", o: "success", d: 1, c: [3], w: 1, sp: "Good morning" },
    { id: "eeee5555", t: T0 - D / 1000 - 3000, ti: "Water leak under the kitchen sink", p: "critical", o: "success", d: 3, c: [0, 1, 5] },
    { id: "ffff6666", t: T0 - D / 1000 - 9000, ti: "Parcel delivered", o: "success", d: 1, c: [4] },
  ] };
S["sensor.supernotify_archive"] = st("6", IDX, { last_updated: iso(NOW) });
const DET = { ok: true, n: { id: "aaaa1111-0000", t: T0 - 240, ti: "Someone is at the front door", m: "Front door camera", p: "high", o: "partial_delivery", mi: 1, v: "2.12.0",
  sc: { on: ["people_home", "morning"], sel: ["people_home", "morning"] }, occ: { home: ["person.alex", "person.sam"], away: ["person.robin"] },
  dl: [
    { n: "mobile_push", r: "ok", calls: 2, tg: { mobile_app_id: ["mobile_app_alex_phone", "mobile_app_sam_phone"] } },
    { n: "alexa_announce", r: "ok", calls: 1, tg: { entity_id: ["media_player.kitchen_echo", "media_player.living_room_echo"] } },
    { n: "email", r: "skip", why: "NO_TARGET", tr: "always" },
    { n: "tts", r: "skip", why: "SNOOZED" },
  ] } };

const LAST = { id: "aaaa1111-0000", title: "Someone is at the front door", message: "Front door camera", priority: "high", created: iso(NOW - 4 * MIN), missed: 1,
  deliveries: { mobile_push: { success: [1, 2] }, alexa_announce: { success: [1] }, email: {}, tts: {} } };
const SNOOZES = [{ target_type: "TAG", target: "garden", snoozed_at: iso(NOW - 5 * MIN), snooze_until: iso(NOW + 25 * MIN) }];
const DRY = { id: "01DRY", outcome: "partial_delivery", created: iso(NOW), message: "Someone is at the front door", priority: "high",
  delivered: 2, skipped: 2, missed: 1, failed: 0, dupe: false, selected_scenario_names: ["people_home", "morning"],
  occupancy: { home: [{ person: "person.alex" }, { person: "person.sam" }], not_home: [] },
  deliveries: {
    alexa_announce: { success: [{ target: { entity_id: ["media_player.kitchen_echo", "media_player.living_room_echo"] } }] },
    mobile_push: { success: [{ target: { mobile_app_id: ["mobile_app_alex_phone", "mobile_app_sam_phone"] } }] },
    email: { skipped: { suppression_reason: "NO_TARGET", target_required: "always" } },
    tts: { skipped: { suppression_reason: "SNOOZED" } } } };

// stats: 14 days of history for the helper entities
const hist = { "input_datetime.supernotify_last_time": [], "input_text.supernotify_last_priority": [],
  "input_text.supernotify_last_channels": [], "input_text.supernotify_last_day_period": [] };
const stats = [];
let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
for (let d = 14; d >= 0; d--) {
  const day0 = new Date(NOW - d * D); day0.setHours(0, 0, 0, 0);
  const wd = (day0.getDay() + 6) % 7;
  const n = d === 0 ? 42 : Math.round((wd >= 5 ? 58 : 44) + rnd() * 18 - 9);
  stats.push({ start: day0.getTime(), change: n });
  for (let i = 0; i < n; i++) {
    const hr = [6, 7, 7, 8, 8, 9, 12, 13, 13, 17, 18, 18, 19, 19, 20, 21, 22, 23][Math.floor(rnd() * 18)];
    const t = day0.getTime() + hr * H + Math.floor(rnd() * 59) * MIN;
    if (t > NOW) continue;
    const r = rnd();
    const prio = r < 0.05 ? "critical" : r < 0.22 ? "high" : r < 0.8 ? "medium" : "low";
    const ch = rnd() < 0.03 ? "mobile_push, ✖telegram_family" : rnd() < 0.5 ? "mobile_push, alexa_announce" : rnd() < 0.7 ? "mobile_push" : "mobile_push, persistent, tts";
    const per = hr < 7 ? "early morning" : hr < 13 ? "morning" : hr < 19 ? "afternoon" : hr < 22 ? "evening" : "night";
    hist["input_datetime.supernotify_last_time"].push({ s: iso(t), lu: t / 1000 });
    hist["input_text.supernotify_last_priority"].push({ s: prio, lu: t / 1000 - 0.5 });
    hist["input_text.supernotify_last_day_period"].push({ s: per, lu: t / 1000 - 0.5 });
    hist["input_text.supernotify_last_channels"].push({ s: ch, lu: t / 1000 + 1 });
  }
}
for (const k of Object.keys(hist)) hist[k].sort((a, b) => a.lu - b.lu);

const MANIFEST = { generated: iso(NOW - 2 * H), automations: [
  { e: "automation.notify_0", n: "Doorbell pressed", c: "Doors", s: "Camera snapshot to phones, Alexa chime" },
  { e: "automation.notify_1", n: "Garage door left open", c: "Doors", s: "Critical after 10 minutes" },
  { e: "automation.notify_2", n: "Washing machine finished", c: "Appliances", s: "Power drops below 5 W" },
  { e: "automation.notify_3", n: "Dishwasher finished", c: "Appliances", s: "" },
  { e: "automation.notify_4", n: "Low battery report", c: "Maintenance", s: "Weekly, disabled for now" },
  { e: "automation.notify_5", n: "Water leak", c: "Safety", s: "Critical, all channels" },
  { e: "automation.notify_6", n: "Smoke alarm", c: "Safety", s: "Critical, sirens" },
  { e: "automation.notify_7", n: "Good morning briefing", c: "Daily", s: "Weather and calendar at 07:30" },
  { e: "automation.notify_8", n: "Parcel delivered", c: "Daily", s: "" } ] };
const _f = window.fetch;
window.fetch = async (u, o) => String(u).includes("automations.json")
  ? new Response(JSON.stringify(MANIFEST), { status: 200, headers: { "Content-Type": "application/json" } }) : _f(u, o);

const ENTS = { "binary_sensor.supernotify_scenario_guests": { platform: "supernotify", translation_key: "scenario_manual" } };
const SVCS = { supernotify: { notify: { response: { optional: true } } }, shell_command: { sn_archive_detail: {} }, switch: {}, button: {} };
window.__mkHass = (dark) => ({
  language: "en", locale: { language: "en" }, themes: { darkMode: dark }, entities: ENTS, services: SVCS, states: S, user: { is_admin: true },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    if (m.type === "history/history_during_period") return hist;
    if (m.type === "recorder/statistics_during_period") return { "sensor.supernotify_sent_today": stats };
    if (m.domain === "shell_command") return { response: { stdout: JSON.stringify(DET), stderr: "", returncode: 0 } };
    const s = m.service || "";
    if (s === "notify") {
      if (((m.service_data || {}).apply_scenarios || []).includes("night")) {
        const d = JSON.parse(JSON.stringify(DRY));
        if (d.deliveries.alexa_announce) d.deliveries.alexa_announce = { skipped: { suppression_reason: "SCENARIO" } };
        return { context: {}, response: d };
      }
      return { context: {}, response: DRY };
    }
    if (s === "enquire_last_notification") return { response: LAST };
    if (s === "enquire_snoozes") return { response: { snoozes: SNOOZES } };
    if (s === "enquire_occupancy") return { response: { scenarios: { home: [{ person: "person.alex", enabled: true, email: "alex@example.com" }, { person: "person.sam", enabled: true }], not_home: [{ person: "person.robin", enabled: false }] } } };
    if (s === "enquire_active_scenarios") return { response: { scenarios: ["people_home", "morning", "voice_off_guests"],
      ...(m.service_data && m.service_data.trace ? { trace: [[], [{ name: "night", enabled: true,
        conditions: [{ condition: "and", conditions: [{ condition: "time", after: "22:30:00", before: "06:30:00" }, { condition: "state", entity_id: ["input_boolean.bedtime"], state: "on" }] }],
        trace: { trace: { "condition/conditions/condition/0": [{ result: { result: false } }], "condition/conditions/condition/0/conditions/0": [{ result: { result: false } }] } } }], {}] } : {}) } };
    if (s === "enquire_deliveries_by_scenario") return { response: {
      people_home: { enabled: ["alexa_announce", "doorbell_chime"], disabled: [] }, morning: { enabled: ["tts"], disabled: [] },
      voice_off_guests: { enabled: [], disabled: ["tts"] }, night: { enabled: [], disabled: ["alexa_announce", "tts"] },
      critical_panic: { enabled: ["sms_fallback", "alexa_announce"], disabled: [] } } };
    if (s === "enquire_implicit_deliveries") return { response: { default: ["mobile_push", "alexa_announce", "persistent", "tts", "email"] } };
    return { response: {} };
  },
});
`;

const BANDS = Object.fromEntries(["early_morning", "morning", "afternoon", "evening", "night", "late_night"].map((b) =>
  [b, { start: `input_datetime.notifier_start_${b}`, volume: `input_number.notifier_${b}_volume` }]));
const CONTROL = { presence_entity: "person.alex", dnd_entity: "input_boolean.notifier_dnd", last_notification: true,
  tiles: ["dnd", "snooze", { toggle: "input_boolean.notifier_phone_notifications", name: "Push", icon: "mdi:cellphone" }, "announce"],
  groups: [{ name: "House modes", entities: ["input_boolean.bedtime", "input_boolean.guests", "input_boolean.babysitter", "input_boolean.holiday"] }] };
const OVERVIEW = { sent_today_entity: "sensor.supernotify_sent_today", quiet_entity: "input_boolean.notifier_dnd" };
const ARCH = { source: "sensor", entity: "sensor.supernotify_archive" };
// name -> [css width, cards [[tag, config], ...], columns, dark, before(page)]
const SHOTS = {
  control: [460, [["control", CONTROL]]],
  overview: [460, [["overview", OVERVIEW]]],
  deliveries: [460, [["deliveries", {}]], 1, false, "open"],
  transports: [460, [["transports", {}]], 1, false, "open"],
  recipients: [460, [["recipients", {}]]],
  scenarios: [460, [["scenarios", { groups: [{ name: "Priority", scenarios: ["critical_panic"] }, { name: "Time of day", scenarios: ["morning", "night"] }] }]]],
  bands: [460, [["bands", { bands: BANDS }]]],
  automations: [460, [["automations", {}]]],
  simulator: [700, [["simulator", {}]]],
  archive: [700, [["archive", ARCH]]],
  why: [700, [["why", ARCH]]],
  stats: [700, [["stats", { sent_today_entity: "sensor.supernotify_sent_today" }]]],
  tools: [460, [["tools", {}]], 1, false, "tools"],
  composer: [700, [["composer", {}]], 1, false, "composer"],
  composer_adv: [460, [["composer", {}]], 1, false, "adv"],
  scenarios_why: [460, [["scenarios", {}]], 1, false, "why"],
  hero: [920, [["control", CONTROL], ["overview", OVERVIEW], ["composer", {}]], 2, false, "composer"],
  dark: [1200, [["control", CONTROL], ["overview", OVERVIEW], ["deliveries", {}]], 3, true],
};

const stub = `const P=${JSON.stringify(icons)};customElements.define("ha-icon",class extends HTMLElement{static get observedAttributes(){return["icon"]}connectedCallback(){this.r()}attributeChangedCallback(){this.r()}r(){const d=P[this.getAttribute("icon")]||"";this.style.display="inline-flex";this.style.verticalAlign=this.style.verticalAlign||"middle";const z="var(--mdc-icon-size,24px)";this.innerHTML='<svg viewBox="0 0 24 24" style="width:'+z+';height:'+z+';fill:currentColor"><path d="'+d+'"/></svg>'}});customElements.define("ha-card",class extends HTMLElement{connectedCallback(){this.style.display="block";this.style.borderRadius="12px";this.style.border="1px solid var(--line,#e3e8ee)";this.style.overflow="hidden"}});`;

const browser = await chromium.launch();
for (const [name, [width, cards, cols = 1, dark = false, before]] of Object.entries(SHOTS)) {
  if (only.size && !only.has(name)) continue;
  const page = await browser.newPage({ viewport: { width: width + 32, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  const bg = dark ? "#111418" : "#eef1f5";
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>body{margin:0;padding:16px;background:${bg};font-family:Roboto,system-ui,sans-serif;--line:${dark ? "#2b3441" : "#e3e8ee"}}
    #root{width:${width}px;display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:16px;align-items:start}
    #root>.full{grid-column:1/-1}</style></head><body>
    <script>${stub}</script><script>window.customCards=[];${DEMO}</script><script>${BUNDLE}</script><div id="root"></div></body></html>`);
  await page.evaluate(([cards, dark, cols]) => {
    const root = document.getElementById("root");
    cards.forEach(([tag, cfg], i) => {
      const el = document.createElement("supernotify-" + tag + "-card");
      el.setConfig(cfg);
      if (cols > 1 && i >= cols) el.className = "full";
      if (cols === 2 && i === 2) el.className = "full";
      root.appendChild(el);
      el.hass = window.__mkHass(dark);
    });
  }, [cards, dark, cols]);
  await page.waitForTimeout(1200);
  if (before === "composer") {
    await page.evaluate(() => {
      const c = document.querySelector("supernotify-composer-card");
      const sr = c.shadowRoot;
      sr.getElementById("t").value = "Front door";
      sr.getElementById("m").value = "Someone is at the front door";
      sr.getElementById("p").value = "high";
      const cam = sr.getElementById("cam"); if (cam) cam.value = "camera.front_door";
      ["t", "m", "p", "cam"].forEach((id) => { const e = sr.getElementById(id); if (e) { e.dispatchEvent(new Event("input")); e.dispatchEvent(new Event("change")); } });
      sr.getElementById("dry").click();
    });
    await page.waitForTimeout(900);
  }
  if (before === "adv") {
    await page.evaluate(() => {
      const sr = document.querySelector("supernotify-composer-card").shadowRoot;
      sr.getElementById("adv").open = true;
      sr.getElementById("spk").value = "Someone is at the front door";
      sr.getElementById("actAdd").click();
      const a = sr.querySelector("#acts .actr");
      a.querySelector(".aid").value = "OPEN_GATE"; a.querySelector(".atl").value = "Open the gate";
      sr.getElementById("dcAdd").click();
      const d = sr.querySelector("#dcs .dcr");
      d.querySelector(".dcn").value = "mobile_push"; d.querySelector(".dcv").value = "ttl: 0\npriority: high";
      sr.getElementById("dbg").checked = true;
    });
    await page.waitForTimeout(200);
  }
  if (before === "why") {
    await page.evaluate(() => { const c = document.querySelector("supernotify-scenarios-card"); c.shadowRoot.querySelector('.row[data-name="night"] .mid b').click(); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const c = document.querySelector("supernotify-scenarios-card"); c.shadowRoot.querySelector('.row[data-name="night"] .sdiff').click(); });
    await page.waitForTimeout(500);
  }
  if (before === "open") {
    await page.evaluate(() => {
      for (const tag of ["supernotify-transports-card", "supernotify-deliveries-card"]) {
        const c = document.querySelector(tag);
        const rows = c ? [...c.shadowRoot.querySelectorAll(".row")] : [];
        const want = tag.includes("transports") ? /Telegram/ : /Alexa/;
        const r = rows.find((x) => want.test(x.textContent)) || rows[0];
        if (r) r.querySelector(".mid b").click();
      }
    });
    await page.waitForTimeout(150);
  }
  if (before === "tools") {
    await page.evaluate(() => { const c = document.querySelector("supernotify-tools-card"); c.shadowRoot.querySelector('.q[data-q="enquire_occupancy"]').click(); });
    await page.waitForTimeout(400);
  }
  if (name === "archive") {
    await page.evaluate(() => { const r = document.querySelector("supernotify-archive-card").shadowRoot.querySelector(".row"); r && r.click(); });
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(400);
  await page.locator("#root").screenshot({ path: path.join(OUT, name + ".png") });
  console.log((errs.length ? "ERR " : "ok  ") + name + (errs.length ? " " + errs[0] : ""));
  await page.close();
}
await browser.close();
