# SuperNotify Cards

Lovelace cards for [SuperNotify](https://github.com/rhizomatics/supernotify).

See [CHANGELOG.md](CHANGELOG.md) for release notes. The loaded version is
shown on the card footer.

Works with SuperNotify ≥ 2.0.0. The composer card's native target selector
and its use of the dedicated `supernotify.notify` action need SuperNotify
≥ 2.3.0; live scenario state (see the control card below) needs ≥ 2.4.0.
The automations card needs no particular SuperNotify version but does need
its manifest generator (`tools/genera_vista_automazioni.py`) to be run
separately — see that card's section below.

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
stay `unknown` and the counter hides automatically. The overview-card and
scenarios-card use the same live state for their "active now" count/badge
when it's available, falling back to their polled `enquire_active_scenarios`
check (a `poll_seconds` option, default 60) only on older versions.

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
transport icon, selection/action/target tags, enabled badge. A "🎯 native
area/floor/label" tag marks deliveries whose transport resolves an
area/floor/label target natively (`notify_entity`, `alexa_devices`, `html5`,
`ntfy`, `kodi`, `media_player`, `tts`, `chime`) — see the composer card's
target selector note below for why this matters. Tap a row for the full
delivery attributes.

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

⚠️ **Areas, floors and labels are not resolved by every channel.** SuperNotify
only resolves them natively for transports that call an HA entity service —
`notify_entity`, `alexa_devices`, `html5`, `ntfy`, `kodi`, `media_player`,
`tts` and `chime` (see [issue #9](https://github.com/rhizomatics/supernotify/issues/9)
upstream). With any other channel, or with the default/implicit routing when
no channel is picked, a target made only of areas/floors/labels can silently
end up with no recipient at all. The card shows an inline warning in this
case; pick a compatible channel above (the deliveries card flags them) or add
a person/device directly to the target.

```yaml
type: custom:supernotify-composer-card
```

## supernotify-automations-card

Live list of the automations that notify via `notify.supernotify`: search,
category filters, a "🔕 disabled only" toggle, state and "last triggered",
enable/disable, tap a row for the automation's own more-info dialog.

Home Assistant does not expose the config of YAML/package automations (they
have no `id`), so discovery is hybrid: [`tools/genera_vista_automazioni.py`](tools/genera_vista_automazioni.py)
(included in this repo, run on the HA host or wherever it can read your
config directory) scans `automations.yaml`/`packages/*.yaml`, finds the
ones calling `notify.supernotify` and writes a JSON manifest to
`config/www/supernotify/automations.json`; the card layers everything live
on top of it (state, last_triggered, enable/disable). Edit the `HA_CONFIG_DIR`
and `CATEGORIES` constants at the top of the script for your own setup
before running it, and rerun it whenever automations are added, removed or
renamed — the card itself only reads the manifest, it never scans anything.

```yaml
type: custom:supernotify-automations-card
# optional:
manifest_url: /local/supernotify/automations.json   # default shown
style: theme
```

⚠️ If the card shows a configuration/loading error, check that the manifest
file actually exists at that URL on your instance — this card depends on it
being generated and copied into `config/www/supernotify/` separately from
the card's own installation.

## supernotify-stats-card

Usage analytics built **only from entities that already exist** — no extra
sensor, no archive parsing: KPIs (notifications in the window, per day,
today vs. average, peak hour, top channel, channel errors), per-day /
per-hour / per-weekday bar charts, channels most used (with error share),
priority and day-period mix, auto-generated insights, and a version strip
showing installed vs. latest version of SuperNotify and of these cards
(from the HACS `update.*` entities, with their brand icon and release link).

Data sources:

- **Per-day series** — long-term statistics of a daily `utility_meter` on
  `sensor.supernotify_notifications` (survives recorder purges).
- **Per-notification detail** — recorder history of the "last notification"
  helpers written by a logging automation: one change of an
  `input_datetime` = one notification, joined with the priority / channels /
  day-period helpers at that moment. History length = your recorder
  `purge_keep_days`.
- **Channels** — an `input_text` written *after* delivery from
  `supernotify.enquire_last_notification` as `a, b, ✖c` (✖ = errored).

```yaml
type: custom:supernotify-stats-card
# optional (defaults shown):
days: 14
time_entity: input_datetime.supernotify_last_time
priority_entity: input_text.supernotify_last_priority
channels_entity: input_text.supernotify_last_channels
period_entity: input_text.supernotify_last_day_period
sent_today_entity: sensor.supernotify_inviate_oggi      # daily utility_meter
update_entity: update.supernotify_update                # HACS update entity
cards_update_entity: update.supernotify_cards_update
refresh_minutes: 10
top_channels: 8
grid_options: { columns: full }   # recommended inside a column_span: 2 section
```

Minimal helpers + automations the card expects (adapt names to yours):

```yaml
input_text:
  supernotify_last_priority: { max: 20 }
  supernotify_last_channels: { max: 255 }
  supernotify_last_day_period: { max: 50 }
input_datetime:
  supernotify_last_time: { has_date: true, has_time: true }

utility_meter:
  supernotify_inviate_oggi:
    source: sensor.supernotify_notifications
    cycle: daily

automation:
  # 1) at call time: timestamp + priority (+ your own day-period sensor)
  - alias: SuperNotify - log last notification
    mode: queued
    trigger:
      - platform: event
        event_type: call_service
        event_data: { domain: notify, service: supernotify }
    action:
      - action: input_text.set_value
        target: { entity_id: input_text.supernotify_last_priority }
        data:
          value: "{{ (trigger.event.data.service_data.data | default({})).priority | default('medium') }}"
      - action: input_datetime.set_datetime
        target: { entity_id: input_datetime.supernotify_last_time }
        data: { datetime: "{{ now().isoformat() }}" }

  # 2) after delivery: channels that really delivered / errored
  - alias: SuperNotify - log delivered channels
    mode: queued
    trigger:
      - platform: state
        entity_id: sensor.supernotify_notifications
        not_to: [unknown, unavailable]
    action:
      - action: supernotify.enquire_last_notification
        response_variable: last
      - action: input_text.set_value
        target: { entity_id: input_text.supernotify_last_channels }
        data:
          value: >-
            {% set ns = namespace(ok=[], ko=[]) %}
            {% for name, o in (last.deliveries | default({})).items() %}
              {% if o.success | default([]) | length > 0 %}{% set ns.ok = ns.ok + [name] %}{% endif %}
              {% if (o.error | default([]) | length) + (o.failed | default([]) | length) > 0 %}{% set ns.ko = ns.ko + ['✖' ~ name] %}{% endif %}
            {% endfor %}
            {{ (ns.ok + ns.ko) | join(', ') if (ns.ok + ns.ko) | length > 0 else 'none' }}
```

Values the card cannot parse (e.g. an older "auto" placeholder) are counted
as *unknown* and shown as such under the channel chart.
