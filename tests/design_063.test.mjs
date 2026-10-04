// CHANGELOG
// 2026-10-04 v0.63.0: chi è in casa, riparazioni, dettaglio transport/canali, voce in archivio,
//   motivo delle pause, compositore completo, pausa a voce per chi non è admin.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/lovelace/0" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (minAgo) => new Date(Date.now() - minAgo * 60000).toISOString();

const DOCS = [{
  id: "a1b2c3d4e5", created: iso(5), message: "Porta di casa aperta", priority: "medium", outcome: "success", delivered: 2,
  deliveries: {
    voce_sala: { success: [{ spoken_message: "Attenzione, la porta di casa è aperta", message: "Porta di casa aperta", calls: [] }] },
    mobile_push: { success: [{ message: "Porta di casa aperta", calls: [] }] },
  },
}];
const ws = [], svc = [];
const mkHass = (admin) => ({
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: admin },
  services: { supernotify: { enquire_archive: {}, notify: {} } },
  states: {
    "person.lorenzo": { state: "home", attributes: { friendly_name: "Lorenzo", user_id: "u1" } },
    "person.anna": { state: "not_home", attributes: { friendly_name: "Anna" } },
    "sensor.supernotify_notifications": { state: "10", attributes: {}, last_updated: iso(0) },
    "switch.supernotify_transport_alexa_media_player": { state: "on", attributes: { name: "alexa_media_player", error_count: 2,
      last_error_at: new Date().toISOString(), last_error_in: "deliver", last_error_message: "timeout",
      delivery_defaults: { action: "notify.alexa_media", target: { entity_id: ["media_player.sala"] }, options: { strip_urls: true, media_auto_pause: true }, priority: ["high", "critical"] } } },
    "switch.supernotify_delivery_voce_sala": { state: "on", attributes: { name: "voce_sala", transport: "alexa_media_player",
      friendly_name: "SuperNotify Delivery Voce in sala abilitata", action: "notify.alexa_media", options: { language: "it-IT", simplify_text: true },
      target: { entity_id: ["media_player.sala"] }, target_required: "always", inclusion: ["explicit"], data: { type: "announce" } } },
    "switch.supernotify_delivery_mobile_push": { state: "on", attributes: { name: "mobile_push", transport: "mobile_push" } },
  },
  localize: (k) => (k === "component.supernotify.issues.deprecated_binary_sensor.title" ? "Sensori binari deprecati" : ""),
  loadBackendTranslation: async () => {},
  callService: async (d, s, data) => { svc.push([d, s, data]); },
  callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m);
    const r = (x) => ({ response: x });
    if (m.type === "repairs/list_issues") return { issues: [
      { domain: "supernotify", issue_id: "deprecated_binary_sensor_x", translation_key: "deprecated_binary_sensor", severity: "warning", ignored: false, dismissed_version: null },
      { domain: "supernotify", issue_id: "old", translation_key: "old", severity: "warning", ignored: true },
      { domain: "hacs", issue_id: "other", severity: "error" }] };
    if (m.type === "conversation/process") return { response: { response_type: "action_done", speech: { plain: { speech: "Ho posticipato le tue notifiche fino alle 15:30" } } } };
    if (m.service === "enquire_occupancy") return r({ scenarios: { home: [{ person: "person.lorenzo", enabled: true, alias: null }], not_home: [{ person: "person.anna", enabled: true }] } });
    if (m.service === "enquire_snoozes") return r({ snoozes: [{ target_type: "EVERYTHING", recipient_type: "EVERYONE", reason: "Voice command", snooze_until: null }] });
    if (m.service === "enquire_archive") return r({ notifications: DOCS });
    if (m.service === "enquire_active_scenarios") return r({ scenarios: [] });
    if (m.service === "enquire_last_notification") return r(DOCS[0]);
    return r({});
  },
});
const mount = (tag, cfg, hass) => { const c = document.createElement(tag); c.setConfig(cfg || {}); c.hass = hass; document.body.appendChild(c); return c; };
const admin = mkHass(true);

// ── (1)(2)(6) overview ──
const ov = mount("supernotify-overview-card", {}, admin);
await wait(40); ov.hass = { ...admin }; await wait(10);
const occ = ov.shadowRoot.getElementById("occ").textContent;
ok(/Uno solo in casa/.test(occ) && /Lorenzo/.test(occ) && /Anna/.test(occ), `overview: chi è in casa (${occ.replace(/\s+/g, " ").trim()})`);
const health = ov.shadowRoot.getElementById("health");
ok(/1 riparazione di SuperNotify/.test(health.textContent) && /Sensori binari deprecati/.test(health.textContent), "overview: riparazioni di SuperNotify col titolo tradotto (ignorate e altre integrazioni escluse)");
const ra = health.querySelector('a[href="/config/repairs"]');
ok(ra && ra.dataset.nav === "1" && !ra.target, "riparazioni: link interno a Impostazioni > Riparazioni");
ra.click();
ok(window.location.pathname === "/config/repairs", "riparazioni: naviga senza ricaricare");
ok(/a voce/.test(health.textContent), "overview: motivo della pausa (a voce)");

// ── (1)(6) control, admin ──
const cc = mount("supernotify-control-card", { tiles: ["snooze"] }, admin);
await wait(40); cc.hass = { ...admin }; await wait(10);
ok(/In casa/.test(cc.shadowRoot.getElementById("statusbar").textContent) && /Lorenzo/.test(cc.shadowRoot.getElementById("statusbar").textContent), "control: in casa da SuperNotify nella riga di stato");
cc.shadowRoot.querySelector(".ctile").click(); await wait(10);
const snzp = cc.shadowRoot.getElementById("snzp");
ok(/a voce/.test(snzp.textContent), "pannello pause: motivo nell'elenco");
ok(/Cosa|What/.test(snzp.textContent) && !snzp.querySelector("#snzMine"), "admin: pannello completo, niente comandi vocali");

// ── (8) control, non admin ──
const user = mkHass(false);
const cu = mount("supernotify-control-card", { tiles: ["snooze"] }, user);
await wait(40); cu.hass = { ...user }; await wait(10);
cu.shadowRoot.querySelector(".ctile").click(); await wait(10);
const up = cu.shadowRoot.getElementById("snzp");
ok(/comandi vocali/.test(up.textContent) && up.querySelector("#snzMine"), "non admin: pause dai comandi vocali, con Riprendi le mie");
up.querySelector('.sc[data-g="min"][data-v="60"]').click(); await wait(5);
cu.shadowRoot.getElementById("snzGo").click(); await wait(10);
const cv = ws.filter((m) => m.type === "conversation/process").pop();
ok(cv && cv.text === "metti in pausa le mie notifiche per 60 minuti" && cv.language === "it", `non admin: frase inviata (${cv && cv.text})`);
ok(!ws.some((m) => m.type === "events/mobile_app_notification_action"), "non admin: niente evento (servirebbe admin)");
cu.shadowRoot.getElementById("snzMine").click(); await wait(10);
ok(ws.filter((m) => m.type === "conversation/process").pop().text === "riattiva le mie notifiche", "non admin: riprendi le mie");

// ── (3) transports ──
const tr = mount("supernotify-transports-card", {}, admin);
await wait(10);
ok(/2 · \d\d:\d\d · timeout/.test(tr.shadowRoot.textContent), "transport: errori con ora e messaggio");
tr.shadowRoot.querySelector(".row .mid b").click(); await wait(5);
const tdet = tr.shadowRoot.querySelector(".det");
ok(tdet && /Ultimo errore/.test(tdet.textContent) && /deliver/.test(tdet.textContent) && /notify\.alexa_media/.test(tdet.textContent)
  && /Togli i link\s*sì/.test(tdet.textContent) && /media_player\.sala/.test(tdet.textContent), "transport: dettaglio errore e predefiniti leggibili");
let mi = null;
tr.addEventListener("hass-more-info", (e) => { mi = e.detail.entityId; });
tr.shadowRoot.querySelector(".dmore").click();
ok(mi === "switch.supernotify_transport_alexa_media_player", "transport: Tutti gli attributi apre il dialogo di HA");

// ── (4) deliveries ──
const dl = mount("supernotify-deliveries-card", {}, admin);
await wait(10);
const drow = [...dl.shadowRoot.querySelectorAll(".row")].find((r) => /Voce in sala/.test(r.textContent));
drow.querySelector(".mid b").click(); await wait(5);
const ddet = dl.shadowRoot.querySelector(".det");
ok(ddet && /Lingua\s*it-IT/.test(ddet.textContent) && /Semplifica il testo\s*sì/.test(ddet.textContent) && /type: announce/.test(ddet.textContent)
  && /Serve un destinatario\s*always/.test(ddet.textContent), "canale: opzioni, dati e destinatari leggibili");
ok(dl.shadowRoot.querySelector('.row[aria-expanded="true"]'), "canale: riga aperta segnata");

// ── (5) archive ──
const ar = mount("supernotify-archive-card", {}, admin);
await wait(60); ar.hass = { ...admin }; await wait(20);
const said = ar.shadowRoot.querySelector(".said");
ok(said && /Voce in sala ha detto/.test(said.textContent) && /la porta di casa è aperta/.test(said.textContent), `archivio: frase detta dal canale vocale (${said && said.textContent.trim()})`);

// ── (7) composer ──
const cp = mount("supernotify-composer-card", {}, admin);
await wait(10);
const C = (id) => cp.shadowRoot.getElementById(id);
C("m").value = "Prova"; C("mhtml").value = "<b>Prova</b>"; C("clipUrl").value = "https://x/clip.mp4";
C("actAdd").click(); C("actAdd").click();
const ar0 = cp.shadowRoot.querySelectorAll("#acts .actr");
ar0[0].querySelector(".aid").value = "OPEN_GATE"; ar0[0].querySelector(".atl").value = "Apri il cancello";
ar0[1].querySelector(".rmx").click();
C("actGroups").value = "gate, luci";
C("dcAdd").click();
const dcr = cp.shadowRoot.querySelector("#dcs .dcr");
dcr.querySelector(".dcn").value = "mobile_push"; dcr.querySelector(".dcv").value = "ttl: 0\npriority: high\npersistent: true";
const pl = cp._payload();
ok(pl.message_html === "<b>Prova</b>" && pl.clip_url === "https://x/clip.mp4", "composer: testo HTML e video");
ok(JSON.stringify(pl.actions) === JSON.stringify([{ action: "OPEN_GATE", title: "Apri il cancello" }]) && pl.action_groups.join() === "gate,luci", "composer: pulsanti e gruppi");
ok(JSON.stringify(pl.delivery_control) === JSON.stringify({ mobile_push: { data: { ttl: 0, priority: "high", persistent: true } } }), `composer: impostazioni del canale (${JSON.stringify(pl.delivery_control)})`);
ok(C("clipUrl").type === "text" && C("snapUrl").type === "text", "composer: campi URL con lo stile dei campi di testo");

// ── editor ──
const form = customElements.get("supernotify-control-card").getConfigForm();
ok(form.schema.some((x) => x.name === "snooze_via") && form.schema.some((x) => x.name === "occupancy"), "editor: snooze_via e occupancy");

console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
