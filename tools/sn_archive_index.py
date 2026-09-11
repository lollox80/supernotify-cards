#!/usr/bin/env python3
"""
sn_archive_index.py - indice compatto dell'archivio SuperNotify per Home Assistant.

CHANGELOG
  2026-09-11 (Cowork) - Prima versione. Legge i file JSON scritti da SuperNotify in
    /config/supernotify/archive e stampa su stdout un JSON con le ultime N notifiche,
    ridotte all'essenziale. Serve al sensore command_line "SuperNotify archivio"
    (packages/supernotify/archivio.yaml), che ne mette il risultato negli attributi:
    da li' la card supernotify-archive-card mostra lo storico senza esporre nessun file.
    E' un PONTE: quando SuperNotify avra' un servizio nativo (enquire_archive) la card
    passera' a quello e questo script si potra' togliere.

Uso:  python3 sn_archive_index.py [--limit N] [--path DIR] [--message-chars N]
Output: {"count", "generated", "total_files", "oldest", "items": [...]}
Non solleva mai: in caso di errore stampa un JSON con "error" e count 0, cosi' il
sensore resta valido e il problema si legge dall'attributo.
"""

import argparse
import json
import os
import sys
from datetime import datetime

DEFAULT_PATH = "/config/supernotify/archive"
# Il sensore tiene tutto negli attributi di stato: oltre ~16 KB Home Assistant
# comincia a soffrire (DB e WebSocket), quindi si resta volutamente stretti.
DEFAULT_LIMIT = 40
DEFAULT_MESSAGE_CHARS = 130


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
            if raw:
                key = str(raw).upper()
                out.append([idx, "s", REASONS.get(key, str(raw)[:18].lower())])
            else:
                out.append([idx, "s"])
    return out


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
    return item


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
    args = ap.parse_args()

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
            result["items"].append(_item_of(doc, mtime, args.message_chars, chan_pool, scen_pool))
        except (OSError, ValueError, TypeError):
            errors += 1  # un file corrotto non deve far sparire tutto l'indice
    result["chan"] = chan_pool.names
    result["scen"] = scen_pool.names
    result["count"] = len(result["items"])
    if errors:
        result["unreadable"] = errors
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
