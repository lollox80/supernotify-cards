// Scenarios card: the `name` of a group from the configuration went into its header as HTML ("Casa <vuota>"
// lost its end). SupernotifyScenariosCard._update0 runs here on a stand-in `this`, without jsdom.
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const fn = (name) => {
  const s = src.indexOf(`function ${name}(`);
  return src.slice(s, src.indexOf("\n}\n", s) + 3);
};
const cls = src.indexOf("class SupernotifyScenariosCard ");
const s = src.indexOf("\n  _update0() {\n", cls);
const body = src.slice(s + "\n  _update0() {\n".length, src.indexOf("\n  }\n", s));
const noop = () => {};
const update = new Function("snT", "snIconify", "snRowsDelegate", "snToggle", "snToggleSafe",
  fn("snEsc") + `return function () {\n${body}\n};`)(() => ({ other: "Other" }), (h) => h, noop, noop, noop);

const rows = { innerHTML: "", querySelectorAll: () => [] };
const card = {
  _config: { groups: [{ name: 'Casa <vuota> & "notte"', scenarios: ["away"] }] }, _hass: {},
  _scenarios: () => [{ name: "away" }, { name: "night" }], _reactiveActive: () => [],
  _rowHtml: (sc) => `<div class="row">${sc.name}</div>`,
  shadowRoot: { getElementById: () => rows },
};
update.call(card);
assert.ok(rows.innerHTML.includes('<div class="sec">Casa &lt;vuota&gt; &amp; &quot;notte&quot;</div>'), "group header as text");
assert.ok(rows.innerHTML.includes('<div class="sec">Other</div>'), "the other scenarios keep their header");
console.log("scenarios_group_name_escaped: 2 ok");
