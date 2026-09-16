// Test funzionale della bands-card in jsdom: il picker dell'orario non deve
// piu' essere distrutto dagli aggiornamenti di stato di Home Assistant.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
dom.window.customCards = [];

const src = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
new dom.window.Function(src)();

const BANDS = {
  // ordine ALFABETICO, come lo risalva Home Assistant
  afternoon:     { name: "Pomeriggio",     start: "input_datetime.a", volume: "input_number.a" },
  early_morning: { name: "Mattina presto", start: "input_datetime.em", volume: "input_number.em" },
  evening:       { name: "Sera",           start: "input_datetime.e", volume: "input_number.e" },
  late_night:    { name: "Notte fonda",    start: "input_datetime.ln", volume: "input_number.ln" },
  morning:       { name: "Mattina",        start: "input_datetime.m", volume: "input_number.m" },
  night:         { name: "Notte",          start: "input_datetime.n", volume: "input_number.n" },
};

const st = (s) => ({ state: s });
const hass = (tick) => ({
  language: "it",
  themes: { darkMode: false },
  states: {
    "input_datetime.em": st("05:00:00"), "input_number.em": st("40"),
    "input_datetime.m":  st("09:00:00"), "input_number.m":  st("50"),
    "input_datetime.a":  st("12:00:00"), "input_number.a":  st("30"),
    "input_datetime.e":  st("18:00:00"), "input_number.e":  st("20"),
    "input_datetime.n":  st("20:00:00"), "input_number.n":  st("10"),
    "input_datetime.ln": st("23:00:00"), "input_number.ln": st("0"),
    "sensor.rumore": st(String(tick)),   // entita' che cambia di continuo
  },
});

const el = document.createElement("supernotify-bands-card");
el.setConfig({ bands: BANDS, style: "flat" });
document.body.appendChild(el);
el.hass = hass(0);

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };

// 1. ordine cronologico malgrado la config alfabetica
const names = [...el.shadowRoot.querySelectorAll(".row .who b")].map((n) => n.textContent.trim());
console.log("ordine renderizzato:", names.map((n) => n.split(" ").slice(1).join(" ")).join(" | "));
ok(/Mattina presto/.test(names[0]) && /Notte fonda/.test(names[5]),
   "fasce in ordine di orario, non alfabetico");

// 2. intervalli corretti
const rng = [...el.shadowRoot.querySelectorAll(".row .rng")].map((n) => n.textContent.trim());
console.log("primo intervallo:", rng[0], "| ultimo:", rng[5]);
ok(rng[0].startsWith("05:00") && rng[0].includes("09:00"), "Mattina presto 05:00 -> 09:00");
ok(rng[5].startsWith("23:00") && rng[5].includes("05:00") && /mezzanotte/.test(rng[5]),
   "Notte fonda 23:00 -> 05:00 con 'attraversa mezzanotte'");

// 3. badge "niente voce" solo sulla fascia a 0
const badges = [...el.shadowRoot.querySelectorAll("[data-m]")];
ok(badges.filter((b) => !b.hidden).length === 1, "un solo badge 'niente voce' visibile");
ok(!el.shadowRoot.querySelector('[data-m="late_night"]').hidden, "il badge e' su Notte fonda (0%)");

// 4. IL BUG: l'input orario deve sopravvivere agli aggiornamenti di stato
const before = el.shadowRoot.querySelector('input[type=time]');
before.focus();
before.value = "06:30";
for (let i = 1; i <= 25; i++) el.hass = hass(i);   // 25 state change di altre entita'
const after = el.shadowRoot.querySelector('input[type=time]');
ok(before === after, "l'input orario NON viene ricreato dagli update di hass");
ok(el.shadowRoot.activeElement === after, "l'input mantiene il focus (picker resta aperto)");
ok(after.value === "06:30", "il valore digitato non viene sovrascritto mentre ha il focus");

// 5. senza focus, i valori si aggiornano comunque
after.blur();
const h2 = hass(99); h2.states["input_number.ln"] = st("55");
el.hass = h2;
ok(el.shadowRoot.querySelector('[data-m="late_night"]').hidden,
   "alzando il volume di Notte fonda il badge sparisce");
ok(el.shadowRoot.querySelector('[data-l="late_night"]').textContent === "55",
   "l'etichetta del volume si aggiorna a 55");

// 6. cambio d'ora che riordina le fasce -> rebuild
const h3 = hass(100); h3.states["input_datetime.a"] = st("02:00:00");
el.hass = h3;
const names2 = [...el.shadowRoot.querySelectorAll(".row .who b")].map((n) => n.textContent.trim());
ok(/Pomeriggio/.test(names2[0]), "spostando Pomeriggio alle 02:00 passa in cima");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
