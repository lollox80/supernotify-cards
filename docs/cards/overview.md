# supernotify-overview-card

[← SuperNotify Cards](../../README.md) · [Common options](../configuration.md)

Dashboard overview shipped in the same bundle: **health** on top — one sentence
("2 things to look at", or "All good" with how many channels are on) and a list
of what to look at, each with its detail and an "Open" link where there is one
(SuperNotify version from the HACS update entity, engine failures, transports
with errors and their last message, channels switched off by readable name, DND
active, active snoozes),
sent and failure counters (`sensor.supernotify_notifications` /
`sensor.supernotify_failures`), active scenarios and last notification (via
the `supernotify.enquire_*` response services over WebSocket) and delivery
counts. Transport status lives in the transports card.

<img src="../images/overview.png" alt="supernotify-overview-card" width="420">

```yaml
type: custom:supernotify-overview-card
# optional:
poll_seconds: 60        # refresh interval for enquire_* data
health: true            # health sentence + list on top (false = hide, chips = the pre-0.52 chips)
stats: full             # all five numbers (default: sent, failures, channels)
update_entity: update.supernotify_update   # HACS update entity for the version chip
quiet_entity: binary_sensor.notifier_dnd   # your DND sensor, for the 🌙 chip
sent_today_entity: sensor.supernotify_sent_today   # daily utility_meter for "sent today"
style: theme            # follow the HA theme instead of the SuperNotify look
```
