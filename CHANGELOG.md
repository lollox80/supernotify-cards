# Changelog

All notable changes to **supernotify-control-card** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
