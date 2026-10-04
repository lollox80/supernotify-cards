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
last_notification: true    # show it even with a control card on the page (false = never)
occupancy: false       # hide "Who is home"
repairs: false         # leave SuperNotify's repairs out of the health list
update_entity: update.supernotify_update   # HACS update entity for the version chip
quiet_entity: binary_sensor.notifier_dnd   # your DND sensor, for the 🌙 chip
sent_today_entity: sensor.supernotify_sent_today   # daily utility_meter for "sent today"
style: theme            # follow the HA theme instead of the SuperNotify look
```

The **last notification** block reads like the control card's: title, message, priority, how long ago,
then "2 delivered · 1 missed · 2 skipped" (hover for the channel names) and **Why ›** when a why card
is on the dashboard. With a control card on the same view that shows it, the overview leaves it out
(0.65.0); `last_notification: true` or `false` decides instead.

**Who is home** comes from SuperNotify (`enquire_occupancy`): the people at home and away, and the
occupancy its conditions see (everyone home, only one home, some at home, everyone away). It is
what decides `occupancy:` in your channels, which can differ from the `person.*` states (an unknown
tracker counts as home).

**SuperNotify's repairs** (admin users) join the health list with their title and an Open link to
Settings › Repairs. Ignored repairs are left out.

**Links to the other cards** (0.65.0), when they are on the same page: *transports with errors* and
*channels off* get **Show ›**, which opens that card on those rows; a pause opens the control card's
pause panel; a person opens the recipients card, an active scenario the scenarios card.
