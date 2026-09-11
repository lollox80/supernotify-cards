# Changelog

All notable changes to **supernotify-control-card** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
