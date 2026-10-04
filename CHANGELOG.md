# Changelog

All notable changes to **supernotify-control-card** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.63.0] - 2026-10-04

Who is home, SuperNotify's repairs, the detail of channels and transports, and the rest of the composer.

### Added
- overview-card / control-card: **who is home for SuperNotify** (`enquire_occupancy`), the people and
  the occupancy its conditions see. `occupancy: false` hides it.
- overview-card: **SuperNotify's repairs** in the health list (admin users), with their title and a
  link to Settings › Repairs. `repairs: false` leaves them out.
- transports-card: when the last error happened and in which step; **tap a row** for the defaults
  (action, targets, priorities, options in plain words).
- deliveries-card: **tap a row** for transport, action, targets, options and data; **All attributes ›**
  opens Home Assistant's dialog.
- control-card: pauses show **why they were set** (by hand, by voice, by the assistant); users who
  are **not admin** pause through SuperNotify's voice commands (their own pauses). `snooze_via`
  forces one way.
- composer-card: text for email (`message_html`), video clip URL, **buttons** (`actions`,
  `action_groups`) and **per-channel settings** (`delivery_control`).

### Changed
- archive-card: what a voice channel said is recognised from SuperNotify's data, not from the
  channel's name, and named after that channel.
- deliveries-card / transports-card: a tap opens the detail instead of the attributes dialog.

### Fixed
- composer-card: the picture URL field had no input style.

## [0.62.0] - 2026-10-04

A tools card, a test button for each person, and the composer's advanced options.

### Added
- **supernotify-tools-card** (new): refresh entities, resume every pause, clean the archive and the
  pictures older than N days, undo the changes made by hand (all or one kind), each with its result
  on the same row. Every `enquire_*` question as a chip, with the answer as a readable tree and
  Copy JSON. Explains the 2.12.0 configuration error (#241).
- recipients-card: **Send a test** button, sends a short notification to that person only (second tap to
  confirm), and the **device list** (name, maker, model, system, app version) behind the devices chip.
- composer-card: **Advanced** section with spoken message, apply / require / constrain scenarios,
  snapshot URL and debug.

### Changed
- Icons: 🗂 and ↩ are now drawn as MDI icons like the others.

## [0.61.0] - 2026-10-04

Pause what you want, and see a notification as soon as it is done.

### Added
- control-card: the snooze tile opens a **pause panel**. Pause non-critical notifications, everything,
  one channel or one priority, for everyone or only you, for 15 minutes to 4 hours or until you
  resume. The panel lists the pauses in force, each with **Resume**, plus **Resume everything**.
  It uses the same `mobile_app_notification_action` event as the buttons of a push notification
  (SNOOZE, SILENCE, NORMAL). `snooze_panel: false` keeps the one-tap snooze.
- **Live updates**: the cards listen to SuperNotify's `supernotify_notification` event (2.10.3+), so
  archive, why, overview and control show a notification as soon as it is done - also one that
  nothing delivered, which the notifications counter does not count. Admin users only; the others
  keep the usual polling.
- why-card: **who sent it** (the automation or script, from the logbook, or the person), how long it
  took, the slowest channel and the share of channels that succeeded, the **targets no channel took**
  and **names that do not exist** in the call.

## [0.60.0] - 2026-10-04

Real data: what the cards show now matches what SuperNotify does.

### Fixed
- Active scenarios come from SuperNotify itself (`enquire_active_scenarios`, read every 30 s and right
  after a change made from a card). SuperNotify 2.12.0 can leave the scenario binary_sensors at their
  startup value, so the scenarios, overview and control cards could show the wrong scenarios as active.
- The last notification's title is shown again: SuperNotify keeps it in `condition_variables` and in
  each delivery, not at the top level of the notification.
- Overview "Failures" counts the channel sends that failed today (from the archive).
  `sensor.supernotify_failures` only counts crashes inside SuperNotify, so it stayed at 0 when a
  channel failed. Without the native archive the card still falls back to the sensor.
- Control: tiles and group pills toggle any domain - a `switch.*` do-not-disturb did nothing.
- Overview and composer list each channel once, by its name, also where the deprecated
  binary_sensor still exists next to the switch; the transports card counts "used by" over all of them.

## [0.59.2] - 2026-10-03

### Changed
- README: a link to this changelog and to the releases near the top, so it shows in HACS.

## [0.59.1] - 2026-10-03

Contrast checked on every text of every card, light and dark theme.

### Fixed
- The active row in the bands and scenarios cards was never highlighted: its colour was missing from
  the palette. It is now tinted green, with the "now" / "active now" badge on a solid background.
- Light theme: the green used for "delivered", "active now", "up to date" is a little darker
  (#17733d), so it passes WCAG AA (4.5:1) also on the green chips; it was 4.2-4.4:1.
- No more faded text where it fell under 4.5:1: the overview's health sentence, the version and
  "list updated" lines, the why card's skipped channels, the technical name in the scenarios card.

### Added
- `tools/contrast_audit.mjs`: measures the contrast of every text of the 13 cards in both themes
  (same demo data as the screenshots). What is left on purpose: the decorative "▾" and disabled
  rows, which WCAG does not require to meet contrast.

## [0.59.0] - 2026-10-03

Design review, part 2: finishing touches.

### Changed
- bands-card 0.20.0: one line per band - name and "until 13:00", start time, volume slider and
  percent - about 40% shorter. On a narrow card the name goes on its own line.
- scenarios-card: a manual scenario's "Apply now" is a button ("Applied" while on), so every row
  has a single switch, the one that enables the scenario.
- control-card: the snooze tile reads "Snoozed · 25 min" with "garden · until 22:05" under it.
- transports-card: the readable name comes first (Alexa Media Player, Mobile app, Text to
  speech...), with the technical name and "used by 2 channels" under it.
- stats-card: the hour and weekday charts are drawn at their real width when side by side, so
  their labels stay readable (10.5 px, hours every 6); day periods use the band names.
- why-card: step 4 (channels) is stacked like the other steps.
- archive-card: scenarios in force by name, not by id.
- simulator-card: the reason sits next to the channel name on wide cards.
- Archive and why: times follow the time format chosen in the Home Assistant profile (12/24 h).

## [0.58.0] - 2026-10-03

Design review, part 1: the cards look like one family, and six visible defects are gone.

### Changed
- One rule for technical names in every card: small and monospaced, and hidden when it says the
  same as the readable name (no more "Email · email" or "Morning · morning"). The transport in the
  channels card follows the same rule.
- Channels, transports, recipients and scenarios: a thin line between rows instead of a bottom
  border bent by the row's rounded corners.
- Stats-card number tiles are filled like the overview's, without a border.
- Archive: priority uses the same colours as the stats card - critical red, high orange, medium
  blue, low grey.

### Fixed
- Archive: "6 in the archive" when the total is not known, instead of "6 of ?".
- Why: "1 call" instead of "1 calls".
- Composer: "loading the picker…" instead of an orphan "…" under Target; it disappears if Home
  Assistant never provides the picker (the custom targets field still works).
- Stats: a channel with only errors shows "✖ 26" instead of "26 ✖26".
- Overview and stats: tile labels wrap instead of spilling out of the tile.
- Control: the last notification's title wraps to two lines (chips move below) instead of being cut
  with "…" in a narrow column.

## [0.57.0] - 2026-10-03

Fewer calls, a better card picker.

### Changed
- Cards on the same view share their reads of SuperNotify: control, overview, scenarios and
  simulator ask for the last notification, snoozes and active scenarios once between them (a
  request in flight or less than 2.5 s old is reused) instead of once each. A snooze, a clear or a
  send from the composer drops the shared copy and the other cards read again straight away.

### Added
- Card picker (**Add card**): every card shows a live preview and links to its documentation page.
- Starting configurations that fit any installation: the control card uses a do-not-disturb switch
  only if one exists, archive and why use SuperNotify's own archive (no sensor needed), and the
  bands card picks up helpers named like the README's (`input_datetime.…start_<band>` +
  `input_number.…<band>_volume`).
- bands-card with no bands shows how to add them instead of an error.

## [0.56.1] - 2026-10-03

Fixes seen on a real dashboard.

### Fixed
- overview-card 0.28.1: with `stats: full` the five numbers sit 3+2 (one row when the card is wide)
  instead of leaving an empty cell; four numbers sit 2+2.
- overview-card: a last notification without a title is shown as plain text, not as a bold headline,
  and is clamped to three lines instead of being cut mid-word.
- overview-card and control-card 0.29.1: markdown in the message (`[text](url)`, `**bold**`, `` `code` ``)
  is shown as plain text instead of the raw link.
- overview-card: space between the icon and the name in the active-scenario chips.

## [0.56.0] - 2026-10-03

One way to read the last notification.

### Changed
- overview-card 0.28.0: the last notification now looks like the control card's - title and message,
  coloured priority and "4 min ago" instead of a raw timestamp, channel counts ("2 delivered",
  "1 missed", "2 skipped") with the names in the tooltip, and **Why ›** when a why card is present.

### Added
- `last_notification: false` on the overview hides the block (and skips the
  `enquire_last_notification` call) when the control card already shows it. Also in the visual editor.

## [0.55.0] - 2026-10-03

Visual editor and a simulator that explains.

### Added
- Visual editor for every card: **Add card** / **Edit card** show a form drawn by Home Assistant
  (entity pickers, switches, numbers, dropdowns) for the common options, with a folded "Look and
  text" section (colours, icons, version, intro). Options a form cannot express (control tiles
  and groups, time bands, scenario groups) stay in the code editor, and the form keeps them.
  Labels in English and Italian.

### Changed
- simulator-card: one row per channel with the reason. *Would go out*: starts on its own,
  turned on by a scenario. *Would not go out*: turned off by a scenario, only when named in the
  call, only with a scenario, backup, switched off.

## [0.54.0] - 2026-10-03

Polish after the redesign.

### Fixed
- Singular and plural: "1 channel off", "1 failure", "1 device", "1 skipped by a rule" instead
  of "1 channels off" and the like. In Italian the channel counts are masculine plural
  ("2 consegnati", "1 mancato"); the archive and the control card said "consegnata", "consegnate".

### Changed
- Readable names where the technical ones were left: simulator (scenarios and channels),
  scenarios card (channel tags), stats card (top channel and insights). The technical name is
  in the tooltip.
- Time bands: translated names ("Late night", "Notte fonda") and listed from the morning, with
  the band that starts after midnight last (bands card and control status bar).
- Archive card: priorities capitalised in English too; the notification id left the details
  (it is in the row's tooltip).

## [0.53.1] - 2026-10-03

### Fixed
- composer-card (0.17.1) and automations-card (0.18.1) still showed their version (composer
  footer, automations header), missed by 0.49.0's `show_version`.

### Docs
- New screenshots of every card in the README and in `docs/cards`, showing the redesign
  (0.49.0 to 0.53.0), from a demo installation with invented data.
- `tools/showcase.mjs` makes them again: headless Chromium, Home Assistant icons drawn from
  `@mdi/js`, light and dark theme.

## [0.53.0] - 2026-10-03

Fifth and last step of the redesign: the why-card answers first, the details come on demand.

### Changed
- why-card (0.9.0): under the title, the path in four steps: the call (channels named, or
  normal routing), the scenarios in force, who was home, the channels (sent / to look at /
  skipped).
- Problems first: a failed channel (red) or one asked for but not sent (orange) gets its own
  box with the reason and what to do about it. "Asked for but not sent" is a skip whose reason
  is not a routine one (snooze, presence, priority, condition, scenario, switched off).
- Then the channels that went out. Routine skips, channels not involved and the full selection
  trace are folded; `expand: true` opens them.

## [0.52.1] - 2026-10-03

### CI
- HACS validation action (`hacs/action`, category plugin) on every push and weekly; repository
  description and topics set. Released after the validation passed, as the HACS default store
  requires. No card changed.

## [0.52.0] - 2026-10-03

Fourth step of the redesign: the control and overview cards.

### Changed
- control-card (0.27.0): the status bar is one line of text; tiles have the icon on the left
  and one colour logic (on = blue tint, needs attention = orange tint), two per row on a phone
  (`tile_layout: stacked` keeps the old tall tiles); the last notification shows counts
  (delivered, failed, missed, skipped, with the channel names in the tooltip;
  `last_channels: true` keeps one chip per channel) and a "Why ›" button when a why-card is on
  the dashboard.
- overview-card (0.25.0): health is one sentence on top ("2 things to look at", or "All good"
  with how many channels are on) and a list of what to look at, each with its detail (which
  channels are off, by readable name; the transport's last error) and an "Open" link where
  there is one (`health: chips` keeps the old chips). Three numbers instead of five
  (`stats: full` keeps all five).

### Fixed
- control-card: the text under an active snooze tile was white on the light orange tint (0.49.0).

## [0.51.0] - 2026-10-03

Third step of the redesign: the deliveries card says how each channel starts and what it is doing now.

### Changed
- deliveries-card (0.24.0): channels grouped by how they start (on their own, only when named
  in the call, only with a scenario, backup), each group with its count, instead of the same
  "always on" tag on every row. Header "Channels · 7 of 8 on".
- One status line per channel: switched off, transport off, "paused now by <scenario>" when an
  active scenario turns it off, "on now through <scenario>" for a scenario-only channel.
  Switched-off rows are dimmed; the other tags are quieter.
- "Reset overrides" is a real button at the bottom. New options `title:` and `group: false`.

## [0.50.0] - 2026-10-03

Second step of the redesign: Home Assistant icons instead of emoji.

### Changed
- The emoji the cards used (channels, scenarios, tiles, chips, section headings, outcome signs,
  about 80 of them) are now Home Assistant icons (`ha-icon`, Material Design Icons): the same
  drawing on iOS, Android and Windows, in the theme's text colour, at the size the emoji had.
  `icons: emoji` on a card keeps the old look. Emoji you wrote yourself in a card's config
  stay as they are; `mdi:...` icons in the config already worked and still do.
- Priority colours follow the palette: "High" in the control and overview cards was `#f0a020`
  (2.2:1 on white), now the same readable warning colour as the rest.
- "Critica ⚠️" and "Inviata 🚀" lost their emoji.

## [0.49.0] - 2026-10-03

First step of the redesign: the same colours and the same signs in every card.

### Changed
- One palette for all 13 cards instead of 13 diverging copies. The light theme now passes WCAG
  AA for text on the card: blue `#0277bd` instead of `#03a9f4` (2.6:1, also under white text),
  warning `#a04f00`, success `#1b7f45`, error `#c62828`, secondary text `#5b6b7c`. In the dark
  theme text on a blue fill is dark. `style: theme` still takes every colour from Home
  Assistant.
- The readable name of a channel (its `alias`) comes first in the deliveries, why, archive and
  composer cards; the technical name is small and monospaced next to it, or in a tooltip.
- why-card: a channel skipped by a rule (snooze, scenario, no target) is grey: it is normal.
  Orange is for missed, red for failed, as in the control card's last notification, whose
  "missed" chip is now orange too.
- control-card: an active snooze tile is a tinted surface, not white text on orange.
- The card version at the bottom of every card is hidden; `show_version: true` shows it.

## [0.48.5] - 2026-10-03

### Docs
- Short README for HACS: what the cards do, who they are for, install, quick start, one line per
  card. Each card's options and examples moved to its own page in `docs/cards/`, common options
  and required SuperNotify versions to `docs/configuration.md`.
- Released so that HACS shows the new README: HACS reads the README of the latest release, not
  of the main branch. No card changed.

## [0.48.4] - 2026-10-03

### Added
- README: screenshots of every card from a demo installation, a "cards at a glance" table, a
  dark-theme picture and a section for the transports card (images in `docs/images`, linked
  with absolute URLs so HACS shows them).

### Fixed
- archive-card (0.31.1): skip reasons on the rows follow the UI language (an English dashboard
  showed the Italian "pausa", "nessun target"), and priorities are translated in Italian.

## [0.48.3] - 2026-10-03

### Changed
- composer-card (0.15.3): camera names instead of entity ids in the picker and the preview; the
  preview shows the "📷 <camera>" text that goes out when the message is empty; the dry-run box
  shows scenario names as the why-card does.

## [0.48.2] - 2026-10-03

### Fixed
- composer-card (0.15.2): a notification with a camera and no text gets "📷 <camera name>" as its
  text. SuperNotify sends a photo-only push with `message: ""`, and the Android companion app
  showed nothing on the phone.

## [0.48.1] - 2026-10-03

### Fixed
- composer-card (0.15.1): the "Try without sending" button showed as soon as HACS had downloaded
  SuperNotify 2.12, before Home Assistant was restarted, and failed with "An action which does not
  return responses can't be called with return_response=True". It now follows what Home Assistant
  is running (the `supernotify.notify` description says whether it can answer), and that error is
  explained as "restart needed".

## [0.48.0] - 2026-10-03

### Changed
- **composer-card (0.15.0): "Try without sending" uses SuperNotify 2.12's dry run.** 2.12 has
  no separate action: it is `supernotify.notify` with `dry_run: simulate`, answering with the
  notification itself (the archive JSON). The button shows on SuperNotify 2.12 or later
  (`update.supernotify_update`, or `dry_run: true`), and the answer shows the channels that
  would send and to whom, skipped ones with the reason, missed channels, priority, scenarios
  and who is home.
- The dry run carries `force_resend` by default: on 2.12.0-beta1 a simulated notification is
  written into the duplicate cache, so the real Send right after would be dropped as a
  duplicate. `dry_run_dupe_check: true` simulates the duplicate check and makes the next Send of
  the same content carry `force_resend`.

### Removed
- `dry_run_action:` (the action name guessed in 0.44.0, never released upstream).

## [0.47.0] - 2026-10-03

Lighter, and checked on a phone-sized screen in both themes.

### Changed
- **Cards redraw only when something they show changed.** control, overview, bands,
  deliveries, transports, recipients, scenarios and automations used to rescan every state and
  rebuild their lists on every state change in the house (a temperature sensor included). Now
  each card notes which entities it looked at and redraws when one of them changes, when the
  entity list changes (cards that scan it), on language / theme / entity registry / services
  changes, and once a minute for relative times. In a test, 20 updates of an unrelated sensor
  caused 0 redraws (before: 20).
- **composer-card (0.14.0)**: a notification can go out without text (SuperNotify 2.11.1) when
  a camera or a channel is picked; on older SuperNotify it says 2.11.1 is needed. Errors from
  the action are shown instead of always "Sent".
- **`getGridOptions()`** on every card, so sections dashboards give them a sensible size
  (lists half width, composer / simulator / stats / archive / why full width). A card's own
  `grid_options:` still wins.

### Fixed
- **Dark theme**: native controls (the time pickers of the bands card, selects, scrollbars)
  follow the Home Assistant theme (`color-scheme`): their icons were dark on dark.
- **Phone**: stats-card (0.23.0) charts are drawn at the card's width, so the labels are about
  9 px instead of ~5 px on a 390 px screen, with fewer day labels when narrow; redrawn on resize.
- control-card (0.24.0): snooze tile shortened to "subject · end time".
- overview (0.22.0), scenarios (0.19.0) and simulator (0.10.0) load their data as soon as they get
  `hass`; before, the overview showed "0 snoozed" and no last notification until the first 60 s
  poll. The overview's last notification shows missed channels and the translated priority.
- recipients-card (0.22.0): "2 h fa" was capitalised as "2 H Fa".

## [0.46.0] - 2026-10-03

Aligned with SuperNotify 2.11 / 2.11.1.

### Added
- **`missed` deliveries** (SuperNotify 2.11): a channel that was asked for but could not go out.
  archive-card (0.30.0) lists it next to delivered / failed / skipped, why-card (0.5.0) shows it
  in the header, and the control-card (0.23.0) last-notification block shows a "missed" chip.
  Archive rows carry it as `mi` (also written by `tools/sn_archive_index.py`).
- **What a snooze is about**: SuperNotify 2.11.1 can snooze by name or tag ("porch camera"),
  besides camera, channel, priority and transport. The control-card snooze tile and the
  overview-card (0.21.0) chip now say it (e.g. "Snoozed: 🏷️ porch"), with every snooze in the
  chip tooltip.

### Fixed
- Skip reason **`SNOOZED`** (the name SuperNotify uses) was shown raw: the cards looked for
  `SNOOZE`. `TRANSPORT_DISABLED`, `NO_SCENARIO`, `NO_ACTION`, `INVALID_ACTION_DATA` and
  `UNKNOWN` now have a text too, in the archive rows and in the why-card.
- Outcomes **`error`** and **`fallback_delivery`** are translated in the why-card (only
  `failed`, which SuperNotify does not write, was known).

### Changed
- archive-card "Problems only" and the why-card dot colour no longer flag routine skips
  (snooze, presence, priority, delivery condition, scenario, switched-off channel or transport,
  implicit channel with no target): on 2.11 `partial_delivery` means a channel was missed.
  Failures, missed channels, other skip reasons, duplicates and fallbacks still count.
  Shared helper `snArchiveProblem()`.

## [0.45.1] - 2026-09-26

### Fixed
- control-card (0.22.2) and overview-card (0.20.3): an **expired snooze was shown as one ending
  tomorrow** ("1078 min left, until 09:41" for a snooze that had ended at 09:41 the same
  morning). `supernotify.enquire_snoozes` returns only `HH:MM:SS` and keeps expired snoozes
  until the nightly housekeeping, and the card moved any end time already past to the next day.
  The new helper `snLiveSnoozes()` anchors the end on `snoozed_at` (next day only for a snooze
  that crosses midnight), drops the snoozes that are over, and uses full ISO timestamps when
  SuperNotify provides them.
- control-card: when clearing snoozes fails, the tile shows the error instead of
  "Snoozes cleared".

## [0.45.0] - 2026-09-25

### Changed
- archive-card (0.29.0), why-card (0.4.0) and recipients-card (0.21.0) read the archive through
  SuperNotify's own **`supernotify.enquire_archive`** action (SuperNotify 2.10.0) when Home
  Assistant has it. The command_line sensor, the automation, `shell_command.sn_archive_detail`
  and `tools/sn_archive_index.py` are no longer needed, and can be removed.
- One store is shared by every card on the page: the latest 40 notifications at first
  (`limit:`), then only the newest few each time `sensor.supernotify_notifications` changes
  (`trigger_entity:`).
- The rows and the detail are built in the card by a port of `sn_archive_index.py`, checked
  field by field against the script on 48 real archived notifications plus synthetic ones with
  errors, a full trace and suppressed channels, so both cards look exactly as before.
- On older SuperNotify, or with `source: sensor`, the cards keep using the bridge as before.

### Fixed
- The why-card shows "no longer in the archive" instead of a raw error when a notification was
  purged after the list was read.

## [0.44.0] - 2026-09-24

### Added
- composer-card (0.13.0): **Try without sending** button. Shows which channels would fire right
  now and to whom, which would be skipped and why, the active scenarios, and whether the
  notification would be suppressed or fall back, without sending anything. It uses SuperNotify's
  dry-run action (issue #218, not released yet): the button stays hidden until Home Assistant has
  `supernotify.enquire_dry_run` (or the action named with `dry_run_action:`).

## [0.43.4] - 2026-09-23

### Fixed
- why-card (0.3.2): `delivery_provenance` read from where SuperNotify 2.8 archives it (top level,
  every notification) as well as from the debug trace; the "selection trace" section is only drawn
  when a trace was archived, instead of an empty box; `call` and `recipient:<name>` are no longer
  shown as scenarios that would switch a channel off.

## [0.43.3] - 2026-09-22

### Fixed
- stats-card (0.22.1): the channel icon and the delivery alias are read from the delivery switch,
  falling back to the deprecated `binary_sensor`. They only read the `binary_sensor`, so on
  SuperNotify 2.8 with the deprecated mirrors removed the Statistics card showed the technical
  channel names and a default icon.

## [0.43.2] - 2026-09-22

### Fixed
- deliveries and transports cards: the **Reset overrides** button is found through the entity
  registry (platform `supernotify`, translation_key `reset_overrides`). With SuperNotify 2.8.0
  its entity_id follows the language Home Assistant was set up in, e.g.
  `button.supernotify_ripristina_override` in Italian, so the cards did not show it.

## [0.43.1] - 2026-09-22

### Changed
- why-card (0.3.1): opens the latest notification by itself (`auto_select: false` to wait for a
  pick), so it is never an empty box next to the archive.

## [0.43.0] - 2026-09-22

### Added
- archive-card (0.28.0) and why-card (0.3.0): optional `max_height` (any CSS length, e.g.
  `calc(100vh - 330px)`) keeps the list / the detail within the screen and scrolls inside, so two
  cards side by side end at about the same height.

### Changed
- bands-card (0.13.0): the bands flow into two columns when the card is wide.

## [0.42.0] - 2026-09-22

### Changed
- Layout uses the width the card gets, on a PC as on a phone: the lists of the recipients,
  transports, deliveries, scenarios, automations and archive cards flow into as many columns as
  fit the card (one on a phone or in a narrow section, two or three in a wide one).
- composer and stats cards fold their two-column parts on the card's own width (container
  queries), so they also fold in a narrow dashboard column on a desktop.
- stats-card: per-day labels thinned out on long windows; more room for channel names on
  narrow cards. deliveries-card: Reset overrides sits on the summary line.

## [0.41.1] - 2026-09-22

### Fixed
- overview-card (0.20.2): the active-scenario chips showed the raw `binary_sensor` entity_id;
  they show the scenario name again.

## [0.41.0] - 2026-09-22

### Added
- stats-card (0.21.0): 7 / 14 / 30 day switch in the header (`periods:` for other choices,
  `days:` for the default); the choice is remembered per browser. When recorder history is
  shorter than the window, the card says over how many days hours, channels and priorities were
  computed (the daily series comes from long-term statistics and covers the whole window).

## [0.40.1] - 2026-09-22

### Fixed
- why-card (0.2.0): the selection trace is only recorded when the notify call has `debug: true`;
  the note said diagnostics alone were enough.

### Added
- why-card: when the trace carries `delivery_provenance` (which source switched each delivery
  on or off, proposed upstream), "selected by" and the reasons of the channels that did not start
  come from it. `tools/sn_archive_index.py --detail` passes it through.

## [0.40.0] - 2026-09-22

### Added
- **New supernotify-why-card** (0.1.0): for one notification, the scenarios in force, who was
  home, what the call asked for, and for every channel whether it went out, why not, to which
  targets and what selected it; also the channels that did not start, with the reason
  reconstructed from the current configuration, and the full selection trace when the archive
  has it. Detail fetched on demand through `shell_command.sn_archive_detail`
  (`tools/sn_archive_index.py --detail`).
- recipients-card (0.19.0): last notification received by each recipient, from
  `notify.recipient_<name>` (SuperNotify 2.7.0), with the archive title; tap to open it in the
  Why? card.
- archive-card (0.26.0): a Why? link on an expanded row.

### Changed
- deliveries-card (0.19.0) and transports-card (0.17.0) ready for the delivery/transport switches
  of SuperNotify PR #207: one row per channel (switch preferred over the binary_sensor mirror),
  toggle through `switch.turn_on/off`, a "transport off" tag, and a Reset overrides button when
  `button.supernotify_reset_overrides` exists. Older SuperNotify keeps working as before.
- `tools/sn_archive_index.py`: a suppressed channel (e.g. a duplicate) now carries its reason.

## [0.30.1] - 2026-09-22

### Added
- **Manual scenarios (SuperNotify 2.7.0).** A scenario without conditions now has a read/write
  "Scenario manuale / Scenario Manual" `binary_sensor`: while it is on (and the scenario is
  enabled) the scenario applies, and its state is restored across restarts.
  - scenarios-card (0.17.0): such a scenario shows a "✋ manual" tag and a second switch,
    "apply now", which writes the binary_sensor state (how SuperNotify expects it to be driven
    from outside); the "enabled" switch is unchanged. Detection uses the entity registry
    `translation_key` (`scenario_manual`), with the translated name as fallback.
- Names also drop the "Scenario manuale / Scenario Manual" prefix.

## [0.30.0] - 2026-09-21

### Fixed
- **SuperNotify 2.7.0 switches.** From 2.7.0 (beta5+) every scenario and recipient has a real
  `switch.supernotify_{scenario,recipient}_<name>`; the recipient `binary_sensor` is only a
  deprecated mirror and the scenario `binary_sensor` exists only for scenarios with conditions,
  meaning "conditions hold now". The cards matched both domains, so:
  - recipients-card (0.18.0): each recipient was listed twice and the toggle wrote a fake state
    that no longer enables anything. Now one row per recipient, switch preferred, toggled with
    `switch.turn_on` / `switch.turn_off`;
  - scenarios-card (0.16.0): each scenario was listed twice and every enabled switch counted as
    "active now". Now one row per scenario (switch + condition sensor merged); "active now"
    needs conditions true **and** the scenario enabled;
  - control-card (0.22.1) and overview-card (0.20.1): active-scenario count skips disabled ones.
- Names drop the translated "SuperNotify Scenario / Recipient … abilitato" wrapping.

### Added
- scenarios-card: live on/off switch on each row (SuperNotify ≥ 2.7.0).

Older SuperNotify versions (binary_sensor only) keep working through fallbacks.

## [0.23.0] - 2026-09-11

### Added
- **New `supernotify-archive-card`** — the notification history. SuperNotify writes one JSON
  file per notification under `/config/supernotify/archive`, but a card cannot read the
  filesystem: `media_source` only serves audio/image/video (a signed URL for a `.json` returns
  404). So a small script (`tools/sn_archive_index.py`, shipped here) is run by a `command_line`
  sensor and publishes a compact index of the last 40 notifications (~8 KB) in the attributes of
  `sensor.supernotify_archivio`; the card reads those, so the data travels over the
  authenticated WebSocket and nothing is exposed under `/local`. Rows are grouped by day and
  show time, title, message, per-channel outcome (delivered / failed / skipped with reason),
  priority and duration; a row expands to the scenarios in force and the notification id.
  Free-text search and filters (all / problems only / today). i18n en/it.
  The index halves its size by sharing two lookup tables (`chan`, `scen`) that rows cite by
  position, and by omitting defaults (priority `medium`, outcome `success`, counters at zero).
  This is a **bridge**: when SuperNotify gains a native `enquire_archive` service the card will
  read that instead and the script can go. README documents the sensor and the recorder exclude.

## [0.22.0] - 2026-09-11

### Changed
- **Per-card versions.** Each card now has its own version (`SN_CARD_VERSIONS` in the
  bundle), bumped only when that card changes, and prints only that in its footer — so
  "v0.16.0" on the deliveries card means the card has not changed since 0.16.0 even if the
  bundle is newer. The bundle version (this changelog, the HACS release tag, the stats-card
  version strip, the console banner) keeps moving at every release. Initial values are the
  release in which each card last changed: control 0.21.0, overview 0.20.0, stats 0.20.0,
  recipients 0.17.0, deliveries 0.16.0, transports 0.16.0, scenarios 0.15.0,
  automations 0.14.0, composer 0.11.0, bands 0.9.0, simulator 0.9.0.

### Added
- `tools/check_card_versions.py`: splits the bundle into per-card regions, compares each
  with the previous commit and fails when a card's code changed without a bump. Run by the
  CI workflow on every push/PR.

## [0.21.0] - 2026-09-11

### Added
- Control card: **native "last notification" block** (`last_notification: true`), meant to
  replace a markdown card: title from `last_notification_entity`, message (optional
  `last_notification_strip` regex, e.g. to drop a trailing timestamp line), priority chip,
  relative time, channels with ✔/✖ (+ skipped count) labelled with the delivery `alias:`,
  optional repeat button (`repeat_entity`, an `input_button`). Refreshed on every change of
  `sensor.supernotify_notifications` and once a minute.
- Control card: **collapsible groups** — each group header shows `active/total` and folds on
  tap; a folded group still shows its ON pills. State is kept per browser (localStorage);
  `collapsible: false` disables it, per-group `collapsed: true` folds it by default.
- Control card: **snooze countdown** — while a snooze is active the tile shows "⏳ N min left"
  (refreshed every 30 s) next to the end time.

### Changed
- Control card: tiles sit on a uniform grid (auto-fit, min 84 px — five tiles fit one row in a
  two-column section); `tile_columns: N` forces a fixed number of columns. Slightly smaller
  tile labels.

## [0.20.0] - 2026-09-10

### Added
- Overview card: **health strip** on top (`health: true` by default) — one chip per thing
  worth a glance: SuperNotify version (up to date / update available / restart required, from
  the HACS update entity `update_entity`, default `update.supernotify_update`), engine
  failures, transports with `error_count > 0`, channels switched off, DND active (new optional
  `quiet_entity`), active snoozes. A single green "All good" chip when nothing is wrong.
- Stats card: channel rows show the delivery `alias:` (surfaced as `friendly_name` on the
  delivery entity) when configured, with the technical name underneath.

## [0.19.0] - 2026-09-10

### Added
- **New `supernotify-stats-card`** — usage analytics built only from entities that
  already exist (no extra sensor, no archive parsing): KPIs (notifications in the
  window, per day, today vs. average, peak hour, top channel, channel errors), inline-SVG
  bar charts per day / hour / weekday, channels most used with error share, priority and
  day-period mix, auto-generated insights (share, peak, night share, weekend delta, 7-day
  trend, errors) and a version strip with installed vs. latest version of SuperNotify and
  of these cards from the HACS `update.*` entities (brand icon + release link).
  Per-day series come from the long-term statistics of a daily `utility_meter`; the
  per-notification detail from the recorder history of the "last notification" helpers;
  channels from an `input_text` written after delivery via
  `supernotify.enquire_last_notification` (`a, b, ✖c`, ✖ = errored). README documents the
  helpers and the two small automations the card expects. i18n en/it.

## [0.18.0] - 2026-09-09

### Removed
- Overview card: the "Transports" section (one row per transport with an ok/off badge).
  It duplicated what `supernotify-transports-card` already shows in the dedicated
  "Transport" dashboard view — same on/off state, rendered there as a live switch — so
  transport status now lives in one place only. The i18n keys `transports` /
  `no_transports` are kept (still used by the transports card).

### Changed
- Overview card description no longer mentions transport status.

## [0.17.0] - 2026-09-08

### Added
- Recipients card: explicit ⚙️ gear icon at the end of each row, next to the on/off switch,
  so tap-for-details is visible instead of implicit on the whole row. Tapping it fires the
  same `hass-more-info` event as before (native HA dialog, read-only — SuperNotify has no
  recipient Config Flow yet, contacts still live in `recipients.yaml`).
- New i18n key `details` (en/it).

## [0.16.0] - 2026-09-08

### Added
- **Live on/off switches on deliveries-card and recipients-card rows**, replacing the
  previous read-only badge. Toggling calls the HA REST states endpoint directly
  (`POST /api/states/<entity_id>` via `hass.callApi`) since SuperNotify's new
  `binary_sensor.supernotify_delivery_*` / `_recipient_*` entities (2.4.0-beta1) are
  raw states with no dedicated HA service — SuperNotify's own
  `DeliveryRegistry`/`PeopleRegistry.handle_entity_state_change()` listener reacts to
  any state change on the entity, which is exactly what this writes.
- **New `supernotify-transports-card`**: auto-discovers `binary_sensor.supernotify_transport_*`,
  shows an error tag when `error_count > 0`, and the same live on/off switch. Transports
  previously had no dedicated card (only read-only display in the overview card or
  native HA tiles).

### Changed
- Shared `snSetBinaryState()` helper and `SN_SWITCH_CSS` block reused by all three
  toggle-capable cards.

## [0.15.0] - 2026-09-07

### Changed
- **Overview card and scenarios card now use Live Scenarios (SuperNotify
  ≥ 2.4.0) for their "active now" count/badge**: they read the reactive
  `binary_sensor.supernotify_scenario_*` state directly — instant, no
  polling delay — instead of waiting for the next `enquire_active_scenarios`
  poll (up to `poll_seconds`, default 60s stale). Only the control card had
  this; the other two still called the polled service every time. On
  SuperNotify < 2.4.0, where that state stays `unknown`, both cards fall
  back to the polled count exactly as before — no behavior change there.

## [0.14.0] - 2026-09-07

### Added
- **Automations card: tap a row to open its more-info dialog** (same
  `hass-more-info` pattern already used by the deliveries/recipients/
  scenarios cards) — the toggle switch keeps its own click target so
  enabling/disabling still works with a single tap.
- **Automations card: "🔕 disabled only" filter chip**, alongside the
  category chips, to spot silenced automations quickly in a long list.
- **CI**: a GitHub Action now runs on every push/PR — `node -c` on the
  card bundle, `python3 -m py_compile` on the tools scripts, and a JSON
  validity check on `hacs.json`.

## [0.13.0] - 2026-09-07

### Added
- **Automations card: version shown in the header**, next to the automation
  count (`v0.13.0`), not only in the footer below the list — with hundreds
  of automations the footer is a long scroll away, so this makes it obvious
  at a glance which version is actually loaded.

## [0.12.0] - 2026-09-07

### Added
- **New card: `supernotify-automations-card`**, restored — it existed only
  as a manually-deployed copy on one installation (never committed to this
  repository), so a HACS update overwriting that installation's files with
  the tracked repository content removed it. Now tracked here for good.
  Live list of the automations that call `notify.supernotify`: search,
  category filters, state and "last triggered", enable/disable toggle.
  Discovery is hybrid — a scanner script (`tools/genera_vista_automazioni.py`)
  writes a JSON manifest, the card layers live state on top of it.

## [0.11.0] - 2026-09-07

### Added
- **Composer: NO_TARGET warning** — an inline warning now appears when the
  target holds only areas/floors/labels with no person/device added
  directly and no explicitly picked channel known to resolve them natively.
  SuperNotify only resolves indirect target categories for transports that
  call an HA entity service (`notify_entity`, `alexa_devices`, `html5`,
  `ntfy`, `kodi`, `media_player`, `tts`, `chime` — see upstream
  [issue #9](https://github.com/rhizomatics/supernotify/issues/9)); with any
  other channel, or the default/implicit routing when nothing is picked, the
  notification can silently end up with no recipient at all.
- **Deliveries card: "🎯 native area/floor/label" tag** on deliveries whose
  transport is in that same native-target list, so it's clear at a glance
  where the composer's target selector fully applies.

## [0.10.0] - 2026-09-07

### Added
- **Composer: native HA target selector** — the target field (people,
  devices, areas, floors, labels) is now a real `ha-selector` with
  `selector: target:`, the same widget SuperNotify's own `supernotify.notify`
  action shows in Developer Tools/the automation editor. Replaces the
  person-only recipient chips.
- **Composer: custom targets field** — comma-separated free text for
  recipients with no HA selector (email addresses, Telegram chat IDs, …),
  sent as `custom_target`.
- **Composer now sends via the dedicated `supernotify.notify` action**
  (SuperNotify ≥ 2.3.0) instead of `notify.supernotify`'s generic `data:`
  field — typed top-level fields (`priority`, `target`, `custom_target`,
  `camera_entity_id`, `delivery_selection`, `delivery`), full HA `Context`
  propagation end to end.
- **Composer: translated priority options** — minimum/low/medium/high/
  critical now follow the card's Italian/English localization instead of
  being hardcoded in English.

### Changed
- README: documented the existing localization (Italian/English, follows
  `hass.language`, `language:` override), the SuperNotify version needed per
  feature, and that scenario sensors report a live state from SuperNotify
  2.4.0 (`scenario_control`) rather than staying `unknown` pending upstream.

## [0.9.1] - 2026-07-04

### Changed
- Control card can now be used as a **modes-only board**: with
  `tiles: []` the intercom row is hidden (it renders only when the
  `announce` tile is configured) and the status bar hides itself when it
  has nothing to show. Useful for a dedicated "house modes" view with
  just grouped toggles.

## [0.9.0] - 2026-07-04

### Added
- **Italian translations**: card strings now follow `hass.language`
  automatically (override with `language:` in the card config). English
  fallback.
- **Overview: `sent_today_entity` option** — point it to a daily
  `utility_meter` on `sensor.supernotify_notifications` to show "sent
  today" with yesterday's total (from the meter `last_period` attribute)
  instead of the since-startup counter.
- **Control: `quiet_entity` option** — show a computed quiet state (e.g.
  a template binary_sensor combining DND switch, schedules and voice
  toggle) in the status bar, while the DND tile keeps toggling the manual
  switch.
- **Composer: recipients and camera** — recipient chips (auto-discovered,
  sent as `target:`) and a camera selector that attaches a snapshot via
  `data.media.camera_entity_id`, both reflected in the phone preview.

## [0.8.0] - 2026-07-04

### Added
- **`intro` option on every card**: renders a prototype-style info banner
  at the top of the card with the text (HTML allowed) from the config.
  Lets dashboards carry the explanatory copy of the SuperNotify prototype
  in any language without hard-coding strings in the cards.

## [0.7.0] - 2026-07-04

### Added
- **New card: `supernotify-simulator-card`** — "who receives?": pick
  scenarios (pre-selected with the ones active right now) and see which
  deliveries would fire. Built on real engine data
  (`enquire_implicit_deliveries` + `enquire_deliveries_by_scenario`),
  suppressed deliveries shown struck-through; disabled wins over enabled,
  matching the runtime merge semantics.
- **New card: `supernotify-composer-card`** — try & send: title, message,
  priority selector, optional explicit channel chips (auto-discovered),
  live phone preview, confirmation guard on critical, sends via
  `notify.supernotify` (`delivery_selection: fixed` when channels picked).

## [0.6.0] - 2026-07-04

### Added
- **New card: `supernotify-scenarios-card`** (same bundle). Scenarios
  dashboard auto-discovered from exposed entities: prototype emoji per
  scenario, "active now" badge (from `enquire_active_scenarios`, polled),
  per-delivery override tags (green enabled / red disabled), action
  groups and media tags, optional `groups` config to reproduce the
  prototype categories, more-info on tap.

### Changed
- **Overview card closer to the prototype dashboard**: new "Snoozed"
  counter (from `enquire_snoozes`, with expiry time), priority badge on
  the last notification, channel count hidden when zero.

## [0.5.0] - 2026-07-03

### Added
- **New card: `supernotify-recipients-card`** (same bundle). Recipients
  dashboard auto-discovered from exposed entities: alias/name, home or
  away state read from the linked `person.*` entity, contact tags (email,
  phone, mobile devices count, delivery overrides count, warning when a
  recipient has no contact points), enabled badge, more-info on tap.

## [0.4.0] - 2026-07-03

### Added
- **New card: `supernotify-deliveries-card`** (same bundle). Delivery
  dashboard that auto-discovers the delivery entities SuperNotify exposes:
  transport icon, name and alias, selection/action/fixed-target/target_usage
  tags, enabled badge, enabled-first sorting. Tap a row for the full
  attributes (more-info dialog). `hide_defaults` option (default true)
  filters out the auto-generated `DEFAULT_*` deliveries.

## [0.3.0] - 2026-07-03

### Added
- **New card: `supernotify-bands-card`** (same bundle). Time bands editor
  mirroring the prototype's Fasce page: one row per band with icon and
  name, active range, "now" badge on the currently active band (handles
  the cross-midnight band), inline start-time input writing to
  `input_datetime` and volume slider writing to `input_number`.

## [0.2.0] - 2026-07-03

### Added
- **New card: `supernotify-overview-card`** (same bundle file). Dashboard
  overview with sent/failure counters (from `sensor.supernotify_notifications`
  and `sensor.supernotify_failures`), active scenarios and last notification
  (via `supernotify.enquire_*` WebSocket response services), delivery
  enabled/total count and transport status (from exposed entities).
  Configurable `poll_seconds` (default 60) and the same `style` option as
  the control card.

## [0.1.5] - 2026-07-03

### Added
- **Stateful snooze tile**: the card polls `supernotify.enquire_snoozes`
  (via WebSocket service call with response) every minute and after each
  action. While a snooze is active the tile turns amber, shows the expiry
  time ("Snoozed · until HH:MM") and tapping it clears all snoozes via
  `supernotify.clear_snoozes`.

## [0.1.4] - 2026-07-03

### Added
- Version badge on the card footer, to make it obvious which version is
  actually loaded (HACS redownload + browser cache can otherwise hide it).

## [0.1.3] - 2026-07-03

### Fixed
- **Snooze tile now works.** There is no `supernotify.snooze` service —
  snoozing in SuperNotify is event-driven, the same mechanism used by the
  push notification action buttons. The tile now fires a
  `mobile_app_notification_action` event with
  `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_<minutes>`, so critical
  notifications keep flowing during the snooze.

### Added
- `snooze_action` config option to override the snooze command
  (e.g. `SUPERNOTIFY_SNOOZE_EVERYONE_EVERYTHING_30` to pause critical too).

## [0.1.2] - 2026-07-03

### Changed
- **Default look now matches the SuperNotify prototype identity**: own
  palette (SuperNotify blue `#03a9f4`, amber DND, green status dots) with
  automatic dark variant, boxed status bar, emoji tile icons.
- New `style: theme` config option to follow the active HA theme instead.
- Tile `icon` accepts either an emoji or an `mdi:*` icon name.

## [0.1.1] - 2026-07-03

### Changed
- First palette pass: prototype colors embedded instead of raw HA theme
  variables (superseded by 0.1.2).

## [0.1.0] - 2026-07-02

### Added
- Initial release: status bar (presence, active time band with volume from
  `input_number`, quiet state, active scenarios when exposed), quick-action
  tiles (DND toggle, snooze, `input_boolean` toggles, announce), intercom
  input calling `notify.supernotify` with `delivery_selection: fixed`,
  grouped `input_boolean` mode toggles. Vanilla custom element, no build
  step, no dependencies.
