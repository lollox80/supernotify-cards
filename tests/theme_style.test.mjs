// Unreleased: the card background comes from the theme (--ha-card-background, glass themes included) with
// `style: theme`, and `style: auto` follows the theme only when a theme other than the default one is in use.
import { SRC, boot, load, ok, fail } from "./_harness.mjs";

boot({ scroll: true });
const { snPalette, snStyle } = load("snPalette, snStyle");
const flush = () => new Promise((r) => setTimeout(r, 30));

// ── 1. palette: a separate key for the card background ─────────────────────
ok(snPalette(true, "theme").card === "var(--ha-card-background, var(--card-background-color))", "theme: card = --ha-card-background");
ok(snPalette(true, "theme").panel === "var(--card-background-color)", "theme: panel unchanged (buttons, fields)");
for (const dark of [true, false]) {
  const p = snPalette(dark, "supernotify");
  ok(p.card === p.panel, `supernotify ${dark ? "dark" : "light"}: card === panel (no visual change)`);
}
ok(snPalette(false, undefined).card === "#fff", "no style: the SuperNotify light card stays white");
// every card draws ha-card on p.card, no longer on p.panel
const haCard = SRC.match(/ha-card \{ padding: [^}]*\}/g) || [];
ok(haCard.length >= 12 && haCard.every((r) => r.includes("background: ${p.card}")), `the ${haCard.length} ha-card rules use p.card`);
ok(!/<ha-card style="[^"]*background:\$\{p\.panel\}/.test(SRC), "inline ha-card style (bands placeholder) uses p.card");

// ── 2. style: auto ──────────────────────────────────────────────────────────
const H = (themes, selectedTheme) => ({ themes, ...(selectedTheme !== undefined ? { selectedTheme } : {}) });
ok(snStyle(H({ theme: "default", darkMode: false }), "auto") === "supernotify", "auto + default theme = supernotify");
ok(snStyle(H({ theme: "Cielo", darkMode: false }), "auto") === "theme", "auto + backend theme Cielo = theme");
ok(snStyle(H({ theme: "default" }, { theme: "Cielo" }), "auto") === "theme", "auto + theme picked in the profile = theme");
ok(snStyle(H({ theme: "Cielo" }, { theme: "default" }), "auto") === "supernotify", "auto + profile back on default = supernotify");
ok(snStyle(H({ theme: "Cielo" }, null), "auto") === "theme", "auto + no profile choice = the backend theme");
ok(snStyle(H({ theme: "Cielo" }), "theme") === "theme" && snStyle(H({ theme: "Cielo" }), "supernotify") === "supernotify"
  && snStyle(H({ theme: "Cielo" }), undefined) === undefined, "theme / supernotify / none are left as they are");
ok(snStyle(null, "auto") === "supernotify", "auto before hass = supernotify");

// ── 3. a card with style: auto redraws when the theme changes ───────────────
const hass = (theme) => ({ language: "en", themes: { darkMode: false, theme }, entities: {}, user: { is_admin: true },
  services: { supernotify: {} }, states: {}, callService: async () => {}, callApi: async () => ({}), callWS: async () => ({}) });
const el = document.createElement("supernotify-tools-card");
el.setConfig({ style: "auto" });
document.body.appendChild(el);
el.hass = hass("default");
await flush();
const bg = () => ((el.shadowRoot.innerHTML.match(/ha-card \{[^}]*background: ([^;]+);/) || [])[1] || "");
ok(bg() === "#fff", `default theme: SuperNotify background (${bg()})`);
el.hass = hass("Cielo");
await flush();
ok(bg().includes("--ha-card-background"), `custom theme, same light/dark: redrawn on the theme (${bg()})`);
el.hass = hass("default");
await flush();
ok(bg() === "#fff", "back on default: SuperNotify again");

// ── 4. editor and docs ──────────────────────────────────────────────────────
ok(/sel\("style", \[\["supernotify", "o_supernotify"\], \["theme", "o_theme"\], \["auto", "o_auto"\]\]\)/.test(SRC), "editor: Automatic in the Colours select");
ok(/style\s+"supernotify" \(default\) \| "theme" \| "auto"/.test(SRC), "options comment lists auto");

if (fail) { console.log(`\n${fail} FAILED`); process.exit(1); }
console.log("\nALL TESTS OK");
