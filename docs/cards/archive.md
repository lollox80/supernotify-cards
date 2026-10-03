# supernotify-archive-card

[← SuperNotify Cards](../../README.md) · [Common options](../configuration.md)

Notification history, read from the SuperNotify archive.

<img src="../images/archive.png" alt="supernotify-archive-card" width="800">

```yaml
type: custom:supernotify-archive-card
```

| Option | Required | Description |
|---|---|---|
| `limit` | no | notifications read from the archive (default 40, max 100) |
| `source` | no | `sensor` to keep using the command_line bridge below even on SuperNotify 2.10+ |
| `trigger_entity` | no | entity whose change means "a notification was sent" (default `sensor.supernotify_notifications`) |
| `entity` | no | bridge only: sensor holding the archive index (default `sensor.supernotify_archivio`) |
| `intro` | no | info banner at the top of the card |
| `style` | no | `supernotify` (default) or `theme` |

**SuperNotify 2.10.0 or later: nothing to set up.** The card reads the archive through the
`supernotify.enquire_archive` action (the file archive must be on in SuperNotify's options). It
asks for the latest `limit` notifications once, then only for the newest few each time
`trigger_entity` changes, and shares what it read with the why card and the recipients card on
the same page.

### Before SuperNotify 2.10: the command_line bridge

Older versions have no action to read the archive, and a Lovelace card cannot read files
(`media_source` serves only audio/image/video, so a `.json` comes back 404 even with a signed
URL). The card then needs an index of the archive in the attributes of a sensor. Copy
`tools/sn_archive_index.py` to `/config/tools/` and add:

```yaml
command_line:
  - sensor:
      name: "SuperNotify archivio"
      unique_id: supernotify_archivio_indice
      command: "python3 /config/tools/sn_archive_index.py"
      value_template: "{{ value_json.count }}"
      json_attributes: [items, chan, scen, generated, total_files, oldest, error, unreadable]
      scan_interval: 300
      command_timeout: 30

recorder:
  exclude:
    entities:
      - sensor.supernotify_archivio    # ~8 KB of attributes, no reason to store them
```

Optionally trigger a refresh right after each notification instead of waiting for the next
scan, with an automation on `sensor.supernotify_notifications` calling
`homeassistant.update_entity` on the sensor (the engine updates that counter *after* delivery,
so the JSON file is already on disk).

The script takes `--limit` (default 40), `--path` and `--message-chars`; it never raises, so a
missing folder or a corrupt file shows up as an attribute instead of breaking the sensor.

Once you are on SuperNotify 2.10+, the sensor, the automation, the shell command and the script
can all be removed: the cards stop reading them as soon as the action is there.

With a `supernotify-why-card` on the same view, an expanded row gets a **🔎 Why?** link.
