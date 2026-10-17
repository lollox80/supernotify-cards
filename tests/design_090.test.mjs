// v0.90.0: archivio 0.44.0 - notifiche di Appliance Autonotify riconosciute dal tag
// appliance_<entry_id> (anche _end): etichetta «🧺 Autonotify · <elettrodomestico>», filtro
// Elettrodomestici, «Inviata da 🧺 Autonotify · ...» nel dettaglio. Il riepilogo non ha il tag:
// solo le 20 recenti lette complete e quelle aperte.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://ha.local/x" });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.customCards = [];
dom.window.fetch = async () => ({ ok: false });
const api = new dom.window.Function(SRC + "\nreturn { snArchiveAppliance, snAppliances, SN_I18N_EXTRA };")();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

// ── 0. riconoscimento del tag ──────────────────────────────────────────
const ap = (tag) => api.snArchiveAppliance({ extra_data: { mobile_push_notification_tag: tag } });
ok(ap("appliance_01M4JSK6Q7SD8RS3R4AKT2EKP6") === "01M4JSK6Q7SD8RS3R4AKT2EKP6", "inizio ciclo: entry id");
ok(ap("appliance_01M4JSK6Q7SD8RS3R4AKT2EKP6_end") === "01M4JSK6Q7SD8RS3R4AKT2EKP6", "fine ciclo (_end): stesso entry id");
ok(ap("garage_door") === null && ap("") === null && api.snArchiveAppliance({}) === null, "altri tag o nessun tag: null");
ok(Object.values(api.SN_I18N_EXTRA).every((l) => l.SN_ARCH_STRINGS.f_appliance && /\{n\}/.test(l.SN_ARCH_STRINGS.ap_scope)),
  "filtro e nota tradotti nelle altre 9 lingue");

// ── archivio: 25 notifiche, la 1 e la 3 da Autonotify (complete), la 22 da Autonotify ma solo riepilogo
const NOW = Date.now();
const at = (i) => new Date(NOW - i * 60e3).toISOString();
const LAV = "01M4JSK6Q7SD8RS3R4AKT2EKP6";
const DOCS = [];
for (let i = 0; i < 25; i++) {
  const doc = { id: `n${String(i).padStart(7, "0")}-x`, created: at(i + 1), message: `Notifica ${i}`, priority: "medium",
    outcome: "success", delivered: 1, condition_variables: { notification_title: `Notifica ${i}` },
    original_context: { id: `ctx${i}`, parent_id: null, user_id: null },
    deliveries: { mobile_push: { success: [{ calls: [{}] }] } } };
  if (i === 1) { doc.message = "Lavatrice is finished"; doc.condition_variables = {}; doc.extra_data = { notification_icon: "mdi:washing-machine", mobile_push_notification_tag: `appliance_${LAV}_end` }; }
  if (i === 3) { doc.message = "Lavatrice started"; doc.condition_variables = {}; doc.extra_data = { mobile_push_notification_tag: `appliance_${LAV}`, live_update: true }; }
  if (i === 22) { doc.message = "Lavatrice is finished"; doc.condition_variables = {}; doc.extra_data = { mobile_push_notification_tag: `appliance_${LAV}_end` }; }
  DOCS.push(doc);
}
const summarize = (c) => ({ id: c.id, created: c.created, outcome: c.outcome, message: c.message,
  title: (c.condition_variables || {}).notification_title, priority: c.priority, scenarios: [], occupancy: {},
  deliveries: { mobile_push: { success: 1 } } });

const ws = [];
let entriesOk = true;
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { id: "u1", is_admin: false },
  services: { supernotify: { enquire_archive: {}, enquire_snoozes: {}, snooze: {} } },
  states: { "sensor.supernotify_notifications": { state: "25", attributes: {}, last_updated: "a" } },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => {
    ws.push(m);
    if (m.type === "config_entries/get") {
      if (!entriesOk) throw new Error("unauthorized");
      return [{ entry_id: LAV, title: "Lavatrice", domain: "appliance_autonotify" }, { entry_id: "X", title: "Bruno", domain: "appliance_autonotify" }];
    }
    if (m.type === "logbook/get_events") return [];
    const sd = m.service_data || {};
    if (m.service === "enquire_snoozes") return { response: { snoozes: [] } };
    if (m.service !== "enquire_archive") return { response: {} };
    if (sd.id) return { response: DOCS.find((x) => x.id === sd.id) };
    let list = DOCS.slice(0, sd.limit || 20);
    if (sd.verbosity === "summary") list = list.map(summarize);
    return { response: { notifications: list, count: list.length } };
  },
};
const a = document.createElement("supernotify-archive-card");
a.setConfig({ group_repeats: false, auto_select: false });
document.body.appendChild(a);
a.hass = hass; await wait(150); a.hass = { ...hass }; await wait(250);
const R = a.shadowRoot;
const rowOf = (id) => R.querySelector(`#list .it[data-id="${id}"]`);

// ── 1. elenco ────────────────────────────────────────────────────────────
ok(R.querySelectorAll("#list .it").length === 25, `25 righe (${R.querySelectorAll("#list .it").length})`);
// the 🧺 becomes the mdi:washing-machine icon (SN_EMOJI_MDI)
const icTxt = (el) => (el ? (el.querySelector('ha-icon[icon="mdi:washing-machine"]') ? "🧺 " : "") + txt(el) : "");
const lab = (id) => icTxt(rowOf(id) && rowOf(id).querySelector(".tg.apl"));
console.log("    riga 1:", txt(rowOf("n0000001")));
ok(lab("n0000001") === "🧺 Autonotify · Lavatrice", `fine ciclo: «🧺 Autonotify · Lavatrice» (${lab("n0000001")})`);
ok(lab("n0000003") === "🧺 Autonotify · Lavatrice", "inizio ciclo: stessa etichetta");
ok(!rowOf("n0000000").querySelector(".tg.apl"), "le altre senza etichetta");
ok(!rowOf("n0000022").querySelector(".tg.apl"), "la 22 (solo riepilogo, senza tag) non è riconosciuta");
ok(ws.filter((m) => m.type === "config_entries/get").length === 1
  && ws.find((m) => m.type === "config_entries/get").domain === "appliance_autonotify", "nomi letti una volta, solo appliance_autonotify");

// ── 2. filtro ────────────────────────────────────────────────────────────
const chip = R.querySelector('#chips .chip[data-k="appliance"]');
ok(chip && txt(chip) === "Elettrodomestici2", `filtro «Elettrodomestici 2» (${txt(chip)})`);
chip.onclick();
const shown = [...R.querySelectorAll("#list .it")].map((r) => r.dataset.id);
ok(shown.join(",") === "n0000001,n0000003", `mostra solo le due di Autonotify (${shown})`);
ok(/ultime 20 lette per intero/.test(txt(R.getElementById("meta"))), `dice che guarda le ultime 20 (${txt(R.getElementById("meta"))})`);

// ── 3. dettaglio: inviata da ─────────────────────────────────────────────
rowOf("n0000001").onclick(); await wait(150);
const sbEl = R.getElementById("sentBy");
const sb = txt(sbEl);
ok(/Inviata da Autonotify · Lavatrice$/.test(sb) && sbEl.querySelector('ha-icon[icon="mdi:washing-machine"]'), `dettaglio: «📨 Inviata da 🧺 Autonotify · Lavatrice» (${sb})`);
ok(!ws.some((m) => m.type === "logbook/get_events" && m.context_id === "ctx1"), "niente ricerca nel logbook per Autonotify");

// ── 4. una vecchia aperta diventa riconosciuta ─────────────────────────────
R.querySelector('#chips .chip[data-k="all"]').onclick();
rowOf("n0000022").onclick(); await wait(300);
ok(lab("n0000022") === "🧺 Autonotify · Lavatrice", "la 22, aperta, ora ha l'etichetta");
ok(txt(R.querySelector('#chips .chip[data-k="appliance"]')) === "Elettrodomestici3", "e il filtro la conta");

// ── 5. nomi non leggibili: solo «🧺 Autonotify» ─────────────────────────────
api.snAppliances.names = null; api.snAppliances.loading = null; entriesOk = false;
await api.snAppliances.load(hass);
ok(api.snAppliances.label(LAV) === "🧺 Autonotify", `senza config entry: «${api.snAppliances.label(LAV)}»`);

console.log(fail ? `\n${fail} FAIL` : "\nall passed");
process.exit(fail ? 1 : 0);
