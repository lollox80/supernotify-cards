# Changelog

All notable changes to **supernotify-control-card** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
