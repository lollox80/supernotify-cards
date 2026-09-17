// La vista Archivio deve segnalare gli annunci usciti sussurrati, e offrire il
// filtro solo quando ce n'e' almeno uno.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

const now = Math.floor(Date.now() / 1000);
const index = (withWhisper) => ({
  count: 3, total: 1063, generated: new Date().toISOString(),
  oldest: new Date(now * 1000 - 9e8).toISOString(),
  chan: ["mobile_push", "alexa_announce"],
  scen: ["multi_home", "late_night"],
  items: [
    { id: "c9953d42", t: now - 60, ti: "DPC Vigilanza Meteo", m: "Vigilanza meteo per domani",
      o: "partial_delivery", c: [0, 1], sc: [0, 1], ...(withWhisper ? { w: true } : {}) },
    { id: "d03c5f80", t: now - 1800, ti: "Aggiornamenti HACS (4)", m: "Ci sono 4 aggiornamenti",
      o: "partial_delivery", c: [0, 1], sc: [0, 1], ...(withWhisper ? { w: true } : {}) },
    { id: "f69df670", t: now - 7200, ti: "Garage chiuso", m: "Ora 21:21", c: [0, 1] },
  ],
});

const mk = (idx) => {
  const el = document.createElement("supernotify-archive-card");
  el.setConfig({ entity: "sensor.supernotify_archivio", style: "flat" });
  document.body.appendChild(el);
  el.hass = {
    language: "it", themes: { darkMode: false },
    states: { "sensor.supernotify_archivio": { state: String(idx.count), attributes: idx } },
  };
  return el;
};

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

// --- con sussurri nell'archivio -------------------------------------------
const a = mk(index(true));
const tags = [...a.shadowRoot.querySelectorAll(".tg.wh")];
console.log("tag trovati:", tags.map((t) => t.textContent.trim()).join(" | "));
ok(tags.length === 2, "due righe marcate come sussurrate");
ok(/sussurrata/.test(tags[0].textContent), "etichetta in italiano");
ok(tags[0].textContent.includes("\u{1F92B}"), "icona presente");

const chips = [...a.shadowRoot.querySelectorAll(".chip")].map((c) => c.textContent.trim());
console.log("filtri:", chips.join(" | "));
ok(chips.includes("Sussurrate"), "il filtro 'Sussurrate' compare");

// il filtro isola le sole sussurrate
const chip = [...a.shadowRoot.querySelectorAll(".chip")].find((c) => c.textContent.trim() === "Sussurrate");
chip.onclick();
const righe = [...a.shadowRoot.querySelectorAll(".row")];
console.log("righe dopo il filtro:", righe.length);
ok(righe.length === 2, "il filtro mostra solo le due sussurrate");
ok(righe.every((r) => r.querySelector(".tg.wh")), "ogni riga filtrata ha il tag");

// --- senza sussurri (com'e' dopo scenarios.yaml v4.0) ---------------------
const b = mk(index(false));
const chips2 = [...b.shadowRoot.querySelectorAll(".chip")].map((c) => c.textContent.trim());
console.log("filtri senza sussurri:", chips2.join(" | "));
ok(!chips2.includes("Sussurrate"), "a sussurro spento il filtro NON compare");
ok(b.shadowRoot.querySelectorAll(".tg.wh").length === 0, "nessun tag sussurro");
ok(b.shadowRoot.querySelectorAll(".row").length === 3, "le tre righe ci sono comunque");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
