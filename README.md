# SuperNotify Cards

Dashboard cards for **[SuperNotify](https://github.com/rhizomatics/supernotify)**, the Home
Assistant notification integration: switch channels and scenarios, send or test a
notification, and see why it went where it went, without touching YAML.

<p align="center"><img src="https://raw.githubusercontent.com/lollox80/supernotify-cards/main/docs/images/hero.png" alt="Control, overview and composer cards" width="760"></p>

**Who it is for:** you already use SuperNotify and want to run it from the dashboard.

**What you need:** Home Assistant with SuperNotify 2.0 or later; some features need a newer
SuperNotify ([which ones](https://github.com/lollox80/supernotify-cards/blob/main/docs/configuration.md#which-supernotify-version-each-feature-needs)).

**What's new:** see the [changelog](https://github.com/lollox80/supernotify-cards/blob/main/CHANGELOG.md) (every version, newest first) or the [releases](https://github.com/lollox80/supernotify-cards/releases).

## Install

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/lollox80/supernotify-cards`, type **Dashboard**.
2. Install **SuperNotify Cards** and reload the browser.
3. Add a card: **Add card** → search *SuperNotify*, or paste one of the examples below.

<details><summary>Manual install (without HACS)</summary>

Copy `dist/supernotify-control-card.js` to `config/www/` and add the dashboard resource
`/local/supernotify-control-card.js` (type: JavaScript module).
</details>

## Quick start

Three cards that work with no options at all:

```yaml
type: custom:supernotify-control-card
```
```yaml
type: custom:supernotify-composer-card
```
```yaml
type: custom:supernotify-why-card
```

## The cards

Each link opens the card's page: screenshot, every option, examples.

| Card | What it does |
|---|---|
| [control](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/control.md) | Touch-first control centre: last notification, snooze, do-not-disturb, announce, house modes. |
| [overview](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/overview.md) | Health at a glance: version, failures, channels off, snoozes, active scenarios. |
| [bands](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/bands.md) | Time bands: start time and voice volume of each part of the day. |
| [deliveries](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/deliveries.md) | Every channel with its on/off switch and when it starts. |
| [transports](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/transports.md) | The integrations behind the channels, with error counts. |
| [recipients](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/recipients.md) | People: contact points, presence, last notification received. |
| [scenarios](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/scenarios.md) | Scenarios, which are active now, on/off switches. |
| [simulator](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/simulator.md) | Tap scenarios and see which channels would fire. |
| [composer](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/composer.md) | Write and send a notification, or try it without sending. |
| [automations](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/automations.md) | The automations that notify, with search and enable/disable. |
| [archive](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/archive.md) | Recent notifications with the outcome of each channel. |
| [why](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/why.md) | Why a notification went where it went, channel by channel. |
| [stats](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/stats.md) | Usage over 7/14/30 days: per day, hour, weekday, channel, priority. |
| [tools](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/tools.md) | Maintenance actions and every SuperNotify question, with readable answers. |

All cards follow the Home Assistant dark theme ([screenshot](https://raw.githubusercontent.com/lollox80/supernotify-cards/main/docs/images/dark.png)).

**Phone and accessibility** (0.68.0): rows at least 48 px high on touch screens, everything usable
with the keyboard (Tab, Enter, Space), names for screen readers, reduced motion respected.

## A full dashboard

**Quickest:** a dashboard that builds itself from what your installation has. In a new dashboard's
raw configuration editor:

```yaml
strategy:
  type: custom:supernotify
```

Views, options and how to make it your own: [docs/dashboard.md](docs/dashboard.md). Or, to place
every card yourself:

Paste it in a new dashboard (**Settings → Dashboards → Add dashboard → New dashboard from scratch**,
then ⋮ → **Edit dashboard** → ⋮ → **Raw configuration editor**). Four views, each card where it is
used; the links between cards (a channel off, a person, a scenario) open the right view.

<details><summary>Dashboard YAML</summary>

```yaml
title: Notifications
views:
  - title: Home
    path: home
    icon: mdi:bell
    type: sections
    max_columns: 2
    sections:
      - type: grid
        cards:
          - type: custom:supernotify-control-card
      - type: grid
        cards:
          - type: custom:supernotify-overview-card
          - type: custom:supernotify-archive-card
  - title: Send
    path: send
    icon: mdi:send
    type: sections
    max_columns: 2
    sections:
      - type: grid
        cards:
          - type: custom:supernotify-composer-card
      - type: grid
        cards:
          - type: custom:supernotify-why-card
          - type: custom:supernotify-simulator-card
  - title: Setup
    path: setup
    icon: mdi:tune-variant
    type: sections
    max_columns: 3
    sections:
      - type: grid
        cards:
          - type: custom:supernotify-deliveries-card
          - type: custom:supernotify-transports-card
      - type: grid
        cards:
          - type: custom:supernotify-scenarios-card
          - type: custom:supernotify-recipients-card
      - type: grid
        cards:
          - type: custom:supernotify-bands-card
          - type: custom:supernotify-automations-card
  - title: Stats
    path: stats
    icon: mdi:chart-bar
    type: sections
    max_columns: 2
    sections:
      - type: grid
        cards:
          - type: custom:supernotify-stats-card
      - type: grid
        cards:
          - type: custom:supernotify-tools-card
```
</details>

The bands card needs its time bands set up first ([bands](https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/bands.md));
the tools card is meant for administrators - put it in a view only they can see
(view → **Visibility**).

## In Home Assistant's own cards

A **status badge** for any view and **tile features** (pause, last notification, test a recipient) for
Home Assistant's tile card, no SuperNotify card needed: [docs/native.md](docs/native.md).

## More

- [Common options and required versions](https://github.com/lollox80/supernotify-cards/blob/main/docs/configuration.md)
- [Changelog](https://github.com/lollox80/supernotify-cards/blob/main/CHANGELOG.md)
- Issues and ideas: [GitHub issues](https://github.com/lollox80/supernotify-cards/issues)
