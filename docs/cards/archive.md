# supernotify-archive-card

[← SuperNotify Cards](../../README.md) · [Common options](../configuration.md)

Notification history, read from the SuperNotify archive, and **why** each one went where it went.

<img src="../images/archive.png" alt="supernotify-archive-card" width="900">

**One card for the list and the detail (0.85.0).** On the left (on top when the card is narrow) one
line per notification: a mark - ✔ arrived, **!** a channel failed or something to look at, ⊘ it
went out on no channel (a pause, nobody home, a rule) - the title, and one line that says how it
went: the failed channel in red, else where it arrived. The priority shows only when it is not
medium. The same notification several times in a row is one line with **×N** (tap it to see each
one). On top: today in one line, the search, and **?** for how to read the card.

On the right (below when narrow) the notification you tap - the latest opens by itself: a verdict
("Arrived on 3 channels of 4 · Telegram failed"), the call, the scenarios in force, who was home,
then every channel with why it went out or not and to whom, the routine skips and the channels not
involved folded, and the pause bar. This is what the separate
[supernotify-why-card](why.md) showed; that card is now an alias of this one.

```yaml
type: custom:supernotify-archive-card
```

| Option | Required | Description |
|---|---|---|
| `limit` | no | notifications in the list (default 150, max 500) |
| `trigger_entity` | no | entity whose change means "a notification was sent" (default `sensor.supernotify_notifications`) |
| `intro` | no | info banner at the top of the card |
| `style` | no | `supernotify` (default) or `theme` |
| `pause` | no | `false` hides the pause bar under the detail (default shown when SuperNotify has `supernotify.snooze`) |
| `priority_filters` | no | `false` hides the **Critical** and **High** filters (default shown when the archive has some) |
| `group_repeats` | no | `false` lists every notification on its own line (default: repeats in a row are one "×N" line) |
| `auto_select` | no | `false` waits for a tap instead of opening the latest notification |
| `expand` | no | `true` opens the folded parts of the detail (routine skips, channels not involved, trace) |
| `max_height` | no | any CSS length (e.g. `calc(100vh - 330px)`): list and detail scroll inside it |
| `pause_sender` | no | `true` also offers the automation or script that sent the notification - needs a SuperNotify whose tag snooze matches the sender ([#270](https://github.com/rhizomatics/supernotify/pull/270)) |

**Pause one notification (0.80.0).** Open a notification: the bar under the detail pauses notifications about the entity
it is about - 30 min, 1 h, 4 h or 24 h, for everyone or only for you - through SuperNotify's tag
snooze. The entity is `entity_id` in the call's `data` (or its camera), so add it to the calls you
want to be able to pause:

```yaml
action: notify.supernotify
data:
  message: "The bathroom thermostat is offline"
  data:
    entity_id: climate.bathroom_thermostat
```

Critical notifications are never paused from here. "Only for me" removes you from the people the
notification goes to; channels with fixed targets (speakers, the dashboard) still play.

**A light list (0.86.0).** The list is read as summaries
(`enquire_archive` with `verbosity: summary`, about 1 KB a notification instead of about 6 KB), and
only the 20 newest in full - those keep the missed count, the spoken text and the whisper mark in
the list. Any other notification is read in full when you open it. **Critical** and **High** look
in the whole archive (31 days): the card asks SuperNotify how many there are per day
(`verbosity: daily`, shared with the stats card) and then reads only the days that have some (on
SuperNotify 2.14, which filters by priority itself, one call); a finished day is kept in the browser
and never read again.

**Appliance Autonotify (0.90.0).** Notifications sent by
[Appliance Autonotify](https://github.com/rhizomatics/appliance_autonotify) (washing machine,
dishwasher, ...) are recognised from their mobile push tag `appliance_<entry_id>`: they read
"🧺 Autonotify · Washing machine" under the title, the detail says "Sent by 🧺 Autonotify · Washing
machine", and an **Appliances** filter shows them. The name is the title of the appliance's config
entry. Only a notification read in full carries the tag - the 20 newest, or one you open - so the
filter does not see older ones until they are opened. Autonotify calls without a tag (for example a
plain message with no extra data) are not recognised.

**Nothing to set up.** The card reads the archive through the `supernotify.enquire_archive`
action (the file archive must be on in SuperNotify's options). It asks for the latest `limit`
notifications once, then only for the newest few each time `trigger_entity` changes, and shares what
it read with the recipients card on the same page.

**Upgrading from the command_line bridge (before 1.0.0).** The `sensor.supernotify_archivio` sensor
running `tools/sn_archive_index.py`, its refresh automation and `shell_command.sn_archive_detail` are no
longer read (the options `source: sensor`, `entity` and `service` are ignored): remove them from your
configuration, together with the script in `/config/tools/`.

What a **voice channel said** (Alexa, TTS…) shows under the message when it differs from the text,
named after that channel. SuperNotify keeps the spoken text only for voice transports, so any voice
channel is recognised, whatever its name.
