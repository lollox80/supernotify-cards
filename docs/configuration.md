# Common options

[← SuperNotify Cards](../README.md)

## Options every card accepts

| Option | What it does |
|---|---|
| `style: theme` | Follow the Home Assistant theme instead of the SuperNotify colours |
| `intro: <text>` | An info banner at the top of the card (HTML allowed) |
| `language: it` / `en` | Pin the language; by default the card follows Home Assistant |
| `show_version: true` | Show the card's version at the bottom (hidden since 0.49.0) |
| `icons: emoji` | Keep the emoji the cards used before 0.50.0 instead of Home Assistant icons |

Italian and English are built in; any other language falls back to English.

## Which SuperNotify version each feature needs

| Feature | SuperNotify |
|---|---|
| All cards | 2.0 or later |
| Composer: native target picker, `supernotify.notify` action | 2.3 |
| Live scenario state (control, scenarios, overview) | 2.4 |
| Delivery and transport switches | 2.8 |
| Archive and Why? without the command_line bridge (`enquire_archive`) | 2.10 |
| Notification without text (composer) | 2.11.1 |
| "Try without sending" (dry run) | 2.12 |

The automations card works with any version but needs its manifest generator
(`tools/genera_vista_automazioni.py`), see [its page](cards/automations.md).

## Versions
The bundle has one release version (HACS, this repo's tags) and **each card has its own
version**, shown in its footer with `show_version: true` and bumped only when that card changes. A card footer that
says `v0.16.0` while the bundle is at `0.22.0` simply means that card has not changed since
0.16.0. `tools/check_card_versions.py` (run in CI) fails when a card's code changes without a
bump in `SN_CARD_VERSIONS`.
