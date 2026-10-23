// La vista Archivio deve segnalare gli annunci usciti sussurrati, e offrire il
// filtro solo quando ce n'e' almeno uno.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.CustomEvent = dom.window.CustomEvent;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
dom.window.customCards = [];
const G = new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8") + "\nreturn { snArchiveStore };")();

// 1.0.0: the sensor index (sensor.supernotify_archivio) is gone: the same notifications come as
// SuperNotify's archive documents through enquire_archive, as on a real installation.
const now = Date.now();
const iso = (s) => new Date(now - s * 1000).toISOString();
const ok1 = (extra) => ({ success: [{ ...extra }] });
const whisper = { data: { message_template: "{{ whispered }}" } };
const docs = (withWhisper) => [
  { id: "c9953d42-a", created: iso(60), message: "DPC Vigilanza Meteo\nVigilanza meteo per domani", outcome: "partial_delivery",
    deliveries: { mobile_push: ok1(), alexa_announce: ok1(withWhisper ? whisper : {}) } },
  { id: "d03c5f80-b", created: iso(1800), message: "Aggiornamenti HACS (4)\nCi sono 4 aggiornamenti", outcome: "partial_delivery",
    deliveries: { mobile_push: ok1(), alexa_announce: ok1(withWhisper ? whisper : {}) } },
  { id: "f69df670-c", created: iso(7200), message: "Garage chiuso\nOra 21:21",
    deliveries: { mobile_push: ok1(), alexa_announce: ok1() } },
];

const mk = (list) => {
  const S = G.snArchiveStore;
  Object.assign(S, { docs: [], limit: 0, stamp: undefined, loading: null, error: null, fetched: null, index: null,
    light: [], lightLimit: 0, lightStamp: undefined, lightFetched: null, lightLoading: null, run: 0, lightRun: 0 });
  S.extra.clear();
  const el = document.createElement("supernotify-archive-card");
  el.setConfig({ style: "flat", priority_filters: false });
  document.body.appendChild(el);
  el.hass = {
    language: "it", themes: { darkMode: false }, services: { supernotify: { enquire_archive: {} } },
    states: { "sensor.supernotify_notifications": { state: "3", attributes: {}, last_updated: "x" } },
    callWS: async (m) => {
      const d = m.service_data || {};
      if (d.id) return { response: list.find((x) => x.id.startsWith(d.id)) || {} };
      return { response: { notifications: d.verbosity === "summary" ? [] : list } };
    },
  };
  return el;
};
const flush = () => new Promise((r) => setTimeout(r, 30));

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

// --- con sussurri nell'archivio -------------------------------------------
const a = mk(docs(true));
await flush(); a.hass = { ...a._hass }; await flush();
const tags = [...a.shadowRoot.querySelectorAll(".tg.wh")];
console.log("tag trovati:", tags.map((t) => t.textContent.trim()).join(" | "));
ok(tags.length === 2, "due righe marcate come sussurrate");
ok(/sussurrata/.test(tags[0].textContent), "etichetta in italiano");
ok(tags[0].querySelector('ha-icon[icon="mdi:volume-low"]'), "icona presente (mdi:volume-low dalla 0.50)");

// 0.85.0: a filter chip is its label plus a count in its own span
const label = (c) => (c.firstChild && c.firstChild.nodeType === 3 ? c.firstChild.textContent : "").trim();
const chips = [...a.shadowRoot.querySelectorAll(".chip")].map(label);
console.log("filtri:", chips.join(" | "));
ok(chips.includes("Sussurrate"), "il filtro 'Sussurrate' compare");

// il filtro isola le sole sussurrate
const chip = [...a.shadowRoot.querySelectorAll(".chip")].find((c) => label(c) === "Sussurrate");
chip.onclick();
const righe = [...a.shadowRoot.querySelectorAll(".row")];
console.log("righe dopo il filtro:", righe.length);
ok(righe.length === 2, "il filtro mostra solo le due sussurrate");
ok(righe.every((r) => r.querySelector(".tg.wh")), "ogni riga filtrata ha il tag");

// --- senza sussurri (com'e' dopo scenarios.yaml v4.0) ---------------------
const b = mk(docs(false));
await flush(); b.hass = { ...b._hass }; await flush();
const chips2 = [...b.shadowRoot.querySelectorAll(".chip")].map(label);
console.log("filtri senza sussurri:", chips2.join(" | "));
ok(!chips2.includes("Sussurrate"), "a sussurro spento il filtro NON compare");
ok(b.shadowRoot.querySelectorAll(".tg.wh").length === 0, "nessun tag sussurro");
ok(b.shadowRoot.querySelectorAll(".row").length === 3, "le tre righe ci sono comunque");

// --- "Alexa ha detto": il testo pronunciato, quando differisce -------------
const parlato = [
  { id: "bef3175c-d", created: iso(120), title: "Garage Chiuso", message: "🚪 Garage chiuso 🕐 Ora: 09:37:05 del 18/09/2026",
    deliveries: { alexa_announce: { success: [{ spoken_message: "Il garage è stato chiuso." }] } } },
  { id: "a9a66762-e", created: iso(3600), message: "Buongiorno Info\nSono le 09:15, A Montese ci sono 15.5 °C",
    deliveries: { alexa_announce: ok1() } },
];
const c = mk(parlato);
await flush(); c.hass = { ...c._hass }; await flush(); await flush();
const dette = [...c.shadowRoot.querySelectorAll(".said")];
console.log("blocchi 'ha detto':", dette.map((n) => n.textContent.trim()).join(" | "));
ok(dette.length === 1, "il dettaglio della notifica con testo diverso mostra cosa è stato detto");
ok(/Alexa ha detto/.test(dette[0].textContent), "etichetta in italiano");
ok(dette[0].textContent.includes("Il garage è stato chiuso."), "riporta il testo pronunciato");
ok(dette[0].closest(".det") !== null, "sta nel dettaglio, non nella riga chiusa");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
