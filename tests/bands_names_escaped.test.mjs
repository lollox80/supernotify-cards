// Bands card: a band's name from the configuration went into the row and into two aria-label attributes
// as it was - "Sera <tardi>" lost its end, a '"' closed the attribute early. The row builder of
// SupernotifyBandsCard._update runs here on a stand-in `this`, without jsdom.
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const fn = (name) => {
  const s = src.indexOf(`function ${name}(`);
  return src.slice(s, src.indexOf("\n}\n", s) + 3);
};
const cls = src.indexOf("class SupernotifyBandsCard ");
const s = src.indexOf("\n  _update() {\n", cls);
const body = src.slice(s + "\n  _update() {\n".length, src.indexOf("\n  }\n", s));
const T = { now: "now", no_voice: "no voice", until: "until", crosses: "next day", start: "start", volume: "volume" };
const update = new Function("snT", "snIconify", fn("snEsc") + `return function () {\n${body}\n};`)(() => T, (h) => h);

const rows = { dataset: {}, innerHTML: "", querySelector: () => null };
const card = {
  _config: {}, _hass: {}, _bind() {}, _activeKey: () => "evening",
  _bands: () => [{ key: "evening", icon: "🌇", name: 'Sera <tardi> & "dopo"', hhmm: "19:00", min: 1140, vol: 40, start: "input_datetime.sera", volume: "input_number.sera" }],
  shadowRoot: { getElementById: () => rows, activeElement: null },
};
update.call(card);
const html = rows.innerHTML;
assert.ok(html.includes("<b>🌇 Sera &lt;tardi&gt; &amp; &quot;dopo&quot;</b>"), "row: name as text");
assert.strictEqual((html.match(/aria-label="Sera &lt;tardi&gt; &amp; &quot;dopo&quot; - /g) || []).length, 2, "both aria-labels whole");
assert.ok(!html.includes("<tardi>"), "no raw markup from the name");
console.log("bands_names_escaped: 3 ok");
