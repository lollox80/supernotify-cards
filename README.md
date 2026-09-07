# SuperNotify Cards

Lovelace cards for [SuperNotify](https://github.com/rhizomatics/supernotify).

See [CHANGELOG.md](CHANGELOG.md) for release notes. The loaded version is
shown on the card footer.

Works with SuperNotify ≥ 2.0.0. The composer card's native target selector
and its use of the dedicated `supernotify.notify` action need SuperNotify
≥ 2.3.0; live scenario state (see the control card below) needs ≥ 2.4.0.

All cards accept two common options: `style: theme` (follow the HA theme
instead of the SuperNotify palette) and `intro: <text>` (HTML allowed),
which renders an info banner at the top of the card.

**Localization:** every card follows `hass.language` automatically (Italian
and English so far, English fallback for anything else). Override with
`language: it` / `language: en` in the card config if you need to pin it
regardless of the HA UI language.

## supernotify-control-card

Touch-first control center: status bar, big quick-action tiles and grouped
mode toggles. Implements the "control center" concept from the SuperNotify
UI roadmap (feature #27, statistics and dashboard).

### Installation

**HACS (recommended):** add this repository as a custom repository of type
"Dashboard", then install *SuperNotify Cards*.

**Manual:** copy `dist/supernotify-control-card.js` to `config/www/` and add
a dashboard resource:

```yaml
url: /local/supernotify-control-card.js
type: module
```

### Configuration

```yaml
type: custom:supernotify-control-card
presence_entity: person.lorenzo
dnd_entity: input_boolean.notifier_dnd
announce_delivery: alexa_announce
snooze_minutes: 30
tiles:
  - dnd
  - snooze
  - toggle: input_boolean.notifier_speech_notifications
    name: Voice
    icon: mdi:account-voice
  - toggle: input_boolean.notifier_phone_notifications
    name: Push
    icon: mdi:cellphone
  - announce
groups:
  - name: Notification channels
    entities:
      - input_boolean.notifier_speech_notifications
      - input_boolean.notifier_phone_notifications
      - input_boolean.notifier_screen_notifications
  - name: Quiet and schedules
    entities:
      - input_boolean.notifier_dnd
      - input_boolean.notifier_holidays
      - input_boolean.notifier_dnd_workdays
  - name: People and home
    entities:
      - input_boolean.modo_ospite
      - input_boolean.tata_presente
bands:
  early_morning: {start: input_datetime.notifier_start_early_morning, volume: input_number.notifier_early_morning_volume}
  morning:       {start: input_datetime.notifier_start_morning,       volume: input_number.notifier_morning_volume}
  afternoon:     {start: input_datetime.notifier_start_afternoon,     volume: input_number.notifier_afternoon_volume}
  evening:       {start: input_datetime.notifier_start_evening,       volume: input_number.notifier_evening_volume}
  night:         {start: input_datetime.notifier_start_night,         volume: input_number.notifier_night_volume}
  late_night:    {start: input_datetime.notifier_start_late_night,    volume: input_number.notifier_late_night_volume}
```

| Option | Required | Description |
|---|---|---|
| `presence_entity` | no | `person.*` shown in the status bar |
| `dnd_entity` | no | `input_boolean` used by the DND tile and status bar |
| `announce_delivery` | no | SuperNotify delivery used by Announce (default `alexa_announce`) |
| `snooze_minutes` | no | minutes for the snooze tile (default 30) |
| `snooze_action` | no | override the snooze command (default `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_<minutes>`; e.g. use `..._EVERYTHING_...` to pause critical too) |
| `tiles` | no | list of `dnd`, `snooze`, `announce`, or `{toggle, name, icon}` |
| `groups` | no | grouped `input_boolean` toggles with a `name` |
| `bands` | no | time bands (`input_datetime` start + `input_number` volume) for the status bar |

Active scenarios are read from `binary_sensor.supernotify_scenario_*`. Since
SuperNotify 2.4.0 these report a live `on`/`off` state (recomputed reactively
plus a periodic sweep — see `scenario_control` in the SuperNotify config); on
older versions, or for a scenario configured with `expose_state: false`, they
stay `unknown` and the counter hides automatically.

The Announce tile calls `notify.supernotify` with
`data: {delivery_selection: fixed, delivery: {<announce_delivery>: {}}}`.

## supernotify-overview-card

Dashboard overview shipped in the same bundle: sent and failure counters
(`sensor.supernotify_notifications` / `sensor.supernotify_failures`), active
scenarios and last notification (via the `supernotify.enquire_*` response
services over WebSocket), delivery counts and transport status (from the
entities SuperNotify exposes).

```yaml
type: custom:supernotify-overview-card
# optional:
poll_seconds: 60        # refresh interval for enquire_* data
style: theme            # follow the HA theme instead of the SuperNotify look
```

## supernotify-bands-card

Time bands editor: one row per band with an "now" badge on the active band
(cross-midnight aware), inline start-time input (`input_datetime`) and
volume slider (`input_number`).

```yaml
type: custom:supernotify-bands-card
bands:                   # config order = chronological order (cyclic)
  early_morning: {start: input_datetime.notifier_start_early_morning, volume: input_number.notifier_early_morning_volume}
  morning:       {start: input_datetime.notifier_start_morning,       volume: input_number.notifier_morning_volume}
  afternoon:     {start: input_datetime.notifier_start_afternoon,     volume: input_number.notifier_afternoon_volume}
  evening:       {start: input_datetime.notifier_start_evening,       volume: input_number.notifier_evening_volume}
  night:         {start: input_datetime.notifier_start_night,         volume: input_number.notifier_night_volume}
  late_night:    {start: input_datetime.notifier_start_late_night,    volume: input_number.notifier_late_night_volume}
# per band, optional: name and icon (emoji); defaults provided for the six standard bands
```

## supernotify-deliveries-card

Delivery dashboard, auto-discovered from the entities SuperNotify exposes:
transport icon, selection/action/target tags, enabled badge. Tap a row for
the full delivery attributes.

```yaml
type: custom:supernotify-deliveries-card
# optional:
hide_defaults: true     # hide auto-generated DEFAULT_* deliveries (default true)
style: theme
```

## supernotify-recipients-card

Recipients dashboard, auto-discovered: home/away state from the linked
`person.*` entity, contact tags (email, phone, devices, delivery overrides)
and enabled badge. Warns when a recipient has no contact points.

```yaml
type: custom:supernotify-recipients-card
# optional: style: theme
```

## supernotify-scenarios-card

Scenarios dashboard, auto-discovered: "active now" badge (polled from
`enquire_active_scenarios`), per-delivery override tags (enabled/disabled),
action groups and media tags. Optional `groups` reproduce categories.

```yaml
type: custom:supernotify-scenarios-card
# optional:
groups:
  - name: 🚨 Priority
    scenarios: [critical_panic, high_priority, alexa_low_whisper]
  - name: 🕐 Time bands
    scenarios: [early_morning, morning, afternoon, evening, night, late_night]
# scenarios not listed fall into an "Other" group
```

## supernotify-simulator-card

"Who receives?" — pick scenarios and see which deliveries would fire,
computed from real engine data (`enquire_implicit_deliveries` and
`enquire_deliveries_by_scenario`). Suppressed deliveries are shown
struck-through. Priority-based delivery filtering happens engine-side and
is not simulated.

```yaml
type: custom:supernotify-simulator-card
```

## supernotify-composer-card

Try & send: title, message, priority, optional explicit channel chips
(auto-discovered), a native HA **target selector** (people, devices, areas,
floors, labels — the same picker HA itself shows for `supernotify.notify`),
an optional comma-separated **custom targets** field for recipients with no
HA selector (email addresses, Telegram chat IDs, …), camera snapshot picker
and a live phone preview.

Sends via the dedicated `supernotify.notify` action (SuperNotify ≥ 2.3.0) —
typed fields instead of `notify.supernotify`'s generic `data:` — with
`delivery_selection: fixed` when channels are picked, and a confirmation
guard on critical priority. Requires SuperNotify ≥ 2.3.0; on older versions
use `supernotify-control-card`'s Announce tile or your own automation
instead.

```yaml
type: custom:supernotify-composer-card
```
