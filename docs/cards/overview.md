# supernotify-overview-card

[← SuperNotify Cards](../../README.md) · [Common options](../configuration.md)

Dashboard overview shipped in the same bundle: a **health strip** (one chip
per thing worth a glance — SuperNotify version status from the HACS update
entity, engine failures, transports with errors, channels switched off, DND
active, active snoozes; a single green "All good" when nothing is wrong),
sent and failure counters (`sensor.supernotify_notifications` /
`sensor.supernotify_failures`), active scenarios and last notification (via
the `supernotify.enquire_*` response services over WebSocket) and delivery
counts. Transport status lives in the transports card.

<img src="../images/overview.png" alt="supernotify-overview-card" width="420">

```yaml
type: custom:supernotify-overview-card
# optional:
poll_seconds: 60        # refresh interval for enquire_* data
health: true            # health strip on top (set false to hide)
update_entity: update.supernotify_update   # HACS update entity for the version chip
quiet_entity: binary_sensor.notifier_dnd   # your DND sensor, for the 🌙 chip
sent_today_entity: sensor.supernotify_sent_today   # daily utility_meter for "sent today"
style: theme            # follow the HA theme instead of the SuperNotify look
```
