// Control card: the group pills and the toggle tiles showed an entity's friendly_name (or a name from the
// configuration) as HTML. "Luce <sala>" lost "<sala>", and a name with markup was drawn as markup.
// The two render methods run here on a stand-in `this`, without jsdom.
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const fn = (name) => {
  const s = src.indexOf(`function ${name}(`);
  return src.slice(s, src.indexOf("\n}\n", s) + 3);
};
const method = (name) => {
  const s = src.indexOf(`\n  ${name}() {\n`);
  const e = src.indexOf("\n  }\n", s);
  return src.slice(s + `\n  ${name}() {\n`.length, e);
};
const helpers = fn("snEsc") + fn("snFname");
const make = (name) => new Function("snT", "snIconify", helpers + `return function () {\n${method(name)}\n};`)(
  () => ({ grp_active: "active", on: "on", off: "off" }), (html) => html);

const NAME = 'Luce <sala> & "porta"';
const hass = { states: { "switch.luce": { state: "on", attributes: { friendly_name: NAME } } } };
const el = () => ({ innerHTML: "", querySelectorAll: () => [] });
const ESCAPED = "Luce &lt;sala&gt; &amp; &quot;porta&quot;";

// group pills: friendly_name, then a name given in the configuration, and the group's own name
const groups = el();
const card = {
  _hass: hass, _on: () => true, _loadCollapsed: () => new Set(), _friendly(id) { return this._hass.states[id].attributes.friendly_name; },
  _config: { collapsible: true, groups: [{ name: "Piano <terra>", entities: ["switch.luce", { entity: "switch.luce", name: "<b>x</b>" }] }] },
  shadowRoot: { getElementById: () => groups },
};
make("_renderGroups").call(card);
assert.ok(groups.innerHTML.includes(ESCAPED), "pill: friendly_name escaped");
assert.ok(groups.innerHTML.includes("&lt;b&gt;x&lt;/b&gt;"), "pill: configured name escaped");
assert.ok(groups.innerHTML.includes("Piano &lt;terra&gt;"), "group name escaped");
assert.ok(!groups.innerHTML.includes("<sala>") && !groups.innerHTML.includes("<b>x"), "no raw markup from names");

// a toggle tile with the entity's name; the snooze tile's own <br> in the subtitle stays markup
const tiles = el();
const tcard = {
  _config: { tiles: [{ toggle: "switch.luce" }] }, _renderSnz() {}, _icon: (ic) => `<span class="ti">${ic}</span>`,
  _tileDef: () => ({ cls: "on", icon: "⚙️", name: NAME, sub: "until 10:00<br>all", act() {} }),
  shadowRoot: { getElementById: () => tiles },
};
make("_renderTiles").call(tcard);
assert.ok(tiles.innerHTML.includes(`<b>${ESCAPED}</b>`), "tile: name escaped");
assert.ok(tiles.innerHTML.includes("until 10:00<br>all"), "tile: subtitle markup kept");
console.log("control_names_escaped: 6 ok");
