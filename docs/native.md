# SuperNotify in Home Assistant's own cards

[← SuperNotify Cards](../README.md) · [Common options](configuration.md)

No SuperNotify card needed: a badge for any view and three features for Home Assistant's **tile
card**. They come with the same download as the cards.

## Status badge

SuperNotify's health in one badge, on top of any view (sections dashboards): transports with errors,
channels off, pauses in force, otherwise *All good*. The colour and icon follow the worst of them, and
the badge's tooltip lists them all. **Edit dashboard → Add badge → SuperNotify status**, or:

```yaml
badges:
  - type: custom:supernotify-status-badge
    # optional:
    name: Notifiche                       # label above the state (default SuperNotify)
    show_name: false                      # state only
    navigation_path: /supernotify-auto/home   # on tap; default: the counter's dialog
```

The dashboard built by `strategy: custom:supernotify` already has it on top of *Home*
(`hide: [badge]` leaves it out).

## Tile features

Add a **Tile** card, pick the entity, then **Features → Add feature**.

| Feature | Tile entity | What it does |
|---|---|---|
| SuperNotify pause | `sensor.supernotify_notifications` | 30 min / 1 h / 2 h pause of the non-critical notifications for everyone; while paused, *Resume* with the end time |
| SuperNotify last notification | `sensor.supernotify_notifications` | title and age of the last notification |
| SuperNotify test | `notify.recipient_<name>` | sends a test through the whole pipeline (scenarios, pauses, duplicates); tap twice |

```yaml
type: tile
entity: sensor.supernotify_notifications
features:
  - type: custom:supernotify-last
  - type: custom:supernotify-pause
    minutes: [15, 60, 240]   # optional, default [30, 60, 120]
```

```yaml
type: tile
entity: notify.recipient_lorenzo
features:
  - type: custom:supernotify-test
```

Pauses work like the control card's: an administrator pauses through the same event as the push
notification buttons; anyone else through SuperNotify's voice commands, which pause their own person
(voice commands must be on in SuperNotify's options).
