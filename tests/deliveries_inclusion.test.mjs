// La deliveries-card deve dire COSA FA l'inclusion, non come si chiama,
// e far vedere a colpo d'occhio quali canali partono da soli.
import { JSDOM } from "jsdom";
import fs from "fs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
dom.window.customCards = [];
new dom.window.Function(fs.readFileSync("dist/supernotify-control-card.js", "utf8"))();

// Delivery vere di Lollo (inclusion come la espone l'entità, già risolta)
const DELS = {
  "binary_sensor.supernotify_delivery_mobile_push": {
    state: "on",
    attributes: { name: "mobile_push", transport: "mobile_push", enabled: true,
                  inclusion: ["default"], friendly_name: "Notifica sul telefono" } },
  "binary_sensor.supernotify_delivery_alexa_announce": {
    state: "on",
    attributes: { name: "alexa_announce", transport: "alexa_media_player", enabled: true,
                  inclusion: ["default"], friendly_name: "Annuncio vocale Alexa" } },
  "binary_sensor.supernotify_delivery_persistent": {
    state: "on",
    attributes: { name: "persistent", transport: "persistent", enabled: true,
                  inclusion: ["explicit"] } },
  "binary_sensor.supernotify_delivery_sirena": {
    state: "on",
    attributes: { name: "sirena", transport: "generic", enabled: true,
                  inclusion: ["scenario"] } },
  "binary_sensor.supernotify_delivery_backup_mail": {
    state: "on",
    attributes: { name: "backup_mail", transport: "email", enabled: true,
                  inclusion: ["fallback"] } },
};

const el = document.createElement("supernotify-deliveries-card");
el.setConfig({ style: "flat" });
document.body.appendChild(el);
el.hass = { language: "it", themes: { darkMode: false }, states: DELS };

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const txt = el.shadowRoot.textContent;

// 1. le etichette dicono l'effetto
console.log("tag inclusion:", [...el.shadowRoot.querySelectorAll(".tag")]
  .map((t) => t.textContent.trim()).filter((t) => t.startsWith("🔀")).join(" | "));
ok(txt.includes("sempre attivo"), "'default' si legge 'sempre attivo'");
ok(txt.includes("solo su richiesta"), "'explicit' si legge 'solo su richiesta'");
ok(txt.includes("solo con scenario"), "'scenario' si legge 'solo con scenario'");
ok(txt.includes("riserva"), "'fallback' si legge 'riserva'");
ok(!txt.includes("implicita"), "la parola 'implicita' non compare più");

// 2. i canali che partono da soli sono evidenziati
const sempre = [...el.shadowRoot.querySelectorAll(".tag.always")];
ok(sempre.length === 2, "due tag evidenziati (mobile_push e alexa_announce)");
ok(sempre.every((t) => /sempre attivo/.test(t.textContent)), "l'evidenza è sul tag giusto");

// 3. il riepilogo in testa
const sum = el.shadowRoot.querySelector(".incsum");
console.log("riepilogo:", sum && sum.textContent.trim());
ok(!!sum, "il riepilogo c'è");
ok(/5 di questi canali/.test(sum.textContent), "conta tutti i canali");
ok(/2\s*partono da soli/.test(sum.textContent.replace(/\s+/g, " ")), "conta quelli che partono da soli");
ok(/2\s*solo se richiesti/.test(sum.textContent.replace(/\s+/g, " ")), "conta quelli su richiesta (explicit + fallback)");
ok(/1\s*solo con uno scenario/.test(sum.textContent.replace(/\s+/g, " ")), "conta quelli da scenario");

// 4. inclusion assente (vecchie versioni di SuperNotify): non deve sparire la riga
const el2 = document.createElement("supernotify-deliveries-card");
el2.setConfig({ style: "flat" });
document.body.appendChild(el2);
el2.hass = { language: "it", themes: { darkMode: false }, states: {
  "binary_sensor.supernotify_delivery_vecchia": {
    state: "on", attributes: { name: "vecchia", transport: "email", enabled: true } } } };
ok(el2.shadowRoot.querySelectorAll(".row").length === 1, "una delivery senza inclusion compare lo stesso");
ok(el2.shadowRoot.textContent.includes("sempre attivo"), "e viene trattata come 'sempre attivo'");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
