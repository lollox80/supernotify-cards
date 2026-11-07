// 1.2.0 (hacs/default#11548): the automations list comes from sensor.supernotify_automations, not from /local/.
import { boot, load, ok, wait, txt, dom } from "./_harness.mjs";
import * as H from "./_harness.mjs";

boot();
let fetched = 0;
dom.window.fetch = async () => { fetched++; return { ok: true, json: async () => ({}) }; };
const { snAutManifest } = load("snAutManifest");

const S = (state, attributes = {}) => ({ state, attributes });
const list = [{ e: "automation.a", n: "Porta aperta", c: "Casa", s: "door_.yaml" },
  { e: "automation.b", n: "Batteria", c: "Dispositivi", s: "battery_.yaml" }];
const man = S("2", { generated: new Date().toISOString(), automations: list });
const mk = (states) => ({ language: "it", states, user: { is_admin: true }, callService: () => {}, callWS: async () => ({}) });

ok(snAutManifest(undefined) === null && snAutManifest(S("unavailable")) === null, "senza sensore o senza attributi: null");
ok(snAutManifest(man).automations.length === 2, "elenco letto dagli attributi");

// default: il sensore
const au = document.createElement("supernotify-automations-card");
au.setConfig({ manifest_url: "/local/supernotify/automations.json" });
ok(au._config.manifest_url === undefined && au._config.manifest_entity === "sensor.supernotify_automations",
  "manifest_url ignorato, manifest_entity di default");
document.body.appendChild(au);
const base = { "automation.a": S("on"), "automation.b": S("off") };
au.hass = mk({ ...base, "sensor.supernotify_automations": man });
await wait(30);
const names = () => [...au.shadowRoot.querySelectorAll(".row .nm")].map(txt).join("|");
ok(names() === "Porta aperta|Batteria", `righe dal sensore (${names()})`);
ok(fetched === 0, "nessun fetch");

// il sensore cambia: la lista si ridisegna da sola
const man2 = S("3", { generated: new Date().toISOString(), automations: [...list, { e: "automation.c", n: "Allarme", c: "Casa" }] });
au.hass = mk({ ...base, "automation.c": S("on"), "sensor.supernotify_automations": man2 });
await wait(30);
ok(names().includes("Allarme"), "nuova automazione dopo l'aggiornamento del sensore");

// sensore mancante: errore con il nome dell'entità
const au2 = document.createElement("supernotify-automations-card");
au2.setConfig({ manifest_entity: "sensor.altro" });
document.body.appendChild(au2);
au2.hass = mk(base);
await wait(30);
const err = txt(au2.shadowRoot.querySelector(".err"));
ok(err.includes("sensor.altro") && err.includes("non trovato"), `errore chiaro (${err.slice(0, 80)})`);

// editor visuale: un selettore di entità sensor
const form = customElements.get("supernotify-automations-card").getConfigForm();
const f = form.schema.find((x) => x.name === "manifest_entity");
ok(f && f.selector.entity && f.selector.entity.domain === "sensor" && !form.schema.some((x) => x.name === "manifest_url"),
  "editor: manifest_entity (sensor), niente manifest_url");

process.exit(H.fail ? 1 : 0);
