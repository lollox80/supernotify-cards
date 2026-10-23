// CHANGELOG
// 2026-10-05 v0.76.1: le letture hanno un tempo massimo, così una richiesta mai risposta non blocca la card.
import { SRC, boot, load, ok, fail } from "./_harness.mjs";

boot({ url: "http://ha.local/" });
const G = load("snWS");

const never = { callWS: () => new Promise(() => {}) };
let err = null;
try { await G.snWS(never, { type: "x" }, 50); } catch (e) { err = e; }
ok(err && /timeout/.test(err.message), "una richiesta senza risposta fallisce dopo il tempo massimo");
ok(await G.snWS({ callWS: async () => 42 }, { type: "x" }, 50) === 42, "una risposta normale passa");
let rej = null;
try { await G.snWS({ callWS: async () => { throw new Error("boom"); } }, { type: "x" }, 50); } catch (e) { rej = e; }
ok(rej && rej.message === "boom", "un errore resta l'errore");
const reads = (SRC.match(/hass\.callWS\(\{\s*type: "call_service", domain: "supernotify", service: "enquire_/g) || []).length;
ok(reads === 0, `nessuna enquire_* senza tempo massimo (${reads})`);
if (fail) { console.log(`FAIL ${fail}`); process.exit(1); }
console.log("all ok");
process.exit(0);
