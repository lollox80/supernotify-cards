# -*- coding: utf-8 -*-
"""Verifica che il freno sul peso dell'indice funzioni davvero."""
import sys, io, json, subprocess
sys.stdout.reconfigure(encoding="utf-8")

SCRIPT = r"X:\tools\sn_archive_index.py"
ARCH = r"X:\supernotify\archive"


def run(maxb=None):
    cmd = [sys.executable, SCRIPT, "--path", ARCH]
    if maxb:
        cmd += ["--max-bytes", str(maxb)]
    out = subprocess.run(cmd, capture_output=True)
    raw = out.stdout.decode("utf-8").strip()
    if out.returncode or not raw:
        print("ERRORE:", out.stderr.decode("utf-8", "replace")[:400])
        sys.exit(1)
    return raw, json.loads(raw)


fail = 0
def ok(c, m):
    global fail
    print(("  PASS  " if c else "  FAIL  ") + m)
    if not c:
        fail += 1


raw, d = run()
byte = len(raw.encode("utf-8"))
sp = sum(1 for it in d["items"] if it.get("sp"))
print("default  : %d byte, %d notifiche, %d con testo vocale, sp_dropped=%s"
      % (byte, len(d["items"]), sp, d.get("sp_dropped", 0)))
ok(byte <= 13000, "sotto la soglia di 13000 byte")
ok(byte <= 16000, "ampiamente sotto il limite HA di ~16 KB")
ok(sp > 0, "almeno una notifica porta il testo pronunciato")
ok(len(d["items"]) == 40, "le 40 notifiche ci sono tutte")

# soglia bassa: il freno deve tagliare `sp`, mai le notifiche
raw2, d2 = run(9000)
byte2 = len(raw2.encode("utf-8"))
sp2 = sum(1 for it in d2["items"] if it.get("sp"))
print("max 9000 : %d byte, %d notifiche, %d con testo vocale, sp_dropped=%s"
      % (byte2, len(d2["items"]), sp2, d2.get("sp_dropped", 0)))
# Il freno sacrifica SOLO `sp`: se anche togliendoli tutti non si rientra,
# si fa quel che si puo' e le notifiche restano. E' il comportamento voluto.
ok(byte2 <= 9000 or sp2 == 0, "rientra nella soglia, o ha gia' tolto tutti gli sp")
ok(len(d2["items"]) == len(d["items"]), "NESSUNA notifica persa, si taglia solo sp")
ok(sp2 < sp, "ha sacrificato dei testi vocali")
# nota: `sp` del run default e' gia' al netto dei suoi 3 tagli, quindi il
# confronto giusto e' sul totale dichiarato dai due run
ok(d2.get("sp_dropped", 0) == sp + d.get("sp_dropped", 0) - sp2,
   "sp_dropped dichiara quanti ne ha tolti")
# i piu' RECENTI devono sopravvivere: si taglia dal fondo
if sp2:
    primo = next(i for i, it in enumerate(d2["items"]) if it.get("sp"))
    ultimo = max(i for i, it in enumerate(d2["items"]) if it.get("sp"))
    ok(primo == next(i for i, it in enumerate(d["items"]) if it.get("sp")),
       "il testo vocale della notifica piu' recente e' conservato")
    ok(ultimo < max(i for i, it in enumerate(d["items"]) if it.get("sp")),
       "a essere sacrificate sono le piu' vecchie")

# soglia assurda: non deve rompersi ne' andare in loop
raw3, d3 = run(500)
print("max 500  : %d byte, %d notifiche, sp_dropped=%s"
      % (len(raw3.encode("utf-8")), len(d3["items"]), d3.get("sp_dropped", 0)))
ok(len(d3["items"]) == len(d["items"]), "con soglia impossibile tiene comunque le notifiche")
ok(all(not it.get("sp") for it in d3["items"]), "ha tolto tutti gli sp senza schiantarsi")

print("\nTUTTI I TEST OK" if not fail else "\n%d TEST FALLITI" % fail)
sys.exit(1 if fail else 0)
