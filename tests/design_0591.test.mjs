// v0.59.1: palette - verde AA anche sulle tinte verdi, okSoft definito (riga attiva di fasce e scenari).
import fs from "fs";
const SRC = fs.readFileSync("dist/supernotify-control-card.js", "utf8");
let fail = 0;
const ok = (c, m) => { console.log((c ? "  PASS  " : "  FAIL  ") + m); if (!c) fail++; };
const body = SRC.slice(SRC.indexOf("function snPalette("), SRC.indexOf("function snCleanName("));
ok((body.match(/okSoft:/g) || []).length === 3, "okSoft definito per tema HA, scuro e chiaro");
const lum = (hex) => { const h = hex.slice(1); const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const light = body.slice(body.lastIndexOf(": { brand:"));
const okc = light.match(/ok: "(#[0-9a-f]{6})"/)[1], soft = light.match(/okSoft: "(#[0-9a-f]{6})"/)[1];
ok(ratio(okc, "#ffffff") >= 4.5 && ratio(okc, soft) >= 4.5 && ratio(okc, "#ddefe4") >= 4.5,
  `verde ${okc}: ${ratio(okc, "#ffffff").toFixed(2)} su bianco, ${ratio(okc, soft).toFixed(2)} su okSoft, ${ratio(okc, "#ddefe4").toFixed(2)} sulla tinta dei chip`);
ok(!/color: \$\{p\.muted\}; opacity: \.7;/.test(SRC), "righe versione senza opacità");
ok((SRC.match(/\.row\.act \.badge \{ background: \$\{p\.panel\}; \}/g) || []).length === 2, "badge sulla riga attiva su fondo pieno");
if (fail) { console.log(`\n${fail} FALLITI`); process.exit(1); }
console.log("\nTUTTI I TEST OK");
