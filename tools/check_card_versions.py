#!/usr/bin/env python3
"""
check_card_versions.py — fail when a card changed without bumping its version.

The bundle dist/supernotify-control-card.js holds every card; each card has its
own entry in SN_CARD_VERSIONS. This script splits the bundle into per-card
regions (from one `class SupernotifyXxxCard` to the next), compares each
region with the same region in a git base (default: HEAD, i.e. the last
commit) and exits 1 when the code of a card changed but its version did not.

Shared helpers (everything before the first card class) are reported as
"shared" for information only: a change there is not attributed to any card.

usage: python3 tools/check_card_versions.py [--base <git-ref>] [--file dist/supernotify-control-card.js]
"""
import argparse, hashlib, re, subprocess, sys

CLASS_RE = re.compile(r"^class Supernotify(\w+)Card extends HTMLElement", re.M)
VER_RE = re.compile(r"const SN_CARD_VERSIONS = \{(.*?)\};", re.S)


def regions(text):
    out = {}
    marks = [(m.start(), m.group(1).lower()) for m in CLASS_RE.finditer(text)]
    if not marks:
        return {"shared": text}
    out["shared"] = text[: marks[0][0]]
    for i, (pos, name) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        out[name] = text[pos:end]
    return out


def versions(text):
    m = VER_RE.search(text)
    if not m:
        return {}
    return dict(re.findall(r"(\w+):\s*\"([^\"]+)\"", m.group(1)))


def h(s):
    return hashlib.sha1(s.encode("utf-8")).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="HEAD")
    ap.add_argument("--file", default="dist/supernotify-control-card.js")
    a = ap.parse_args()
    try:
        old = subprocess.check_output(["git", "show", f"{a.base}:{a.file}"], stderr=subprocess.DEVNULL).decode("utf-8")
    except subprocess.CalledProcessError:
        print(f"no {a.file} at {a.base}: nothing to compare"); return 0
    new = open(a.file, encoding="utf-8").read()
    ro, rn = regions(old), regions(new)
    vo, vn = versions(old), versions(new)
    if not vn:
        print("SN_CARD_VERSIONS not found in the new bundle"); return 1
    bad, changed = [], []
    for name, body in rn.items():
        if name == "shared":
            if h(ro.get("shared", "")) != h(body):
                changed.append("shared helpers (not attributed to a card)")
            continue
        if h(ro.get(name, "")) != h(body):
            changed.append(name)
            if vo.get(name) == vn.get(name):
                bad.append(name)
    for c in changed:
        print(f"changed: {c}")
    if bad:
        print("ERROR: card code changed without a version bump in SN_CARD_VERSIONS: " + ", ".join(bad))
        return 1
    print("card versions OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
