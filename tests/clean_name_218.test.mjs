// SuperNotify 2.18: delivery switches live under their transport's device, so the
// friendly_name starts with the device name ("Mobile Push Delivery ... abilitata").
// snCleanName must still give back just the alias, and nothing for technical names.
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const re = src.match(/const SN_NAME_TYPE_RE = [^\n]+\n/)[0];
const fnStart = src.indexOf("function snCleanName(");
const fnEnd = src.indexOf("\n}\n", fnStart) + 3;
const snCleanName = new Function(re + src.slice(fnStart, fnEnd) + "return snCleanName;")();

const cases = [
  // 2.18 names (transport device first)
  ["Mobile Push Delivery Notifica sul telefono abilitata", "mobile_push", "Notifica sul telefono"],
  ["Email Delivery Email HTML abilitata", "html_email", "Email HTML"],
  ["Alexa Media Player Delivery Annuncio vocale Alexa abilitata", "alexa_announce", "Annuncio vocale Alexa"],
  ["Email Delivery email abilitata", "email", ""],
  ["Alexa Media Player Delivery alexa_media_player abilitata", "alexa_media_player", ""],
  // transport switches: the device name is a fine label
  ["Email Abilitato", "email", "Email"],
  ["Alexa Media Player Abilitato", "alexa_media_player", "Alexa Media Player"],
  // pre-2.18 names keep working
  ["SuperNotify Delivery Notifica sul telefono abilitata", "mobile_push", "Notifica sul telefono"],
  ["Supernotify Transport sms abilitato", "sms", ""],
  ["Recipient Lorenzo (admin) abilitato", "lorenzo", "Lorenzo (admin)"],
  ["Supernotify Condizione scenario Morning", "morning", "Morning"],
  ["Supernotify Condizione scenario late_night", "late_night", ""],
  ["Supernotify Scenario Priorità Alta (sempre consegna)", "high_priority", "Priorità Alta (sempre consegna)"],
  // a recipient alias containing "Delivery" is left alone
  ["Recipient Delivery Guy abilitato", "guy", "Delivery Guy"],
];
for (const [fn, tech, want] of cases) assert.strictEqual(snCleanName(fn, tech), want, fn);
console.log(`clean_name_218: ${cases.length} ok`);
