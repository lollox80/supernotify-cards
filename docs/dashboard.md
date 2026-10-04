# A dashboard that builds itself

[← SuperNotify Cards](../README.md) · [Common options](configuration.md)

Instead of placing the cards one by one, let the dashboard build itself from what SuperNotify has in
your installation:

1. **Settings → Dashboards → Add dashboard → New dashboard from scratch**, give it a name (for
   example *Notifications*).
2. Open it, ⋮ → **Edit dashboard** → ⋮ → **Raw configuration editor**, replace everything with:

```yaml
strategy:
  type: custom:supernotify
```

Where Home Assistant lists custom strategies in **Add dashboard**, *SuperNotify* is there too.

## What you get

| View | Cards |
|---|---|
| Home | control · overview, archive |
| Send | composer · why, simulator |
| Setup | channels, transports · scenarios, recipients · time bands, automations |
| Stats | stats |
| Tools | tools - **administrators only** |

The views are built for whoever opens the dashboard, every time:

- each card gets the configuration its card picker would suggest;
- transports, scenarios and recipients appear only when SuperNotify has them;
- the time bands card only when helpers named like the [bands example](cards/bands.md) exist
  (`input_datetime.…start_<band>` + `input_number.…<band>_volume`);
- the automations card only when its manifest (`/local/supernotify/automations.json`) is there;
- the Tools view only for administrators.

The links between cards (a channel off, a person, a scenario) open the right view.

## Options

```yaml
strategy:
  type: custom:supernotify
  title: Notifications                 # default "SuperNotify"
  views: [home, send, setup, stats]    # which views, in this order (default: all five)
  hide: [simulator, automations]       # card kinds to leave out
  cards:                               # extra configuration per card kind, over the suggested one
    control:
      dnd_entity: input_boolean.notifier_dnd
      tiles: [dnd, snooze, announce]
    archive:
      limit: 30
```

## Making it your own

To move cards around or add your own, use ⋮ → **Take control** in the dashboard: Home Assistant
turns the generated views into an ordinary dashboard you can edit, as with its own built-in
dashboards. From then on it no longer follows your installation by itself.
