// CHANGELOG
// 2026-11-24 - 1.4.0: the cards for a user who is not an administrator. One place decides what they may see and
//   do (snAccess); SuperNotify's admin actions are refused before the call (snWS); "Resume every pause" ends each
//   pause with supernotify.unsnooze; "Reset overrides" presses SuperNotify's button; the stats and the overview's
//   numbers come from the counter's statistics; the archive, the last notification and the admin tools are
//   hidden, with a line that says they are for administrators.
import { boot, load, ok, wait, txt, fail } from "./_harness.mjs";

const dom = boot({ url: "http://ha.local/", scroll: true });
dom.window.CSS = { escape: (x) => String(x) }; global.CSS = dom.window.CSS;
dom.window.fetch = async () => ({ ok: false });
const G = load("snAccess, snResumeAll, snResetOverrides, snWS, snStatsDaily, snEnquireBust, SN_ADMIN_ACTIONS");

const S = (state, attributes = {}, extra = {}) => ({ state, attributes, last_updated: "t0", last_changed: "t0", ...extra });
const calls = [];
const now = new Date();
const h0 = new Date(now); h0.setMinutes(0, 0, 0);
const hourAgo = (n) => h0.getTime() - n * 3600000;
let snoozes = [];

function makeHass(admin) {
  return {
    language: "it", themes: { darkMode: false }, user: { id: admin ? "a1" : "u1", is_admin: admin },
    entities: { "button.supernotify_reset_overrides": { platform: "supernotify", translation_key: "reset_overrides" } },
    states: {
      "sensor.supernotify_notifications": S("12"),
      "button.supernotify_reset_overrides": S("unknown", { friendly_name: "SuperNotify Reset overrides" }),
      "switch.supernotify_delivery_mobile_push": S("on", { name: "mobile_push" }),
      "person.anna": S("home", { user_id: "u1" }),
      "person.bruno": S("home", { user_id: "b2" }),
    },
    services: { supernotify: { snooze: {}, silence: {}, unsnooze: {}, enquire_snoozes: {}, clear_snoozes: {},
      enquire_archive: { fields: {} }, enquire_last_notification: {}, enquire_configuration: {}, reset_overrides: {},
      purge_archive: {}, purge_media: {}, enquire_scenarios: {}, enquire_recipients: {} } },
    connection: { subscribeEvents: () => Promise.resolve(() => {}) },
    callService: async (d, s, data) => { calls.push(["svc", d, s, data]); },
    callApi: async () => ({}),
    callWS: async (m) => {
      calls.push(["ws", m.type === "call_service" ? m.service : m.type, m.service_data || m]);
      if (m.type === "recorder/statistics_during_period") {
        const id = "sensor.supernotify_notifications";
        if (m.period === "hour") return { [id]: [
          { start: hourAgo(26), end: hourAgo(25), change: 3 },
          { start: hourAgo(2), end: hourAgo(1), change: 2 },
          { start: hourAgo(1), end: h0.getTime(), change: 1 },
        ] };
        return { [id]: [{ start: h0.getTime(), end: h0.getTime() + 300000, change: 4 }] };
      }
      if (m.service === "enquire_snoozes") return { response: { snoozes } };
      if (m.service === "clear_snoozes") return { response: { cleared: 2 } };
      if (m.service === "enquire_archive") return { response: { notifications: [], days: [] } };
      return { response: {} };
    },
  };
}
const user = makeHass(false);
const admin = makeHass(true);
const wsCalls = (svc) => calls.filter((c) => c[0] === "ws" && c[1] === svc);

// ── one place decides ──
const aU = G.snAccess(user), aA = G.snAccess(admin);
ok(aA.admin && aA.archive && aA.last && aA.purge && aA.reset === "action" && aA.resume_all, "amministratore: tutto");
ok(!aU.admin && !aU.archive && !aU.last && !aU.purge && !aU.live && !aU.repairs, "utente: niente archivio, ultima, pulizie, evento, riparazioni");
ok(aU.resume_all && aU.reset === "button.supernotify_reset_overrides", "utente: riprendi tutte (unsnooze) e ripristino (pulsante)");
ok(G.snAccess({ ...user, states: {} }).reset === "", "utente senza il pulsante: niente ripristino");
ok(["enquire_archive", "enquire_last_notification", "clear_snoozes", "reset_overrides", "purge_archive"].every((x) => G.SN_ADMIN_ACTIONS.has(x))
  && !G.SN_ADMIN_ACTIONS.has("enquire_snoozes") && !G.SN_ADMIN_ACTIONS.has("unsnooze"), "elenco delle azioni da amministratore");

// ── an admin action is refused before the call ──
calls.length = 0;
let refused = null;
try { await G.snWS(user, { type: "call_service", domain: "supernotify", service: "enquire_archive", service_data: {} }); } catch (e) { refused = e; }
ok(refused && refused.code === "unauthorized" && !calls.length, "snWS: azione da amministratore rifiutata senza chiamare HA");
await G.snWS(user, { type: "call_service", domain: "supernotify", service: "enquire_snoozes", service_data: {} });
ok(wsCalls("enquire_snoozes").length === 1, "snWS: le altre azioni passano");

// ── Resume every pause ──
const fut = new Date(Date.now() + 3600000).toISOString();
snoozes = [
  { target_type: "NONCRITICAL", recipient_type: "EVERYONE", snooze_until: fut },
  { target_type: "DELIVERY", target: "alexa_announce", recipient_type: "USER", recipient: "person.anna", snooze_until: fut },
  { target_type: "NONCRITICAL", recipient_type: "USER", recipient: "person.bruno", snooze_until: fut },
];
calls.length = 0;
const n = await G.snResumeAll(user);
const un = wsCalls("unsnooze");
ok(n === 2 && un.length === 2 && !wsCalls("clear_snoozes").length, `utente: ${n} pause riprese con unsnooze, niente clear_snoozes`);
ok(!un.some((c) => c[2].person === "person.bruno"), "utente: la pausa personale di un altro resta");
ok(un.some((c) => c[2].scope === "noncritical" && !c[2].person) && un.some((c) => c[2].scope === "delivery" && c[2].name === "alexa_announce" && c[2].person === "person.anna"),
  "unsnooze con ambito, nome e persona di ciascuna pausa");
calls.length = 0;
ok(await G.snResumeAll(admin) === 2 && wsCalls("clear_snoozes").length === 1 && !wsCalls("unsnooze").length, "amministratore: clear_snoozes");

// ── Reset overrides ──
calls.length = 0;
ok(await G.snResetOverrides(user, "scenario") === null, "utente: ripristino senza dettagli");
ok(calls.some((c) => c[0] === "svc" && c[1] === "button" && c[2] === "press" && c[3].entity_id === "button.supernotify_reset_overrides")
  && !wsCalls("reset_overrides").length, "utente: preme il pulsante di SuperNotify");
calls.length = 0;
await G.snResetOverrides(admin, "scenario");
ok(wsCalls("reset_overrides").length === 1 && wsCalls("reset_overrides")[0][2].kind === "scenario", "amministratore: reset_overrides con kind");

// ── statistics from the counter ──
calls.length = 0;
const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 3);
const days = await G.snStatsDaily.get(user, start.getTime());
const tot = days.reduce((a, d) => a + d.count, 0);
ok(!wsCalls("enquire_archive").length && wsCalls("recorder/statistics_during_period").length === 2, "statistiche: dal registratore, non dall'archivio");
ok(tot === 10 && days.every((d) => d.src === "counters" && d.hour.length === 24 && d.outcome.success === d.count), `statistiche: 10 consegnate per giorno e ora (${tot})`);

// ── tools card ──
const tools = document.createElement("supernotify-tools-card");
tools.setConfig({});
document.body.appendChild(tools);
tools.hass = user;
await wait(20);
let sr = tools.shadowRoot;
ok(!sr.getElementById("purgeArch") && !sr.getElementById("purgeMedia") && !sr.getElementById("kind"), "strumenti: niente pulizie né scelta del tipo");
ok(!!sr.getElementById("clear") && !!sr.getElementById("reset") && !!sr.getElementById("refresh"), "strumenti: riprendi tutte, ripristina, aggiorna");
const qs = [...sr.querySelectorAll(".q")].map((b) => b.dataset.q);
ok(!qs.some((q) => G.SN_ADMIN_ACTIONS.has(q)) && qs.includes("enquire_snoozes"), `strumenti: solo le richieste per tutti (${qs.join(",")})`);
ok(/solo per amministratori/.test(txt(sr.querySelector(".adm"))) && !sr.querySelector(".lnk"), "strumenti: riga «solo per amministratori», niente link alle impostazioni");
calls.length = 0;
sr.getElementById("clear").click(); await wait(20);
ok(wsCalls("unsnooze").length === 2 && /2/.test(txt(sr.getElementById("r_clear"))), "strumenti: Riprendi → unsnooze su ogni pausa");
calls.length = 0;
sr.getElementById("reset").click(); sr.getElementById("reset").click(); await wait(20);
ok(calls.some((c) => c[1] === "button" && c[2] === "press") && /✔/.test(txt(sr.getElementById("r_reset"))), "strumenti: Ripristina → pulsante");
const toolsA = document.createElement("supernotify-tools-card");
toolsA.setConfig({});
document.body.appendChild(toolsA);
toolsA.hass = admin;
await wait(20);
ok(!!toolsA.shadowRoot.getElementById("purgeArch") && !!toolsA.shadowRoot.getElementById("kind") && !toolsA.shadowRoot.querySelector(".adm"), "strumenti (amministratore): come prima");

// ── archive card ──
calls.length = 0;
const arch = document.createElement("supernotify-archive-card");
arch.setConfig({});
document.body.appendChild(arch);
arch.hass = user;
await wait(30);
ok(/amministratori/.test(txt(arch.shadowRoot.querySelector(".adm"))) && !wsCalls("enquire_archive").length, "archivio: una riga, nessuna lettura");

// ── control card: the last notification ──
calls.length = 0;
const ctl = document.createElement("supernotify-control-card");
ctl.setConfig({ tiles: ["snooze"], last_notification: true, occupancy: false });
document.body.appendChild(ctl);
ctl.hass = user;
await wait(40);
ok(/solo per amministratori/.test(txt(ctl.shadowRoot.getElementById("lastn"))) && !wsCalls("enquire_last_notification").length,
  "controllo: ultima notifica «solo per amministratori», nessuna lettura");

// ── overview: the numbers from the counter ──
calls.length = 0;
G.snStatsDaily.cmemo = null;
const ov = document.createElement("supernotify-overview-card");
ov.setConfig({ last_notification: true });
document.body.appendChild(ov);
ov.hass = user;
await wait(80);
ov.hass = { ...user };
await wait(40);
const stats = txt(ov.shadowRoot.getElementById("stats"));
ok(/amministratori/.test(stats) && !wsCalls("enquire_archive").length && !wsCalls("enquire_last_notification").length,
  `panoramica: numeri dal contatore, canali falliti solo per amministratori (${stats.slice(0, 120)})`);
ok(/solo per amministratori/.test(txt(ov.shadowRoot.getElementById("last"))), "panoramica: ultima notifica solo per amministratori");

// ── stats card ──
G.snStatsDaily.cmemo = null;
const st = document.createElement("supernotify-stats-card");
st.setConfig({});
document.body.appendChild(st);
st.hass = user;
await wait(80);
ok(/contatore/.test(txt(st.shadowRoot.getElementById("win"))) && /amministratori/.test(txt(st.shadowRoot.querySelector(".adm"))),
  "statistiche: «dal contatore», canali e priorità solo per amministratori");

// ── dashboard strategy ──
const Strat = customElements.get("ll-strategy-dashboard-supernotify");
const vU = (await Strat.generate({ type: "custom:supernotify" }, { ...user, states: user.states })).views;
const vA = (await Strat.generate({ type: "custom:supernotify" }, { ...admin, states: admin.states })).views;
const cardsOf = (v) => v.sections.flatMap((s) => s.cards.map((c) => c.type));
ok(!vU.some((v) => v.path === "archive") && vU.some((v) => v.path === "tools"), "strategia (utente): niente vista archivio, strumenti sì");
ok(!cardsOf(vU.find((v) => v.path === "home")).includes("custom:supernotify-archive-card"), "strategia (utente): niente archivio in Casa");
ok(vA.some((v) => v.path === "archive") && vA.some((v) => v.path === "tools"), "strategia (amministratore): archivio e strumenti");

console.log(fail ? `\n${fail} FAIL` : "\nall ok");
process.exit(fail ? 1 : 0);
