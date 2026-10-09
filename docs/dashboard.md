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
| Home | status badge on top; control · overview (and the archive, when the Archive view is left out) |
| Archive | the archive at full width, with the pause of the sending automation (`pause_sender`) |
| Send | composer · simulator (the "why" is inside archive since 0.85) |
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
  views: [home, send, setup, stats]    # which views, in this order (default: all six)
  hide: [simulator, automations]       # card kinds to leave out (badge: the status badge)
  tabs: icons                          # icons (default) | emoji | text - what the view tabs show
  icons:                               # change the mark of a single view
    home: mdi:home                     # an mdi icon goes in the tab icon...
    stats: "📈"                        # ...anything else is put before the name
  cards:                               # extra configuration per card kind, over the suggested one
    control:
      dnd_entity: input_boolean.notifier_dnd
      tiles: [dnd, snooze, announce]
    archive:
      limit: 30
```

Every view can be left out by not listing it in `views:`. Without `archive` the archive card goes
back into Home, next to the overview, as before 0.87. The Archive view gives its card
`max_height: calc(100vh - 300px)` and `pause_sender: true`; `cards: {archive: ...}` changes them.

### View tabs

By default every tab shows an mdi icon **and** the view name (`tabs: icons`). Showing both needs
Home Assistant 2026.2 or later; on older versions the tabs show the name only, so a tab is never
an unlabelled icon. `tabs: emoji` puts an emoji before the name instead (🔔 Home, 🗂️ Archive, ✉️ Send,
⚙️ Setup, 📊 Stats, 🧰 Tools), `tabs: text` shows the name alone.

In a dashboard of your own (or after **Take control**) the same is one line per view:

```yaml
views:
  - title: Home
    icon: mdi:bell
    show_icon_and_title: true   # without it Home Assistant shows the icon only
```

## Making it your own

To move cards around or add your own, use ⋮ → **Take control** in the dashboard: Home Assistant
turns the generated views into an ordinary dashboard you can edit, as with its own built-in
dashboards. From then on it no longer follows your installation by itself.
