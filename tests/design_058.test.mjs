// v0.58.0: revisione grafica - coerenza tra card (A1-A4) e difetti visibili (B1-B6).
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
const flush = () => new Promise((r) => setTimeout(r, 30));

const del = (name, fn, transport) => ({ state: "on", attributes: { name, enabled: true, transport, inclusion: ["default"], transport_enabled: true,
  friendly_name: `SuperNotify Delivery ${fn} abilitata` } });
const IDX = { count: 3, chan: ["mobile_push"], scen: [], items: [
  { id: "a1", t: Math.floor(Date.now() / 1000) - 60, ti: "Garage", p: "critical", d: 1, c: [0] },
  { id: "a2", t: Math.floor(Date.now() / 1000) - 120, ti: "Lavatrice", p: "low", d: 1, c: [0] },
  { id: "a3", t: Math.floor(Date.now() / 1000) - 180, ti: "Porta", p: "high", d: 1, c: [0] }] };
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: {} },
  states: {
    "switch.supernotify_delivery_email": del("email", "Email", "email"),
    "switch.supernotify_delivery_mobile_push": del("mobile_push", "Telefono", "mobile_push"),
    "switch.supernotify_delivery_alexa_announce": del("alexa_announce", "Annuncio Alexa", "alexa_media_player"),
    "sensor.supernotify_archivio": { state: "3", attributes: IDX, last_updated: "x" },
  },
  callService: async () => {}, callApi: async () => ({}), callWS: async () => ({ response: {} }),
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// A2: technical names
const dc = mount("supernotify-deliveries-card");
const rows = [...dc.shadowRoot.querySelectorAll(".row")];
const r = (re) => rows.find((x) => re.test(x.textContent));
const em = r(/Email/);
ok(em && !em.querySelector(".tr .sn-tech"), "Email: niente «email» ripetuto (né nome né transport)");
const ph = r(/Telefono/);
ok(ph && ph.querySelectorAll(".tr .sn-tech").length === 1 && /mobile_push/.test(ph.querySelector(".tr").textContent), "Telefono: mobile_push una volta sola");
const al = r(/Annuncio Alexa/);
ok(al && al.querySelectorAll(".tr .sn-tech").length === 2, "Annuncio Alexa: nome tecnico e transport, entrambi monospace");
// A3: hairline between rows
const css = dc.shadowRoot.innerHTML;
ok(/\.row \+ \.row::before \{ content: ""; position: absolute/.test(css) && !/\.row \{[^}]*border-bottom/.test(css), "deliveries: linea sottile tra le righe, niente bordo curvato");
// A1: stats tiles
ok(/\.kpi \{ border: 0; border-radius: 10px; padding: 12px 14px; background: #eef4fb; \}/.test(SRC.replace(/\$\{p\.soft\}/g, "#eef4fb")), "statistiche: riquadri pieni come nell'overview");
// B5: labels wrap
ok(!/\.stat \.k \{[^}]*nowrap/.test(SRC) && !/\.kpi \.k \{[^}]*nowrap/.test(SRC), "etichette dei riquadri vanno a capo");
// A4 + B1: archive
const ac = mount("supernotify-archive-card", { source: "sensor", entity: "sensor.supernotify_archivio" });
await flush();
const pr = [...ac.shadowRoot.querySelectorAll(".tg.pr")].map((n) => n.className);
ok(pr.includes("tg pr critical") && pr.includes("tg pr low") && pr.includes("tg pr high"), `archivio: classe per priorità (${pr})`);
const acss = ac.shadowRoot.innerHTML;
ok(/\.tg\.pr\.critical \{ color: #c62828/.test(acss), "archivio: critica in rosso");
const meta = ac.shadowRoot.textContent;
ok(!/\?/.test(meta.match(/3 [^\n]*archivio/) ? meta.match(/3 [^\n]*archivio/)[0] : "?") && /3 nell'archivio/.test(meta), "archivio: «3 nell'archivio», niente «di ?»");
// B2
ok(/snPl\(T, "calls", ch\.calls\)/.test(SRC) && /calls_1: "chiamata"/.test(SRC), "perché: «1 chiamata»");
// B6
const cc = mount("supernotify-control-card", { last_notification: true });
ok(/\.lastn \.lt \{[^}]*-webkit-line-clamp: 2/.test(cc.shadowRoot.innerHTML) && !/\.lastn \.lt \{[^}]*nowrap/.test(cc.shadowRoot.innerHTML), "control: titolo su due righe, non tagliato");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
process.exit(0);
