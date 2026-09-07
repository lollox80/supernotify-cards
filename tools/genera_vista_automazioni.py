# -*- coding: utf-8 -*-
"""Generate the manifest for supernotify-automations-card (and, optionally,
a static "Automations" dashboard view as a starting point).

Home Assistant does not expose the config of YAML/package automations (they
have no numeric `id` unless one was set explicitly), so this script scans
your automations.yaml / packages/*.yaml on disk, finds the ones that call
notify.supernotify, resolves their real entity_id (via the entity registry
when the automation has an explicit `id:`, otherwise by slugifying its
alias the same way Home Assistant does) and writes:

  config/www/supernotify/automations.json
      -> manifest read live by supernotify-automations-card at
         /local/supernotify/automations.json

  examples/dashboard_supernotify.yaml   (optional, only if DASHBOARD_STORAGE
      exists) -> a starting-point "Automations" view you can paste into a
      dashboard's raw YAML editor and adapt.

Re-runnable: whenever you add/remove/rename automations that use
SuperNotify, rerun this script and the manifest (and optionally the view)
are refreshed.

Setup — edit the constants right below before running:
  HA_CONFIG_DIR   path to your Home Assistant config directory
  CATEGORIES      how to group your own automations in the manifest/view;
                   the defaults below are just examples — replace the
                   patterns with prefixes that match your own automation
                   file names or aliases.

Usage:  python tools/genera_vista_automazioni.py
"""
import json
import re
import unicodedata
from pathlib import Path

import yaml

# ---------------------------------------------------------------- settings
# Path to your Home Assistant config directory (where automations.yaml,
# packages/ and .storage/ live). Adjust for your setup.
HA_CONFIG_DIR = Path(r"/config")

# Categories used to group automations in the manifest and the optional
# dashboard view. Each entry is (label, tuple-of-prefixes-to-match against
# the source file name, or the literal "automations.yaml"). Replace these
# examples with patterns that match your own automations/packages.
CATEGORIES = [
    ("🏠 Security", ("security_", "door_", "window_", "alarm_")),
    ("🌡️ Climate", ("climate_", "temperature_")),
    ("🔌 Devices", ("device_", "battery_")),
    ("🖥️ System", ("system_", "update_", "network_")),
]

WORKSPACE = Path(__file__).resolve().parent.parent
OUT_YAML = WORKSPACE / "examples" / "dashboard_supernotify.yaml"
DASHBOARD_STORAGE = HA_CONFIG_DIR / ".storage" / "lovelace.dashboard_supernotify"
ENTITY_REGISTRY = HA_CONFIG_DIR / ".storage" / "core.entity_registry"
MANIFEST = HA_CONFIG_DIR / "www" / "supernotify" / "automations.json"

# ---------------------------------------------------------------- YAML loader
class HALoader(yaml.SafeLoader):
    """SafeLoader that ignores HA's custom tags (!include, !secret, !input...)."""

def _ignore(loader, tag_suffix, node):
    return None

HALoader.add_multi_constructor("!", _ignore)

def load_yaml(path):
    try:
        with open(path, encoding="utf-8") as f:
            return yaml.load(f, Loader=HALoader)
    except Exception as e:
        print(f"  ! skip {path.name}: {e}")
        return None

# ---------------------------------------------------------------- slugify HA
def slugify(text):
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-z0-9]+", "_", text.lower())
    return text.strip("_")

# ------------------------------------------------------------------ collect
def collect_automations():
    """Return a list of {alias, id, source} dicts for automations that
    reference supernotify anywhere in their config (service call target,
    delivery override, …)."""
    found = []

    def scan_list(lst, source):
        for auto in lst or []:
            if not isinstance(auto, dict):
                continue
            blob = json.dumps(auto, default=str)
            if "supernotify" in blob:
                found.append({
                    "alias": auto.get("alias", "(no alias)"),
                    "id": auto.get("id"),
                    "source": source,
                })

    data = load_yaml(HA_CONFIG_DIR / "automations.yaml")
    if isinstance(data, list):
        scan_list(data, "automations.yaml")

    packages_dir = HA_CONFIG_DIR / "packages"
    if packages_dir.is_dir():
        for pkg in sorted(packages_dir.glob("*.yaml")):
            data = load_yaml(pkg)
            if not isinstance(data, dict):
                continue
            for key, val in data.items():
                if key == "automation" or key.startswith("automation "):
                    if isinstance(val, list):
                        scan_list(val, pkg.name)
    return found

def resolve_entity_ids(autos):
    """id -> entity_id via the entity registry; otherwise slugify(alias)."""
    if not ENTITY_REGISTRY.exists():
        for a in autos:
            a["entity_id"] = "automation." + slugify(a["alias"])
        return autos
    reg = json.loads(ENTITY_REGISTRY.read_text(encoding="utf-8"))
    by_unique = {
        e["unique_id"]: e["entity_id"]
        for e in reg["data"]["entities"]
        if e.get("platform") == "automation"
    }
    for a in autos:
        if a["id"] and a["id"] in by_unique:
            a["entity_id"] = by_unique[a["id"]]
        else:
            a["entity_id"] = "automation." + slugify(a["alias"])
    return autos

def categorize(source):
    for name, patterns in CATEGORIES:
        for p in patterns:
            if source.startswith(p) or source == p:
                return name
    return "📦 Other"

# ------------------------------------------------------------------- view
def build_view(autos):
    """Compact view: one entities card with a fold-entity-row per category.
    Requires the fold-entity-row custom card (HACS)."""
    groups = {}
    for a in sorted(autos, key=lambda x: x["alias"].lower()):
        groups.setdefault(categorize(a["source"]), []).append(a)

    order = [c[0] for c in CATEGORIES] + ["📦 Other"]
    folds = []
    for cat in order:
        if cat not in groups:
            continue
        rows = [{
            "entity": a["entity_id"],
            "name": a["alias"],
            "secondary_info": "last-triggered",
        } for a in groups[cat]]
        folds.append({
            "type": "custom:fold-entity-row",
            "head": {"type": "section", "label": f"{cat} ({len(rows)})"},
            "padding": 8,
            "entities": rows,
        })
    sections = [{
        "type": "grid",
        "cards": [
            {"type": "heading", "heading": "🤖 Automations using SuperNotify"},
            {"type": "markdown", "content": (
                f"**{len(autos)} automations** send notifications via "
                "`notify.supernotify`, grouped by category: tap a category "
                "to expand it. Toggle = enable/disable; below the name, the "
                "last time it fired.\n\n"
                "ℹ️ View generated by `tools/genera_vista_automazioni.py` — "
                "rerun the script after adding automations."
            )},
            {"type": "entities", "entities": folds},
        ],
    }]
    return {
        "title": "Automations",
        "path": "automazioni",
        "icon": "mdi:robot",
        "type": "sections",
        "max_columns": 1,
        "sections": sections,
    }

# ---------------------------------------------------------------- manifest
def write_manifest(autos):
    """JSON manifest for supernotify-automations-card (served from /local/)."""
    import datetime
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated": datetime.datetime.now(datetime.timezone.utc)
                     .isoformat(timespec="seconds"),
        "automations": [
            {"e": a["entity_id"], "n": a["alias"],
             "c": categorize(a["source"]), "s": a["source"]}
            for a in sorted(autos, key=lambda x: x["alias"].lower())
        ],
    }
    MANIFEST.write_text(json.dumps(payload, ensure_ascii=False, indent=1),
                        encoding="utf-8")
    print(f"Manifest: {MANIFEST} ({len(payload['automations'])} automations)")

# ------------------------------------------------------------------- main
def main():
    autos = collect_automations()
    autos = resolve_entity_ids(autos)
    print(f"Found {len(autos)} automations using notify.supernotify")
    write_manifest(autos)

    if not DASHBOARD_STORAGE.exists():
        print(f"(skipping dashboard view: {DASHBOARD_STORAGE} not found)")
        return

    dash = json.loads(DASHBOARD_STORAGE.read_text(encoding="utf-8"))
    cfg = dash["data"]["config"]
    view = build_view(autos)
    views = cfg.get("views", [])
    for i, v in enumerate(views):
        if v.get("path") == "automazioni":
            views[i] = view
            break
    else:
        views.append(view)

    class D(yaml.SafeDumper):
        pass

    def str_presenter(dumper, s):
        if "\n" in s or len(s) > 90:
            return dumper.represent_scalar("tag:yaml.org,2002:str", s, style=">")
        return dumper.represent_scalar("tag:yaml.org,2002:str", s)

    D.add_representer(str, str_presenter)
    OUT_YAML.parent.mkdir(exist_ok=True)
    OUT_YAML.write_text(
        yaml.dump(cfg, Dumper=D, allow_unicode=True, sort_keys=False, width=100),
        encoding="utf-8",
    )
    print(f"Written {OUT_YAML} ({len(views)} views)")
    for a in autos[:5]:
        print(f"  e.g. {a['entity_id']}  <-  {a['source']}")

if __name__ == "__main__":
    main()
