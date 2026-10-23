# Common options

[← SuperNotify Cards](../README.md)

## Visual editor

Since 0.55.0 every card has a visual editor: **Add card** or **Edit card** shows a form for the
common options (entity pickers, switches, numbers), with colours, icons, version and intro
under "Look and text". Options a form cannot express (control tiles and groups, time bands,
scenario groups) are edited in the code editor; the form keeps them.

## Options every card accepts

| Option | What it does |
|---|---|
| `style: theme` | Follow the Home Assistant theme instead of the SuperNotify colours |
| `intro: <text>` | An info banner at the top of the card (HTML allowed) |
| `language: de` | Pin the language (`en`, `it`, `de`, `es`, `fr`, `nl`, `pl`, `pt`, `ja`, `zh`, `hi`); by default the card follows Home Assistant |
| `show_version: true` | Show the card's version at the bottom (hidden since 0.49.0) |
| `icons: emoji` | Keep the emoji the cards used before 0.50.0 instead of Home Assistant icons |

Eleven languages are built in, the same as SuperNotify's own: English, Italian, German, Spanish, French, Dutch,
Polish, Portuguese, Japanese, Simplified Chinese and Hindi. Any other language falls back to English. Where the
cards and SuperNotify talk about the same thing (priority, scenario, transport, recipient, outcomes), they use
the words of SuperNotify's own translation. Corrections are welcome as issues or pull requests.

## Which SuperNotify version each feature needs

Since 1.0.0 the cards need **SuperNotify 2.13 or later** and **Home Assistant 2026.2 or later**; the
code for older versions is gone (the archive's command_line sensor and shell_command, the stats
helpers and utility meter, the version checks). On an older SuperNotify stay on release 0.92.0.

| Feature | SuperNotify |
|---|---|
| All cards | 2.13 or later |
| Live scenario state without polling (`scenario_control: {refresh: true}`; with refresh off the cards ask `enquire_active_scenarios` every 30 s) | 2.13 |
| Channels: how the last send went (`last_outcome`), Critical / High filters in one call (`enquire_archive` `priority`) | 2.14 |

The automations card works with any version but needs its manifest generator
(`tools/genera_vista_automazioni.py`), see [its page](cards/automations.md).

## Versions
The bundle has one release version (HACS, this repo's tags) and **each card has its own
version**, shown in its footer with `show_version: true` and bumped only when that card changes. A card footer that
says `v0.16.0` while the bundle is at `0.22.0` simply means that card has not changed since
0.16.0. `tools/check_card_versions.py` (run in CI) fails when a card's code changes without a
bump in `SN_CARD_VERSIONS`.
