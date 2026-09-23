#!/usr/bin/env python3
"""
sn_archive_index.py - indice compatto dell'archivio SuperNotify per Home Assistant.

CHANGELOG
  2026-09-23 (Cowork, 2) - un singolo file d'archivio malformato non fa piu' morire lo
    script: prima un JSON che non era un oggetto (o con un campo di tipo inatteso) alzava
    AttributeError, non catturato, e il sensore restava senza NESSUNA notifica.
  2026-09-23 (Cowork) - il provenance esce come chiave "prov" a se stante: metterlo dentro
    "trace" faceva credere alla card che ci fosse un trace, e disegnava una sezione vuota.
  2026-09-22 (Cowork, 3) - delivery_provenance letto anche in cima al file, dove
    SuperNotify 2.8 (PR #210) lo mette per OGNI notifica, non solo con debug: true;
    resta la lettura dal trace per i file archiviati prima.
  2026-09-22 (Cowork, 2) - --detail riporta anche delivery_provenance del trace (chi ha
    acceso o spento ogni canale), quando SuperNotify lo registra.
  2026-09-22 (Cowork) - Modalita' --detail ID per la card "Perche'?"
    (supernotify-why-card): stampa il dettaglio di UNA notifica - scenari attivi e
    applicati, presenza, override della chiamata, esito e motivo di ogni canale con
    i target finali, e il trace completo quando la diagnostica lo ha archiviato. Si
    chiama su richiesta da uno shell_command con risposta (packages/supernotify/
    archivio.yaml), quindi non pesa sugli attributi del sensore. Nell'indice, un canale
    "suppressed" (es. doppione) ora riporta il suo motivo invece di un "s" muto.
  2026-09-11 (Cowork) - Prima versione. Legge i file JSON scritti da SuperNotify in
    /config/supernotify/archive e stampa su stdout un JSON con le ultime N notifiche,
    ridotte all'essenziale. Serve al sensore command_line "SuperNotify archivio"
    (packages/supernotify/archivio.yaml), che ne mette il risultato negli attributi:
    da li' la card supernotify-archive-card mostra lo storico senza esporre nessun file.
    E' un PONTE: quando SuperNotify avra' un servizio nativo (enquire_archive) la card
    passera' a quello e questo script si potra' togliere.

Uso:  python3 sn_archive_index.py [--limit N] [--path DIR] [--message-chars N]
      python3 sn_archive_index.py --detail <id o prefisso dell'id> [--path DIR]
Output: {"count", "generated", "total_files", "oldest", "items": [...]}
Non solleva mai: in caso di errore stampa un JSON con "error" e count 0, cosi' il
sensore resta valido e il problema si legge dall'attributo.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime

DEFAULT_PATH = "/config/supernotify/archive"
# Il sensore tiene tutto negli attributi di stato: oltre ~16 KB Home Assistant
# comincia a soffrire (DB e WebSocket), quindi si resta volutamente stretti.
DEFAULT_LIMIT = 40
DEFAULT_MESSAGE_CHARS = 130
# Il testo pronunciato da Alexa viene incluso solo quando differisce dal
# messaggio, e troncato: gli attributi di un sensore devono stare sotto ~16 KB
# e l'indice ne usa gia' ~8 con 40 notifiche.
SPOKEN_CHARS = 110
# Soglia oltre la quale si comincia a sacrificare `sp` (vedi main()).
MAX_BYTES = 13000


def _title_of(doc, message):
    """Il titolo non e' un campo top-level: sta nelle condition_variables."""
    cv = doc.get("condition_variables") or {}
    title = cv.get("notification_title")
    if title:
        return str(title)[:120]
    # fallback: prima riga del messaggio
    return (message or "").split("\n")[0][:120]


# Motivi di scarto accorciati: il testo esteso resta nel file JSON.
REASONS = {
    "DUPE": "doppione",
    "NO_TARGET": "nessun target",
    "ERROR": "errore",
    "DELIVERY_CONDITION": "condizione",
    "SCENARIO": "scenario",
    "OCCUPANCY": "presenza",
    "PRIORITY": "priorita",
    "DELIVERY_DISABLED": "spento",
    "SNOOZE": "pausa",
}


class Pool:
    """Tabella condivisa nome -> indice.

    Gli stessi 4-5 nomi di canale e di scenario si ripetono in ogni notifica: messi
    una volta sola in testa al JSON e citati per indice, l'indice dimezza di peso
    (gli attributi di un sensore devono restare sotto ~16 KB).
    """

    def __init__(self):
        self.names = []
        self._idx = {}

    def id_of(self, name):
        name = str(name)
        if name not in self._idx:
            self._idx[name] = len(self.names)
            self.names.append(name)
        return self._idx[name]


def _channels_of(doc, pool):
    """Un canale consegnato e' solo il suo indice; se saltato o fallito diventa
    [indice, "s"|"e", motivo?]."""
    out = []
    for name, res in (doc.get("deliveries") or {}).items():
        if not isinstance(res, dict):
            continue
        idx = pool.id_of(name)
        if res.get("error"):
            out.append([idx, "e"])
        elif res.get("success"):
            out.append(idx)                  # consegnato = caso normale
        else:
            skipped = res.get("skipped") or {}
            raw = skipped.get("suppression_reason") or skipped.get("skip_reason")
            if not raw:
                # "suppressed" = lista di envelope scartati (es. doppione): il motivo
                # sta in ciascuno, come skip_reason
                for env in res.get("suppressed") or []:
                    if isinstance(env, dict) and env.get("skip_reason"):
                        raw = env["skip_reason"]
                        break
            if raw:
                key = str(raw).upper()
                out.append([idx, "s", REASONS.get(key, str(raw)[:18].lower())])
            else:
                out.append([idx, "s"])
    return out


def _spoken_of(doc, limit):
    """Il testo che Alexa ha PRONUNCIATO, quando e' diverso dal messaggio.

    Non e' il `message` della notifica: `spoken_message` nei data, le opzioni
    della delivery (message_usage, simplify_text) e gli eventuali
    message_template degli scenari lo riscrivono. La verita' e' l'argomento
    passato al servizio, in deliveries[*].success[*].calls[*].action_data.message
    (fallback: success[*].message). Esempio reale: la notifica dice
    "Garage chiuso - Ora: 09:37:05", Alexa dice "Il garage e' stato chiuso.".

    Torna None se coincide col messaggio gia' in elenco: inutile ripeterlo, e
    gli attributi del sensore devono restare sotto ~16 KB.
    """
    for name, res in (doc.get("deliveries") or {}).items():
        if not isinstance(res, dict) or ("alexa" not in name and "tts" not in name):
            continue
        for call in res.get("success") or []:
            if not isinstance(call, dict):
                continue
            said = None
            for c in call.get("calls") or []:
                if isinstance(c, dict):
                    said = ((c.get("action_data") or {}).get("message")) or said
                    if said:
                        break
            said = said or call.get("message")
            if said:
                return " ".join(str(said).split())[:limit]
    return None


def _whispered(doc):
    """True se una consegna RIUSCITA ha usato un message_template sussurrato.

    L'SSML <amazon:effect name="whispered"> arriva da uno scenario e finisce in
    deliveries[*].success[*].data.message_template: non e' un campo top level,
    quindi la card non potrebbe dedurlo da sola. Serve come sentinella: il
    sussurro e' stato rimosso da scenarios.yaml v4.0, se ricompare si vede.
    """
    for res in (doc.get("deliveries") or {}).values():
        if not isinstance(res, dict):
            continue
        for call in res.get("success") or []:
            if not isinstance(call, dict):
                continue
            tpl = str((call.get("data") or {}).get("message_template") or "")
            if "whispered" in tpl:
                return True
    return False


def _item_of(doc, mtime, message_chars, chan_pool, scen_pool):
    """Solo cio' che non e' ricostruibile: i valori di default vengono omessi
    (priorita' medium, esito success, contatori a zero) e li rimette la card."""
    message = (doc.get("message") or "").strip()
    title = _title_of(doc, message)
    # il messaggio ripete quasi sempre il titolo come prima riga: non duplicarlo
    body = message
    if title and body.startswith(title):
        body = body[len(title):]
    body = " ".join(body.split())          # newline e spazi multipli via: la card va a capo da sola
    # t = epoch in secondi: 10 byte invece dei 32 della data ISO, la card formatta
    created = doc.get("created")
    stamp = int(mtime)
    if created:
        try:
            stamp = int(datetime.fromisoformat(str(created)).timestamp())
        except ValueError:
            pass
    # id accorciato: basta a identificare la notifica nel file (nome = data_uuid)
    item = {"id": (doc.get("id") or "")[:8], "t": stamp, "ti": title}
    if body:
        item["m"] = body[:message_chars]
        if len(body) > message_chars:
            item["mt"] = True              # messaggio troncato
    prio = doc.get("priority") or ""
    if prio and prio != "medium":
        item["p"] = prio
    outcome = doc.get("outcome") or ""
    if outcome and outcome != "success":
        item["o"] = outcome
    for key, field in (("d", "delivered"), ("f", "failed"), ("s", "skipped")):
        val = int(doc.get(field) or 0)
        if val:
            item[key] = val
    chans = _channels_of(doc, chan_pool)
    if chans:
        item["c"] = chans
    scen = doc.get("selected_scenario_names") or []
    if scen:
        item["sc"] = [scen_pool.id_of(s) for s in scen[:6]]
    ms = (doc.get("stats") or {}).get("total_duration_ms")
    if isinstance(ms, (int, float)) and ms:
        item["ms"] = round(float(ms), 1)
    if _whispered(doc):
        item["w"] = True                   # annuncio uscito sussurrato (SSML)
    # sp = cosa ha detto davvero Alexa, solo quando e' DAVVERO diverso da quello
    # che si legge gia' in elenco. Confronto normalizzato (solo lettere e cifre):
    # senza, un aforisma che differisce per un punto occuperebbe 110 byte per
    # niente.
    said = _spoken_of(doc, SPOKEN_CHARS)
    if said:
        flat = lambda s: "".join(c for c in str(s).lower() if c.isalnum())
        fs = flat(said)
        if fs and not any(fs.startswith(f[:len(fs)]) or f.startswith(fs)
                          for f in (flat(message), flat(body), flat(title)) if f):
            item["sp"] = said
    return item


# ---------------------------------------------------------------------------
# --detail: una sola notifica, per la card "Perche'?"
# ---------------------------------------------------------------------------

ID_RE = re.compile(r"^[0-9a-fA-F-]{6,36}$")
DETAIL_TEXT = 400        # messaggio e testo pronunciato
DETAIL_VALUE = 160       # singoli valori di target/eccezioni


def _short(value, limit=DETAIL_VALUE):
    text = " ".join(str(value).split())
    return text if len(text) <= limit else text[: limit - 1] + "\u2026"


def _targets_of(target):
    """{categoria: [valori]} senza categorie vuote; accetta dict o lista di dict."""
    out = {}
    for t in target if isinstance(target, list) else [target]:
        if not isinstance(t, dict):
            continue
        for cat, vals in t.items():
            vals = vals if isinstance(vals, list) else [vals]
            for v in vals:
                if v is None:
                    continue
                bucket = out.setdefault(str(cat), [])
                v = _short(v, 80)
                if v not in bucket:
                    bucket.append(v)
    return out


def _delivery_detail(name, res):
    """Esito di un canale: ok / err / skip / supp, motivo, target finali, chiamate."""
    d = {"n": name}
    if not isinstance(res, dict):
        d["r"] = "?"
        return d
    envelopes = []
    if res.get("error"):
        d["r"] = "err"
        envelopes = res.get("error") or []
    elif res.get("success"):
        d["r"] = "ok"
        envelopes = res.get("success") or []
    elif res.get("suppressed"):
        d["r"] = "supp"
        envelopes = res.get("suppressed") or []
    else:
        skipped = res.get("skipped") or {}
        d["r"] = "skip"
        if skipped.get("suppression_reason"):
            d["why"] = str(skipped["suppression_reason"])
        if skipped.get("target_required"):
            d["tr"] = str(skipped["target_required"])
        tg = _targets_of(skipped.get("targets") or [])
        if tg:
            d["tg"] = tg
        return d
    targets, calls, errors = [], 0, []
    for env in envelopes:
        if not isinstance(env, dict):
            continue
        if env.get("target"):
            targets.append(env["target"])
        if env.get("skip_reason") and "why" not in d:
            d["why"] = str(env["skip_reason"])
        calls += len(env.get("calls") or [])
        for call in env.get("failedcalls") or []:
            if isinstance(call, dict) and call.get("exception"):
                errors.append(_short(call["exception"]))
    tg = _targets_of(targets)
    if tg:
        d["tg"] = tg
    if calls:
        d["calls"] = calls
    if errors:
        d["err"] = errors[:3]
    return d


def _prov_of(doc):
    """Chi ha acceso o spento ogni canale. Da SuperNotify 2.8 (PR #210) e' in cima al file
    e c'e' per OGNI notifica; prima stava dentro al trace e solo con debug: true."""
    for prov in (doc.get("delivery_provenance"), (doc.get("debug_trace") or {}).get("delivery_provenance")):
        if isinstance(prov, dict) and prov:
            return {k: v for k, v in prov.items() if isinstance(v, dict)}
    return None


def _trace_of(doc):
    """Il trace completo, solo se la diagnostica lo ha messo nel file."""
    trace = doc.get("debug_trace")
    if not isinstance(trace, dict):
        return None
    out = {}
    sel = trace.get("delivery_selection")
    if isinstance(sel, dict) and sel:
        out["sel"] = {k: list(v) if isinstance(v, (list, tuple)) else v for k, v in sel.items()}
    res = trace.get("resolved")
    if isinstance(res, dict) and res:
        chains = {}
        for name, stages in res.items():
            if not isinstance(stages, dict):
                continue
            chain = []
            for stage, value in stages.items():
                if value == "NO_CHANGE":
                    continue            # solo le tappe che cambiano qualcosa
                chain.append([stage, _targets_of(value) if isinstance(value, (dict, list)) else _short(value)])
            if chain:
                chains[name] = chain
        if chains:
            out["res"] = chains
    exc = trace.get("delivery_exceptions")
    if isinstance(exc, dict) and exc:
        out["exc"] = {k: _short(json.dumps(v, ensure_ascii=False), 300) for k, v in exc.items()}
    return out or None


def detail_of(doc, mtime):
    message = (doc.get("message") or "").strip()
    created = doc.get("created")
    stamp = int(mtime)
    if created:
        try:
            stamp = int(datetime.fromisoformat(str(created)).timestamp())
        except ValueError:
            pass
    out = {
        "id": doc.get("id"),
        "t": stamp,
        "ti": _title_of(doc, message),
        "m": _short(message, DETAIL_TEXT),
        "p": doc.get("priority") or "medium",
        "o": doc.get("outcome") or "",
        "sel": doc.get("delivery_selection") or "",
        "v": doc.get("version") or "",
    }
    if doc.get("spoken_message"):
        out["sp"] = _short(doc["spoken_message"], DETAIL_TEXT)
    if doc.get("dupe"):
        out["dupe"] = True
    scen = {}
    for key, field in (("on", "enabled_scenarios"), ("sel", "selected_scenario_names"),
                       ("ap", "applied_scenario_names"), ("rq", "required_scenario_names"),
                       ("cs", "constrain_scenario_names")):
        val = doc.get(field)
        if isinstance(val, dict):
            val = list(val.keys())
        if val:
            scen[key] = list(val)
    if scen:
        out["sc"] = scen
    occ = doc.get("occupancy") or {}
    flags = (doc.get("condition_variables") or {}).get("occupancy") or []
    home = [p.get("person") for p in occ.get("home") or [] if isinstance(p, dict)]
    away = [p.get("person") for p in occ.get("not_home") or [] if isinstance(p, dict)]
    if home or away or flags:
        out["occ"] = {"home": home, "away": away, "flags": list(flags)}
    overrides = {}
    for name, ov in (doc.get("delivery_overrides") or {}).items():
        if not isinstance(ov, dict):
            continue
        entry = {"en": ov.get("enabled") is not False}
        tg = _targets_of(ov.get("target") or {})
        if tg:
            entry["tg"] = tg
        if ov.get("data"):
            entry["data"] = sorted(str(k) for k in ov["data"])[:8]
        overrides[name] = entry
    if overrides:
        out["ov"] = overrides
    out["dl"] = [_delivery_detail(n, r) for n, r in (doc.get("deliveries") or {}).items()]
    if doc.get("delivery_exceptions"):
        out["dx"] = _short(json.dumps(doc["delivery_exceptions"], ensure_ascii=False), 400)
    ctx = doc.get("original_context") or {}
    if isinstance(ctx, dict) and ctx.get("id"):
        out["ctx"] = {k: ctx.get(k) for k in ("id", "parent_id", "user_id") if ctx.get(k)}
    trace = _trace_of(doc)
    if trace:
        out["trace"] = trace
    prov = _prov_of(doc)
    if prov:
        # fuori dal trace: c'e' per ogni notifica, il trace solo con debug: true
        out["prov"] = prov
    return out


def run_detail(path, wanted):
    """Trova il file dell'id (nome = <data>_<uuid>.json) e ne stampa il dettaglio."""
    result = {"ok": False}
    if not ID_RE.match(wanted or ""):
        result["error"] = "id non valido"
        return result
    wanted = wanted.lower()
    try:
        with os.scandir(path) as it:
            matches = [(e.path, e.stat().st_mtime) for e in it
                       if e.is_file() and e.name.endswith(".json") and "_" in e.name
                       and e.name.split("_", 1)[1].lower().startswith(wanted)]
    except OSError as err:
        result["error"] = f"cartella archivio non leggibile: {err}"
        return result
    if not matches:
        result["error"] = "notifica non piu' in archivio"
        return result
    matches.sort(key=lambda x: x[1], reverse=True)
    file_path, mtime = matches[0]
    try:
        with open(file_path, encoding="utf-8") as fh:
            doc = json.load(fh)
        if not isinstance(doc, dict):
            raise TypeError("non e' un oggetto JSON")
    except Exception as err:
        result["error"] = f"file illeggibile: {err}"
        return result
    try:
        result["n"] = detail_of(doc, mtime)
    except Exception as err:
        result["error"] = f"dettaglio non leggibile: {err}"
        return result
    result["ok"] = True
    return result


def main():
    # I titoli sono pieni di emoji: senza questo, su una console non UTF-8
    # (Windows cp1252) il print finale muore con UnicodeEncodeError.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--path", default=os.environ.get("SN_ARCHIVE_PATH", DEFAULT_PATH))
    ap.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    ap.add_argument("--message-chars", type=int, default=DEFAULT_MESSAGE_CHARS)
    ap.add_argument("--max-bytes", type=int, default=MAX_BYTES,
                    help="oltre questa dimensione si sacrifica `sp` (test: abbassarlo)")
    ap.add_argument("--detail", default=None,
                    help="stampa il dettaglio di una sola notifica (id o suo prefisso)")
    args = ap.parse_args()

    if args.detail is not None:
        try:
            out = run_detail(args.path, args.detail.strip())
        except Exception as err:  # noqa: BLE001 - la card deve sempre ricevere JSON
            out = {"ok": False, "error": f"errore interno: {err}"}
        print(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
        return 0

    result = {"count": 0, "generated": datetime.now().astimezone().isoformat(timespec="seconds"),
              "total_files": 0, "oldest": None, "items": []}
    try:
        with os.scandir(args.path) as it:
            files = [(e.path, e.stat().st_mtime) for e in it
                     if e.is_file() and e.name.endswith(".json")]
    except OSError as err:
        result["error"] = f"cartella archivio non leggibile: {err}"
        print(json.dumps(result, ensure_ascii=False))
        return 0

    files.sort(key=lambda x: x[1], reverse=True)
    result["total_files"] = len(files)
    if files:
        result["oldest"] = datetime.fromtimestamp(files[-1][1]).astimezone().isoformat(timespec="seconds")

    errors = 0
    chan_pool, scen_pool = Pool(), Pool()
    for path, mtime in files[: max(1, args.limit)]:
        try:
            with open(path, encoding="utf-8") as fh:
                doc = json.load(fh)
            if not isinstance(doc, dict):
                raise TypeError("non e' un oggetto JSON")
            result["items"].append(_item_of(doc, mtime, args.message_chars, chan_pool, scen_pool))
        except Exception:
            # un file corrotto non deve far sparire tutto l'indice: qualsiasi errore su
            # UN file (anche AttributeError su un campo di tipo inatteso) lo salta e basta
            errors += 1
    result["chan"] = chan_pool.names
    result["scen"] = scen_pool.names
    result["count"] = len(result["items"])
    if errors:
        result["unreadable"] = errors

    # Freno di sicurezza sul peso. Gli attributi di un sensore devono stare
    # sotto ~16 KB: il contenuto varia (un giorno di messaggi lunghi puo'
    # sforare da solo), quindi se si supera la soglia si sacrifica per primo
    # `sp` — il testo pronunciato — partendo dalle notifiche piu' vecchie,
    # che e' l'informazione meno urgente. Meglio un indice completo con
    # qualche `sp` in meno che un sensore che esplode.
    def weigh():
        # in BYTE, non in caratteri: accenti ed emoji dei titoli pesano 2-4x
        return len(json.dumps(result, ensure_ascii=False,
                              separators=(",", ":")).encode("utf-8"))

    dropped = 0
    for item in reversed(result["items"]):
        if weigh() <= args.max_bytes:
            break
        if item.pop("sp", None) is not None:
            dropped += 1
    if dropped:
        result["sp_dropped"] = dropped

    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
