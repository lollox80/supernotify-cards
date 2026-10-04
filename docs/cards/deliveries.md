# supernotify-deliveries-card

[← SuperNotify Cards](../../README.md) · [Common options](../configuration.md)

Every channel (delivery) with its on/off switch, auto-discovered from the entities
SuperNotify exposes and grouped by how it starts: **on its own**, **only when named in
the call**, **only with a scenario**, **backup**. The readable name (the delivery's
`alias`) comes first, the technical name small next to it. One status line says what is
going on right now: switched off, transport off, "paused now by <scenario>" when an active
scenario turns it off, "on now through <scenario>" for a scenario-only channel. A "native
area/floor/label" tag marks deliveries whose transport resolves an
area/floor/label target natively (`notify_entity`, `alexa_devices`, `html5`,
`ntfy`, `kodi`, `media_player`, `tts`, `chime`) — see the composer card's
target selector note below for why this matters. **Tap a row** for its detail: transport, action,
fixed targets, when it is used, options in plain words and data, with **All attributes ›**
for Home Assistant's dialog.

<img src="../images/deliveries.png" alt="supernotify-deliveries-card" width="420">

```yaml
type: custom:supernotify-deliveries-card
# optional:
hide_defaults: true     # hide auto-generated DEFAULT_* deliveries (default true)
title: Canali           # header text (default "Channels" / "Canali")
group: false            # one flat list instead of the groups (default: grouped)
style: theme
```

To undo the changes made by hand (all, or only channels, transports…) use the
[tools card](tools.md) (0.65.0: the button left this card).
