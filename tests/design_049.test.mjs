// v0.49.0: una sola palette con contrasti AA, nome leggibile davanti, versione nascosta.
import { JSDOM } from "jsdom";
import fs from "fs";

const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document; global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement; global.customElements = dom.window.customElements;
dom.window.customCards = [];
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
new dom.window.Function(SRC)();

let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const flush = () => new Promise((r) => setTimeout(r, 30));

// ── 1. contrasti della palette chiara (WCAG AA 4.5:1 sul fondo della card) ──
const body = SRC.slice(SRC.indexOf("function snPalette("), SRC.indexOf("function snCleanName("));
const light = body.slice(body.lastIndexOf(": { brand:"));
const val = (k) => (light.match(new RegExp(`\\b${k}: "(#[0-9a-f]{3,6})"`)) || [])[1];
const lum = (hex) => {
  const h = hex.length === 4 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const panel = val("panel") === "#fff" ? "#ffffff" : val("panel");
for (const k of ["ink", "muted", "brand", "brandD", "ok", "warn", "crit"]) {
  const r = ratio(val(k), panel);
  ok(r >= 4.5, `chiaro: ${k} ${val(k)} su card ${r.toFixed(2)}:1 (>= 4.5)`);
}
ok(ratio("#ffffff", val("brand")) >= 4.5, `chiaro: testo bianco su brand ${ratio("#ffffff", val("brand")).toFixed(2)}:1`);
ok(ratio(val("warnInk"), val("warnSoft")) >= 4.5, `chiaro: snooze attivo ${ratio(val("warnInk"), val("warnSoft")).toFixed(2)}:1`);
// 0.64.0: one _palette in SnCard, and the cards extend it (0.85.0: 13 - why is an alias of archive)
ok((SRC.match(/\n  _palette\(\) \{\n    return snPalette\(/g) || []).length === 1
  && (SRC.match(/^class Supernotify\w+Card extends SnCard \{/gm) || []).length === 13, "le 13 card usano snPalette tramite SnCard (0.64.0)");

// ── 2. stati di prova ───────────────────────────────────────────────────────
const T0 = Math.floor(Date.now() / 1000) - 600;
const IDX = { count: 1, chan: ["mobile_push", "email"], scen: [],
  items: [{ id: "aaaa1111", t: T0, ti: "Porta", o: "partial_delivery", d: 1, s: 1, c: [0, [1, "s", "nessun target"]] }] };
const DET = JSON.stringify({ ok: true, n: { id: "aaaa1111-x", t: T0, ti: "Porta", p: "high", o: "partial_delivery",
  dl: [{ n: "mobile_push", r: "ok", calls: 1 }, { n: "email", r: "skip", why: "NO_TARGET", tr: "always" }] } });
const del = (name, fn, transport) => ({ state: "on", attributes: { name, enabled: true, transport, inclusion: ["default"], transport_enabled: true,
  friendly_name: `SuperNotify Delivery ${fn} abilitata` } });
const hass = {
  language: "it", themes: { darkMode: false }, entities: {}, user: { is_admin: true },
  services: { supernotify: { notify: {} }, shell_command: { sn_archive_detail: {} } },
  states: {
    "switch.supernotify_delivery_mobile_push": del("mobile_push", "Notifica sul telefono", "mobile_push"),
    "switch.supernotify_delivery_email": del("email", "Email", "email"),
    "sensor.supernotify_archivio": { state: "1", attributes: IDX, last_updated: "x" },
  },
  callService: async () => {}, callApi: async () => ({}),
  callWS: async (m) => (m.domain === "shell_command" ? { response: { stdout: DET, stderr: "", returncode: 0 } } : { response: {} }),
};
const mount = (tag, cfg = {}) => { const c = document.createElement(tag); c.setConfig(cfg); document.body.appendChild(c); c.hass = hass; return c; };

// ── 3. nome leggibile davanti ───────────────────────────────────────────────
const dc = mount("supernotify-deliveries-card");
const row = [...dc.shadowRoot.querySelectorAll(".row")].find((r) => r.textContent.includes("mobile_push"));
ok(row && row.querySelector(".mid b").textContent === "Notifica sul telefono", "deliveries: in grassetto l'alias");
ok(row && row.querySelector(".tech").textContent === "mobile_push", "deliveries: nome tecnico piccolo accanto");
const emailRow = [...dc.shadowRoot.querySelectorAll(".row")].find((r) => /email/i.test(r.textContent));
ok(emailRow && !emailRow.querySelector(".tech"), "deliveries: senza alias diverso niente doppione del nome");

const cc = mount("supernotify-composer-card");
const chip = cc.shadowRoot.querySelector('#chips .chip[data-d="mobile_push"]');
ok(chip && chip.textContent === "Notifica sul telefono" && chip.title === "mobile_push", "composer: chip con alias, tecnico nel tooltip");

const ac = mount("supernotify-archive-card", { source: "sensor", entity: "sensor.supernotify_archivio" });
await flush();
// 0.85.0: the list says where it went, with the alias
const l2 = ac.shadowRoot.querySelector(".it .l2");
ok(l2 && /Notifica sul telefono/.test(l2.textContent) && !/mobile_push/.test(l2.textContent), "archive: riga con alias");

const wc = mount("supernotify-why-card", { source: "sensor", entity: "sensor.supernotify_archivio" });
await flush(); await flush();
const nm = [...wc.shadowRoot.querySelectorAll(".ch .nm")].map((n) => n.textContent);
ok(nm.includes("Notifica sul telefono"), `why: nome leggibile (${nm.join(", ")})`);
const css = wc.shadowRoot.innerHTML;
ok(/\.st\.skip, \.st\.supp \{ color: #5b6b7c; \}/.test(css), "why: saltata in grigio, non arancio");

// ── 4. versione nascosta salvo show_version ─────────────────────────────────
ok(!dc.shadowRoot.querySelector(".ver"), "deliveries: niente riga versione di default");
const dv = mount("supernotify-deliveries-card", { show_version: true });
ok(/supernotify-deliveries-card v\d+\.\d+\.\d+/.test(dv.shadowRoot.textContent), "show_version: true la mostra");
ok(/--sn-sw-on:#0277bd/.test(dc.shadowRoot.innerHTML), "tema chiaro: gli switch usano il blu leggibile #0277bd");

if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
