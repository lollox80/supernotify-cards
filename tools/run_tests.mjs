// CHANGELOG
// 2026-10-03 - first version: runs every tests/*.test.mjs in its own node process (each test
//   defines custom elements on a fresh JSDOM, so they cannot share one), with a timeout, and
//   exits 1 if any fails. Used by `npm test` and by the "Tests" job in .github/workflows/lint.yml.
import { readdirSync } from "fs";
import { spawnSync } from "child_process";

const only = process.argv[2];
const files = readdirSync("tests").filter((f) => f.endsWith(".test.mjs") && (!only || f.includes(only))).sort();
let failed = [];
for (const f of files) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [`tests/${f}`], { encoding: "utf8", timeout: 90000 });
  const out = (r.stdout || "") + (r.stderr || "");
  const ok = r.status === 0 && !/\bFAIL\b/.test(out);
  console.log(`${ok ? "ok  " : "FAIL"}  ${f}  (${Date.now() - t0} ms)`);
  if (!ok) {
    failed.push(f);
    console.log(out.split("\n").filter((l) => /FAIL|Error|at /.test(l)).slice(0, 25).join("\n") || out.slice(-2000));
    if (r.error) console.log(String(r.error));
  }
}
console.log(`\n${files.length - failed.length}/${files.length} test files passed`);
process.exit(failed.length ? 1 : 0);
