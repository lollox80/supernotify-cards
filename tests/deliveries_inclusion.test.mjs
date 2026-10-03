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

// 1. (0.51.0) i canali sono raggruppati per come partono, con il conteggio
const groups = [...el.shadowRoot.querySelectorAll(".grp")].map((g) => ({
  h: g.querySelector("h3").textContent.replace(/\s+/g, " ").trim(),
  rows: [...g.querySelectorAll(".row .mid b")].map((b) => b.textContent),
}));
console.log("gruppi:", groups.map((g) => `${g.h} [${g.rows.join(", ")}]`).join(" | "));
ok(groups.length === 4, "quattro gruppi");
ok(groups[0].h === "Partono da soli · 2" && groups[0].rows.includes("Notifica sul telefono"), "'default' -> Partono da soli, con alias");
ok(groups[1].h === "Solo se chiamati per nome · 1" && groups[1].rows[0] === "persistent", "'explicit' -> Solo se chiamati per nome");
ok(groups[2].h === "Solo con uno scenario · 1" && groups[2].rows[0] === "sirena", "'scenario' -> Solo con uno scenario");
ok(/^Di riserva/.test(groups[3].h) && groups[3].rows[0] === "backup_mail", "'fallback' -> Di riserva");
ok(!txt.includes("implicita"), "la parola 'implicita' non compare più");
ok(!el.shadowRoot.querySelector(".tag.always"), "niente tag 'sempre attivo' ripetuto su ogni riga");

// 2. intestazione con quanti sono accesi
const hd = el.shadowRoot.querySelector(".chd");
ok(hd && /Canali/.test(hd.textContent) && /5 di 5 accesi/.test(hd.textContent), "intestazione 'Canali · 5 di 5 accesi'");

// 3. group: false = lista unica
const flat = document.createElement("supernotify-deliveries-card");
flat.setConfig({ group: false }); document.body.appendChild(flat);
flat.hass = { language: "it", themes: { darkMode: false }, states: DELS };
ok(!flat.shadowRoot.querySelector(".grp") && flat.shadowRoot.querySelectorAll(".row").length === 5, "group: false -> lista unica");

// 4. inclusion assente (vecchie versioni di SuperNotify): non deve sparire la riga
const el2 = document.createElement("supernotify-deliveries-card");
el2.setConfig({ style: "flat" });
document.body.appendChild(el2);
el2.hass = { language: "it", themes: { darkMode: false }, states: {
  "binary_sensor.supernotify_delivery_vecchia": {
    state: "on", attributes: { name: "vecchia", transport: "email", enabled: true } } } };
ok(el2.shadowRoot.querySelectorAll(".row").length === 1, "una delivery senza inclusion compare lo stesso");
ok(/Partono da soli/.test(el2.shadowRoot.textContent), "e viene trattata come 'parte da sola'");

console.log(fail ? `\n${fail} TEST FALLITI` : "\nTUTTI I TEST OK");
process.exit(fail ? 1 : 0);
