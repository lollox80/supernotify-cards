/**
 * SuperNotify Control Card — v0.1.0
 * Touch-first control center for SuperNotify (https://github.com/rhizomatics/supernotify)
 *
 * Status bar + big action tiles + grouped mode toggles.
 * Vanilla Custom Element, no build step, no dependencies.
 *
 * Example config: see README.md
 *
 * CHANGELOG
 * 2026-10-03 - v0.53.0. Redesign, step 5: why-card 0.9.0 answers first, details on demand.
 *   - The path in four steps under the title: call (channels named, or normal routing), scenarios
 *     in force, who was home, channels (sent / to look at / skipped).
 *   - Problems first: a failed channel (red) or one asked for but not sent (orange: a skip whose
 *     reason is not a routine one such as snooze, presence, priority, condition, scenario,
 *     switched off) gets its own box with the reason and what to do (NO_TARGET, ERROR,
 *     NO_ACTION, INVALID_ACTION_DATA).
 *   - Then the channels that went out; routine skips, channels not involved and the full
 *     selection trace are folded (`expand: true` opens them).
 * 2026-10-03 - v0.52.1. No card changed: HACS validation action added, release made after it passed
 *   (required to submit the repository to the HACS default store).
 * 2026-10-03 - v0.52.0. Redesign, step 4: control-card 0.27.0 and overview-card 0.25.0.
 *   control: the status bar is one line of text (no box, no capital labels); tiles have the icon
 *   on the left and one colour logic (on = blue tint, needs attention = orange tint), 2 per row on
 *   a phone (`tile_layout: stacked` = the old tall tiles); the last notification shows counts
 *   ("2 delivered", "1 failed", "1 missed", "2 skipped", channel names in the tooltip;
 *   `last_channels: true` = one chip per channel) and a "Why ›" button when a why-card is on the
 *   dashboard. Fixed: the text under an active snooze tile was white on the light orange tint (0.49).
 *   overview: health is one sentence on top ("2 things to look at" / "All good" with how many
 *   channels are on) and a list of what to look at, each with its detail (which channels are off,
 *   by readable name; the transport error message) and an "Open" link where there is one
 *   (`health: chips` = the old chips). Three numbers instead of five (`stats: full` = all five):
 *   active scenarios and snoozes are already in the list below and in the health list.
 * 2026-10-03 - v0.51.0. Redesign, step 3: deliveries-card 0.24.0 grouped by how a channel starts.
 *   - Sections "Start on their own", "Only when named in the call", "Only with a scenario",
 *     "Backup" with their count, instead of the same "always on" tag repeated on every row and a
 *     summary line on top. Header: "Channels · 7 of 8 on" (`title:` to rename it).
 *   - One status line per channel, saying what is going on right now: switched off, transport
 *     off, "paused now by <scenario>" when an active scenario turns it off, "on now through
 *     <scenario>" for a scenario-only channel. Read from the scenario entities' `delivery`
 *     attribute, as the why-card does. Switched-off rows are dimmed.
 *   - The other tags (action, fixed targets, target usage, native area/floor/label) are quieter.
 *   - "Reset overrides" moved to the bottom as a real button. `group: false` keeps one flat list.
 * 2026-10-03 - v0.50.0. Redesign, step 2: Home Assistant icons instead of emoji.
 *   - Every card's HTML goes through snIconify(): the ~80 emoji the cards use (channels,
 *     scenarios, tiles, chips, section headings, outcome signs) become <ha-icon> Material
 *     Design Icons, as in the rest of Home Assistant: the same drawing on iOS, Android and
 *     Windows, the theme's text colour, the size the emoji had. `icons: emoji` keeps the old
 *     look; emoji written in a card's config that are not in the table stay emoji.
 *   - Priority colours follow the palette (control and overview): "High" was #f0a020, 2.2:1.
 *   - The emoji left inside translations ("Critica ⚠️", "Inviata 🚀") are gone.
 * 2026-10-03 - v0.49.0. Redesign, step 1: foundations (design study "Studio card SuperNotify").
 *   - One palette for all 13 cards (snPalette), instead of 13 diverging copies. Light theme
 *     passes WCAG AA as text: blue #0277bd instead of #03a9f4 (2.6:1), warning #a04f00,
 *     success #1b7f45, error #c62828, secondary text #5b6b7c. Dark theme: dark text on blue
 *     fills. `style: theme` still takes every colour from the Home Assistant theme.
 *   - Active snooze tile: tinted surface instead of white text on orange.
 *   - control-card: the "missed" chip of the last notification is orange, as in the other
 *     cards (red stays for failed).
 *   - why-card: a channel skipped by a rule (snooze, scenario, no target) is grey, not orange:
 *     it is normal; orange stays for missed, red for failed.
 *   - The readable name (delivery `alias`) comes first in the deliveries, why, archive and
 *     composer cards; the technical name is small and monospaced next to it (or a tooltip).
 *   - The card version line at the bottom of every card is hidden; `show_version: true` shows it.
 *     The overview health strip still shows the SuperNotify version.
 * 2026-10-03 - v0.48.5. Docs only: short README (HACS shows the README of the latest release),
 *   one page per card in docs/cards. No card changed.
 * 2026-10-03 - v0.48.4. archive-card 0.31.1: skip reasons on the rows follow the UI language (the
 *   index keeps short Italian ones, so an English dashboard showed "pausa", "nessun target"), and
 *   priorities are translated in Italian. README: screenshots of every card (docs/images).
 * 2026-10-03 - v0.48.3. composer-card 0.15.3: camera names instead of entity ids in the picker and
 *   the preview; the preview shows the "📷 <camera>" text that goes out when the message is empty;
 *   the dry-run box shows scenario names as the why-card does. Shared helpers snCameraName /
 *   snScenarioName.
 * 2026-10-03 - v0.48.2. composer-card 0.15.2: a notification with a camera and no text gets
 *   "📷 <camera name>" as its text. SuperNotify sends a text-less photo push with message "",
 *   and the Android companion app showed nothing on the phone.
 * 2026-10-03 - v0.48.1. composer-card 0.15.1: the "Try without sending" button follows what Home
 *   Assistant is running (supernotify.notify able to answer, `response` in its description), not
 *   update.supernotify_update, which says 2.12 as soon as HACS has downloaded it, before the
 *   restart. "An action which does not return responses..." is explained as "restart needed".
 * 2026-10-03 - v0.48.0. composer-card 0.15.0: "Try without sending" on SuperNotify 2.12's real dry run.
 *   - 2.12 has no separate dry-run action: it is supernotify.notify with `dry_run: simulate`,
 *     answering with the notification itself (the archive JSON). The button shows on SuperNotify
 *     2.12 or later (read from update.supernotify_update; `dry_run: true|false` forces it), and the
 *     answer is drawn through snArchiveDetail: channels that would send and to whom, skipped ones
 *     with the reason, missed channels, priority, scenarios, who is home, raw JSON.
 *   - 2.12.0-beta1 writes a simulated notification into the duplicate cache, so the real Send
 *     right after would be dropped as a duplicate. The dry run therefore carries force_resend
 *     (no duplicate check, nothing cached); with `dry_run_dupe_check: true` it checks duplicates
 *     and the next Send of the same content carries force_resend instead.
 *   - `dry_run_action:` (for the action name guessed in 0.44.0) is gone.
 * 2026-10-03 - v0.47.0. Lighter, phone and dark theme.
 *   - Cards redraw only when something they show changed: control, overview, bands, deliveries,
 *     transports, recipients, scenarios and automations used to rescan every state and rebuild
 *     their lists on every state change in the house. Helpers snTracker / snTrackedHass /
 *     snChanged / snSnap: hass is read through a proxy that notes the entities each card looked
 *     at; a redraw happens when one of them, the entity list (for cards that scan it), language,
 *     theme, entity registry or services change, or once a minute for relative times.
 *   - composer-card: a notification without text (SuperNotify 2.11.1), when a camera or a
 *     channel is picked; on older versions it says 2.11.1 is needed. Send errors are shown.
 *   - getGridOptions() on every card: sensible default size in sections dashboards.
 *   - Dark theme / phone, from screenshots of all 13 cards at 390 px in both themes: native
 *     controls (time pickers in the bands card, selects, scrollbars) follow the theme
 *     (color-scheme); stats-card charts are drawn at the card's width, so their labels are no
 *     longer ~5 px on a phone, and redraw on resize; the snooze tile is shorter; "2 h fa" in the
 *     recipients card was capitalised as "2 H Fa".
 *   - overview, scenarios and simulator load their data as soon as they get hass, instead of
 *     showing "0 snoozed" and no last notification until the first 60 s poll.
 * 2026-10-03 - v0.46.0. Aligned with SuperNotify 2.11 / 2.11.1.
 *   - `missed` (2.11): a requested channel that could not go out. The archive rows carry it
 *     (`mi`), the archive card lists it next to delivered/failed/skipped, the why-card header
 *     shows it, and the control card's last-notification block shows a "missed" chip.
 *   - "Problems only" (archive-card) and the dot colour (why-card) no longer flag routine skips:
 *     snooze, presence, priority, delivery condition, scenario, switched-off channel or
 *     transport, and an implicit channel with no target. Shared helper snArchiveProblem().
 *   - Skip reasons: SuperNotify writes SNOOZED (the cards looked for SNOOZE), and
 *     TRANSPORT_DISABLED, NO_SCENARIO, NO_ACTION, INVALID_ACTION_DATA, UNKNOWN had no text.
 *   - Outcomes `error` and `fallback_delivery` are translated (the cards only knew `failed`).
 *   - Snoozes say what they are about (2.11.1 snoozes by name/tag, camera, channel, priority):
 *     control-card tile and overview-card chip, via snSnoozeLabel().
 *   control 0.23.0, overview 0.21.0, archive 0.30.0, why 0.5.0; tools/sn_archive_index.py
 *   writes `mi` and knows the same reasons.
 * 2026-09-26 - v0.45.1. Snooze tile and overview chip no longer show an expired snooze as one
 *   ending tomorrow. enquire_snoozes gives only "HH:MM:SS" and keeps expired snoozes until the
 *   nightly housekeeping, so a snooze that ended at 09:41 showed "1078 min left, until 09:41".
 *   New helper snLiveSnoozes(): works out the end from snoozed_at (+1 day only when the snooze
 *   crosses midnight), drops the ones already over, and uses full ISO timestamps when SuperNotify
 *   sends them. control-card 0.22.2 (tile, countdown, tap-to-clear), overview-card 0.20.3 (chip
 *   and stat). Clearing a snooze that fails now shows the error instead of "Snoozes cleared".
 * 2026-09-25 — v0.45.0. The archive and why cards read the archive through SuperNotify's own
 *   action, supernotify.enquire_archive (SuperNotify 2.10.0), instead of the command_line bridge.
 *   - archive-card 0.29.0, why-card 0.4.0 and recipients-card 0.21.0 use the action when Home
 *     Assistant has it: no sensor, no shell_command and no script in /config/tools are needed any
 *     more. On older SuperNotify, or with `source: sensor`, they keep reading
 *     sensor.supernotify_archivio and shell_command.sn_archive_detail as before;
 *   - one store is shared by all the cards on a page: the latest 40 notifications at first (set
 *     with `limit:`), then only the newest few each time sensor.supernotify_notifications changes;
 *   - the rows and the detail are built in the card by a port of tools/sn_archive_index.py
 *     (_item_of / detail_of), checked field by field against the script on 48 real archived
 *     notifications plus synthetic ones with errors, a full trace and suppressed channels;
 *   - the why-card opens a notification straight from the store, and only asks the action for
 *     one it has not loaded.
 * 2026-09-24 — v0.44.0. composer-card 0.13.0: "Try without sending" button, ready for the
 *   dry-run action jeyrb is adding to SuperNotify (issue #218, engine.async_dry_run()).
 *   - hidden until Home Assistant has the action (`supernotify.enquire_dry_run`, or the name
 *     set with `dry_run_action:`), so the card looks the same as before on older versions;
 *   - sends the same fields as the Send button and shows, without sending anything, which
 *     channels would fire and to whom, which would be skipped and why, the active scenarios,
 *     and whether the notification would be suppressed or fall back;
 *   - the send payload is now built in one place (_payload) for both buttons.
 * 2026-09-23 — v0.43.4. why-card 0.3.2: reads `delivery_provenance` where SuperNotify 2.8
 *   (PR #210) archives it, for every notification and not only with `debug: true`.
 *   - the "selection trace" section is only drawn when there really is a trace, instead of an
 *     empty box next to the channels;
 *   - `call` and `recipient:<name>` are no longer listed as scenarios that switch a channel off.
 * 2026-09-22 — v0.43.3. stats-card 0.22.1: channel icon and alias read the delivery switch,
 *   falling back to the binary_sensor. They only read the binary_sensor, so on SuperNotify 2.8
 *   with the deprecated mirrors deleted the Statistics card lost the channel names and icons.
 * 2026-09-22 — v0.43.2. Reset overrides button found by its registry translation_key: with
 *   SuperNotify 2.8.0 in an Italian HA it is button.supernotify_ripristina_override, not
 *   button.supernotify_reset_overrides, so the deliveries and transports cards did not show it.
 * 2026-09-22 — v0.43.1. why-card 0.3.1: opens the latest notification by itself
 *   (`auto_select: false` to wait for a pick), so it is never an empty box next to the archive.
 * 2026-09-22 — v0.43.0. Less empty space on the Archive and Timetable views.
 *   - archive-card 0.28.0 / why-card 0.3.0: optional `max_height` (any CSS length, e.g.
 *     `calc(100vh - 330px)`) keeps the list / the detail within the screen, scrolling inside,
 *     so the two cards side by side end at about the same height instead of one running on;
 *   - bands-card 0.13.0: the bands flow into two columns when the card is wide.
 * 2026-09-22 — v0.42.0. Layout that uses the width it gets, on a PC as on a phone.
 *   - shared SN_FLOW_CSS: the lists of the recipients, transports, deliveries, scenarios,
 *     automations and archive cards flow into as many columns as fit the CARD's width
 *     (auto-fill, 340px min, CSS grid), headings and summaries spanning the full row - one
 *     column on a phone or in a narrow section, two or three in a wide one;
 *   - composer and stats cards: the two-column parts collapse on the card's own width
 *     (container queries) instead of the browser window's, so they also fold in a narrow
 *     dashboard column on a desktop;
 *   - stats-card: day labels of the per-day chart thinned out on long windows (30 days no
 *     longer overlap), channel names get more room on narrow cards.
 * 2026-09-22 — v0.41.1. overview-card 0.20.2: the "active scenarios" chips showed the raw
 *   binary_sensor entity_id (the reactive path returns ids); they show the scenario's name again.
 * 2026-09-22 — v0.41.0. stats-card 0.21.0: 7 / 14 / 30 day switch in the header (`periods:`
 *   to change the choices, `days:` the default; the choice is remembered per browser). The
 *   daily series comes from long-term statistics, so it covers the whole window; hours,
 *   channels and priorities come from recorder history, and when that is shorter than the
 *   window the card now says over how many days they were computed.
 *   automations-card 0.14.1: no change of its own - the stats strings sit in its part of the
 *   bundle, so the version check counts them as its code.
 * 2026-09-22 — v0.40.1. why-card 0.2.0: the trace is only recorded when the call itself has
 *   `debug: true` (and archived with diagnostics) - the note said diagnostics alone. When the
 *   trace carries `delivery_provenance` (per-delivery enabled_by / disabled_by sources, proposed
 *   upstream), "selected by" and the reasons of the channels that did not start come from it
 *   instead of being reconstructed from today's configuration.
 * 2026-09-22 — v0.40.0. Ready for SuperNotify PR #207 (delivery/transport switches) and a new
 *   "Why?" card.
 *   - shared: snEntityRows() merges switch.* and binary_sensor.* per delivery/transport/
 *     recipient (switch preferred, keyed by the `name` attribute), so the rows are not doubled
 *     once #207 adds switches; snCleanName() also drops the "Delivery / Transport" prefix;
 *     snDeliveryAlias() reads the switch too; snResetOverridesButton() finds
 *     button.supernotify_reset_overrides; snWhyOpen() asks a supernotify-why-card on the
 *     page to show one notification.
 *   - deliveries-card 0.19.0 / transports-card 0.17.0: one row per channel, toggle through
 *     switch.turn_on/off when the switch exists (raw state write only on older SuperNotify),
 *     "transport off" tag from the `transport_enabled` attribute, "Reset overrides" button
 *     when SuperNotify has it.
 *   - recipients-card 0.19.0: last notification received, from notify.recipient_<name>
 *     (SuperNotify 2.7.0 stamps it on every delivery), with the matching archive title;
 *     tapping it opens that notification in the Why? card, or the entity otherwise.
 *   - archive-card 0.26.0: a "Why?" link on an expanded row.
 *   - NEW supernotify-why-card 0.1.0: for one notification, the scenarios in force, who was
 *     home, what the call asked for, and for every channel whether it went out, why not,
 *     and to which targets - plus the channels that did not even start, with the reason
 *     reconstructed from the current configuration, and the full selection trace when the
 *     archive has it (diagnostics). Detail fetched on demand through
 *     shell_command.sn_archive_detail (tools/sn_archive_index.py --detail).
 * 2026-09-22 — v0.30.1. SuperNotify 2.7.0 stable (commit 9065d8e) gives a scenario WITHOUT
 *   conditions a *manual* binary_sensor ("Scenario manuale <name>" / "Scenario Manual <name>",
 *   translation_key scenario_manual): read/write, restored across restarts, and the scenario
 *   applies while it is on (and the scenario switch is on). Before, such scenarios had no
 *   binary_sensor at all.
 *   - snCleanName() also drops the "Scenario manuale / Scenario Manual" prefix;
 *   - new snIsManualScenario(): registry translation_key (hass.entities) with the
 *     friendly_name prefix as fallback;
 *   - scenarios-card 0.17.0: a manual scenario gets a "✋ manual" tag and a second switch
 *     ("apply now") that writes the binary_sensor state - the documented way to drive it
 *     from outside SuperNotify; the enable switch stays as it is.
 * 2026-09-21 — v0.30.0. SuperNotify 2.7.0 (beta5+) gives every scenario and recipient a real
 *   `switch.supernotify_{scenario,recipient}_<name>` (enable/disable), keeps the recipient
 *   binary_sensor only as a deprecated mirror, and keeps the scenario binary_sensor only for
 *   scenarios with conditions, now meaning "conditions hold right now". The cards matched both
 *   domains with /^[a-z_]+\.supernotify_…/, so every recipient and scenario was listed twice,
 *   the recipient toggle wrote a fake state (POST /api/states) that no longer enables anything,
 *   and enabled switches (all "on") were counted as active scenarios.
 *   - new helpers snToggle() (switch.* -> switch.turn_on/turn_off service, anything else ->
 *     old snSetBinaryState fallback), snCleanName() (drops "SuperNotify ", the "Scenario /
 *     Recipient / Condizione scenario" prefix and the " abilitato / Enabled" suffix from the
 *     translated friendly_name) and snScenarioActive() (binary_sensor on AND switch not off);
 *   - recipients-card 0.18.0: one row per recipient, switch preferred, toggle via service;
 *   - scenarios-card 0.16.0: one row per scenario merging switch (enabled + attributes) and
 *     binary_sensor (condition state); new live on/off switch per row; "active now" requires
 *     the scenario to be enabled too;
 *   - control-card 0.22.1 / overview-card 0.20.1: active-scenario count ignores disabled ones.
 *   Older SuperNotify (binary_sensor only) keeps working through the fallbacks.
 * 2026-09-15 — v0.23.1. deliveries-card v0.17.0: SuperNotify 2.5.0 renamed the delivery
 *   attribute `selection` to `inclusion` (and made it a list), so the channel tag silently
 *   fell back to "implicit" for every delivery. Now reads `inclusion` with `selection` as
 *   fallback, and labels each entry of the list instead of the joined string.
 * 2026-09-11 — v0.23.0. New supernotify-archive-card: the notification history, at last.
 *   SuperNotify writes one JSON file per notification under /config/supernotify/archive, but a
 *   browser card cannot read the filesystem (and media_source only serves audio/image/video —
 *   a signed URL for a .json returns 404). So a small script (tools/sn_archive_index.py) is run
 *   by a command_line sensor and publishes a compact index (last 40 notifications, ~8 KB) in the
 *   attributes of sensor.supernotify_archivio: the card reads those, so the data travels over the
 *   authenticated WebSocket and no file is exposed under /local. The index shares two lookup
 *   tables (`chan`, `scen`) that rows reference by position, which roughly halves its size.
 *   The card groups rows by day, shows time, title, message, per-channel outcome (delivered /
 *   failed / skipped with reason), priority and duration, and expands a row for scenarios and ids.
 *   Free-text search plus filters (all / problems only / today). This is a BRIDGE: when
 *   SuperNotify gains a native service (enquire_archive) the card will switch to it.
 *   New i18n block SN_ARCH_STRINGS (en/it).
 * 2026-09-11 — v0.22.0. Per-card versions (Lollo's request): new SN_CARD_VERSIONS map, one entry
 *   per card, bumped only when that card changes; every footer now prints its own card version
 *   instead of the bundle VERSION (which stays for HACS/releases, the stats-card version strip and
 *   the console banner). Initial values = the release in which each card last changed, from
 *   CHANGELOG.md. New tools/check_card_versions.py compares each card's source region with the
 *   previous commit and fails when it changed without a bump (run by the release script and CI).
 * 2026-09-11 — v0.21.0. Control card only. (1) Tiles now sit on a uniform grid
 *   (auto-fit, min 84px — five tiles fit one row in a 2-column section; `tile_columns: N` forces N columns).
 *   (2) Snooze tile shows a live countdown ("⏳ N min left", refreshed every 30 s) while a snooze is
 *   active — snooze_until comes from enquire_snoozes as local "HH:MM:SS". (3) Mode groups are
 *   collapsible: header shows active/total, tap to fold; a folded group still shows its ON pills;
 *   state kept in localStorage (`collapsible: false` disables, per-group `collapsed: true` folds by
 *   default). (4) New native "last notification" block (`last_notification: true`), meant to replace
 *   the markdown card: title from `last_notification_entity`, message (optional
 *   `last_notification_strip` regex removes e.g. a trailing timestamp line), priority chip, relative
 *   time from enquire_last_notification.created, channels with ✔/✖ (+ skipped count) using the
 *   delivery `alias` (shared helper snDeliveryAlias), optional repeat button (`repeat_entity`,
 *   an input_button). Refreshed on every change of sensor.supernotify_notifications and each minute.
 *   New i18n keys (en/it): grp_active, repeat, skipped_n, left, no_notif.
 *   Backup of the pre-change file: X:\sn_backups\cards_021_20260911\supernotify-control-card_pre_021.js
 * 2026-09-10 — v0.20.0. Overview card: new health strip on top (option `health`, default true):
 *   one chip per thing worth a glance — SuperNotify version (up to date / update available /
 *   restart required, from the HACS update entity `update_entity`), engine failures, transports
 *   with error_count > 0, channels switched off, DND active (`quiet_entity`, optional), active
 *   snoozes; a single green "all good" chip when nothing is wrong. Stats card: channel rows show
 *   the delivery `alias` (friendly_name) when configured, technical name underneath. New i18n keys
 *   h_* (en/it). Backup of the pre-change file: X:\sn_backups\stats_card_20260910\supernotify-control-card_pre_health.js
 * 2026-09-10 — v0.19.0. New supernotify-stats-card: usage analytics built ONLY from entities
 *   that already exist (no extra sensor, archive retention untouched — Lollo's choice).
 *   Daily series from the long-term statistics of the daily utility_meter
 *   (sensor.supernotify_inviate_oggi); hour/weekday/priority/day-period/channel detail from
 *   the recorder history of the "last notification" helpers (one change of
 *   input_datetime.supernotify_last_time = one notification, joined with the value the other
 *   helpers had at that moment). Channels come from input_text.supernotify_last_channels, now
 *   written AFTER delivery by the new automation "Supernotify - Log canali consegnati"
 *   (packages/supernotify/ultima_notifica.yaml) as "a, b, ✖c" — ✖ marks a channel that
 *   errored; older "auto (scenari)" values count as unknown. KPIs (total, per day, today vs
 *   average, peak hour, top channel, channel errors), inline-SVG bar charts, priority/period
 *   chips, auto-generated insights (share, peak, night share, weekend delta, 7-day trend,
 *   errors) and a version strip from the HACS update entities (installed vs latest, release
 *   link, brand icon) for both SuperNotify and these cards. i18n en/it.
 *   Backup of the pre-change file: X:\sn_backups\stats_card_20260910\supernotify-control-card_pre_stats.js
 * 2026-09-09 — v0.18.0. Overview card: removed the "Transports" section (name + ok/off badge
 *   per transport) — it duplicated what supernotify-transports-card already shows in the
 *   dedicated "Transport" dashboard view (same on/off state, rendered as a live switch), so
 *   transport status now lives in one place only. No i18n keys removed (`transports` and
 *   `no_transports` are still used by the transports card). Card description updated.
 *   Backup of the pre-change file: X:\sn_backups\supernotify_cards_20260909\supernotify-control-card_pre_overview_transports.js
 * 2026-09-08 — v0.17.0. Recipients card: explicit ⚙️ gear icon at the end of each row
 *   (next to the on/off switch), so tap-for-details is visible instead of implicit on the
 *   whole row. Tapping it fires the same hass-more-info event as before (native HA dialog,
 *   read-only — SuperNotify has no recipient Config Flow yet, contacts still live in
 *   recipients.yaml). New i18n key `details` (en/it).
 *   Backup of the pre-change file: X:\sn_backups\supernotify_cards_20260908\supernotify-control-card_pre_gear.js
 * 2026-09-08 — v0.16.0. SuperNotify 2.4.0-beta1 exposes binary_sensor.supernotify_delivery_*,
 *   _transport_* and _recipient_* as genuinely toggle-able (a state change is picked up by
 *   DeliveryRegistry/PeopleRegistry.handle_entity_state_change and enables/disables the real
 *   delivery/transport/recipient — see custom_components/supernotify/delivery.py and people.py).
 *   Added: deliveries-card and recipients-card rows now have a live on/off switch instead of a
 *   read-only badge; new supernotify-transports-card (same pattern, new — transports had no
 *   dedicated card before). Toggling calls the REST states endpoint directly (POST /api/states/
 *   <entity_id>, via hass.callApi — there is no HA service for a custom binary_sensor), since
 *   that's what SuperNotify's own state-change listener is built to react to.
 *   Backup of the pre-change file: X:\sn_backups\supernotify_cards_20260908\supernotify-control-card_pre_toggle.js
 */

const VERSION = "0.53.0"; // bundle / HACS release

/**
 * Per-card versions: bumped ONLY when that card changes (the bundle VERSION
 * above is what HACS tracks and moves at every release). Each card footer
 * prints its own entry, so "v0.16.0" on the deliveries card means the card
 * has not changed since 0.16.0 even if the bundle is newer.
 * tools/check_card_versions.py fails the release when a card's code changed
 * without a bump here.
 */
const SN_CARD_VERSIONS = {
  control: "0.27.0",
  overview: "0.25.0",
  bands: "0.16.0",
  deliveries: "0.24.0",
  transports: "0.21.0",
  recipients: "0.24.0",
  scenarios: "0.21.0",
  simulator: "0.12.0",
  composer: "0.17.0",
  automations: "0.18.0",
  stats: "0.25.0",
  archive: "0.33.0",
  why: "0.9.0",
};

/**
 * Minimal i18n: strings follow hass.language (override with `language:` in
 * the card config). English fallback.
 */
const SN_STRINGS = {
  en: {
    presence: "Presence", time_band: "Time band", quiet: "Quiet",
    act_scen: "Active scenarios", on: "on", off: "off", active: "active",
    dnd: "Do not disturb", tap_silence: "tap to silence",
    snooze: "Snooze", min: "min", pause_nc: "pause non-critical",
    snoozed: "Snoozed", until: "until", tap_clear: "tap to clear",
    announce: "Announce", intercom: "intercom",
    announce_ph: "Announce on all speakers…", send: "Send",
    announced: "Announced", cleared: "Snoozes cleared",
    snoozed_for: "Snoozed non-critical notifications for",
    sent: "Sent", sent_today: "Sent today", since_startup: "since startup",
    yesterday: "yesterday", failures: "Failures", deliveries: "Deliveries",
    enabled_total: "enabled/total", last_notif: "Last notification",
    transports: "Transports", delivered: "delivered", failed: "failed",
    channels: "channels", none: "none", no_transports: "no transport entities found",
    start: "start", volume: "volume", now: "now", crosses: "crosses midnight",
    no_voice: "no voice", mute_hint: "A band at <b>0%</b> sends <b>no voice announcement</b> at all (Alexa and TTS off, push and dashboard still delivered). Critical and high-priority alerts always speak.",
    enabled: "enabled", implicit: "always on", explicit: "on request",
    by_scenario: "scenario only", fallback: "backup", fallback_err: "backup on error",
    inc_sum: "of these channels", inc_always: "start on their own",
    inc_req: "only when asked for", inc_scen: "only with a scenario",
    grp_auto: "Start on their own", grp_named: "Only when named in the call", grp_scen: "Only with a scenario",
    grp_fallback: "Backup, when the others fail", ch_title: "Channels", ch_count: "{on} of {tot} on",
    off_manual: "switched off", paused_by: "paused now by", on_by: "on now through",
    fixed_targets: "fixed targets", no_deliveries: "no delivery entities found",
    home: "home", away: "away", devices: "devices", overrides: "delivery overrides",
    no_contact: "no contact points", no_recipients: "no recipient entities found",
    details: "Details",
    h_update: "update available:", h_restart: "restart Home Assistant to finish the update",
    h_uptodate: "up to date", h_transport_err: "transports with errors", h_channels_off: "channels off",
    h_all_good: "All good", h_health: "Health",
    h_look_1: "1 thing to look at", h_look_n: "{n} things to look at", h_rest_ok: "everything else works",
    h_ch_on: "{on} of {tot} channels on", h_open: "Open", ln_delivered: "delivered", ln_failed: "failed",
    ln_why: "Why",
    active_now: "active now", disabled: "disabled", other: "Other",
    manual: "manual", apply_now: "apply now", enabled_lbl: "enabled",
    reset_overrides: "Reset overrides", reset_done: "overrides reset",
    transport_off: "transport off", last_notified: "last notified", never_notified: "never notified",
    media: "media", no_scenarios: "no scenario entities found",
    sim_pick: "🎬 Scenarios — tap to simulate", sim_fire: "📤 Deliveries that would fire",
    sim_hint: "Real engine data (enquire services). Priority-based delivery filtering happens engine-side and is not simulated here. Disabled wins over enabled, like the runtime merge.",
    sim_none: "no deliveries would fire", scenario_tag: "scenario",
    title: "Title", message: "Message", priority: "Priority",
    channels_lbl: "Channels — none picked = normal routing",
    camera_lbl: "Camera snapshot", preview: "Preview",
    no_title: "(no title)", no_message: "(no message)",
    default_prio: "default (medium)",
    comp_hint: "Picked channels are sent with delivery_selection: fixed (only those fire). Critical really is critical — sirens included.",
    critical_confirm: "Send a CRITICAL notification? Sirens and max volume included.",
    write_first: "Write a message first", sent_toast: "Sent",
    write_or_pick: "Write a message, or pick a camera or a channel",
    need_2111: "A notification without text needs SuperNotify 2.11.1", send_err: "Not sent",
    dry_btn: "Try without sending", dry_title: "If you sent it now",
    dry_err: "Dry run failed", dry_would: "would send", dry_skip: "skipped",
    dry_nobody: "no recipient, direct targets only", dry_targets: "targets",
    dry_suppressed: "The notification would be suppressed", dry_fallback: "No channel would fire: fallback to",
    dry_none: "No channel selected", dry_scen: "Active scenarios", dry_raw: "Raw response",
    dry_prio: "Priority", dry_would_n: "channels would send", dry_nothing: "Nothing would be sent",
    dry_dupe: "Duplicate of a recent notification: it would be dropped",
    dry_no_dupe: "Duplicate check not simulated, so the real Send right after is not blocked.",
    dry_restart: "The SuperNotify running now cannot simulate: dry run needs 2.12, and Home Assistant must be restarted after the update.",
    dry_home: "Home", dry_empty: "SuperNotify gave no answer: is it 2.12 or later?",
    dry_reasons: { NO_TARGET: "no usable target", DUPE: "duplicate", PRIORITY: "not for this priority",
      SNOOZED: "snoozed", DELIVERY_CONDITION: "delivery condition false", OCCUPANCY: "presence rule",
      TRANSPORT_DISABLED: "transport off", DELIVERY_DISABLED: "switched off", NO_SCENARIO: "required scenario not in force",
      NO_ACTION: "no action", INVALID_ACTION_DATA: "invalid data", UNKNOWN: "unknown reason", ERROR: "error" },
    prio_minimum: "Minimum", prio_low: "Low", prio_medium: "Medium",
    prio_high: "High", prio_critical: "Critical",
    target_lbl: "Target — people, devices, areas, floors, labels",
    custom_target_lbl: "Custom targets (email, Telegram IDs, …) — comma separated",
    custom_target_ph: "e.g. user@example.com, 123456789",
    native_target_tag: "🎯 native area/floor/label",
    target_warn: "⚠️ Areas, floors and labels are only resolved by notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts and chime. With any other channel — or the default routing when no channel is picked above — the notification can silently end up with no target. Pick a compatible channel, or add a person/device directly.",
    aut_search: "Search automations…", aut_all: "All", aut_none: "No matches",
    aut_err: "Manifest not found — generate it with tools/genera_vista_automazioni.py",
    aut_updated: "list updated", aut_count: "automations", never: "never",
    ago_now: "now", ago_min: "min ago", ago_h: "h ago", ago_d: "d ago",
    aut_disabled_only: "Disabled only",
    grp_active: "active", repeat: "Repeat", skipped_n: "skipped", left: "left", missed_n: "missed",
    snz_all: "everything", snz_nc: "non-critical", snz_prio: "priority", snz_transport: "transport", snz_for: "for",
    no_notif: "no notification yet",
  },
  it: {
    presence: "Presenza", time_band: "Fascia oraria", quiet: "Silenzioso",
    act_scen: "Scenari attivi", on: "attivo", off: "spento", active: "attivo",
    dnd: "Non disturbare", tap_silence: "tocca per silenziare",
    snooze: "Snooze", min: "min", pause_nc: "pausa ai non critici",
    snoozed: "In pausa", until: "fino alle", tap_clear: "tocca per annullare",
    announce: "Annuncia", intercom: "interfono",
    announce_ph: "Annuncia su tutti gli Echo di casa…", send: "Invia",
    announced: "Annunciato", cleared: "Pause annullate",
    snoozed_for: "Notifiche non critiche in pausa per",
    sent: "Inviate", sent_today: "Inviate oggi", since_startup: "dall'avvio",
    yesterday: "ieri", failures: "Fallimenti", deliveries: "Delivery",
    enabled_total: "attive/totali", last_notif: "Ultima notifica",
    transports: "Transport", delivered: "consegnata", failed: "fallite",
    channels: "canali", none: "nessuno", no_transports: "nessuna entità transport trovata",
    start: "inizio", volume: "volume", now: "ora", crosses: "attraversa mezzanotte",
    no_voice: "niente voce", mute_hint: "Una fascia a <b>0%</b> <b>non manda proprio</b> l'annuncio vocale (Alexa e TTS spenti; push e notifica a schermo arrivano lo stesso). Gli avvisi critici e urgenti parlano sempre.",
    enabled: "attiva", implicit: "sempre attivo", explicit: "solo su richiesta",
    by_scenario: "solo con scenario", fallback: "riserva", fallback_err: "riserva su errore",
    inc_sum: "di questi canali", inc_always: "partono da soli",
    inc_req: "solo se richiesti", inc_scen: "solo con uno scenario",
    grp_auto: "Partono da soli", grp_named: "Solo se chiamati per nome", grp_scen: "Solo con uno scenario",
    grp_fallback: "Di riserva, se gli altri falliscono", ch_title: "Canali", ch_count: "{on} di {tot} accesi",
    off_manual: "spento a mano", paused_by: "in pausa ora:", on_by: "acceso ora da",
    fixed_targets: "target fissi", no_deliveries: "nessuna entità delivery trovata",
    home: "in casa", away: "fuori", devices: "dispositivi", overrides: "override delivery",
    no_contact: "nessun recapito", no_recipients: "nessuna entità destinatario trovata",
    details: "Dettagli",
    h_update: "aggiornamento disponibile:", h_restart: "riavvia Home Assistant per completare l'aggiornamento",
    h_uptodate: "aggiornato", h_transport_err: "transport con errori", h_channels_off: "canali spenti",
    h_all_good: "Tutto ok", h_health: "Stato",
    h_look_1: "1 cosa da guardare", h_look_n: "{n} cose da guardare", h_rest_ok: "il resto funziona",
    h_ch_on: "{on} di {tot} canali accesi", h_open: "Apri", ln_delivered: "consegnate", ln_failed: "fallite",
    ln_why: "Perché",
    active_now: "attivo ora", disabled: "disattivato", other: "Altro",
    manual: "manuale", apply_now: "applica ora", enabled_lbl: "abilitato",
    reset_overrides: "Ripristina override", reset_done: "override ripristinati",
    transport_off: "transport spento", last_notified: "ultimo avviso", never_notified: "nessun avviso",
    media: "media", no_scenarios: "nessuna entità scenario trovata",
    sim_pick: "🎬 Scenari — tocca per simulare", sim_fire: "📤 Canali che partirebbero",
    sim_hint: "Dati reali del motore (servizi enquire). Il filtro per priorità delle delivery avviene lato motore e non è simulato qui. Lo spegnimento vince sull'accensione, come nel merge reale.",
    sim_none: "nessun canale partirebbe", scenario_tag: "scenario",
    title: "Titolo", message: "Messaggio", priority: "Priorità",
    channels_lbl: "Canali — nessuno scelto = instradamento normale",
    camera_lbl: "Foto camera", preview: "Anteprima",
    no_title: "(senza titolo)", no_message: "(nessun messaggio)",
    default_prio: "default (media)",
    comp_hint: "I canali scelti partono con delivery_selection: fixed (solo quelli). Il critical è critical davvero — sirene incluse.",
    critical_confirm: "Inviare una notifica CRITICA? Sirene e volume massimo inclusi.",
    write_first: "Scrivi prima un messaggio", sent_toast: "Inviata",
    write_or_pick: "Scrivi un messaggio, oppure scegli una camera o un canale",
    need_2111: "Una notifica senza testo richiede SuperNotify 2.11.1", send_err: "Non inviata",
    dry_btn: "Prova senza inviare", dry_title: "Se la inviassi adesso",
    dry_err: "Simulazione non riuscita", dry_would: "partirebbe", dry_skip: "saltato",
    dry_nobody: "nessun destinatario, solo target diretti", dry_targets: "target",
    dry_suppressed: "La notifica verrebbe soppressa", dry_fallback: "Nessun canale partirebbe: ripiego su",
    dry_none: "Nessun canale selezionato", dry_scen: "Scenari attivi", dry_raw: "Risposta completa",
    dry_prio: "Priorità", dry_would_n: "canali partirebbero", dry_nothing: "Non partirebbe niente",
    dry_dupe: "Doppione di una notifica recente: verrebbe scartata",
    dry_no_dupe: "Controllo doppioni non simulato, così l'Invia subito dopo non viene bloccato.",
    dry_restart: "Il SuperNotify in esecuzione non sa simulare: la prova richiede la 2.12, e dopo l'aggiornamento Home Assistant va riavviato.",
    dry_home: "In casa", dry_empty: "SuperNotify non ha risposto: è la 2.12 o successiva?",
    dry_reasons: { NO_TARGET: "nessun destinatario utilizzabile", DUPE: "doppione", PRIORITY: "non per questa priorità",
      SNOOZED: "in pausa", DELIVERY_CONDITION: "condizione del canale falsa", OCCUPANCY: "regola di presenza",
      TRANSPORT_DISABLED: "transport spento", DELIVERY_DISABLED: "spento", NO_SCENARIO: "manca uno scenario richiesto",
      NO_ACTION: "nessuna azione", INVALID_ACTION_DATA: "dati non validi", UNKNOWN: "motivo sconosciuto", ERROR: "errore" },
    prio_minimum: "Minima", prio_low: "Bassa", prio_medium: "Media",
    prio_high: "Alta", prio_critical: "Critica",
    target_lbl: "Target — persone, dispositivi, aree, piani, etichette",
    custom_target_lbl: "Target personalizzati (email, ID Telegram, …) — separati da virgola",
    custom_target_ph: "es. utente@esempio.com, 123456789",
    native_target_tag: "🎯 area/piano/etichetta nativi",
    target_warn: "⚠️ Aree, piani ed etichette vengono risolti solo da notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts e chime. Con qualsiasi altro canale — o con l'instradamento di default se non scegli nessun canale qui sopra — la notifica può restare senza target senza nessun errore visibile. Scegli un canale compatibile, oppure aggiungi anche una persona/dispositivo diretto.",
    aut_search: "Cerca automazione…", aut_all: "Tutte", aut_none: "Nessun risultato",
    aut_err: "Manifest non trovato — generalo con tools/genera_vista_automazioni.py",
    aut_updated: "elenco aggiornato", aut_count: "automazioni", never: "mai",
    ago_now: "ora", ago_min: "min fa", ago_h: "h fa", ago_d: "g fa",
    aut_disabled_only: "Solo disattivate",
    grp_active: "attivi", repeat: "Ripeti", skipped_n: "saltati", left: "rimasti", missed_n: "mancati",
    snz_all: "tutto", snz_nc: "non critici", snz_prio: "priorità", snz_transport: "transport", snz_for: "per",
    no_notif: "nessuna notifica ancora",
  },
};

/**
 * Active snoozes only, each with `_end` (Date or null = no end).
 * enquire_snoozes returns snoozed_at / snooze_until as local "HH:MM:SS" (no date) and
 * keeps expired snoozes until the nightly housekeeping. The end is anchored on
 * snoozed_at: the start is today (yesterday if that time is still ahead), the end is on
 * the start's day, +1 day only when it is not after the start (snooze across midnight).
 * Full ISO timestamps, when SuperNotify sends them, are used as they are.
 */
/**
 * What a snooze is about, for people: "everything", "non-critical", a channel alias,
 * a camera name, a tag (SuperNotify 2.11.1, e.g. "porch"), a priority or a transport,
 * plus "for <person>" when it only covers one recipient. Fields from enquire_snoozes.
 */
function snSnoozeLabel(hass, s, T) {
  const st = (hass && hass.states) || {};
  const tt = String((s && s.target_type) || "").toUpperCase();
  const raw = s ? s.target : null;
  const tg = Array.isArray(raw) ? raw.join(", ") : (raw == null ? "" : String(raw));
  const fname = (id) => (st[id] && st[id].attributes && st[id].attributes.friendly_name) || "";
  let what;
  if (tt === "EVERYTHING") what = T.snz_all;
  else if (tt === "NONCRITICAL") what = T.snz_nc;
  else if (tt === "DELIVERY") what = snDeliveryAlias(hass, tg) || tg;
  else if (tt === "CAMERA") what = "📷 " + (fname(tg) || tg.replace(/^camera\./, ""));
  else if (tt === "TAG") what = "🏷️ " + tg;
  else if (tt === "PRIORITY") what = `${T.snz_prio} ${tg}`;
  else if (tt === "TRANSPORT") what = `${T.snz_transport} ${tg}`;
  else what = tg || tt.toLowerCase();
  if (String((s && s.recipient_type) || "").toUpperCase() === "USER" && s.recipient) {
    const who = fname(s.recipient) || String(s.recipient).replace(/^person\./, "");
    what += ` (${T.snz_for} ${who})`;
  }
  return what || "?";
}

/** Labels of active snoozes, at most `max` and "+N" for the rest. */
function snSnoozeLabels(hass, list, T, max = 2) {
  const labels = [...new Set((list || []).map((s) => snSnoozeLabel(hass, s, T)))];
  return labels.length > max ? labels.slice(0, max).join(", ") + ` +${labels.length - max}` : labels.join(", ");
}

function snLiveSnoozes(list, now) {
  now = now || new Date();
  const hms = (s) => {
    const m = String(s || "").match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    return m ? [+m[1], +m[2], +(m[3] || 0)] : null;
  };
  const iso = (s) => {
    if (!s || !/\d{4}-\d{2}-\d{2}T/.test(String(s))) return null;
    const d = new Date(s);
    return isNaN(d) ? null : d;
  };
  const out = [];
  for (const s of list || []) {
    if (!s) continue;
    if (!s.snooze_until) { out.push({ ...s, _end: null }); continue; }
    let end = iso(s.snooze_until);
    if (!end) {
      const u = hms(s.snooze_until);
      if (!u) { out.push({ ...s, _end: null }); continue; }
      const a = hms(s.snoozed_at);
      const start = new Date(now);
      if (a) {
        start.setHours(a[0], a[1], a[2], 0);
        if (start > now) start.setDate(start.getDate() - 1);
      }
      end = new Date(start);
      end.setHours(u[0], u[1], u[2], 0);
      if (a ? end <= start : end < now) end.setDate(end.getDate() + 1);
    }
    if (end > now) out.push({ ...s, _end: end });
  }
  return out;
}

function snT(config, hass) {
  const lang = ((config && config.language) || (hass && hass.language) || "en").split("-")[0];
  return SN_STRINGS[lang] || SN_STRINGS.en;
}

/**
 * Prototype-style intro banner, shared by every card.
 * Set `intro: <text>` (HTML allowed) in the card config to render it.
 */
function snIntro(config, dark) {
  if (!config || !config.intro) return "";
  const bg = dark ? "#14212e" : "#eef6fd";
  const bd = dark ? "#26384a" : "#cfe4f7";
  const fg = dark ? "#8fd0ff" : "#23577e";
  return `<div style="background:${bg};border:1px solid ${bd};color:${fg};
    border-radius:12px;padding:10px 14px;font-size:12.5px;line-height:1.55;
    margin-bottom:12px">${config.intro}</div>`;
}

/**
 * Toggle a SuperNotify delivery/transport/recipient binary_sensor.
 *
 * SuperNotify >= 2.4.0-beta1 exposes these as plain states set with
 * hass.states.async_set() (see hass_api.py expose_entity), not as a real
 * entity platform — there is no turn_on/turn_off service for them. What
 * DOES react is DeliveryRegistry/PeopleRegistry.handle_entity_state_change,
 * subscribed via async_track_state_change_event: it fires on ANY state
 * change to that entity_id, from any source. So the one thing a card can
 * do from the browser is write the new state through the REST API
 * (POST /api/states/<entity_id>) — same mechanism Developer Tools > States
 * uses. Attributes are included so the row doesn't blank out until the
 * next expose_entities() refresh.
 */
function snSetBinaryState(hass, entityId, on) {
  const cur = hass.states[entityId];
  const attributes = (cur && cur.attributes) || {};
  return hass.callApi("POST", `states/${entityId}`, {
    state: on ? "on" : "off",
    attributes,
  });
}

/**
 * Turn an entity on/off. SuperNotify >= 2.7.0 exposes scenarios and
 * recipients as real `switch` entities: those go through the switch service
 * (the only way that actually enables/disables them). Anything else (the
 * delivery/transport binary_sensors, or older SuperNotify) keeps the raw
 * state write above.
 */
function snToggle(hass, entityId, on) {
  if (entityId && entityId.startsWith("switch.")) {
    return hass.callService("switch", on ? "turn_on" : "turn_off", { entity_id: entityId });
  }
  return snSetBinaryState(hass, entityId, on);
}

/**
 * Human name from a SuperNotify friendly_name. Since 2.7.0 entity names are
 * translated and type-first ("SuperNotify Recipient Lorenzo abilitato",
 * "SuperNotify Condizione scenario Morning"): strip the integration name,
 * the type prefix and the "enabled" suffix. Returns "" when nothing is left
 * or the name is just the technical one.
 */
/* ════════════════════════════════════════════════════════════════════════
 * One palette for every card (0.49.0)
 *
 * The 13 cards each carried their own copy, with diverging values. Light
 * values pass WCAG AA (4.5:1) as text on the card background: the HA blue
 * #03a9f4 is only 2.6:1, so text, chips and filled buttons use #0277bd
 * (4.8:1, white text on it too). Warning text is #a04f00 (5.8:1), success
 * #1b7f45 (5.0:1), error #c62828 (5.6:1), secondary text #5b6b7c (5.5:1).
 * Dark theme: text on a blue fill is dark (white on #03a9f4 is 2.6:1).
 * `style: theme` takes everything from the Home Assistant theme.
 * warnSoft / warnLine / warnInk: a tinted surface for "on but limited"
 * states (an active snooze), instead of white text on orange.
 * ════════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════════
 * Home Assistant icons instead of emoji (0.50.0)
 *
 * Emoji look different on iOS, Android and Windows and ignore the theme
 * colour. Every card's HTML goes through snIconify(), which swaps the emoji
 * the cards use for <ha-icon> (Material Design Icons, as in the rest of Home
 * Assistant): same drawing everywhere, current text colour, 1.15em high so it
 * keeps the size the emoji had. Text inside tags, <style>, <svg>, <select>,
 * <option>, <textarea> and <title> is left alone. Emoji a user wrote in the
 * card config that are not in the table stay emoji; "mdi:..." icons in the
 * config already render as ha-icon. \`icons: emoji\` on a card keeps the old look.
 * ════════════════════════════════════════════════════════════════════════ */
const SN_EMOJI_MDI = [
  ["👨‍👩‍👧", "account-group"],
  ["✔", "check-circle"], ["✓", "check"], ["✖", "close-circle"], ["✕", "close"], ["✗", "close"],
  ["⚠", "alert"], ["⊘", "minus-circle-outline"], ["♻", "content-duplicate"], ["⛔", "cancel"], ["🚫", "cancel"],
  ["🎬", "movie-open-outline"], ["🔔", "bell-outline"], ["🔕", "bell-off-outline"], ["📤", "send-outline"],
  ["📨", "email-fast-outline"], ["📷", "camera-outline"], ["🖼", "image-outline"], ["⚙", "cog-outline"],
  ["😴", "sleep"], ["⏳", "timer-sand"], ["🎯", "target"], ["🌙", "weather-night"], ["🚀", "send"],
  ["🕐", "clock-outline"], ["⏰", "clock-time-four-outline"], ["🏠", "home-outline"], ["🚗", "car"],
  ["🗣", "account-voice"], ["🔍", "magnify"], ["🔎", "magnify"], ["🔁", "repeat"], ["🔄", "restart"],
  ["📢", "bullhorn-outline"], ["⬆", "arrow-up-circle-outline"], ["🌅", "weather-sunset-up"],
  ["🌤", "weather-partly-cloudy"], ["☀", "weather-sunny"], ["🌇", "weather-sunset-down"],
  ["🌃", "weather-night-partly-cloudy"], ["🔇", "volume-off"], ["🔉", "volume-low"], ["🔊", "volume-high"],
  ["🤫", "volume-low"], ["📱", "cellphone"], ["📵", "cellphone-off"], ["📺", "television"],
  ["🖥", "monitor"], ["✉", "email-outline"], ["💬", "message-text-outline"], ["✈", "send"],
  ["🕹", "dots-grid"], ["🎵", "music-note"], ["📌", "pin-outline"], ["📡", "access-point"],
  ["🔀", "call-split"], ["↔", "swap-horizontal"], ["🔌", "power-plug-outline"], ["🔗", "link-variant"],
  ["👤", "account"], ["🚨", "alarm-light-outline"], ["💼", "briefcase-outline"], ["🏖", "beach"],
  ["🎄", "pine-tree"], ["👻", "ghost-outline"], ["🚪", "door"], ["🛡", "shield-check-outline"],
  ["🔒", "lock-outline"], ["🔘", "gesture-tap-button"], ["✋", "hand-back-right-outline"],
  ["🏷", "tag-outline"], ["📊", "chart-bar"], ["📅", "calendar-today"], ["🏆", "trophy-outline"],
  ["💡", "lightbulb-on-outline"], ["📝", "pencil-outline"], ["🧭", "compass-outline"], ["🧪", "flask-outline"],
  ["ℹ", "information-outline"], ["↺", "restore"], ["🃏", "cards-outline"],
];
const SN_EMOJI_MAP = new Map(SN_EMOJI_MDI);
const SN_EMOJI_RE = new RegExp(
  SN_EMOJI_MDI.map(([e]) => e).sort((a, b) => b.length - a.length)
    .map((e) => e.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&") + "\\uFE0F?").join("|"), "gu");
const SN_ICON_SKIP = /^<(style|svg|select|option|textarea|title)\b/i;

function snIconify(html, cfg) {
  if (typeof html !== "string" || (cfg && cfg.icons === "emoji")) return html;
  SN_EMOJI_RE.lastIndex = 0;
  if (!SN_EMOJI_RE.test(html)) return html;
  const swap = (text) => text.replace(SN_EMOJI_RE, (e) =>
    '<ha-icon class="sn-i" icon="mdi:' + SN_EMOJI_MAP.get(e.replace(/️$/, "")) +
    '" style="--mdc-icon-size:1.15em;vertical-align:-.2em"></ha-icon>');
  const tagRe = /<[^>]*>/g;
  let out = "", last = 0, skip = null, m;
  while ((m = tagRe.exec(html))) {
    const text = html.slice(last, m.index);
    out += skip ? text : swap(text);
    const tag = m[0];
    if (!skip) {
      const k = SN_ICON_SKIP.exec(tag);
      if (k && !/\/>$/.test(tag)) skip = k[1].toLowerCase();
    } else if (tag.toLowerCase().startsWith("</" + skip)) skip = null;
    out += tag;
    last = tagRe.lastIndex;
  }
  const rest = html.slice(last);
  return out + (skip ? rest : swap(rest));
}

function snPalette(dark, style) {
  if (style === "theme") {
    return {
      brand: "var(--primary-color)", brandD: "var(--primary-color)",
      onBrand: "var(--text-primary-color, #fff)",
      ok: "var(--success-color, #1b7f45)", warn: "var(--warning-color, #a04f00)",
      crit: "var(--error-color, #c62828)",
      warnSoft: "rgba(var(--rgb-warning-color, 255,166,0), .16)",
      warnLine: "var(--warning-color, #f0c48a)", warnInk: "var(--primary-text-color)",
      line: "var(--divider-color)", panel: "var(--card-background-color)",
      soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
      ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
      dot: "var(--disabled-text-color)",
    };
  }
  return dark
    ? { brand: "#03a9f4", brandD: "#8fd0ff", onBrand: "#06131d", ok: "#7fe0a5", warn: "#f0b050",
        crit: "#ff9a9a", warnSoft: "rgba(240,160,32,.18)", warnLine: "#8a5a10", warnInk: "#ffd8a3",
        line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#9aa8b6",
        dot: "#3a4653" }
    : { brand: "#0277bd", brandD: "#01579b", onBrand: "#fff", ok: "#1b7f45", warn: "#a04f00",
        crit: "#c62828", warnSoft: "#fdf1e3", warnLine: "#f0c48a", warnInk: "#5c3200",
        line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#5b6b7c",
        dot: "#c3cdd8" };
}

function snCleanName(fn, techName) {
  if (!fn) return "";
  const n = String(fn)
    .replace(/^SuperNotify\s+/i, "")
    .replace(/^(Condizione scenario|Scenario Condition|Scenario manuale|Scenario Manual|Scenario|Recipient|Destinatario|Delivery|Transport)\s+/i, "")
    .replace(/\s+(abilitato|abilitata|attivo|enabled)$/i, "")
    .trim();
  return n && n !== techName ? n : "";
}

/**
 * Is a scenario active right now? binary_sensor.supernotify_scenario_<name>
 * says whether its conditions hold (or, for a scenario without conditions,
 * whether its manual state is on - SuperNotify >= 2.7.0), but not whether
 * it is enabled - that is switch.supernotify_scenario_<name>
 * (SuperNotify >= 2.7.0). Active = conditions hold AND not switched off.
 */
function snScenarioActive(hass, bsId) {
  if (!hass || !hass.states[bsId] || hass.states[bsId].state !== "on") return false;
  const sw = hass.states[bsId.replace(/^binary_sensor\./, "switch.")];
  return !sw || sw.state !== "off";
}

/**
 * SuperNotify >= 2.7.0: a scenario without conditions has a *manual*
 * binary_sensor (translation_key "scenario_manual") whose state is the control
 * - writing it on/off makes the scenario apply or not. The entity registry
 * entry (hass.entities) says so; the translated friendly_name is the fallback.
 */
function snIsManualScenario(hass, bsId) {
  const reg = hass && hass.entities && hass.entities[bsId];
  if (reg && reg.translation_key) return reg.translation_key === "scenario_manual";
  const st = hass && hass.states[bsId];
  const fn = st && st.attributes && st.attributes.friendly_name;
  return !!fn && /^(SuperNotify\s+)?(Scenario manuale|Scenario Manual)\s/i.test(fn);
}

/**
 * Delivery `alias:` (surfaced as friendly_name on the delivery binary_sensor).
 * The engine's auto-generated "<name> Delivery Configuration" is not an alias.
 * Returns null when no alias is configured.
 */
function snDeliveryEntity(hass, deliveryName) {
  for (const dom of ["switch", "binary_sensor"]) {
    const st = hass && hass.states[`${dom}.supernotify_delivery_${deliveryName}`];
    if (st) return st;
  }
  return null;
}

/**
 * Delivery `alias:` (surfaced as friendly_name on the delivery entity).
 * The engine's auto-generated "<name> Delivery Configuration" is not an alias.
 * Returns null when no alias is configured.
 */
function snDeliveryAlias(hass, deliveryName) {
  // SuperNotify >= PR #207: the switch carries the translated, alias-based name
  // ("SuperNotify Delivery Notifica sul telefono abilitata"); older versions put
  // the raw alias in the binary_sensor friendly_name.
  for (const dom of ["switch", "binary_sensor"]) {
    const st = hass && hass.states[`${dom}.supernotify_delivery_${deliveryName}`];
    const fn = st && st.attributes && st.attributes.friendly_name;
    if (!fn || fn === st.entity_id || /Delivery Configuration$/i.test(fn)) continue;
    const clean = snCleanName(fn, deliveryName);
    if (clean) return clean;
  }
  return null;
}

/**
 * One row per SuperNotify delivery / transport / recipient. SuperNotify >= PR #207
 * (and >= 2.7.0 for recipients) has a real switch.* plus, on older installs, a
 * deprecated binary_sensor.* mirror: merge them by name, switch preferred, so the
 * rows are not doubled. `name` is the model name (the `name` attribute when there is
 * one: switch entity_ids are slugified).
 */
function snEntityRows(hass, kind) {
  const byName = new Map();
  if (!hass) return [];
  const re = new RegExp(`^(switch|binary_sensor)\\.supernotify_${kind}_(.+)$`);
  for (const id of Object.keys(hass.states)) {
    const m = id.match(re);
    if (!m) continue;
    const s = hass.states[id];
    const a = s.attributes || {};
    const name = kind === "recipient" ? m[2] : String(a.name || m[2]);
    const prev = byName.get(name);
    if (prev && prev.isSwitch) continue;
    byName.set(name, { id, name, on: s.state === "on", a, isSwitch: m[1] === "switch" });
  }
  return [...byName.values()];
}

/**
 * The SuperNotify "Reset overrides" button (SuperNotify >= 2.8.0), or null.
 * Its entity_id follows the language HA was set up in (translation_key
 * "reset_overrides": button.supernotify_ripristina_override in Italian), so it
 * is found in the entity registry by platform + translation_key, with the
 * English id as the fallback when the registry is not available.
 */
function snResetOverridesButton(hass) {
  if (!hass) return null;
  const reg = hass.entities || {};
  for (const id of Object.keys(reg)) {
    const e = reg[id];
    if (id.startsWith("button.") && e && e.platform === "supernotify"
        && e.translation_key === "reset_overrides" && hass.states[id]) return id;
  }
  const id = "button.supernotify_reset_overrides";
  return hass.states[id] ? id : null;
}

/**
 * Who switched each channel on or off, for one archived notification. SuperNotify 2.8
 * (PR #210) archives it for every notification, and the index script returns it as `prov`;
 * before that it was inside the debug trace, and only with `debug: true`.
 */
function snProvOf(n) {
  const prov = (n && n.prov) || (n && n.trace && n.trace.prov);
  return prov && Object.keys(prov).length ? prov : null;
}

/**
 * Ask a supernotify-why-card on the page to show one notification (archive id or
 * its 8-char prefix). Returns false when there is no such card to answer.
 */
/* ════════════════════════════════════════════════════════════════════════
 * Archive through SuperNotify's own action (2.10.0+, supernotify.enquire_archive)
 *
 * Before 2.10 the archive reached the dashboard through a bridge: a command_line
 * sensor (sensor.supernotify_archivio) running tools/sn_archive_index.py, plus
 * shell_command.sn_archive_detail for one notification. When Home Assistant has
 * supernotify.enquire_archive, the archive and why cards read the archive from it
 * instead, and build the same compact rows and the same detail the script used to
 * print (snArchiveItem / snArchiveDetail below are a port of its _item_of and
 * detail_of), so the rest of both cards is unchanged. The bridge still works: it
 * is used when the action is missing, or when a card sets `source: sensor`.
 *
 * One store is shared by every card on the page:
 *   - the first card asks for the latest `limit` notifications (whole files, about
 *     10 KB each, so the default stays at 40);
 *   - after that, each time sensor.supernotify_notifications changes (SuperNotify
 *     updates it after every notification) only the newest few are asked for and
 *     merged in. `after` is not used for this on purpose: the action then reads
 *     every file in the archive to find the few newer ones.
 * Cards listen for the "supernotify-archive" window event to redraw, and also compare
 * snArchiveStore.version on every hass update: Home Assistant sets `hass` before the card
 * is in the page, so the first answer often arrives before the card can hear the event.
 * ════════════════════════════════════════════════════════════════════════ */

const SN_ARCHIVE_REASONS = {
  DUPE: "doppione", NO_TARGET: "nessun target", ERROR: "errore", DELIVERY_CONDITION: "condizione",
  SCENARIO: "scenario", OCCUPANCY: "presenza", PRIORITY: "priorita", DELIVERY_DISABLED: "spento",
  SNOOZE: "pausa", SNOOZED: "pausa", TRANSPORT_DISABLED: "transport spento", NO_SCENARIO: "scenario",
  NO_ACTION: "nessuna azione", INVALID_ACTION_DATA: "dati non validi", UNKNOWN: "sconosciuto",
};
/**
 * Short skip reasons that are just the configuration doing its job (SuperNotify 2.11
 * SuppressionReason.is_rule, plus a channel switched off, plus no target, which on 2.11
 * only stays quiet for an implicit channel: a requested one is counted in `missed`).
 */
const SN_ARCHIVE_ROUTINE = new Set(["pausa", "transport spento", "scenario", "priorita", "condizione",
  "presenza", "spento", "nessun target"]);

/** True when an archive row deserves a look: failures, missed channels, odd skips, odd outcomes. */
function snArchiveProblem(r) {
  if (!r) return false;
  if (r.f || r.mi) return true;
  if ((r.c || []).some((x) => Array.isArray(x) && (x[1] === "e" || (x[1] === "s" && !SN_ARCHIVE_ROUTINE.has(x[2] || ""))))) return true;
  // before 2.11 partial_delivery also covered routine skips: the channels above decide
  return !!r.o && r.o !== "success" && r.o !== "partial_delivery";
}
const SN_ARCHIVE_MESSAGE_CHARS = 130;
const SN_ARCHIVE_SPOKEN_CHARS = 110;
const SN_ARCHIVE_DETAIL_TEXT = 400;
const SN_ARCHIVE_DETAIL_VALUE = 160;
const SN_ARCHIVE_REFRESH = 5;

/** Length and slice by code point, like Python str: an emoji is one character, not two. */
function snLen(s) { return Array.from(String(s)).length; }
function snCut(s, n) { return Array.from(String(s)).slice(0, n).join(""); }

/** JSON the way Python's json.dumps writes it (", " and ": "), for text shown as-is. */
function snPyJson(v) {
  if (Array.isArray(v)) return "[" + v.map(snPyJson).join(", ") + "]";
  if (v !== null && typeof v === "object") {
    return "{" + Object.entries(v).map(([k, x]) => JSON.stringify(k) + ": " + snPyJson(x)).join(", ") + "}";
  }
  return v === undefined ? "null" : JSON.stringify(v);
}

function snIsObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

/** Python truthiness, since the archive JSON is written by Python: empty list, dict and string are false. */
function snTruthy(v) {
  if (Array.isArray(v) || typeof v === "string") return v.length > 0;
  if (snIsObj(v)) return Object.keys(v).length > 0;
  return !!v;
}

function snArchiveStamp(doc) {
  const t = doc && doc.created ? Date.parse(doc.created) : NaN;
  return isNaN(t) ? Math.floor(Date.now() / 1000) : Math.floor(t / 1000);
}

function snArchiveTitle(doc, message) {
  const cv = (doc && doc.condition_variables) || {};
  if (cv.notification_title) return snCut(cv.notification_title, 120);
  return snCut(String(message || "").split("\n")[0], 120);
}

function snArchiveShort(value, limit = SN_ARCHIVE_DETAIL_VALUE) {
  const text = String(value).split(/\s+/).filter(Boolean).join(" ");
  return snLen(text) <= limit ? text : snCut(text, limit - 1) + "…";
}

/** A channel that delivered is just its pool index; skipped or failed is [index, "s"|"e", reason?]. */
function snArchiveChannels(doc, chan) {
  const out = [];
  for (const [name, res] of Object.entries((doc && doc.deliveries) || {})) {
    if (!snIsObj(res)) continue;
    const idx = chan.id(name);
    if (snTruthy(res.error)) { out.push([idx, "e"]); continue; }
    if (snTruthy(res.success)) { out.push(idx); continue; }
    const skipped = snIsObj(res.skipped) ? res.skipped : {};
    let raw = skipped.suppression_reason || skipped.skip_reason;
    if (!raw) {
      for (const env of res.suppressed || []) {
        if (snIsObj(env) && env.skip_reason) { raw = env.skip_reason; break; }
      }
    }
    if (raw) {
      const key = String(raw).toUpperCase();
      out.push([idx, "s", SN_ARCHIVE_REASONS[key] || snCut(raw, 18).toLowerCase()]);
    } else {
      out.push([idx, "s"]);
    }
  }
  return out;
}

/** What Alexa or TTS actually said, from the call's action data. */
function snArchiveSpoken(doc) {
  for (const [name, res] of Object.entries((doc && doc.deliveries) || {})) {
    if (!snIsObj(res) || (!name.includes("alexa") && !name.includes("tts"))) continue;
    for (const call of res.success || []) {
      if (!snIsObj(call)) continue;
      let said = null;
      for (const c of call.calls || []) {
        if (snIsObj(c)) {
          said = ((c.action_data || {}).message) || said;
          if (said) break;
        }
      }
      said = said || call.message;
      if (said) return snCut(String(said).split(/\s+/).filter(Boolean).join(" "), SN_ARCHIVE_SPOKEN_CHARS);
    }
  }
  return null;
}

function snArchiveWhispered(doc) {
  for (const res of Object.values((doc && doc.deliveries) || {})) {
    if (!snIsObj(res)) continue;
    for (const call of res.success || []) {
      if (snIsObj(call) && String(((call.data || {}).message_template) || "").includes("whispered")) return true;
    }
  }
  return false;
}

/** One row of the archive index, in the format of tools/sn_archive_index.py. */
function snArchiveItem(doc, chan, scen) {
  const message = String(doc.message || "").trim();
  const title = snArchiveTitle(doc, message);
  let body = message;
  if (title && body.startsWith(title)) body = body.slice(title.length);
  body = body.split(/\s+/).filter(Boolean).join(" ");
  // the full id travels in `fid`, for the detail; `id` stays the 8 characters shown
  const item = { id: String(doc.id || "").slice(0, 8), fid: String(doc.id || ""), t: snArchiveStamp(doc), ti: title };
  if (body) {
    item.m = snCut(body, SN_ARCHIVE_MESSAGE_CHARS);
    if (snLen(body) > SN_ARCHIVE_MESSAGE_CHARS) item.mt = true;
  }
  if (doc.priority && doc.priority !== "medium") item.p = doc.priority;
  if (doc.outcome && doc.outcome !== "success") item.o = doc.outcome;
  for (const [key, field] of [["d", "delivered"], ["f", "failed"], ["s", "skipped"], ["mi", "missed"]]) {
    const val = parseInt(doc[field] || 0, 10);
    if (val) item[key] = val;
  }
  const chans = snArchiveChannels(doc, chan);
  if (chans.length) item.c = chans;
  const sc = doc.selected_scenario_names || [];
  if (sc.length) item.sc = sc.slice(0, 6).map((s) => scen.id(s));
  const ms = (doc.stats || {}).total_duration_ms;
  if (typeof ms === "number" && ms) item.ms = Math.round(ms * 10) / 10;
  if (snArchiveWhispered(doc)) item.w = true;
  const said = snArchiveSpoken(doc);
  if (said) {
    const flat = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const fs = flat(said);
    const same = [flat(message), flat(body), flat(title)].filter(Boolean)
      .some((f) => fs.startsWith(snCut(f, snLen(fs))) || f.startsWith(fs));
    if (fs && !same) item.sp = said;
  }
  return item;
}

function snArchivePool() {
  const names = [];
  const index = new Map();
  return {
    names,
    id(name) {
      name = String(name);
      if (!index.has(name)) { index.set(name, names.length); names.push(name); }
      return index.get(name);
    },
  };
}

/** {category: [values]} without empty categories; takes an object or a list of objects. */
function snArchiveTargets(target) {
  const out = {};
  for (const t of Array.isArray(target) ? target : [target]) {
    if (!snIsObj(t)) continue;
    for (const [cat, vals] of Object.entries(t)) {
      for (let v of Array.isArray(vals) ? vals : [vals]) {
        if (v === null || v === undefined) continue;
        const bucket = out[cat] || (out[cat] = []);
        v = snArchiveShort(v, 80);
        if (!bucket.includes(v)) bucket.push(v);
      }
    }
  }
  return out;
}

function snArchiveDelivery(name, res) {
  const d = { n: name };
  if (!snIsObj(res)) { d.r = "?"; return d; }
  let envelopes = [];
  if (snTruthy(res.error)) { d.r = "err"; envelopes = res.error || []; }
  else if (snTruthy(res.success)) { d.r = "ok"; envelopes = res.success || []; }
  else if (snTruthy(res.suppressed)) { d.r = "supp"; envelopes = res.suppressed || []; }
  else {
    const skipped = snIsObj(res.skipped) ? res.skipped : {};
    d.r = "skip";
    if (skipped.suppression_reason) d.why = String(skipped.suppression_reason);
    if (skipped.target_required) d.tr = String(skipped.target_required);
    const tg = snArchiveTargets(skipped.targets || []);
    if (Object.keys(tg).length) d.tg = tg;
    return d;
  }
  const targets = [];
  const errors = [];
  let calls = 0;
  for (const env of envelopes) {
    if (!snIsObj(env)) continue;
    if (env.target) targets.push(env.target);
    if (env.skip_reason && !("why" in d)) d.why = String(env.skip_reason);
    calls += (env.calls || []).length;
    for (const call of env.failedcalls || []) {
      if (snIsObj(call) && call.exception) errors.push(snArchiveShort(call.exception));
    }
  }
  const tg = snArchiveTargets(targets);
  if (Object.keys(tg).length) d.tg = tg;
  if (calls) d.calls = calls;
  if (errors.length) d.err = errors.slice(0, 3);
  return d;
}

function snArchiveProvenance(doc) {
  for (const prov of [doc.delivery_provenance, (doc.debug_trace || {}).delivery_provenance]) {
    if (snIsObj(prov) && Object.keys(prov).length) {
      const out = {};
      for (const [k, v] of Object.entries(prov)) if (snIsObj(v)) out[k] = v;
      return out;
    }
  }
  return null;
}

function snArchiveTrace(doc) {
  const trace = doc.debug_trace;
  if (!snIsObj(trace)) return null;
  const out = {};
  const sel = trace.delivery_selection;
  if (snIsObj(sel) && Object.keys(sel).length) {
    out.sel = {};
    for (const [k, v] of Object.entries(sel)) out.sel[k] = Array.isArray(v) ? [...v] : v;
  }
  const res = trace.resolved;
  if (snIsObj(res) && Object.keys(res).length) {
    const chains = {};
    for (const [name, stages] of Object.entries(res)) {
      if (!snIsObj(stages)) continue;
      const chain = [];
      for (const [stage, value] of Object.entries(stages)) {
        if (value === "NO_CHANGE") continue;
        chain.push([stage, (snIsObj(value) || Array.isArray(value)) ? snArchiveTargets(value) : snArchiveShort(value)]);
      }
      if (chain.length) chains[name] = chain;
    }
    if (Object.keys(chains).length) out.res = chains;
  }
  const exc = trace.delivery_exceptions;
  if (snIsObj(exc) && Object.keys(exc).length) {
    out.exc = {};
    for (const [k, v] of Object.entries(exc)) out.exc[k] = snArchiveShort(snPyJson(v), 300);
  }
  return Object.keys(out).length ? out : null;
}

/** The detail of one notification, in the format of sn_archive_index.py --detail. */
function snArchiveDetail(doc) {
  const message = String(doc.message || "").trim();
  const out = {
    id: doc.id, t: snArchiveStamp(doc), ti: snArchiveTitle(doc, message),
    m: snArchiveShort(message, SN_ARCHIVE_DETAIL_TEXT), p: doc.priority || "medium",
    o: doc.outcome || "", sel: doc.delivery_selection || "", v: doc.version || "",
  };
  if (doc.spoken_message) out.sp = snArchiveShort(doc.spoken_message, SN_ARCHIVE_DETAIL_TEXT);
  if (doc.dupe) out.dupe = true;
  const missed = parseInt(doc.missed || 0, 10);
  if (missed) out.mi = missed;
  const scen = {};
  for (const [key, field] of [["on", "enabled_scenarios"], ["sel", "selected_scenario_names"],
    ["ap", "applied_scenario_names"], ["rq", "required_scenario_names"], ["cs", "constrain_scenario_names"]]) {
    let val = doc[field];
    if (snIsObj(val)) val = Object.keys(val);
    if (snTruthy(val)) scen[key] = [...val];
  }
  if (Object.keys(scen).length) out.sc = scen;
  const occ = doc.occupancy || {};
  const flags = ((doc.condition_variables || {}).occupancy) || [];
  const home = (occ.home || []).filter(snIsObj).map((p) => p.person);
  const away = (occ.not_home || []).filter(snIsObj).map((p) => p.person);
  if (home.length || away.length || flags.length) out.occ = { home, away, flags: [...flags] };
  const overrides = {};
  for (const [name, ov] of Object.entries(doc.delivery_overrides || {})) {
    if (!snIsObj(ov)) continue;
    const entry = { en: ov.enabled !== false };
    const tg = snArchiveTargets(ov.target || {});
    if (Object.keys(tg).length) entry.tg = tg;
    if (snTruthy(ov.data)) entry.data = Object.keys(ov.data).map(String).sort().slice(0, 8);
    overrides[name] = entry;
  }
  if (Object.keys(overrides).length) out.ov = overrides;
  out.dl = Object.entries(doc.deliveries || {}).map(([n, r]) => snArchiveDelivery(n, r));
  if (snTruthy(doc.delivery_exceptions)) {
    out.dx = snArchiveShort(snPyJson(doc.delivery_exceptions), 400);
  }
  const ctx = doc.original_context || {};
  if (snIsObj(ctx) && ctx.id) {
    out.ctx = {};
    for (const k of ["id", "parent_id", "user_id"]) if (ctx[k]) out.ctx[k] = ctx[k];
  }
  const trace = snArchiveTrace(doc);
  if (trace) out.trace = trace;
  const prov = snArchiveProvenance(doc);
  if (prov) out.prov = prov;
  return out;
}

/** True when this card should read the archive through supernotify.enquire_archive. */
function snArchiveNative(hass, config) {
  if (config && config.source === "sensor") return false;
  const svc = hass && hass.services && hass.services.supernotify;
  return !!(svc && svc.enquire_archive);
}

const snArchiveStore = {
  docs: [],            // archived notifications, newest first
  limit: 0,
  stamp: undefined,    // last_updated of the trigger entity at the last fetch
  loading: null,
  error: null,
  fetched: null,       // Date of the last successful fetch
  index: null,         // cached compact index, rebuilt when docs change
  version: 0,          // bumped on every fetch, so a card that missed the event still redraws

  async _call(hass, data) {
    const r = await hass.callWS({
      type: "call_service", domain: "supernotify", service: "enquire_archive",
      service_data: data, return_response: true,
    });
    return (r && r.response) || {};
  },

  /** Keep the store current for this card: first load, then only the newest few. */
  ensure(hass, limit, trigger) {
    const st = hass.states[trigger || "sensor.supernotify_notifications"];
    const stamp = st ? st.last_updated : "none";
    const want = Math.max(1, Math.min(100, limit || 40));
    if (this.loading) return;
    let data = null;
    if (!this.fetched || want > this.limit) data = { limit: want };
    else if (stamp !== this.stamp) data = { limit: SN_ARCHIVE_REFRESH };
    if (!data) return;
    this.limit = Math.max(this.limit, want);
    this.stamp = stamp;
    this.loading = this._call(hass, data).then((resp) => {
      const got = (resp.notifications || []).filter(snIsObj);
      const seen = new Set(got.map((d) => d.id));
      const merged = got.concat(this.docs.filter((d) => !seen.has(d.id)));
      merged.sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
      this.docs = merged.slice(0, this.limit);
      this.index = null;
      this.error = null;
      this.fetched = new Date();
    }).catch((e) => {
      this.error = (e && e.message) || String(e);
    }).finally(() => {
      this.loading = null;
      this.version += 1;
      window.dispatchEvent(new CustomEvent("supernotify-archive"));
    });
  },

  /** The compact index the cards already know, built from the store. */
  getIndex() {
    if (!this.fetched && !this.error) return { items: [], chan: [], scen: [], loading: true, native: true };
    if (!this.index) {
      const chan = snArchivePool();
      const scen = snArchivePool();
      const items = [];
      for (const doc of this.docs) {
        try { items.push(snArchiveItem(doc, chan, scen)); } catch (e) { /* one bad file never empties the list */ }
      }
      this.index = { items, chan: chan.names, scen: scen.names, native: true,
        generated: this.fetched ? this.fetched.toISOString() : null };
    }
    return { ...this.index, error: this.error && !this.docs.length ? this.error : null };
  },

  /** The archived notification whose id starts with this, from the store or from the action. */
  async doc(hass, id) {
    const wanted = String(id || "").toLowerCase();
    const found = this.docs.find((d) => String(d.id || "").toLowerCase().startsWith(wanted));
    if (found) return found;
    try {
      const resp = await this._call(hass, { id: wanted });
      return snIsObj(resp) && resp.id ? resp : null;
    } catch (e) {
      // archive_entry_not_found comes back as a service_validation_error: the file was
      // purged since the list was read, or the id never existed
      if (e && (e.code === "service_validation_error" || String(e.code || e.message || "").includes("not_found"))) return null;
      throw e;
    }
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * Redraw only when something the card looked at changed (0.47.0)
 *
 * Home Assistant hands every card a new `hass` on every state change in the
 * house, a temperature sensor included: the cards used to rescan all states and
 * rebuild their lists each time. Now each card reads hass through a proxy that
 * notes which entities it looked at; on the next update the card redraws only
 * when one of those state objects was replaced (HA replaces them on change), the
 * entity list grew or shrank (a card that scans it), language, theme, entity
 * registry or services changed, or a minute went by (relative times, current band).
 * ════════════════════════════════════════════════════════════════════════ */
function snTracker() {
  return { keys: new Set(), scanned: false, snap: null };
}

function snTrackedHass(hass, tr) {
  if (!hass || !hass.states) return hass;
  const states = new Proxy(hass.states, {
    get(t, k) { if (typeof k === "string") tr.keys.add(k); return t[k]; },
    has(t, k) { if (typeof k === "string") tr.keys.add(k); return k in t; },
    ownKeys(t) { tr.scanned = true; return Reflect.ownKeys(t); },
  });
  return new Proxy(hass, {
    get(t, k) {
      if (k === "states") return states;
      const v = t[k];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}

function snChanged(tr, hass) {
  const p = tr.snap;
  if (!p || !hass || !hass.states) return true;
  if (p.lang !== hass.language || p.themes !== hass.themes || p.entities !== hass.entities ||
      p.services !== hass.services || p.minute !== Math.floor(Date.now() / 60000)) return true;
  if (tr.scanned && p.count !== Object.keys(hass.states).length) return true;
  if (tr.keys.size !== p.objs.size) return true; // the card looked at something new
  for (const [k, obj] of p.objs) if (hass.states[k] !== obj) return true;
  return false;
}

function snSnap(tr, hass) {
  if (!hass || !hass.states) return;
  const objs = new Map();
  for (const k of tr.keys) objs.set(k, hass.states[k]);
  tr.snap = {
    objs, lang: hass.language, themes: hass.themes, entities: hass.entities, services: hass.services,
    minute: Math.floor(Date.now() / 60000), count: tr.scanned ? Object.keys(hass.states).length : 0,
  };
}

/**
 * SuperNotify version from its HACS update entity: true / false against `min`
 * ("2.11.1"), null when it cannot be told (no update entity, unparsable).
 */
function snSupernotifyAtLeast(hass, min, entity) {
  const st = hass && hass.states && hass.states[entity || "update.supernotify_update"];
  const raw = st && st.attributes && st.attributes.installed_version;
  const parse = (v) => {
    const m = String(v || "").match(/(\d+)\.(\d+)(?:\.(\d+))?/);
    return m ? [+m[1], +m[2], +(m[3] || 0)] : null;
  };
  const have = parse(raw);
  const want = parse(min);
  if (!have || !want) return null;
  for (let i = 0; i < 3; i++) if (have[i] !== want[i]) return have[i] > want[i];
  return true;
}

/** A camera's friendly name, or its entity_id without "camera.". */
function snCameraName(hass, id) {
  const st = hass && hass.states && hass.states[id];
  return (st && st.attributes && st.attributes.friendly_name) || String(id || "").replace(/^camera\./, "");
}

/** A scenario's readable name from its switch / binary_sensor, as the why-card shows it. */
function snScenarioName(hass, name) {
  for (const dom of ["switch", "binary_sensor"]) {
    const st = hass && hass.states && hass.states[`${dom}.supernotify_scenario_${name}`];
    const c = st && snCleanName(st.attributes.friendly_name, name);
    if (c) return c;
  }
  return name;
}

function snWhyOpen(id) {
  if (!id || !window.__snWhyCards) return false;
  window.dispatchEvent(new CustomEvent("supernotify-why", { detail: { id } }));
  return true;
}

/** "3 min ago" style relative label from a Date (i18n via T). */
function snAgo(date, T) {
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return T.ago_now;
  if (m < 60) return `${m} ${T.ago_min}`;
  const hh = String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
  if (m < 1440) return `${Math.floor(m / 60)} ${T.ago_h} · ${hh}`;
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")} ${hh}`;
}

/**
 * Shared CSS for the small pill on/off switch used by the toggle-able
 * delivery/transport/recipient rows (same look as automations-card's
 * enable/disable switch).
 */
/**
 * Lists that flow into as many columns as fit the card's own width: one on a
 * phone or in a narrow dashboard section, two or three in a wide one. Headings,
 * summaries and empty states (the direct children listed below) span the row.
 */
const SN_FLOW_CSS = `
  :host { display: block; container-type: inline-size; }
  .flow { display: grid; column-gap: 18px; align-items: start;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); }
  .flow > .sec, .flow > .grp, .flow > .day, .flow > .incsum, .flow > .rst, .flow > .empty,
  .flow > .badge, .flow > .tag, .flow > .err { grid-column: 1 / -1; }
`;

const SN_SWITCH_CSS = `
  .sw { position: relative; width: 40px; height: 22px; flex: none; }
  .sw input { opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  .sw .sl { position: absolute; inset: 0; border-radius: 999px; background: var(--sn-sw-line, #ccc);
    pointer-events: none; transition: background .15s; }
  .sw .sl::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px;
    height: 16px; border-radius: 50%; background: #fff; transition: left .15s; }
  .sw input:checked + .sl { background: var(--sn-sw-on, #03a9f4); }
  .sw input:checked + .sl::after { left: 21px; }
`;

class SupernotifyControlCard extends HTMLElement {
  static getStubConfig() {
    return {
      dnd_entity: "input_boolean.notifier_dnd",
      snooze_minutes: 30,
      tiles: ["dnd", "snooze", "announce"],
      groups: [],
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      snooze_minutes: 30,
      announce_delivery: "alexa_announce",
      tiles: ["dnd", "snooze", "announce"],
      groups: [],
      style: "supernotify", // "supernotify" = prototype look; "theme" = follow HA theme
      collapsible: true,     // groups fold on header tap (active/total counter)
      last_notification: false, // native "last notification" block (replaces a markdown card)
      ...config,
    };
    this._rendered = false;
    this._collapsed = null; // lazily loaded from localStorage
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
    if (this._config.last_notification) {
      const cnt = this._st("sensor.supernotify_notifications");
      if (cnt !== this._lastCount) { this._lastCount = cnt; this._refreshLast(); }
    }
    // first hass after connect: connectedCallback may have run without hass
    if (!this._booted) { this._booted = true; this._refreshSnoozes(); }
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 4 + (this._config.groups || []).length + (this._config.last_notification ? 2 : 0);
  }

  connectedCallback() {
    this._pollTimer = setInterval(() => { this._refreshSnoozes(); this._refreshLast(); }, 60000);
    // 30 s tick: snooze countdown + relative time of the last notification
    this._tickTimer = setInterval(() => {
      if (!this._rendered) return;
      if ((this._snoozes || []).length) this._renderTiles(); // also hides a snooze that just ended
      if (this._config.last_notification) this._renderLast();
    }, 30000);
    this._refreshSnoozes();
    this._refreshLast();
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
    clearInterval(this._tickTimer);
  }

  async _refreshLast() {
    if (!this._hass || !this._config.last_notification) return;
    try {
      const r = await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "enquire_last_notification",
        service_data: {}, return_response: true,
      });
      const n = r && r.response && Object.keys(r.response).length ? r.response : null;
      const raw = n ? (n.id || "") + "|" + (n.delivered || 0) + "|" + (n.failed || 0) : "";
      if (raw !== this._lastRaw) {
        this._lastRaw = raw;
        this._last = n;
        if (this._rendered) this._renderLast();
      }
    } catch (e) {
      // supernotify may still be loading; retry on next poll
    }
  }

  async _refreshSnoozes() {
    if (!this._hass) return;
    try {
      const r = await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "enquire_snoozes",
        service_data: {}, return_response: true,
      });
      const list = (r && r.response && r.response.snoozes) || [];
      const raw = JSON.stringify(list);
      if (raw !== this._snoozesRaw) {
        this._snoozesRaw = raw;
        this._snoozes = list;
        if (this._rendered) this._renderTiles();
      }
    } catch (e) {
      // supernotify may still be loading; retry on next poll
    }
  }

  // ── helpers ────────────────────────────────────────────────────────────
  _st(entityId) {
    const s = this._hass && this._hass.states[entityId];
    return s ? s.state : undefined;
  }
  _on(entityId) {
    return this._st(entityId) === "on";
  }
  _friendly(entityId, fallback) {
    const s = this._hass && this._hass.states[entityId];
    return (s && s.attributes.friendly_name) || fallback || entityId;
  }
  _toggle(entityId) {
    this._hass.callService("input_boolean", "toggle", { entity_id: entityId });
  }

  _activeBand() {
    const bands = this._config.bands;
    if (!bands) return null;
    const now = new Date();
    const t = now.getHours() * 60 + now.getMinutes();
    const entries = Object.entries(bands)
      .map(([name, b]) => {
        const raw = this._st(b.start) || "";
        const [h, m] = raw.split(":");
        if (h === undefined || m === undefined) return null;
        return { name: b.name || name, min: +h * 60 + +m, volume: b.volume };
      })
      .filter(Boolean)
      .sort((a, b) => a.min - b.min);
    if (!entries.length) return null;
    for (let i = 0; i < entries.length; i++) {
      const s = entries[i].min;
      const e = entries[(i + 1) % entries.length].min;
      const hit = s < e ? t >= s && t < e : t >= s || t < e;
      if (hit) return entries[i];
    }
    return null;
  }

  _activeScenarios() {
    if (!this._hass) return null;
    const ids = Object.keys(this._hass.states).filter((e) =>
      e.startsWith("binary_sensor.supernotify_scenario_")
    );
    if (!ids.length) return null;
    const known = ids.filter((e) => !["unknown", "unavailable"].includes(this._st(e)));
    if (!known.length) return null; // scenario state not exposed yet
    return known.filter((e) => snScenarioActive(this._hass, e));
  }

  async _snooze() {
    // SuperNotify snoozing is event-driven (same mechanism as the push
    // notification buttons): fire a mobile_app_notification_action event
    // with a SUPERNOTIFY_<CMD>_<RECIPIENT>_<TARGET>_<minutes> action name.
    // NONCRITICAL keeps critical notifications flowing during the snooze.
    // When a snooze is already active, tapping the tile clears it instead.
    const T = snT(this._config, this._hass);
    if (snLiveSnoozes(this._snoozes).length) {
      try {
        await this._hass.callWS({
          type: "call_service", domain: "supernotify", service: "clear_snoozes",
          service_data: {}, return_response: true,
        });
        this._toast(T.cleared);
      } catch (e) {
        this._toast(`✖ ${(e && e.message) || e}`);
      }
    } else {
      const minutes = this._config.snooze_minutes || 30;
      const action =
        this._config.snooze_action || `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_${minutes}`;
      this._hass.callApi("POST", "events/mobile_app_notification_action", { action });
      this._toast(`${T.snoozed_for} ${minutes} ${T.min}`);
    }
    setTimeout(() => this._refreshSnoozes(), 800);
  }

  _announce() {
    const input = this.shadowRoot.getElementById("announceInput");
    const message = (input.value || "").trim();
    if (!message) {
      input.focus();
      return;
    }
    const delivery = {};
    delivery[this._config.announce_delivery || "alexa_announce"] = {};
    this._hass.callService("notify", "supernotify", {
      message,
      data: { delivery_selection: "fixed", delivery },
    });
    input.value = "";
    this._toast(snT(this._config, this._hass).announced);
  }

  _toast(msg) {
    const t = this.shadowRoot.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  // ── palette ────────────────────────────────────────────────────────────
  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  // ── render ─────────────────────────────────────────────────────────────
  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; position: relative; background: ${p.panel}; color: ${p.ink}; }
        .statusbar { display: flex; flex-wrap: wrap; gap: 4px 18px; padding: 0 4px; margin-bottom: 12px;
                     font-size: 13.5px; }
        .sseg { display: inline-flex; align-items: baseline; gap: 6px; }
        .sl { color: ${p.muted}; white-space: nowrap; }
        .sv { font-weight: 650; white-space: nowrap; }
        .tiles { display: grid; gap: 10px;
                 grid-template-columns: ${this._config.tile_columns
                   ? `repeat(${+this._config.tile_columns}, minmax(0, 1fr))`
                   : this._config.tile_layout === "stacked" ? "repeat(auto-fit, minmax(84px, 1fr))" : "repeat(auto-fill, minmax(150px, 1fr))"}; }
        .ctile { border: 1.5px solid ${p.line}; border-radius: 12px;
                 background: ${p.panel}; padding: 12px 14px;
                 text-align: left; cursor: pointer; user-select: none;
                 min-height: 64px; display: flex; flex-direction: row;
                 align-items: center; justify-content: flex-start; gap: 12px;
                 transition: transform .1s, border-color .15s; }
        .ctile .tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .stacked .ctile { flex-direction: column; text-align: center; justify-content: center; gap: 5px;
                          min-height: 96px; padding: 14px 8px; }
        .stacked .ctile .tx { align-items: center; }
        .ctile:hover { border-color: ${p.brand}; transform: translateY(-1px); }
        .ctile:active { transform: scale(.97); }
        .ctile .ti { --mdc-icon-size: 26px; font-size: 24px; line-height: 1.1; flex: none; color: ${p.muted}; }
        .stacked .ctile .ti { --mdc-icon-size: 30px; font-size: 30px; }
        .ctile b { font-size: 14px; line-height: 1.25; }
        .ctile .ts { font-size: 11px; color: ${p.muted}; line-height: 1.25; }
        .ctile.on { background: ${p.soft}; border-color: ${p.brand}; color: ${p.ink}; }
        .ctile.on .ti { color: ${p.brand}; }
        .ctile.warn { background: ${p.warnSoft}; border-color: ${p.warnLine}; color: ${p.warnInk}; }
        .ctile.warn .ti, .ctile.warn .ts { color: ${p.warnInk}; }
        .announce { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
        .announce input { flex: 1; border: 1.5px solid ${p.line}; border-radius: 10px;
                          padding: 10px 12px; font-size: 13.5px; background: ${p.panel};
                          color: ${p.ink}; }
        .announce input:focus { outline: none; border-color: ${p.brand};
                                box-shadow: 0 0 0 3px rgba(3,169,244,.14); }
        .announce button {
          border: 0; border-radius: 10px; background: ${p.brand}; color: ${p.onBrand};
          font-weight: 700; padding: 10px 16px; cursor: pointer; font-size: 13px; }
        .mgroup { font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
                  font-weight: 800; color: ${p.muted}; margin: 14px 0 8px;
                  display: flex; align-items: center; gap: 8px; }
        .mgroup.clk { cursor: pointer; user-select: none; }
        .mgroup .gc { font-size: 10.5px; font-weight: 700; letter-spacing: 0; text-transform: none;
                      border-radius: 999px; padding: 2px 8px; background: ${p.soft}; color: ${p.brandD}; }
        .mgroup .gc.zero { background: transparent; border: 1px solid ${p.line}; color: ${p.muted}; }
        .mgroup .gv { margin-left: auto; font-size: 12px; opacity: .8; transition: transform .15s; }
        .mgroup.fold .gv { transform: rotate(-90deg); }
        .lastn { border: 1px solid ${p.line}; border-radius: 14px; padding: 12px 14px;
                 margin-bottom: 14px; background: ${p.panel}; box-shadow: 0 1px 3px rgba(16,42,67,.06); }
        .lastn .lh { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .lastn .lt { font-size: 14.5px; font-weight: 750; flex: 1; min-width: 0;
                     overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lastn .lm { font-size: 13px; line-height: 1.45; white-space: pre-line; color: ${p.ink}; }
        .lastn .lf { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px;
                     font-size: 11.5px; color: ${p.muted}; }
        .lastn .lb { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px;
                     padding: 3px 9px; font-weight: 700; font-size: 11px; background: ${p.soft}; }
        .lastn .lb.ok { color: ${p.ok}; background: rgba(46,158,91,.12); }
        .lastn .lb.err { color: ${p.crit}; background: rgba(226,60,60,.12); }
        .lastn .lb.mis { color: ${p.warn}; background: rgba(240,160,32,.14); }
        .lastn .lb.mut { color: ${p.muted}; background: transparent; border: 1px solid ${p.line}; }
        .lastn .rep { margin-left: auto; border: 1.5px solid ${p.line}; background: ${p.panel};
                      color: ${p.brandD}; border-radius: 999px; padding: 5px 12px; font-size: 12px;
                      font-weight: 700; cursor: pointer; }
        .lastn .rep:hover { border-color: ${p.brand}; }
        .lastn .why + .rep { margin-left: 0; }
        .lastn .rep:active { transform: scale(.96); }
        .mpill { display: inline-flex; align-items: center; gap: 7px;
                 border: 1.5px solid ${p.line}; background: ${p.panel};
                 border-radius: 999px; padding: 9px 15px; font-size: 13px; font-weight: 650;
                 cursor: pointer; margin: 0 6px 8px 0; user-select: none; transition: .15s; }
        .mpill:hover { border-color: ${p.brand}; }
        .mpill:active { transform: scale(.96); }
        .mpill.on { border-color: ${p.brand}; color: ${p.brandD}; background: ${p.soft}; }
        .mpill .pd { width: 8px; height: 8px; border-radius: 50%; background: ${p.dot}; }
        .mpill.on .pd { background: ${p.ok}; box-shadow: 0 0 0 3px rgba(46,158,91,.18); }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7;
               margin-top: 10px; user-select: none; }
        .toast { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%) translateY(20px);
                 background: ${p.ink}; color: ${p.panel};
                 border-radius: 10px; padding: 8px 16px; font-size: 12.5px; font-weight: 650;
                 opacity: 0; pointer-events: none; transition: .25s; }
        .toast.show { opacity: .95; transform: translateX(-50%) translateY(0); }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="statusbar" id="statusbar"></div>
        ${this._config.last_notification ? `<div class="lastn" id="lastn"></div>` : ""}
        <div class="tiles${this._config.tile_layout === "stacked" ? " stacked" : ""}" id="tiles"></div>
        ${(this._config.tiles || []).includes("announce") ? `<div class="announce" id="announceRow">
          <ha-icon icon="mdi:bullhorn"></ha-icon>
          <input id="announceInput" placeholder="${snT(this._config, this._hass).announce_ph}">
          <button id="announceBtn">${snT(this._config, this._hass).send}</button>
        </div>` : ""}
        <div id="groups"></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-control-card v${SN_CARD_VERSIONS.control}</div>` : ""}
        <div class="toast" id="toast"></div>
      </ha-card>`, this && this._config);
    const abtn = this.shadowRoot.getElementById("announceBtn");
    if (abtn) {
      abtn.addEventListener("click", () => this._announce());
      this.shadowRoot.getElementById("announceInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") this._announce();
      });
    }
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    this._renderStatus();
    if (this._config.last_notification) this._renderLast();
    this._renderTiles();
    this._renderGroups();
  }

  _renderLast() {
    const el = this.shadowRoot.getElementById("lastn");
    if (!el) return;
    const c = this._config;
    const T = snT(c, this._hass);
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const n = this._last;
    const titleFromEntity = c.last_notification_entity ? this._st(c.last_notification_entity) : undefined;
    const title = (n && n.title) || (titleFromEntity && !["unknown", "unavailable", ""].includes(titleFromEntity) ? titleFromEntity : "");
    let msg = (n && n.message) || "";
    if (c.last_notification_strip) {
      try { msg = msg.replace(new RegExp(c.last_notification_strip, "m"), "").trim(); } catch (e) { /* bad regex: ignore */ }
    }
    if (!n && !title) { el.innerHTML = snIconify(`<div class="lm" style="opacity:.7">${T.no_notif}</div>`, this && this._config); return; }
    const pp = this._palette();
    const prioCol = { critical: pp.crit, high: pp.warn, medium: pp.brandD, low: pp.muted, minimum: pp.muted };
    const prio = n && n.priority
      ? `<span class="lb" style="color:${prioCol[n.priority] || "inherit"}">● ${esc(T["prio_" + n.priority] || n.priority)}</span>` : "";
    let when = "";
    if (n && n.created) { const d = new Date(n.created); if (!isNaN(d)) when = `<span class="lb mut">🕐 ${esc(snAgo(d, T))}</span>`; }
    const chips = [];
    const okNames = [], errNames = [];
    let skipped = 0;
    if (n && n.deliveries && typeof n.deliveries === "object") {
      for (const [name, d] of Object.entries(n.deliveries)) {
        const ok = d && Array.isArray(d.success) && d.success.length;
        const err = d && Array.isArray(d.error) && d.error.length;
        if (!ok && !err) { skipped++; continue; }
        const label = snDeliveryAlias(this._hass, name) || name;
        (err ? errNames : okNames).push(label);
        if (c.last_channels) chips.push(`<span class="lb ${err ? "err" : "ok"}">${err ? "✖" : "✔"} ${esc(label)}</span>`);
      }
    }
    // 0.52.0: counts with the channel names in the tooltip (`last_channels: true` = one chip each)
    if (!c.last_channels) {
      if (okNames.length) chips.push(`<span class="lb ok" title="${esc(okNames.join(", "))}">✔ ${okNames.length} ${T.ln_delivered}</span>`);
      if (errNames.length) chips.push(`<span class="lb err" title="${esc(errNames.join(", "))}">✖ ${errNames.length} ${T.ln_failed}</span>`);
    }
    if (n && +n.missed > 0) chips.push(`<span class="lb mis">⚠ ${esc(n.missed)} ${T.missed_n}</span>`);
    if (skipped) chips.push(`<span class="lb mut">${skipped} ${T.skipped_n}</span>`);
    const rep = c.repeat_entity
      ? `<button class="rep" id="repBtn">🔁 ${T.repeat}</button>` : "";
    const why = n && n.id && window.__snWhyCards
      ? `<button class="rep why" id="whyBtn">${esc(T.ln_why)} ›</button>` : "";
    el.innerHTML = snIconify(`
      <div class="lh"><span class="lt">${esc(title) || "📨 " + T.last_notif}</span>${prio}${when}</div>
      ${msg ? `<div class="lm">${esc(msg)}</div>` : ""}
      <div class="lf">${chips.join("")}${why}${rep}</div>`, this && this._config);
    const wb = el.querySelector("#whyBtn");
    if (wb) wb.onclick = () => snWhyOpen(n.id);
    const btn = el.querySelector("#repBtn");
    if (btn) btn.onclick = () => {
      const [dom] = c.repeat_entity.split(".");
      const svc = dom === "input_button" ? "press" : dom === "script" ? "turn_on" : "press";
      this._hass.callService(dom, svc, { entity_id: c.repeat_entity });
      this._toast("🔁 " + T.repeat);
    };
  }

  _renderStatus() {
    const c = this._config;
    const p = this._palette();
    const T = snT(c, this._hass);
    const segs = [];
    const seg = (l, v, color) =>
      `<div class="sseg"><span class="sl">${l}</span><span class="sv"${color ? ` style="color:${color}"` : ""}>${v}</span></div>`;
    if (c.presence_entity) {
      const st = this._st(c.presence_entity);
      segs.push(seg("🏠 " + T.presence, this._friendly(c.presence_entity, "") + " · " + (st === "home" ? T.home : st || "—"),
        st === "home" ? p.ok : undefined));
    }
    const band = this._activeBand();
    if (band) {
      const vol = band.volume ? Math.round(+this._st(band.volume) || 0) + "%" : "";
      segs.push(seg("🕐 " + T.time_band, band.name.replace(/_/g, " ") + (vol ? " · vol " + vol : ""), p.brandD));
    }
    if (c.dnd_entity || c.quiet_entity) {
      // quiet_entity (optional): a COMPUTED quiet state (e.g. a template
      // binary_sensor combining DND switch, schedules, voice toggle) shown in
      // the status bar, while the DND tile keeps toggling the manual switch.
      const on = this._on(c.quiet_entity || c.dnd_entity);
      segs.push(seg("🔕 " + T.quiet, on ? T.on : T.off, on ? p.warn : p.ok));
    }
    const act = this._activeScenarios();
    if (act !== null) segs.push(seg("🎬 " + T.act_scen, String(act.length)));
    const bar = this.shadowRoot.getElementById("statusbar");
    bar.innerHTML = snIconify(segs.join(""), this && this._config);
    bar.style.display = segs.length ? "" : "none";
  }

  _icon(ic) {
    // mdi:* renders as ha-icon; anything else (emoji, text) renders as-is,
    // matching the prototype's emoji tiles.
    return ic && ic.startsWith("mdi:")
      ? `<ha-icon class="ti" icon="${ic}"></ha-icon>`
      : `<span class="ti">${ic || "⚙️"}</span>`;
  }

  _tileDef(t) {
    const c = this._config;
    const T = snT(c, this._hass);
    if (t === "dnd" && c.dnd_entity) {
      const on = this._on(c.dnd_entity);
      return { cls: on ? "warn" : "", icon: on ? "🔕" : "🔔",
        name: T.dnd, sub: on ? T.active : T.tap_silence,
        act: () => this._toggle(c.dnd_entity) };
    }
    if (t === "snooze") {
      // expired snoozes dropped, end anchored on snoozed_at (see snLiveSnoozes)
      const act = snLiveSnoozes(this._snoozes);
      if (act.length) {
        const ends = act.map((s) => s._end);
        const end = ends.includes(null) ? null : new Date(Math.max(...ends));
        let until = "";
        let left = "";
        if (end) {
          const pad = (n) => String(n).padStart(2, "0");
          until = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
          const mins = Math.max(1, Math.ceil((end - new Date()) / 60000));
          left = `⏳ ${mins} ${T.min} ${T.left}`;
        }
        const what = snSnoozeLabels(this._hass, act, T);
        return { cls: "warn", icon: "😴", name: left || T.snoozed,
          sub: what ? what + (until ? ` · ${until}` : "") : (until ? T.until + " " + until + " · " : "") + T.tap_clear,
          act: () => this._snooze() };
      }
      return { cls: "", icon: "😴", name: `${T.snooze} ${c.snooze_minutes || 30} ${T.min}`,
        sub: T.pause_nc, act: () => this._snooze() };
    }
    if (t === "announce")
      return { cls: "", icon: "📢", name: T.announce, sub: T.intercom,
        act: () => this.shadowRoot.getElementById("announceInput").focus() };
    if (t && t.toggle) {
      const on = this._on(t.toggle);
      return { cls: on ? "on" : "", icon: t.icon || "⚙️",
        name: t.name || this._friendly(t.toggle), sub: on ? T.on : T.off,
        act: () => this._toggle(t.toggle) };
    }
    return null;
  }

  _renderTiles() {
    const defs = (this._config.tiles || []).map((t) => this._tileDef(t)).filter(Boolean);
    const el = this.shadowRoot.getElementById("tiles");
    el.innerHTML = snIconify(defs
      .map((d, i) =>
        `<div class="ctile ${d.cls}" data-i="${i}" role="button" tabindex="0">
           ${this._icon(d.icon)}<span class="tx"><b>${d.name}</b><span class="ts">${d.sub}</span></span>
         </div>`)
      .join(""), this && this._config);
    el.querySelectorAll(".ctile").forEach((node) => {
      const d = defs[+node.dataset.i];
      node.onclick = () => d.act();
      node.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") d.act(); };
    });
  }

  _collapseKey() {
    // one localStorage slot per card instance (config-derived, stable across reloads)
    return "sn-ctl-fold:" + ((this._config.groups || []).map((g) => g.name || "").join("|") || "default");
  }

  _loadCollapsed() {
    if (this._collapsed) return this._collapsed;
    const set = new Set();
    (this._config.groups || []).forEach((g, i) => { if (g.collapsed) set.add(i); });
    try {
      const saved = JSON.parse(localStorage.getItem(this._collapseKey()) || "null");
      if (Array.isArray(saved)) { set.clear(); saved.forEach((i) => set.add(+i)); }
    } catch (e) { /* storage unavailable */ }
    this._collapsed = set;
    return set;
  }

  _toggleGroup(i) {
    const set = this._loadCollapsed();
    if (set.has(i)) set.delete(i); else set.add(i);
    try { localStorage.setItem(this._collapseKey(), JSON.stringify([...set])); } catch (e) { /* ignore */ }
    this._renderGroups();
  }

  _renderGroups() {
    const el = this.shadowRoot.getElementById("groups");
    const T = snT(this._config, this._hass);
    const foldable = this._config.collapsible !== false;
    const folded = foldable ? this._loadCollapsed() : new Set();
    el.innerHTML = snIconify((this._config.groups || [])
      .map((g, gi) => {
        const ents = (g.entities || []).map((ent) => {
          const id = typeof ent === "string" ? ent : ent.entity;
          const name = typeof ent === "string" ? this._friendly(id) : ent.name || this._friendly(id);
          return { id, name, on: this._on(id) };
        });
        const nOn = ents.filter((e) => e.on).length;
        const isFold = folded.has(gi);
        // a folded group keeps its ON pills visible: you still see what's active
        const shown = isFold ? ents.filter((e) => e.on) : ents;
        const pills = shown
          .map((e) => `<span class="mpill ${e.on ? "on" : ""}" data-e="${e.id}" role="switch" aria-checked="${e.on}">
                      <span class="pd"></span>${e.name}</span>`)
          .join("");
        const counter = `<span class="gc ${nOn ? "" : "zero"}">${nOn}/${ents.length} ${T.grp_active}</span>`;
        const chev = foldable ? `<span class="gv">▾</span>` : "";
        return `<div class="mgroup ${foldable ? "clk" : ""} ${isFold ? "fold" : ""}" data-g="${gi}" role="${foldable ? "button" : ""}"
                     ${foldable ? `aria-expanded="${!isFold}" tabindex="0"` : ""}>${g.name || ""}${counter}${chev}</div><div>${pills}</div>`;
      })
      .join(""), this && this._config);
    el.querySelectorAll(".mpill").forEach((node) => {
      node.onclick = () => this._toggle(node.dataset.e);
    });
    if (foldable) el.querySelectorAll(".mgroup.clk").forEach((node) => {
      node.onclick = () => this._toggleGroup(+node.dataset.g);
      node.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this._toggleGroup(+node.dataset.g); } };
    });
  }
}

customElements.define("supernotify-control-card", SupernotifyControlCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "supernotify-control-card",
  name: "SuperNotify Control Card",
  description: "Touch-first control center for SuperNotify: status, last notification, quick actions (snooze countdown), collapsible mode groups.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-overview-card — dashboard overview
 * Stats (sent, failures, active scenarios, deliveries) and last notification.
 * Transport status lives in supernotify-transports-card only (since 0.18.0).
 * Data from entities exposed by SuperNotify plus
 * enquire_* services called over WebSocket. Active scenarios prefer the
 * reactive binary_sensor.supernotify_scenario_* state (SuperNotify >= 2.4.0,
 * Live Scenarios) over the polled enquire_active_scenarios count.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyOverviewCard extends HTMLElement {
  static getStubConfig() {
    return { poll_seconds: 60 };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      poll_seconds: 60, style: "supernotify",
      health: true,                                   // traffic-light strip on top (0.20.0)
      update_entity: "update.supernotify_update",     // HACS update entity for the version light
      quiet_entity: null,                             // e.g. binary_sensor.notifier_dnd
      ...config,
    };
    this._rendered = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
    // connectedCallback may have run before hass: first data now, not at the first poll
    if (!this._booted) { this._booted = true; this._refresh(); }
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 5;
  }

  // Health strip (0.20.0): one glance = is everything fine? Each light is a
  // chip; when nothing is wrong a single green "all good" chip is shown.
  _health() {
    const T = snT(this._config, this._hass);
    const c = this._config;
    const chips = [];
    const upd = c.update_entity && this._hass.states[c.update_entity];
    if (upd) {
      const a = upd.attributes || {};
      if (upd.state === "on") chips.push({ k: "warn", t: `⬆ ${T.h_update} ${a.latest_version || ""}`, href: a.release_url });
      else if (/restart/i.test(a.release_summary || "")) chips.push({ k: "warn", t: `🔄 ${T.h_restart}` });
      else chips.push({ k: "ok", t: `✔ SuperNotify ${a.installed_version || ""} ${T.h_uptodate}` });
    }
    const failures = +this._st("sensor.supernotify_failures") || 0;
    if (failures > 0) chips.push({ k: "crit", t: `✖ ${failures} ${T.failures.toLowerCase()}` });
    const trErr = this._scan("transport").filter((t) => {
      const st = this._hass.states[t.id];
      return st && st.state !== "unavailable" && +((st.attributes || {}).error_count || 0) > 0;
    });
    if (trErr.length) chips.push({ k: "crit", t: `⚠️ ${trErr.length} ${T.h_transport_err}`, title: trErr.map((t) => {
      const a = (this._hass.states[t.id] || {}).attributes || {};
      return a.last_error_message ? `${t.name}: ${a.last_error_message}` : t.name;
    }).join(" · ") });
    const delsOff = this._scan("delivery").filter((d) => d.state === "off" && !/^default_/i.test(d.name));
    if (delsOff.length) chips.push({ k: "off", t: `🔕 ${delsOff.length} ${T.h_channels_off}`, title: delsOff.map((d) => snDeliveryAlias(this._hass, d.name) || d.name).join(", ") });
    if (c.quiet_entity && this._st(c.quiet_entity) === "on") chips.push({ k: "warn", t: `🌙 ${T.dnd} ${T.active}` });
    const snz = snLiveSnoozes(this._snoozes);
    if (snz.length) chips.push({ k: "warn",
      t: snz.length === 1 ? `😴 ${T.snoozed}: ${snSnoozeLabel(this._hass, snz[0], T)}` : `😴 ${snz.length} ${T.snoozed.toLowerCase()}`,
      title: snz.map((x) => snSnoozeLabel(this._hass, x, T)).join(", ") });
    if (!chips.some((x) => x.k !== "ok" && x.k !== "off")) chips.unshift({ k: "ok", t: `✔ ${T.h_all_good}` });
    return chips;
  }

  connectedCallback() {
    const s = (this._config && this._config.poll_seconds) || 60;
    this._pollTimer = setInterval(() => this._refresh(), s * 1000);
    this._refresh();
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _st(id) {
    const s = this._hass && this._hass.states[id];
    return s ? s.state : undefined;
  }

  // SuperNotify >= 2.4.0 (Live Scenarios): binary_sensor.supernotify_scenario_*
  // reports a real, reactive on/off state — read it directly instead of
  // waiting for the next enquire_active_scenarios poll. Returns null on
  // older versions (state stuck at "unknown"), so the caller falls back
  // to the polled count from _refresh().
  _activeScenarios() {
    if (!this._hass) return null;
    const ids = Object.keys(this._hass.states).filter((e) =>
      e.startsWith("binary_sensor.supernotify_scenario_")
    );
    if (!ids.length) return null;
    const known = ids.filter((e) => !["unknown", "unavailable"].includes(this._st(e)));
    if (!known.length) return null;
    return known.filter((e) => snScenarioActive(this._hass, e));
  }

  async _ws(service, data) {
    const r = await this._hass.callWS({
      type: "call_service", domain: "supernotify", service,
      service_data: data || {}, return_response: true,
    });
    return (r && r.response) || {};
  }

  async _refresh() {
    if (!this._hass) return;
    try {
      const [act, last, snz] = await Promise.all([
        this._ws("enquire_active_scenarios"),
        this._ws("enquire_last_notification"),
        this._ws("enquire_snoozes"),
      ]);
      this._active = act.scenarios || [];
      this._last = last && Object.keys(last).length ? last : null;
      this._snoozes = snz.snoozes || [];
    } catch (e) {
      this._active = this._active || null;
      this._last = this._last || null;
      this._snoozes = this._snoozes || [];
    }
    if (this._rendered) this._update();
  }

  _scan(kind) {
    // Entities exposed by SuperNotify: <domain>.supernotify_<kind>_<name>
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(new RegExp(`^[a-z_]+\\.supernotify_${kind}_(.+)$`));
      if (m) out.push({ id, name: m[1], state: this._hass.states[id].state });
    }
    return out;
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
        .stat { border: 0; border-radius: 10px; padding: 12px 14px; background: ${p.soft}; }
        .stat .k { font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
                   font-weight: 800; color: ${p.muted}; white-space: nowrap; }
        .stat .v { font-size: 22px; font-weight: 800; margin-top: 3px; }
        .stat .s { font-size: 11px; color: ${p.muted}; margin-top: 2px; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
               font-weight: 800; color: ${p.muted}; margin: 16px 0 8px; }
        .row { display: flex; align-items: center; justify-content: space-between;
               gap: 10px; padding: 8px 2px; border-bottom: 1px solid ${p.line};
               font-size: 13.5px; }
        .row:last-child { border-bottom: 0; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750; }
        .b-ok { background: rgba(46,158,91,.14); color: ${p.ok}; }
        .b-off { background: ${p.soft}; color: ${p.muted}; }
        .b-crit { background: rgba(226,60,60,.12); color: ${p.crit}; }
        .lastmsg { font-size: 13px; }
        .lastmsg .t { color: ${p.muted}; font-size: 11.5px; }
        .chip { display: inline-flex; border: 1.5px solid ${p.line}; border-radius: 999px;
                padding: 5px 12px; font-size: 12px; font-weight: 650; margin: 0 6px 6px 0;
                background: ${p.soft}; color: ${p.brandD}; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 10px; }
        .health { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .health:empty { display: none; }
        .hc { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 5px 11px;
              font-size: 11.5px; font-weight: 700; text-decoration: none; }
        .hc.ok { background: rgba(46,158,91,.14); color: ${p.ok}; }
        .hc.warn { background: rgba(240,160,32,.16); color: ${p.warn}; }
        .hc.crit { background: rgba(226,60,60,.12); color: ${p.crit}; }
        .hc.off { background: ${p.soft}; color: ${p.muted}; }
        .health:has(.hb) { display: block; }
        .hb { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; }
        .hb .hbi { --mdc-icon-size: 26px; font-size: 22px; }
        .hb.ok { background: rgba(46,158,91,.12); color: ${p.ok}; }
        .hb.warn { background: ${p.warnSoft}; color: ${p.warnInk}; }
        .hb.crit { background: rgba(226,60,60,.10); color: ${p.crit}; }
        .hbt { font-size: 17px; font-weight: 700; } .hbs { font-size: 13px; opacity: .85; margin-top: 2px; }
        .hl { margin: 6px 2px 0; }
        .hr { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid ${p.line};
              font-size: 14px; }
        .hr:last-child { border-bottom: 0; }
        .hr .hi { flex: none; } .hr.crit .hi { color: ${p.crit}; } .hr.warn .hi { color: ${p.warn}; }
        .hr.off .hi { color: ${p.muted}; } .hr.ok .hi { color: ${p.ok}; } .hr.ok .ht { color: ${p.muted}; }
        .hr .ht { flex: 1; min-width: 0; } .hr .ht > div:first-child { font-weight: 600; }
        .hr.ok .ht > div:first-child { font-weight: 400; }
        .hr .hd { font-size: 12.5px; color: ${p.muted}; margin-top: 2px; overflow-wrap: anywhere; }
        .hr .ha { flex: none; font-weight: 600; text-decoration: none; color: ${p.brandD}; padding: 8px 4px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="health" id="health"></div><div class="stats" id="stats"></div>
        <div class="sec">${snT(this._config, this._hass).last_notif}</div>
        <div class="lastmsg" id="last">—</div>
        <div class="sec">${snT(this._config, this._hass).act_scen}</div>
        <div id="scen">—</div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-overview-card v${SN_CARD_VERSIONS.overview}</div>` : ""}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const sent = this._st("sensor.supernotify_notifications");
    const failures = this._st("sensor.supernotify_failures");
    const dels = this._scan("delivery");
    const delsOn = dels.filter((d) => d.state === "on").length;
    const reactiveAct = this._activeScenarios();
    const act = reactiveAct !== null ? reactiveAct : this._active;
    const stat = (k, v, s, color) =>
      `<div class="stat"><div class="k">${k}</div><div class="v"${color ? ` style="color:${color}"` : ""}>${v}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
    const p = this._palette();
    const T = snT(this._config, this._hass);
    const snz = snLiveSnoozes(this._snoozes);
    // Optional daily counter (utility_meter on sensor.supernotify_notifications):
    // shows "sent today" with yesterday's total from the last_period attribute.
    let sentStat;
    const todayId = this._config.sent_today_entity;
    const todayState = todayId ? this._hass.states[todayId] : null;
    if (todayState && !["unknown", "unavailable"].includes(todayState.state)) {
      const yd = todayState.attributes && todayState.attributes.last_period;
      sentStat = stat("📨 " + T.sent_today, esc(Math.round(+todayState.state)),
        yd != null ? T.yesterday + ": " + esc(Math.round(+yd)) : "");
    } else {
      sentStat = stat("📨 " + T.sent, sent != null ? esc(sent) : "—", T.since_startup);
    }
    const healthEl = this.shadowRoot.getElementById("health");
    if (healthEl) {
      let html = "";
      if (this._config.health === "chips") {
        html = this._health().map((h) => h.href
          ? `<a class="hc ${h.k}" href="${esc(h.href)}" target="_blank" rel="noopener">${esc(h.t)}</a>`
          : `<span class="hc ${h.k}"${h.title ? ` title="${esc(h.title)}"` : ""}>${esc(h.t)}</span>`).join("");
      } else if (this._config.health) {
        // 0.52.0: one sentence on top, then what to look at, each with its detail and action
        const all = this._health();
        const todo = all.filter((h) => h.k === "crit" || h.k === "warn" || h.k === "off");
        const fine = all.filter((h) => h.k === "ok" && !/^✔ (Tutto ok|All good)/.test(h.t));
        const chOn = T.h_ch_on.replace("{on}", delsOn).replace("{tot}", dels.length);
        const lvl = todo.some((h) => h.k === "crit") ? "crit" : todo.length ? "warn" : "ok";
        const head = todo.length
          ? (todo.length === 1 ? T.h_look_1 : T.h_look_n.replace("{n}", todo.length))
          : T.h_all_good;
        const sub = todo.length ? `${T.h_rest_ok}${dels.length ? " · " + chOn : ""}` : (dels.length ? chOn : "");
        const row = (h) => {
          const m = String(h.t).match(/^(\S+)\s+(.*)$/);
          const icon = m ? m[1] : "", text = m ? m[2] : h.t;
          return `<div class="hr ${h.k}"><span class="hi">${esc(icon)}</span>
            <div class="ht"><div>${esc(text)}</div>${h.title && !text.includes(h.title) ? `<div class="hd">${esc(h.title)}</div>` : ""}</div>
            ${h.href ? `<a class="ha" href="${esc(h.href)}" target="_blank" rel="noopener">${esc(T.h_open)}</a>` : ""}</div>`;
        };
        html = `<div class="hb ${lvl}"><span class="hbi">${lvl === "ok" ? "✔" : "⚠"}</span>
            <div><div class="hbt">${esc(head)}</div>${sub ? `<div class="hbs">${esc(sub)}</div>` : ""}</div></div>`
          + (todo.length || fine.length ? `<div class="hl">${todo.map(row).join("")}${fine.map(row).join("")}</div>` : "");
      }
      healthEl.innerHTML = snIconify(html, this && this._config);
    }
    this.shadowRoot.getElementById("stats").innerHTML =
      snIconify(sentStat +
      stat("⚠️ " + T.failures, failures != null ? esc(failures) : "—", "", +failures > 0 ? p.crit : p.ok) +
      (this._config.stats === "full" ? stat("🎬 " + T.act_scen, act ? act.length : "—", "") : "") +
      stat("📤 " + T.deliveries, dels.length ? `${delsOn}/${dels.length}` : "—", T.enabled_total) +
      (this._config.stats !== "full" ? "" : stat("😴 " + T.snoozed, snz.length, snz.length && snz[0]._end ? T.until + " " + esc(String(snz[0]._end.getHours()).padStart(2, "0") + ":" + String(snz[0]._end.getMinutes()).padStart(2, "0")) : "", snz.length ? p.warn : undefined)), this && this._config);

    const lastEl = this.shadowRoot.getElementById("last");
    if (this._last) {
      const n = this._last;
      const when = n.created ? esc(String(n.created).replace("T", " ").slice(0, 16)) : "";
      const msg = esc((n.message || "").slice(0, 90));
      const ok = (n.failed || 0) === 0;
      const prioCol = { critical: p.crit, high: p.warn, medium: p.brandD }[n.priority];
      const prio = n.priority
        ? `<span class="badge" style="background:${p.soft};color:${prioCol || p.muted}">${esc(T["prio_" + n.priority] || n.priority)}</span>`
        : "";
      const ch = +n.delivered > 0 ? `<span class="badge b-off">${n.delivered} ${T.channels}</span>` : "";
      lastEl.innerHTML = snIconify(`<div class="t">${when}</div><div>${msg}</div>
        <div style="margin-top:5px">${prio}<span class="badge ${ok ? "b-ok" : "b-crit"}">${ok ? "✔ " + T.delivered : "✖ " + n.failed + " " + T.failed}</span>${+n.missed > 0 ? `<span class="badge" style="background:${p.soft};color:${p.warn || "#f0a020"}">⚠ ${esc(n.missed)} ${T.missed_n}</span>` : ""}${ch}</div>`, this && this._config);
    } else {
      lastEl.textContent = "—";
    }

    this.shadowRoot.getElementById("scen").innerHTML = snIconify(act && act.length
      ? act.map((s) => `<span class="chip">🎬 ${esc(this._scenLabel(s))}</span>`).join("")
      : `<span class="badge b-off">${T.none}</span>`, this && this._config);
  }

  /** Scenario name for a chip: entity ids (reactive path) become the translated alias. */
  _scenLabel(s) {
    const m = String(s).match(/^binary_sensor\.supernotify_scenario_(.+)$/);
    if (!m) return s;
    for (const dom of ["switch", "binary_sensor"]) {
      const st = this._hass.states[`${dom}.supernotify_scenario_${m[1]}`];
      const clean = st && snCleanName(st.attributes.friendly_name, m[1]);
      if (clean) return clean;
    }
    return m[1];
  }
}

customElements.define("supernotify-overview-card", SupernotifyOverviewCard);

window.customCards.push({
  type: "supernotify-overview-card",
  name: "SuperNotify Overview Card",
  description: "Dashboard overview for SuperNotify: health strip (version, failures, transport errors, DND, snoozes), sent/failure counters, active scenarios, last notification.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-bands-card — time bands editor
 * One row per band: icon, name, active range, "now" badge on the active
 * band, inline start-time input (input_datetime) and volume slider
 * (input_number). Mirrors the prototype's "Fasce" page.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyBandsCard extends HTMLElement {
  static getStubConfig() {
    return { bands: {} };
  }

  setConfig(config) {
    if (!config || !config.bands || !Object.keys(config.bands).length)
      throw new Error("bands is required: {name: {start: input_datetime.x, volume: input_number.y}}");
    this._config = { style: "supernotify", ...config };
    this._rendered = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 1 + Object.keys(this._config.bands).length;
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _st(id) {
    const s = this._hass && this._hass.states[id];
    return s ? s.state : undefined;
  }

  _bands() {
    // Preserve config order (chronological, cyclic: last crosses midnight).
    const DEFAULT_ICONS = { early_morning: "🌅", morning: "🌤️", afternoon: "☀️",
      evening: "🌇", night: "🌙", late_night: "🌃" };
    return Object.entries(this._config.bands).map(([key, b]) => {
      const raw = this._st(b.start) || "";
      const [h, m] = raw.split(":");
      return {
        key, start: b.start, volume: b.volume,
        name: b.name || key.replace(/_/g, " "),
        icon: b.icon || DEFAULT_ICONS[key] || "🕐",
        hhmm: h !== undefined && m !== undefined ? `${h.padStart(2, "0")}:${m}` : "",
        min: h !== undefined && m !== undefined ? +h * 60 + +m : null,
        vol: b.volume ? Math.round(+this._st(b.volume) || 0) : null,
      };
    }).sort((x, y) => {
      // Sort by start time, never by config order: Home Assistant
      // reserialises the card config with its keys sorted alphabetically,
      // so the order written in YAML does not survive a save. Bands with
      // no readable start time go last.
      if (x.min === null) return y.min === null ? 0 : 1;
      if (y.min === null) return -1;
      return x.min - y.min;
    });
  }

  _activeKey(bands) {
    const now = new Date();
    const t = now.getHours() * 60 + now.getMinutes();
    const valid = bands.filter((b) => b.min !== null).slice()
      .sort((a, b) => a.min - b.min);
    for (let i = 0; i < valid.length; i++) {
      const s = valid[i].min, e = valid[(i + 1) % valid.length].min;
      const hit = s < e ? t >= s && t < e : t >= s || t < e;
      if (hit) return valid[i].key;
    }
    return null;
  }

  _setStart(entity, hhmm) {
    this._hass.callService("input_datetime", "set_datetime", {
      entity_id: entity, time: hhmm + ":00",
    });
  }

  _setVolume(entity, value) {
    this._hass.callService("input_number", "set_value", {
      entity_id: entity, value: +value,
    });
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
               padding: 10px 8px; border-radius: 12px; }
        .row.act { background: ${p.okSoft}; }
        .who { flex: 1; min-width: 150px; }
        .who b { font-size: 14px; }
        .who .rng { font-size: 11.5px; color: ${p.muted}; margin-top: 1px; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px;
                 font-weight: 750; background: rgba(46,158,91,.16); color: ${p.ok}; }
        .badge.mute { background: rgba(160,160,160,.20); color: ${p.muted}; }
        .badge[hidden] { display: none; }
        .row.mute .who b { opacity: .62; }
        .row.mute input[type=range] { accent-color: ${p.muted}; }
        .hint { font-size: 11.5px; line-height: 1.45; color: ${p.muted};
                border-top: 1px dashed ${p.line}; margin-top: 10px; padding-top: 8px; }
        .fld { display: flex; flex-direction: column; gap: 2px; }
        .fld .k { font-size: 10px; letter-spacing: .05em; text-transform: uppercase;
                  font-weight: 800; color: ${p.muted}; }
        input[type=time] { border: 1.5px solid ${p.line}; border-radius: 8px;
                 padding: 6px 8px; font-size: 13px; background: ${p.panel}; color: ${p.ink}; }
        input[type=time]:focus { outline: none; border-color: ${p.brand}; }
        .volwrap { min-width: 150px; }
        input[type=range] { width: 100%; accent-color: ${p.brand}; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
        ${SN_FLOW_CSS}
        .flow { column-gap: 22px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        <div class="hint">🔇 ${snT(this._config, this._hass).mute_hint}</div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-bands-card v${SN_CARD_VERSIONS.bands}</div>` : ""}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    // Skip re-render while the user is dragging a slider in this card.
    if (this._dragging) return;
    const bands = this._bands();
    const active = this._activeKey(bands);
    const T = snT(this._config, this._hass);
    const rows = this.shadowRoot.getElementById("rows");

    // Build the row DOM once. Home Assistant calls `set hass` on every state
    // change in the system, so rebuilding here would tear down the
    // <input type=time> under the user and close the native time picker the
    // moment it opens. Only a change in the set or order of bands rebuilds.
    const sig = bands.map((b) => b.key + ":" + (b.min === null ? "-" : b.min)).join("|");
    if (rows.dataset.sig !== sig) {
      rows.innerHTML = snIconify(bands.map((b, i) => {
        const next = bands[(i + 1) % bands.length];
        const isAct = b.key === active;
        const isMute = b.vol === 0;
        return `<div class="row ${isAct ? "act" : ""} ${isMute ? "mute" : ""}" data-row="${b.key}">
        <div class="who"><b>${b.icon} ${b.name}</b> <span class="badge" data-now ${isAct ? "" : "hidden"}>${T.now}</span><span class="badge mute" data-m="${b.key}" ${isMute ? "" : "hidden"}>&nbsp;\u{1F507} ${T.no_voice}</span>
          <div class="rng">${b.hhmm || "\u2014"} \u2192 ${next.hhmm || "\u2014"}${i === bands.length - 1 ? " \u00b7 " + T.crosses : ""}</div>
        </div>
        <div class="fld"><span class="k">${T.start}</span>
          <input type="time" value="${b.hhmm}" data-e="${b.start}"></div>
        <div class="fld volwrap"><span class="k">${T.volume} <span data-l="${b.key}">${b.vol != null ? b.vol : "\u2014"}</span>%</span>
          <input type="range" min="0" max="100" value="${b.vol != null ? b.vol : 0}" data-e="${b.volume || ""}" data-k="${b.key}"></div>
      </div>`;
      }).join(""), this && this._config);
      rows.dataset.sig = sig;
      this._bind(rows);
    }

    // Patch values in place, never touching whatever has focus.
    const focused = this.shadowRoot.activeElement;
    bands.forEach((b, i) => {
      const next = bands[(i + 1) % bands.length];
      const row = rows.querySelector(`[data-row="${b.key}"]`);
      if (!row) return;
      const isAct = b.key === active;
      const isMute = b.vol === 0;
      row.classList.toggle("act", isAct);
      row.classList.toggle("mute", isMute);
      const nowb = row.querySelector("[data-now]");
      if (nowb) nowb.hidden = !isAct;
      const mb = row.querySelector(`[data-m="${b.key}"]`);
      if (mb) mb.hidden = !isMute;
      const rng = row.querySelector(".rng");
      if (rng) {
        rng.textContent = `${b.hhmm || "\u2014"} \u2192 ${next.hhmm || "\u2014"}`
          + (i === bands.length - 1 ? " \u00b7 " + T.crosses : "");
      }
      const ti = row.querySelector("input[type=time]");
      if (ti && ti !== focused && ti.value !== b.hhmm) ti.value = b.hhmm;
      const ri = row.querySelector("input[type=range]");
      const rv = b.vol != null ? b.vol : 0;
      if (ri && ri !== focused && +ri.value !== rv) ri.value = rv;
      const lab = row.querySelector(`[data-l="${b.key}"]`);
      if (lab) lab.textContent = b.vol != null ? b.vol : "\u2014";
    });
  }

  _bind(rows) {
    rows.querySelectorAll("input[type=time]").forEach((inp) => {
      inp.onchange = () => this._setStart(inp.dataset.e, inp.value);
    });
    rows.querySelectorAll("input[type=range]").forEach((inp) => {
      if (!inp.dataset.e) { inp.disabled = true; return; }
      inp.oninput = () => {
        this._dragging = true;
        const l = rows.querySelector(`[data-l="${inp.dataset.k}"]`);
        if (l) l.textContent = inp.value;
        // Mostra/nasconde subito il badge "niente voce" senza aspettare il re-render.
        const mute = +inp.value === 0;
        const badge = rows.querySelector(`[data-m="${inp.dataset.k}"]`);
        if (badge) badge.hidden = !mute;
        const row = rows.querySelector(`[data-row="${inp.dataset.k}"]`);
        if (row) row.classList.toggle("mute", mute);
      };
      inp.onchange = () => {
        this._dragging = false;
        this._setVolume(inp.dataset.e, inp.value);
      };
    });
  }
}

customElements.define("supernotify-bands-card", SupernotifyBandsCard);

window.customCards.push({
  type: "supernotify-bands-card",
  name: "SuperNotify Bands Card",
  description: "Time bands editor: one row per band with active badge, inline start time and volume slider.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-deliveries-card — delivery dashboard
 * Auto-discovers the delivery entities SuperNotify exposes and renders
 * them prototype-style: transport icon, name, selection/action/target
 * tags and enabled badge. Tap a row for the full attributes (more-info).
 * ════════════════════════════════════════════════════════════════════════ */

// Transports that resolve area_id/floor_id/label_id natively, because they
// call an HA entity service rather than the legacy notify platform (verified
// against services.yaml — see SuperNotify issue #9 upstream). Everything
// else ignores indirect target categories: has_resolved_target() only sees
// entity_id/device_id for them, so an area/floor/label-only target can end
// up NO_TARGET, silently, on those other channels.
const SN_NATIVE_TARGET_TRANSPORTS = [
  "notify_entity", "alexa_devices", "html5", "ntfy", "kodi", "media_player", "tts", "chime",
];

const SN_TRANSPORT_ICONS = {
  mobile_push: "📱", telegram: "✈️", alexa_media_player: "🗣️", alexa_devices: "🗣️",
  google_cast: "📺", pushover: "🔔", email: "✉️", ntfy: "📢", gotify: "📨",
  lametric: "🕹️", chime: "🎵", persistent: "📌", sms: "💬", tts: "🗣️",
  generic: "⚙️", notify_entity: "🔔", media: "📺", mqtt: "📡",
};

function snSelectionLabel(sel, T) {
  return { default: T.implicit, explicit: T.explicit, scenario: T.by_scenario,
    fallback: T.fallback, fallback_on_error: T.fallback_err }[sel];
}

class SupernotifyDeliveriesCard extends HTMLElement {
  static getStubConfig() {
    return { hide_defaults: true };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { hide_defaults: true, style: "supernotify", ...config };
    this._rendered = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 8;
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _deliveries() {
    // one row per delivery: switch.* (SuperNotify >= PR #207) preferred over the
    // binary_sensor.* that older versions expose
    const out = snEntityRows(this._hass, "delivery")
      .filter((d) => !(this._config.hide_defaults && /^default_/i.test(d.name)));
    // enabled first, then alphabetical — like the prototype list
    out.sort((x, y) => (x.on === y.on ? x.name.localeCompare(y.name) : x.on ? -1 : 1));
    return out;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .row { display: flex; align-items: center; gap: 12px; padding: 10px 8px;
               border-bottom: 1px solid ${p.line}; cursor: pointer; border-radius: 8px; }
        .row:hover { background: ${p.soft}; }
        .row:last-child { border-bottom: 0; }
        .em { font-size: 22px; flex-shrink: 0; }
        .mid { flex: 1; min-width: 0; }
        .mid b { font-size: 14px; }
        .mid .tr { font-size: 11.5px; color: ${p.muted}; }
        .tech { font-family: ui-monospace, 'Roboto Mono', monospace; font-size: 11px; }
        .tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
        .tag { border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD};
               border-radius: 7px; padding: 2px 8px; font-size: 11px; font-weight: 650;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750;
                 flex-shrink: 0; }
        .b-on { background: rgba(46,158,91,.14); color: ${p.ok}; }
        .b-off { background: ${p.soft}; color: ${p.muted}; }
        ${SN_SWITCH_CSS}
        ${SN_FLOW_CSS}
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
        .tag.always { border-color: ${p.ok}; color: ${p.ok};
                      background: rgba(46,158,91,.12); }
        .incsum { font-size: 11.5px; line-height: 1.5; color: ${p.muted};
                  background: ${p.soft}; border-radius: 9px;
                  padding: 7px 10px; margin-bottom: 10px; }
        .incsum b { color: ${p.ink}; }
        .incsum { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .incsum .rstb { flex: none; }
        .tag.off { color: #c62828; border-color: rgba(198,40,40,.35); background: rgba(198,40,40,.08); }
        .chd { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 0 4px 6px; }
        .cht { font-size: 17px; font-weight: 700; } .chn { font-size: 13px; color: ${p.muted}; }
        .grp h3 { margin: 14px 4px 2px; font-size: 11.5px; font-weight: 700; letter-spacing: .05em;
                  text-transform: uppercase; color: ${p.muted}; }
        .grp .row:last-child { border-bottom: 0; }
        .row.dim .em, .row.dim .mid b { opacity: .6; }
        .mid .tr { margin-top: 2px; }
        .st.warn { color: ${p.warn}; font-weight: 600; } .st.crit { color: ${p.crit}; font-weight: 600; }
        .st.ok { color: ${p.ok}; font-weight: 600; }
        .tag { color: ${p.muted}; background: transparent; }
        .rstb { display: block; margin: 12px 4px 2px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
                border-radius: 10px; border: 1px solid ${p.line}; background: ${p.panel}; color: ${p.brandD};
                padding: 9px 14px; min-height: 40px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-deliveries-card v${SN_CARD_VERSIONS.deliveries}</div>` : ""}
      </ha-card>`, this && this._config);
    this._update();
  }

  // Which group a delivery belongs to, from its inclusion list (SuperNotify 2.5: `inclusion`,
  // older: `selection`). A channel that starts on its own wins over everything else.
  _group(d) {
    const r = d.a.inclusion ?? d.a.selection;
    const inc = Array.isArray(r) ? r : r ? [r] : ["default"];
    if (inc.includes("default")) return "auto";
    if (inc.includes("scenario")) return "scen";
    if (inc.some((x) => /^fallback/.test(x))) return "fallback";
    return "named";
  }

  // Active scenarios that switch this delivery off / on right now (scenario entity attribute
  // `delivery: {<name>: {enabled: …}}`, the same source as the why-card).
  _scenarioEffect(name) {
    const off = [], on = [];
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^binary_sensor\.supernotify_scenario_(.+)$/);
      if (!m || !snScenarioActive(this._hass, id)) continue;
      let dl = null;
      for (const dom of ["switch", "binary_sensor"]) {
        const st = this._hass.states[`${dom}.supernotify_scenario_${m[1]}`];
        if (st && st.attributes && st.attributes.delivery && typeof st.attributes.delivery === "object") { dl = st.attributes.delivery; break; }
      }
      if (!dl || dl[name] === undefined) continue;
      (dl[name] && dl[name].enabled === false ? off : on).push(snScenarioName(this._hass, m[1]));
    }
    return { off, on };
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const dels = this._deliveries();
    const rows = this.shadowRoot.getElementById("rows");
    if (!dels.length) {
      rows.innerHTML = snIconify(`<span class="badge b-off">${T.no_deliveries}</span>`, this && this._config);
      return;
    }
    const resetBtn = snResetOverridesButton(this._hass);
    const nOn = dels.filter((d) => d.on).length;
    const head = `<div class="chd"><span class="cht">${esc(this._config.title || T.ch_title)}</span>`
      + `<span class="chn">${esc(T.ch_count.replace("{on}", nOn).replace("{tot}", dels.length))}</span></div>`;
    const rowHtml = (d) => {
      const i = dels.indexOf(d);
      const tr = d.a.transport || "";
      const em = SN_TRANSPORT_ICONS[tr] || "📤";
      const alias = snDeliveryAlias(this._hass, d.name) || "";
      const tech = alias && alias.toLowerCase() !== d.name.toLowerCase() ? d.name : "";
      // the one line that says what is going on with this channel right now
      let state = "", cls = "";
      if (!d.on) { state = T.off_manual; }
      else if (d.a.transport_enabled === false) { state = `⛔ ${T.transport_off}`; cls = "crit"; }
      else {
        const fx = this._scenarioEffect(d.name);
        if (fx.off.length) { state = `${T.paused_by} ${fx.off.join(", ")}`; cls = "warn"; }
        else if (fx.on.length && this._group(d) === "scen") { state = `${T.on_by} ${fx.on.join(", ")}`; cls = "ok"; }
      }
      const tags = [];
      if (d.a.action) tags.push(`⚙️ ${d.a.action}`);
      const tgt = d.a.target;
      const nTgt = Array.isArray(tgt) ? tgt.length : tgt && typeof tgt === "object" ? Object.keys(tgt).length : tgt ? 1 : 0;
      if (nTgt) tags.push(`🎯 ${nTgt} ${T.fixed_targets}`);
      if (d.a.target_usage && d.a.target_usage !== "no_action") tags.push(`↔️ ${d.a.target_usage}`);
      if (SN_NATIVE_TARGET_TRANSPORTS.includes(tr)) tags.push(T.native_target_tag);
      const meta = [state ? `<span class="st ${cls}">${esc(state)}</span>` : "",
        tech ? `<span class="tech">${esc(tech)}</span>` : "", tr && tr !== tech ? esc(tr) : ""].filter(Boolean).join(" · ");
      return `<div class="row${d.on ? "" : " dim"}" data-i="${i}">
        <span class="em">${em}</span>
        <div class="mid"><b>${esc(alias || d.name)}</b>
          <div class="tr">${meta}</div>
          ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
        </div>
        <label class="sw" data-id="${esc(d.id)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${d.on ? "checked" : ""} aria-label="${esc(alias || d.name)}">
          <span class="sl"></span>
        </label>
      </div>`;
    };
    let body;
    if (this._config.group === false) {
      body = dels.map(rowHtml).join("");
    } else {
      const order = [["auto", T.grp_auto], ["named", T.grp_named], ["scen", T.grp_scen], ["fallback", T.grp_fallback]];
      body = order.map(([k, label]) => {
        const g = dels.filter((d) => this._group(d) === k);
        return g.length ? `<section class="grp"><h3>${esc(label)} · ${g.length}</h3>${g.map(rowHtml).join("")}</section>` : "";
      }).join("");
    }
    const foot = resetBtn ? `<button class="rstb">↺ ${esc(T.reset_overrides)}</button>` : "";
    rows.innerHTML = snIconify(head + body + foot, this && this._config);
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = (e) => {
        if (e.target.closest(".sw")) return;
        this._moreInfo(dels[+node.dataset.i].id);
      };
    });
    rows.querySelectorAll(".sw").forEach((label) => {
      label.addEventListener("click", (e) => e.stopPropagation());
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        snToggle(this._hass, label.dataset.id, input.checked);
      });
    });
    const rb = rows.querySelector(".rstb");
    if (rb) rb.onclick = () => this._hass.callService("button", "press", { entity_id: resetBtn });
  }
}

customElements.define("supernotify-deliveries-card", SupernotifyDeliveriesCard);

window.customCards.push({
  type: "supernotify-deliveries-card",
  name: "SuperNotify Deliveries Card",
  description: "Delivery dashboard: auto-discovered rows with transport icon, selection/action/target tags and a live on/off switch.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-transports-card — transport adaptors dashboard (NEW, 2026-09-08)
 * Auto-discovers binary_sensor.supernotify_transport_* (SuperNotify >= 2.2.0
 * exposed these read-only; >= 2.4.0-beta1 they're genuinely toggle-able —
 * see DeliveryRegistry.handle_entity_state_change in delivery.py). One row
 * per transport adaptor: icon, name/alias, error tag if it has ever failed,
 * live on/off switch. Tap a row for full attributes (more-info).
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyTransportsCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 6;
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _transports() {
    const out = snEntityRows(this._hass, "transport");
    out.sort((x, y) => (x.on === y.on ? x.name.localeCompare(y.name) : x.on ? -1 : 1));
    return out;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .row { display: flex; align-items: center; gap: 12px; padding: 10px 8px;
               border-bottom: 1px solid ${p.line}; cursor: pointer; border-radius: 8px; }
        .row:hover { background: ${p.soft}; }
        .row:last-child { border-bottom: 0; }
        .em { font-size: 22px; flex-shrink: 0; }
        .mid { flex: 1; min-width: 0; }
        .mid b { font-size: 14px; }
        .mid .sub { font-size: 11.5px; color: ${p.muted}; }
        .tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
        .tag { border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD};
               border-radius: 7px; padding: 2px 8px; font-size: 11px; font-weight: 650;
               white-space: nowrap; }
        .tag.err { color: ${p.crit}; border-color: ${p.crit}; background: rgba(226,60,60,.08); }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750; }
        .b-off { background: ${p.soft}; color: ${p.muted}; }
        ${SN_SWITCH_CSS}
        ${SN_FLOW_CSS}
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
        .rst { text-align: right; margin: 0 0 8px; }
        .rstb { font: inherit; font-size: 11.5px; font-weight: 650; cursor: pointer; border-radius: 8px;
                border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD}; padding: 4px 10px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-transports-card v${SN_CARD_VERSIONS.transports}</div>` : ""}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const trs = this._transports();
    const rows = this.shadowRoot.getElementById("rows");
    if (!trs.length) {
      rows.innerHTML = snIconify(`<span class="badge b-off">${T.no_transports}</span>`, this && this._config);
      return;
    }
    const resetBtn = snResetOverridesButton(this._hass);
    rows.innerHTML = snIconify((resetBtn ? `<div class="rst"><button class="rstb">↺ ${esc(T.reset_overrides)}</button></div>` : "")
      + trs.map((t, i) => {
      const em = SN_TRANSPORT_ICONS[t.name] || "🔌";
      const tags = [];
      const errCount = +t.a.error_count || 0;
      if (errCount > 0) tags.push(`<span class="tag err">⚠️ ${errCount} · ${esc(t.a.last_error_message || "")}</span>`);
      let alias = snCleanName(t.a.friendly_name, t.name);
      if (/Transport Adaptor$/i.test(alias)) alias = "";
      return `<div class="row" data-i="${i}">
        <span class="em">${em}</span>
        <div class="mid"><b>${esc(t.name)}</b>${alias ? ` <span class="sub">· ${esc(alias)}</span>` : ""}
          ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
        </div>
        <label class="sw" data-id="${esc(t.id)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${t.on ? "checked" : ""} aria-label="${esc(t.name)}">
          <span class="sl"></span>
        </label>
      </div>`;
    }).join(""), this && this._config);
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = (e) => {
        if (e.target.closest(".sw")) return;
        this._moreInfo(trs[+node.dataset.i].id);
      };
    });
    rows.querySelectorAll(".sw").forEach((label) => {
      label.addEventListener("click", (e) => e.stopPropagation());
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        snToggle(this._hass, label.dataset.id, input.checked);
      });
    });
    const rb = rows.querySelector(".rstb");
    if (rb) rb.onclick = () => this._hass.callService("button", "press", { entity_id: snResetOverridesButton(this._hass) });
  }
}

customElements.define("supernotify-transports-card", SupernotifyTransportsCard);

window.customCards.push({
  type: "supernotify-transports-card",
  name: "SuperNotify Transports Card",
  description: "Transport adaptors dashboard: auto-discovered rows with icon, error tag if any, and a live on/off switch.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-recipients-card — recipients dashboard
 * Auto-discovers the recipient entities SuperNotify exposes: name, home
 * state from the linked person entity, contact tags (email, phone, mobile
 * devices, delivery overrides) and enabled badge. Tap for full attributes.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyRecipientsCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 4;
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _recipients() {
    // SuperNotify >= 2.7.0 has both switch.* (the real control) and a
    // deprecated binary_sensor.* mirror per recipient: one row each,
    // switch preferred; binary_sensor only on older versions.
    const out = snEntityRows(this._hass, "recipient");
    out.sort((x, y) => (x.on === y.on ? x.name.localeCompare(y.name) : x.on ? -1 : 1));
    return out;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .row { display: flex; align-items: center; gap: 12px; padding: 10px 8px;
               border-bottom: 1px solid ${p.line}; cursor: pointer; border-radius: 8px; }
        .row:hover { background: ${p.soft}; }
        .row:last-child { border-bottom: 0; }
        .em { font-size: 24px; flex-shrink: 0; }
        .mid { flex: 1; min-width: 0; }
        .mid b { font-size: 14px; text-transform: capitalize; }
        .mid .sub { font-size: 11.5px; color: ${p.muted}; }
        .tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
        .tag { border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD};
               border-radius: 7px; padding: 2px 8px; font-size: 11px; font-weight: 650;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
        .tag.warn { color: #c77700; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750;
                 flex-shrink: 0; }
        .b-on { background: rgba(46,158,91,.14); color: ${p.ok}; }
        .b-off { background: ${p.soft}; color: ${p.muted}; }
        ${SN_SWITCH_CSS}
        ${SN_FLOW_CSS}
        .gear { font-size: 17px; opacity: .5; flex-shrink: 0; cursor: pointer;
                transition: opacity .15s; padding: 2px; }
        .gear:hover { opacity: 1; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
        .last { margin-top: 5px; font-size: 11.5px; color: ${p.muted}; cursor: pointer; }
        .last b { color: ${p.ink}; text-transform: none; }
        .last.none { cursor: default; opacity: .7; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-recipients-card v${SN_CARD_VERSIONS.recipients}</div>` : ""}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const recs = this._recipients();
    const rows = this.shadowRoot.getElementById("rows");
    if (!recs.length) {
      rows.innerHTML = snIconify(`<span class="badge b-off">${T.no_recipients}</span>`, this && this._config);
      return;
    }
    rows.innerHTML = snIconify(recs.map((r, i) => {
      const personId = r.a.entity_id;
      const pState = personId ? (this._hass.states[personId] || {}).state : undefined;
      const home = pState === "home";
      const tags = [];
      if (r.a.email) tags.push(`✉️ ${r.a.email}`);
      if (r.a.phone_number) tags.push(`💬 ${r.a.phone_number}`);
      const nDev = Array.isArray(r.a.mobile_devices) ? r.a.mobile_devices.length : 0;
      if (nDev) tags.push(`📱 ${nDev} ${T.devices}`);
      const nOvr = r.a.delivery && typeof r.a.delivery === "object" ? Object.keys(r.a.delivery).length : 0;
      if (nOvr) tags.push(`🔗 ${nOvr} ${T.overrides}`);
      if (!tags.length) tags.push(`<span class="tag warn">⚠️ ${T.no_contact}</span>`);
      const alias = snCleanName(r.a.friendly_name, r.name);
      const last = this._lastNotified(r.name);
      const lastHtml = last
        ? `<div class="last" data-why="${esc(last.id || "")}" data-ent="${esc(last.entity)}">🔔 ${esc(T.last_notified)}: <b>${esc(snAgo(last.when, T))}</b>${last.title ? ` · ${esc(last.title)}` : ""}</div>`
        : (this._hass.states[`notify.recipient_${r.name}`] ? `<div class="last none">🔕 ${esc(T.never_notified)}</div>` : "");
      return `<div class="row" data-i="${i}">
        <span class="em">👤</span>
        <div class="mid"><b>${esc(alias || r.name)}</b>
          <span class="sub">${esc(personId || "")}${pState !== undefined ? (home ? " · 🏠 " + T.home : " · 🚗 " + T.away) : ""}</span>
          <div class="tags">${tags.map((t) => t.startsWith("<span") ? t : `<span class="tag">${esc(t)}</span>`).join("")}</div>
          ${lastHtml}
        </div>
        <span class="gear" title="${esc(T.details)}" aria-label="${esc(T.details)}">⚙️</span>
        <label class="sw" data-id="${esc(r.id)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${r.on ? "checked" : ""} aria-label="${esc(alias || r.name)}">
          <span class="sl"></span>
        </label>
      </div>`;
    }).join(""), this && this._config);
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = (e) => {
        if (e.target.closest(".sw")) return;
        this._moreInfo(recs[+node.dataset.i].id);
      };
    });
    rows.querySelectorAll(".sw").forEach((label) => {
      label.addEventListener("click", (e) => e.stopPropagation());
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        snToggle(this._hass, label.dataset.id, input.checked);
      });
    });
    rows.querySelectorAll(".last[data-ent]").forEach((node) => {
      node.onclick = (e) => {
        e.stopPropagation();
        if (!snWhyOpen(node.dataset.why)) this._moreInfo(node.dataset.ent);
      };
    });
  }

  /**
   * SuperNotify 2.7.0 stamps notify.recipient_<name> (state = ISO time, with the
   * notification's context) on every delivery that reaches the recipient. The
   * archive index gives the title: the notification created closest to that time,
   * within 2 minutes. The index is the enquire_archive store on SuperNotify 2.10+,
   * sensor.supernotify_archivio before that.
   */
  _lastNotified(name) {
    const entity = `notify.recipient_${name}`;
    const st = this._hass.states[entity];
    const when = st && st.state ? new Date(st.state) : null;
    if (!when || isNaN(when.getTime())) return null;
    let items;
    if (snArchiveNative(this._hass, this._config)) {
      snArchiveStore.ensure(this._hass, 40, this._config.trigger_entity);
      items = snArchiveStore.getIndex().items || [];
    } else {
      const idx = this._hass.states[this._config.archive_entity || "sensor.supernotify_archivio"];
      items = (idx && idx.attributes && idx.attributes.items) || [];
    }
    const ts = when.getTime() / 1000;
    let best = null;
    for (const it of items) {
      const d = Math.abs((it.t || 0) - ts);
      if (d <= 120 && (!best || d < best.d)) best = { d, it };
    }
    return { when, entity, id: best ? best.it.id : null, title: best ? best.it.ti : null };
  }
}

customElements.define("supernotify-recipients-card", SupernotifyRecipientsCard);

window.customCards.push({
  type: "supernotify-recipients-card",
  name: "SuperNotify Recipients Card",
  description: "Recipients dashboard: home state, contact tags (email, phone, devices) and a live on/off switch.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-scenarios-card — scenarios dashboard
 * Auto-discovers the scenario entities SuperNotify exposes. "Active now"
 * badge: on SuperNotify >= 2.4.0 (Live Scenarios) it reads the real,
 * reactive on/off state of binary_sensor.supernotify_scenario_* directly —
 * instant, no polling. On older versions, where that state stays
 * "unknown", it falls back to the enquire_active_scenarios response
 * service (polled every poll_seconds). Per-delivery override tags
 * (enabled/disabled) come from entity attributes. Optional groups
 * reproduce the prototype categories.
 * ════════════════════════════════════════════════════════════════════════ */

const SN_SCENARIO_ICONS = {
  critical_panic: "🚨", high_priority: "⬆️", alexa_low_whisper: "🔉",
  notifiche_vocali_solo_ufficio: "👤", notifiche_vocali_off: "🔇",
  phone_notifications_off: "📵", screen_notifications_off: "🖥️",
  cn_dnd_orario: "🔔", dnd_globale: "🔕", dnd_workdays: "💼", dnd_holidays: "🏖️",
  xmas: "🎄", halloween: "👻", alone_night: "🌙", multi_home: "👨‍👩‍👧",
  early_morning: "🌅", morning: "🌤️", afternoon: "☀️", evening: "🌇",
  night: "🌙", late_night: "🌃", emergency: "🚨", presenza_ingresso: "🚪",
  alarm_disarmed: "🛡️", alarm_armed: "🔒",
};

class SupernotifyScenariosCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { poll_seconds: 60, style: "supernotify", groups: null, ...(config || {}) };
    this._rendered = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._update();
    // connectedCallback may have run before hass: first data now, not at the first poll
    if (!this._booted) { this._booted = true; this._refresh(); }
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 10;
  }

  connectedCallback() {
    const s = (this._config && this._config.poll_seconds) || 60;
    this._pollTimer = setInterval(() => this._refresh(), s * 1000);
    this._refresh();
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
  }

  async _refresh() {
    if (!this._hass) return;
    try {
      const r = await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "enquire_active_scenarios",
        service_data: {}, return_response: true,
      });
      this._active = (r && r.response && r.response.scenarios) || [];
    } catch (e) { /* retry on next poll */ }
    if (this._rendered) this._update();
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _scenarios() {
    // One entry per scenario. SuperNotify >= 2.7.0: switch.* = enabled (and
    // the full attributes), binary_sensor.* = conditions hold, or - for a
    // scenario without conditions - the manual on/off state (bsId + manual).
    // Older versions: binary_sensor only.
    const byName = new Map();
    if (!this._hass) return [];
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^(switch|binary_sensor)\.supernotify_scenario_(.+)$/);
      if (!m) continue;
      const s = this._hass.states[id];
      const e = byName.get(m[2]) || { name: m[2], id, a: s.attributes || {}, state: "unknown", swId: null, bsId: null, manual: false, enabled: undefined };
      if (m[1] === "switch") {
        e.swId = id; e.id = id; e.a = s.attributes || {};
        e.enabled = s.state === "on";
      } else {
        e.state = s.state;
        e.bsId = id;
        e.manual = snIsManualScenario(this._hass, id);
        if (!e.swId) { e.id = id; e.a = s.attributes || {}; }
      }
      byName.set(m[2], e);
    }
    for (const e of byName.values()) if (e.enabled === undefined) e.enabled = e.a.enabled !== false;
    return [...byName.values()];
  }

  // SuperNotify >= 2.4.0 (Live Scenarios): binary_sensor.supernotify_scenario_*
  // now reports a real on/off state, recomputed reactively — no need to wait
  // for the next enquire_active_scenarios poll. Returns null (not an empty
  // array) when every scenario is still "unknown"/"unavailable", so the
  // caller can fall back to the polled list on older SuperNotify versions.
  _reactiveActive(all) {
    const known = all.filter((s) => !["unknown", "unavailable"].includes(s.state));
    if (!known.length) return null;
    return known.filter((s) => s.state === "on" && s.enabled).map((s) => s.name);
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
               font-weight: 800; color: ${p.muted}; margin: 14px 0 6px; }
        .sec:first-child { margin-top: 0; }
        .row { display: flex; align-items: center; gap: 12px; padding: 9px 8px;
               border-bottom: 1px solid ${p.line}; cursor: pointer; border-radius: 8px; }
        .row.act { background: ${p.okSoft}; }
        .row:hover { background: ${p.soft}; }
        .row:last-child { border-bottom: 0; }
        .em { font-size: 20px; flex-shrink: 0; width: 26px; text-align: center; }
        .mid { flex: 1; min-width: 0; }
        .mid b { font-size: 13.5px; }
        .tags { margin-top: 3px; display: flex; flex-wrap: wrap; gap: 4px; }
        .tag { border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD};
               border-radius: 7px; padding: 1px 7px; font-size: 10.5px; font-weight: 650;
               white-space: nowrap; }
        .tag.on { color: ${p.ok}; }
        .tag.off { color: ${p.crit}; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750;
                 flex-shrink: 0; }
        .b-act { background: rgba(46,158,91,.16); color: ${p.ok}; }
        .b-dis { background: rgba(226,60,60,.10); color: ${p.crit}; }
        .row.dis .mid { opacity: .55; }
        .mlbl { font-size: 10.5px; color: ${p.muted}; flex-shrink: 0; }
        ${SN_SWITCH_CSS}
        ${SN_FLOW_CSS}
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-scenarios-card v${SN_CARD_VERSIONS.scenarios}</div>` : ""}
      </ha-card>`, this && this._config);
    this._update();
  }

  _rowHtml(s, i, active) {
    const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const T = snT(this._config, this._hass);
    const isAct = active.includes(s.name);
    const em = SN_SCENARIO_ICONS[s.name] || "🎬";
    const tags = [];
    const dels = s.a.delivery && typeof s.a.delivery === "object" ? Object.entries(s.a.delivery) : [];
    for (const [dn, dc] of dels.slice(0, 6)) {
      const on = !dc || dc.enabled !== false;
      tags.push(`<span class="tag ${on ? "on" : "off"}">${on ? "✓" : "✕"} ${esc(dn)}</span>`);
    }
    if (dels.length > 6) tags.push(`<span class="tag">+${dels.length - 6}</span>`);
    const ags = Array.isArray(s.a.action_groups) ? s.a.action_groups : [];
    if (ags.length) tags.push(`<span class="tag">🔘 ${esc(ags.join(", "))}</span>`);
    if (s.a.media) tags.push(`<span class="tag">📷 ${T.media}</span>`);
    if (s.manual) tags.unshift(`<span class="tag">✋ ${T.manual}</span>`);
    const alias = snCleanName(s.a.friendly_name, s.name);
    const p = this._palette();
    // SuperNotify >= 2.7.0: live switch; older versions: read-only badge.
    const ctl = s.swId
      ? `<label class="sw" data-id="${esc(s.swId)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${s.enabled ? "checked" : ""} aria-label="${esc(alias || s.name)}" title="${T.enabled_lbl}">
          <span class="sl"></span></label>`
      : (s.enabled === false ? `<span class="badge b-dis">${T.disabled}</span>` : "");
    // Manual scenario (no conditions): its binary_sensor state IS the control.
    const man = s.manual && s.bsId
      ? `<span class="mlbl">${T.apply_now}</span><label class="sw man" data-id="${esc(s.bsId)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.ok}">
          <input type="checkbox" ${s.state === "on" ? "checked" : ""} aria-label="${esc((alias || s.name) + " - " + T.apply_now)}" title="${T.apply_now}">
          <span class="sl"></span></label>`
      : "";
    return `<div class="row ${isAct ? "act" : ""} ${s.enabled === false ? "dis" : ""}" data-i="${i}">
      <span class="em">${em}</span>
      <div class="mid"><b>${esc(alias || s.name)}</b>
        ${alias ? `<span style="font-size:11px;color:inherit;opacity:.6"> · ${esc(s.name)}</span>` : ""}
        <div class="tags">${tags.join("")}</div>
      </div>
      ${isAct ? `<span class="badge b-act">${T.active_now}</span>` : ""}
      ${man}
      ${ctl}
    </div>`;
  }

  _update() {
    if (!this.shadowRoot) return;
    const all = this._scenarios();
    const reactive = this._reactiveActive(all);
    const active = reactive !== null ? reactive : (this._active || []);
    const rows = this.shadowRoot.getElementById("rows");
    if (!all.length) {
      rows.innerHTML = snIconify(`<span class="tag">${snT(this._config, this._hass).no_scenarios}</span>`, this && this._config);
      return;
    }
    const sortFn = (x, y) => {
      const ax = active.includes(x.name) ? 0 : 1, ay = active.includes(y.name) ? 0 : 1;
      return ax === ay ? x.name.localeCompare(y.name) : ax - ay;
    };
    let html = "";
    if (Array.isArray(this._config.groups) && this._config.groups.length) {
      const used = new Set();
      for (const g of this._config.groups) {
        const items = (g.scenarios || [])
          .map((n) => all.find((s) => s.name === n))
          .filter(Boolean);
        items.forEach((s) => used.add(s.name));
        if (!items.length) continue;
        html += `<div class="sec">${g.name || ""}</div>` +
          items.map((s) => this._rowHtml(s, all.indexOf(s), active)).join("");
      }
      const rest = all.filter((s) => !used.has(s.name)).sort(sortFn);
      if (rest.length)
        html += `<div class="sec">${snT(this._config, this._hass).other}</div>` +
          rest.map((s) => this._rowHtml(s, all.indexOf(s), active)).join("");
    } else {
      html = all.slice().sort(sortFn).map((s) => this._rowHtml(s, all.indexOf(s), active)).join("");
    }
    rows.innerHTML = snIconify(html, this && this._config);
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = (e) => {
        if (e.target.closest(".sw")) return;
        this._moreInfo(all[+node.dataset.i].id);
      };
    });
    rows.querySelectorAll(".sw").forEach((label) => {
      label.addEventListener("click", (e) => e.stopPropagation());
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        // switch.* -> switch service; the manual binary_sensor -> state write,
        // which SuperNotify applies back to the scenario.
        snToggle(this._hass, label.dataset.id, input.checked);
      });
    });
  }
}

customElements.define("supernotify-scenarios-card", SupernotifyScenariosCard);

window.customCards.push({
  type: "supernotify-scenarios-card",
  name: "SuperNotify Scenarios Card",
  description: "Scenarios dashboard: active-now badge, live on/off switch, per-delivery override tags, optional category groups.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-simulator-card — "who receives?" simulator
 * Pick scenarios (pre-selected with the ones active right now) and see
 * which deliveries would fire, using the REAL engine data:
 * enquire_implicit_deliveries (baseline) + enquire_deliveries_by_scenario
 * (per-scenario enabled/disabled). Disabled wins over enabled, matching
 * the engine merge semantics.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifySimulatorCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
    this._sel = null;
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    // connectedCallback may have run before hass: first data now, not at the first poll
    if (!this._booted) { this._booted = true; this._refresh(); }
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() {
    return 6;
  }

  connectedCallback() {
    this._refresh();
  }

  async _ws(service) {
    const r = await this._hass.callWS({
      type: "call_service", domain: "supernotify", service,
      service_data: {}, return_response: true,
    });
    return (r && r.response) || {};
  }

  async _refresh() {
    if (!this._hass) return;
    try {
      const [act, byScen, impl] = await Promise.all([
        this._ws("enquire_active_scenarios"),
        this._ws("enquire_deliveries_by_scenario"),
        this._ws("enquire_implicit_deliveries"),
      ]);
      this._byScen = byScen || {};
      this._implicit = [];
      for (const names of Object.values(impl || {})) {
        if (Array.isArray(names)) this._implicit.push(...names);
      }
      if (this._sel === null) this._sel = new Set(act.scenarios || []);
      this._simulate();
    } catch (e) { /* supernotify may still be loading */ }
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
               font-weight: 800; color: ${p.muted}; margin: 12px 0 7px; }
        .sec:first-child { margin-top: 0; }
        .chip { display: inline-flex; align-items: center; gap: 5px;
                border: 1.5px solid ${p.line}; background: ${p.panel};
                border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 650;
                cursor: pointer; margin: 0 5px 6px 0; user-select: none; }
        .chip.sel { background: ${p.brand}; border-color: ${p.brand}; color: ${p.onBrand}; }
        .out { display: inline-flex; align-items: center; gap: 6px;
               border: 1.5px solid ${p.line}; background: ${p.soft}; color: ${p.brandD};
               border-radius: 999px; padding: 6px 13px; font-size: 12.5px; font-weight: 700;
               margin: 0 6px 6px 0; }
        .out .tag { font-size: 10px; font-weight: 800; text-transform: uppercase;
                    color: ${p.ok}; }
        .out.sup { opacity: .55; text-decoration: line-through; color: ${p.crit}; }
        .out.sup .tag { color: ${p.crit}; text-decoration: none; }
        .hint { font-size: 11.5px; color: ${p.muted}; margin-top: 8px; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="sec">${snT(this._config, this._hass).sim_pick}</div>
        <div id="chips"></div>
        <div class="sec">${snT(this._config, this._hass).sim_fire}</div>
        <div id="result">—</div>
        <div class="hint">${snT(this._config, this._hass).sim_hint}</div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-simulator-card v${SN_CARD_VERSIONS.simulator}</div>` : ""}
      </ha-card>`, this && this._config);
    this._refresh();
  }

  _simulate() {
    if (!this.shadowRoot) return;
    const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const chips = this.shadowRoot.getElementById("chips");
    const names = Object.keys(this._byScen || {}).sort();
    chips.innerHTML = snIconify(names.map((n) =>
      `<span class="chip ${this._sel.has(n) ? "sel" : ""}" data-n="${esc(n)}">${SN_SCENARIO_ICONS[n] || "🎬"} ${esc(n)}</span>`
    ).join("") || "—", this && this._config);
    chips.querySelectorAll(".chip").forEach((node) => {
      node.onclick = () => {
        const n = node.dataset.n;
        if (this._sel.has(n)) this._sel.delete(n); else this._sel.add(n);
        this._simulate();
      };
    });

    const enabled = new Set(this._implicit || []);
    const byScenAdd = new Set();
    const disabled = new Set();
    for (const n of this._sel) {
      const s = this._byScen[n];
      if (!s) continue;
      (s.enabled || []).forEach((d) => { enabled.add(d); byScenAdd.add(d); });
      (s.disabled || []).forEach((d) => disabled.add(d));
    }
    const fired = [...enabled].filter((d) => !disabled.has(d)).sort();
    const suppressed = [...enabled].filter((d) => disabled.has(d)).sort();
    const res = this.shadowRoot.getElementById("result");
    res.innerHTML =
      snIconify(fired.map((d) =>
        `<span class="out">${esc(d)}${byScenAdd.has(d) && !(this._implicit || []).includes(d) ? ' <span class="tag">scenario</span>' : ""}</span>`
      ).join("") +
      suppressed.map((d) => `<span class="out sup">${esc(d)} <span class="tag">${snT(this._config, this._hass).off}</span></span>`).join("") ||
      `<span class='hint'>${snT(this._config, this._hass).sim_none}</span>`, this && this._config);
  }
}

customElements.define("supernotify-simulator-card", SupernotifySimulatorCard);

window.customCards.push({
  type: "supernotify-simulator-card",
  name: "SuperNotify Simulator Card",
  description: "Who receives? Pick scenarios and see which deliveries would fire, from real engine data.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-composer-card — try & send
 * Free-form composer: title, message, priority, optional explicit delivery
 * chips, live phone preview, send via notify.supernotify.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyComposerCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
    this._picked = new Set();
    this._targetValue = {};
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else {
      if (this._targetSelEl) this._targetSelEl.hass = hass;
      this._syncDry();
    }
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() {
    return 8;
  }

  // Dry run (SuperNotify 2.12, issue #218): supernotify.notify with `dry_run: simulate`
  // does everything a real notification does except calling the integrations, so
  // the button shows on 2.12 or later. `dry_run: true|false` in the card config
  // forces it, e.g. when there is no update.supernotify_update entity to read.
  _dryAvailable() {
    const c = this._config;
    if (c.dry_run === true || c.dry_run === false) return c.dry_run;
    // What Home Assistant is RUNNING decides, not what HACS downloaded: the action's
    // description carries `response` only when supernotify.notify can answer (2.12+).
    // update.supernotify_update already says 2.12 after the download, before the restart.
    const svc = this._hass && this._hass.services && this._hass.services.supernotify;
    if (svc && svc.notify) return !!svc.notify.response;
    return snSupernotifyAtLeast(this._hass, "2.12.0", c.update_entity) === true;
  }

  _syncDry() {
    const b = this.shadowRoot && this.shadowRoot.getElementById("dry");
    if (!b) return;
    const has = this._dryAvailable();
    b.style.display = has ? "" : "none";
    if (!has) this.shadowRoot.getElementById("dryBox").style.display = "none";
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _deliveries() {
    // name + transport (the latter needed to tell whether an explicitly
    // picked channel actually resolves an area/floor/label target).
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_delivery_(.+)$/);
      if (m && !/^default_/i.test(m[1]))
        out.push({ name: m[1], transport: (this._hass.states[id].attributes || {}).transport || "" });
    }
    return out.sort((x, y) => x.name.localeCompare(y.name));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = snT(this._config, this._hass);
    const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; container-type: inline-size; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .grid2 { display: grid; grid-template-columns: 1fr 220px; gap: 16px; }
        @container (max-width: 560px) { .grid2 { grid-template-columns: 1fr; } }
        label { display: block; font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
                font-weight: 800; color: ${p.muted}; margin: 10px 0 4px; }
        label:first-child { margin-top: 0; }
        input[type=text], textarea, select { width: 100%; box-sizing: border-box;
          border: 1.5px solid ${p.line}; border-radius: 10px; padding: 9px 11px;
          font-size: 13.5px; background: ${p.panel}; color: ${p.ink}; font-family: inherit; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: ${p.brand}; }
        .chip { display: inline-flex; border: 1.5px solid ${p.line}; background: ${p.panel};
                border-radius: 999px; padding: 5px 11px; font-size: 11.5px; font-weight: 650;
                cursor: pointer; margin: 0 5px 5px 0; user-select: none; }
        .chip.sel { background: ${p.brand}; border-color: ${p.brand}; color: ${p.onBrand}; }
        .send { border: 0; border-radius: 10px; background: ${p.brand}; color: ${p.onBrand};
                font-weight: 750; padding: 11px 20px; cursor: pointer; font-size: 13.5px;
                margin-top: 14px; }
        .send:active { transform: scale(.97); }
        .send.dry { background: ${p.panel}; color: ${p.brandD}; border: 1.5px solid ${p.brand};
                    margin-left: 8px; }
        .dryBox { margin-top: 14px; border: 1.5px solid ${p.line}; border-radius: 12px;
                  padding: 10px 12px; background: ${p.soft}; font-size: 12.5px; }
        .dryBox h4 { margin: 0 0 8px; font-size: 12px; letter-spacing: .05em;
                     text-transform: uppercase; color: ${p.muted}; }
        .dRow { display: flex; flex-wrap: wrap; column-gap: 8px; align-items: baseline; padding: 5px 0;
                border-top: 1px solid ${p.line}; }
        .dHead { font-weight: 650; margin-bottom: 6px; }
        .dErr { color: ${p.crit || "#e23c3c"}; } .dWarnI { color: ${p.warn}; }
        .dRow:first-of-type { border-top: 0; }
        .dName { font-weight: 750; min-width: 130px; }
        .dOk { color: ${p.ok}; } .dNo { color: ${p.muted}; }
        .dMeta { margin-top: 8px; color: ${p.muted}; font-size: 11.5px; }
        .dWarn { color: ${p.warn}; font-weight: 700; margin-bottom: 6px; }
        .dryBox pre { white-space: pre-wrap; font-size: 11px; max-height: 240px; overflow: auto; }
        .phone { border: 1.5px solid ${p.line}; border-radius: 18px; padding: 12px;
                 background: ${this._dark ? "#10161e" : "#f4f7fa"}; }
        .notif { background: ${p.panel}; border-radius: 12px; padding: 10px 12px;
                 box-shadow: 0 1px 4px rgba(16,42,67,.12); }
        .pstrip { height: 3px; border-radius: 3px; margin-bottom: 7px; background: ${p.brand}; }
        .napp { font-size: 10.5px; color: ${p.muted}; font-weight: 700; }
        .ntit { font-size: 13px; font-weight: 750; margin-top: 3px; }
        .nmsg { font-size: 12.5px; margin-top: 2px; color: ${p.ink}; }
        .hint { font-size: 11px; color: ${p.muted}; margin-top: 6px; }
        .toast { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%);
                 background: ${p.ink}; color: ${p.panel}; border-radius: 10px;
                 padding: 8px 16px; font-size: 12.5px; font-weight: 650; opacity: 0;
                 pointer-events: none; transition: .25s; }
        .toast.show { opacity: .95; }
      </style>
      <ha-card style="position:relative">
        ${snIntro(this._config, this._dark)}<div class="grid2">
          <div>
            <label>${T.title}</label>
            <input type="text" id="t" placeholder="Test">
            <label>${T.message}</label>
            <textarea id="m" rows="3" placeholder="…"></textarea>
            <label>${T.priority}</label>
            <select id="p">
              <option value="">${T.default_prio}</option>
              <option value="minimum">${T.prio_minimum}</option>
              <option value="low">${T.prio_low}</option>
              <option value="medium">${T.prio_medium}</option>
              <option value="high">${T.prio_high}</option>
              <option value="critical">${T.prio_critical}</option>
            </select>
            <label>${T.channels_lbl}</label>
            <div id="chips">${this._deliveries().map((d) => `<span class="chip" data-d="${esc(d.name)}" title="${esc(d.name)}">${esc(snDeliveryAlias(this._hass, d.name) || d.name)}</span>`).join("")}</div>
            <label>${T.target_lbl}</label>
            <div id="targetSel"></div>
            <input type="text" id="customTarget" placeholder="${T.custom_target_ph}" style="margin-top:6px">
            <div class="hint" style="margin-top:3px">${T.custom_target_lbl}</div>
            <div class="hint" id="targetWarn" style="display:none;margin-top:6px;color:${p.warn}"></div>
            <label>${T.camera_lbl}</label>
            <select id="cam"><option value="">${T.none}</option>${this._cameraNames().map((c) => `<option value="${esc(c)}">📷 ${esc(snCameraName(this._hass, c))}</option>`).join("")}</select>
            <button class="send" id="send">🚀 ${T.send}</button><button class="send dry" id="dry" style="display:none">🔍 ${T.dry_btn}</button>
          </div>
          <div>
            <label>${T.preview}</label>
            <div class="phone"><div class="notif">
              <div class="pstrip" id="pvStrip"></div>
              <div class="napp">🔔 SuperNotify</div>
              <div class="ntit" id="pvT">${T.no_title}</div>
              <div class="nmsg" id="pvM">${T.no_message}</div>
              <div class="nmsg" id="pvC" style="display:none"></div>
            </div></div>
            <div class="hint">${T.comp_hint}</div>
          </div>
        </div>
        <div class="dryBox" id="dryBox" style="display:none"></div>
        <div class="toast" id="toast"></div>
        <div style="text-align:right;font-size:10px;color:${p.muted};opacity:.7;margin-top:8px">supernotify-composer-card v${SN_CARD_VERSIONS.composer}</div>
      </ha-card>`, this && this._config);
    const sr = this.shadowRoot;
    const upd = () => {
      sr.getElementById("pvT").textContent = sr.getElementById("t").value || T.no_title;
      const camSel = sr.getElementById("cam").value;
      // with a camera and no text, the card sends "📷 <camera>" as the text: show that
      sr.getElementById("pvM").textContent = sr.getElementById("m").value ||
        (camSel ? "📷 " + snCameraName(this._hass, camSel) : T.no_message);
      const pr = sr.getElementById("p").value;
      sr.getElementById("pvStrip").style.background =
        { critical: p.crit, high: p.warn, low: p.muted, minimum: p.muted }[pr] || p.brand;
      const cam = sr.getElementById("cam").value;
      const pvC = sr.getElementById("pvC");
      pvC.style.display = cam ? "" : "none";
      pvC.textContent = cam ? "🖼️ " + snCameraName(this._hass, cam) : "";
    };
    sr.getElementById("t").addEventListener("input", upd);
    sr.getElementById("m").addEventListener("input", upd);
    sr.getElementById("p").addEventListener("change", upd);
    sr.getElementById("cam").addEventListener("change", upd);
    this._deliveryTransport = {};
    this._deliveries().forEach((d) => { this._deliveryTransport[d.name] = d.transport; });
    sr.querySelectorAll("#chips .chip").forEach((node) => {
      node.onclick = () => {
        const d = node.dataset.d;
        if (this._picked.has(d)) this._picked.delete(d); else this._picked.add(d);
        node.classList.toggle("sel", this._picked.has(d));
        this._updateTargetWarn();
      };
    });
    sr.getElementById("send").onclick = () => this._send();
    sr.getElementById("dry").onclick = () => this._dryRun();
    this._mountTargetSelector();
    this._syncDry();
  }

  // Warn when the target selector holds only "indirect" categories
  // (area/floor/label) that most transports won't resolve — see
  // SN_NATIVE_TARGET_TRANSPORTS. Conservative on purpose: also warns when no
  // channel is explicitly picked, since the default/implicit routing could
  // include a non-native transport.
  _updateTargetWarn() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("targetWarn");
    if (!el) return;
    const t = this._targetValue || {};
    const hasIndirect = ["area_id", "floor_id", "label_id"].some((k) => Array.isArray(t[k]) && t[k].length);
    const hasDirect = ["entity_id", "device_id"].some((k) => Array.isArray(t[k]) && t[k].length);
    const pickedAllNative = this._picked.size > 0 &&
      [...this._picked].every((d) => SN_NATIVE_TARGET_TRANSPORTS.includes(this._deliveryTransport[d]));
    const show = hasIndirect && !hasDirect && !pickedAllNative;
    el.style.display = show ? "" : "none";
    if (show) el.textContent = snT(this._config, this._hass).target_warn;
  }

  // Native HA target selector (people/devices/areas/floors/labels), same
  // widget HA itself uses in the supernotify.notify Developer Tools/
  // automation editor UI (services.yaml: target: {selector: {target: {}}}).
  // ha-selector is part of the core Lovelace frontend bundle, but the
  // specific target-picker sub-element can still be lazy-loaded, so we wait
  // for its definition rather than assuming it's ready synchronously.
  _mountTargetSelector() {
    const container = this.shadowRoot && this.shadowRoot.getElementById("targetSel");
    if (!container) return;
    const mount = () => {
      const sel = document.createElement("ha-selector");
      sel.hass = this._hass;
      sel.selector = { target: {} };
      sel.value = this._targetValue || {};
      sel.addEventListener("value-changed", (ev) => {
        this._targetValue = (ev.detail && ev.detail.value) || {};
        this._updateTargetWarn();
      });
      container.innerHTML = "";
      container.appendChild(sel);
      this._targetSelEl = sel;
      this._updateTargetWarn();
    };
    if (customElements.get("ha-selector")) {
      mount();
    } else {
      container.textContent = "…";
      customElements.whenDefined("ha-selector").then(mount).catch(() => {
        container.textContent = "";
      });
    }
  }

  _cameraNames() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states).filter((e) => e.startsWith("camera.")).sort();
  }

  async _send() {
    const T = snT(this._config, this._hass);
    const payload = this._payload();
    if (!payload.message) {
      // SuperNotify 2.11.1: supernotify.notify works without text, e.g. only a camera
      // snapshot or a channel with a preset message. Older versions need the text.
      const other = payload.camera_entity_id || (payload.delivery && Object.keys(payload.delivery).length);
      const ok = snSupernotifyAtLeast(this._hass, "2.11.1", this._config.update_entity);
      if (ok === false) { this._toast(other ? T.need_2111 : T.write_first); return; }
      if (!other) { this._toast(T.write_or_pick); return; }
    }
    if (payload.priority === "critical" && !confirm(T.critical_confirm))
      return;
    // a dry run with the duplicate check left this content in SuperNotify's dupe cache:
    // without force_resend the real one would be dropped as a duplicate of the simulation
    const k = this._dryKey;
    if (k && k.key === JSON.stringify(payload) && Date.now() - k.at < 3600000) payload.force_resend = true;
    this._dryKey = null;
    try {
      await this._hass.callService("supernotify", "notify", payload);
      this._toast(T.sent_toast);
    } catch (e) {
      this._toast(`✖ ${T.send_err}: ${(e && (e.message || e.code)) || e}`);
    }
  }

  // The form as a supernotify.notify payload - shared by Send and Try without sending.
  _payload() {
    const sr = this.shadowRoot;
    const message = (sr.getElementById("m").value || "").trim();
    const title = (sr.getElementById("t").value || "").trim();
    const priority = sr.getElementById("p").value;
    // Dedicated `supernotify.notify` action (SuperNotify >= 2.3.0): typed,
    // selector-driven fields instead of notify.supernotify's generic data:.
    // Context is preserved end-to-end and the target field accepts the
    // native HA target selector (people/devices/areas/floors/labels).
    const payload = {};
    if (message) payload.message = message;
    if (title) payload.title = title;
    if (priority) payload.priority = priority;
    if (this._picked.size) {
      payload.delivery_selection = "fixed";
      payload.delivery = {};
      for (const d of this._picked) payload.delivery[d] = {};
    }
    const target = this._targetValue;
    if (target && Object.keys(target).some((k) => target[k] && target[k].length))
      payload.target = target;
    const customRaw = (sr.getElementById("customTarget").value || "").trim();
    if (customRaw)
      payload.custom_target = customRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const cam = sr.getElementById("cam").value;
    if (cam) {
      payload.camera_entity_id = cam;
      // Tested on SuperNotify 2.12 + the Android companion app: a photo-only push reaches the
      // phone with message "" and the app shows nothing. So a camera with no text gets the
      // camera's name as text; a channel picked without text still goes out without one.
      if (!payload.message) {
        payload.message = "📷 " + snCameraName(this._hass, cam);
      }
    }
    return payload;
  }

  // Dry run: the notification as SuperNotify would send it now, without sending it.
  // By default it also carries force_resend, so it skips the duplicate check: in 2.12.0-beta1
  // a simulated notification is written into the duplicate cache, and the real one sent right
  // after (same text, within the dupe TTL) would be dropped as a duplicate. With
  // `dry_run_dupe_check: true` the simulation does check for duplicates, and the next Send of
  // the same content carries force_resend instead.
  async _dryRun() {
    const T = snT(this._config, this._hass);
    const box = this.shadowRoot.getElementById("dryBox");
    if (!this._dryAvailable()) return;
    const payload = this._payload();
    const dupeCheck = !!this._config.dry_run_dupe_check;
    const data = { ...payload, dry_run: "simulate" };
    if (!dupeCheck) data.force_resend = true;
    box.style.display = "";
    box.textContent = "…";
    try {
      const res = await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "notify",
        service_data: data, return_response: true,
      });
      if (dupeCheck) this._dryKey = { key: JSON.stringify(payload), at: Date.now() };
      this._renderDry((res && res.response) || {}, !dupeCheck);
    } catch (e) {
      const msg = String((e && (e.message || e.code)) || e);
      box.textContent = /does not return responses/i.test(msg)
        ? `✖ ${T.dry_restart}`
        : `✖ ${T.dry_err}: ${msg}`;
    }
  }

  // The response is the notification itself (Notification.contents(), the same JSON the
  // archive keeps), read through snArchiveDetail like the why-card does.
  _renderDry(doc, noDupeCheck) {
    const T = snT(this._config, this._hass);
    const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const n = snIsObj(doc) && (doc.deliveries || doc.outcome || doc.id) ? snArchiveDetail(doc) : null;
    const box = this.shadowRoot.getElementById("dryBox");
    if (!n) {
      box.innerHTML = snIconify(`<h4>🔍 ${T.dry_title}</h4><div class="dNo">${T.dry_empty}</div>`, this && this._config);
      return;
    }
    const st = this._hass.states;
    const chan = (name) => {
      const alias = snDeliveryAlias(this._hass, name);
      return alias && alias !== name ? `${esc(alias)} <span class="dNo">(${esc(name)})</span>` : esc(name);
    };
    const reason = (code) => {
      const k = String(code || "").toUpperCase();
      return esc((T.dry_reasons && T.dry_reasons[k]) || code || "?");
    };
    const short = (v) => String(v).replace(/^(mobile_app_|person\.|media_player\.|notify\.)/, "");
    const tgText = (tg) => {
      const vals = Object.values(tg || {}).flat();
      if (!vals.length) return "";
      const shown = vals.slice(0, 3).map((v) => esc((st[v] && st[v].attributes && st[v].attributes.friendly_name) || short(v)));
      return shown.join(", ") + (vals.length > 3 ? ` +${vals.length - 3}` : "");
    };
    const order = { ok: 0, err: 1, supp: 2, skip: 3 };
    const dl = [...(n.dl || [])].sort((a, b) => (order[a.r] ?? 4) - (order[b.r] ?? 4) || a.n.localeCompare(b.n));
    const going = dl.filter((d) => d.r === "ok").length;
    let h = `<h4>🔍 ${T.dry_title}</h4>`;
    h += `<div class="dHead">${going ? `✔ <b>${going}</b> ${T.dry_would_n}` : `⛔ ${T.dry_nothing}`}` +
      `${n.mi ? ` · <span class="dWarnI">⚠ <b>${esc(n.mi)}</b> ${T.missed_n}</span>` : ""}</div>`;
    if (n.o === "dupe" || dl.some((d) => d.why === "DUPE")) h += `<div class="dWarn">♻ ${T.dry_dupe}</div>`;
    if (!dl.length) h += `<div class="dNo">${T.dry_none}</div>`;
    for (const d of dl) {
      if (d.r === "ok") {
        const tg = tgText(d.tg);
        h += `<div class="dRow"><span class="dName dOk">✔ ${chan(d.n)}</span><span>${tg || T.dry_nobody}</span></div>`;
      } else if (d.r === "err") {
        h += `<div class="dRow"><span class="dName dErr">✖ ${chan(d.n)}</span><span class="dErr">${esc((d.err || [])[0] || T.dry_err)}</span></div>`;
      } else {
        h += `<div class="dRow"><span class="dName dNo">⊘ ${chan(d.n)}</span><span class="dNo">${reason(d.why)}</span></div>`;
      }
    }
    const meta = [];
    meta.push(`${T.dry_prio}: ${esc(T["prio_" + n.p] || n.p || "medium")}`);
    const scen = (n.sc && (n.sc.sel || n.sc.on)) || [];
    if (scen.length) meta.push(`${T.dry_scen}: ${esc(scen.map((x) => snScenarioName(this._hass, x)).join(", "))}`);
    if (n.occ && n.occ.home && n.occ.home.length)
      meta.push(`${T.dry_home}: ${esc(n.occ.home.map((p) => (st[p] && st[p].attributes.friendly_name) || short(p)).join(", "))}`);
    h += `<div class="dMeta">${meta.join(" · ")}</div>`;
    if (noDupeCheck) h += `<div class="dMeta">ℹ️ ${T.dry_no_dupe}</div>`;
    h += `<details class="dMeta"><summary>${T.dry_raw}</summary><pre>${esc(JSON.stringify(doc, null, 2))}</pre></details>`;
    box.innerHTML = snIconify(h, this && this._config);
  }

  _toast(msg) {
    const t = this.shadowRoot.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove("show"), 2400);
  }
}

customElements.define("supernotify-composer-card", SupernotifyComposerCard);

window.customCards.push({
  type: "supernotify-composer-card",
  name: "SuperNotify Composer Card",
  description: "Try & send: title, message, priority, optional explicit channels, live phone preview.",
});

/* ======================================================================
 * SupernotifyAutomationsCard — dynamic list of the automations that send
 * notifications via notify.supernotify.
 *
 * HA cannot expose the config of YAML/package automations (no `id`), so
 * discovery is hybrid: a scanner script writes a JSON manifest under
 * /config/www/ and this card layers everything live on top of it —
 * state, last_triggered, enable/disable toggle, search and category
 * filters. Regenerate the manifest with tools/genera_vista_automazioni.py.
 *
 * Options:
 *   manifest_url  (default /local/supernotify/automations.json)
 *   intro         optional intro text (HTML)
 *   style         "supernotify" (default) | "theme"
 *   language      override, else follows hass.language
 * ==================================================================== */
class SupernotifyAutomationsCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      manifest_url: "/local/supernotify/automations.json",
      style: "supernotify",
      ...(config || {}),
    };
    this._rendered = false;
    this._q = "";
    this._cat = null;
    this._onlyDisabled = false;
  }

  set hass(hass) {
    const raw = hass;
    const tr = this._snTr || (this._snTr = snTracker());
    const changed = snChanged(tr, raw);
    hass = snTrackedHass(raw, tr);
    queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._manifest && !this._loading && !this._err) this._load();
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (changed) this._updateRows();
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  getCardSize() {
    return 8;
  }

  async _load() {
    this._loading = true;
    try {
      const r = await fetch(this._config.manifest_url + "?nc=" + Date.now(),
        { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      this._manifest = await r.json();
      this._err = null;
    } catch (e) {
      this._err = String((e && e.message) || e);
    }
    this._loading = false;
    this._rendered = false;
    if (this._hass) this._render();
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  _rel(iso) {
    const T = snT(this._config, this._hass);
    if (!iso) return T.never;
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 90) return T.ago_now;
    if (s < 5400) return Math.round(s / 60) + " " + T.ago_min;
    if (s < 129600) return Math.round(s / 3600) + " " + T.ago_h;
    return Math.round(s / 86400) + " " + T.ago_d;
  }

  _items() {
    const list = (this._manifest && this._manifest.automations) || [];
    return list.map((a) => ({
      e: a.e, n: a.n || a.e, c: a.c || "—", s: a.s || "",
      st: this._hass.states[a.e],
    }));
  }

  _cats(items) {
    const seen = [];
    for (const a of items) if (!seen.includes(a.c)) seen.push(a.c);
    return seen;
  }

  _filtered(items) {
    const q = this._q.trim().toLowerCase();
    return items.filter((a) =>
      (!this._cat || a.c === this._cat) &&
      (!this._onlyDisabled || !(a.st && a.st.state === "on")) &&
      (!q || a.n.toLowerCase().includes(q) || a.e.includes(q) ||
        a.s.toLowerCase().includes(q)));
  }

  _toggle(ent, on) {
    this._hass.callService("automation", on ? "turn_on" : "turn_off",
      { entity_id: ent });
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = snT(this._config, this._hass);
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .top { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
        input[type=search] { flex: 1; border: 1.5px solid ${p.line}; border-radius: 10px;
          padding: 8px 12px; font-size: 13.5px; background: ${p.panel}; color: ${p.ink}; }
        input[type=search]:focus { outline: none; border-color: ${p.brand}; }
        .tot { font-size: 12px; font-weight: 750; color: ${p.muted}; white-space: nowrap; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
        .chip { border: 1.5px solid ${p.line}; border-radius: 999px; padding: 4px 11px;
          font-size: 12px; font-weight: 650; cursor: pointer; user-select: none; }
        .chip.sel { border-color: ${p.brand}; background: ${p.soft}; color: ${p.brandD}; }
        .chip.warn.sel { border-color: #e0733a; background: rgba(224,115,58,.12); color: #e0733a; }
        .grp { font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
          font-weight: 800; color: ${p.muted}; margin: 12px 4px 4px; }
        .row { display: flex; align-items: center; gap: 10px; padding: 7px 8px;
          border-radius: 10px; }
        .row:hover { background: ${p.soft}; }
        .row.off .nm { opacity: .55; }
        .who { flex: 1; min-width: 0; cursor: pointer; }
        .nm { font-size: 13.5px; font-weight: 650; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap; }
        .sub { font-size: 11px; color: ${p.muted}; }
        .sw { position: relative; width: 40px; height: 22px; flex: none; }
        .sw input { opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
        .sw .sl { position: absolute; inset: 0; border-radius: 999px; background: ${p.line};
          pointer-events: none; transition: background .15s; }
        .sw .sl::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px;
          height: 16px; border-radius: 50%; background: #fff; transition: left .15s; }
        .sw input:checked + .sl { background: ${p.brand}; }
        .sw input:checked + .sl::after { left: 21px; }
        .empty { padding: 18px 8px; color: ${p.muted}; font-size: 13px; }
        .err { padding: 14px; border: 1.5px dashed ${p.line}; border-radius: 12px;
          color: ${p.muted}; font-size: 13px; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
        ${SN_FLOW_CSS}
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}
        <div id="body"></div>
        <div class="ver" id="foot">${this._config && this._config.show_version ? `supernotify-automations-card v${SN_CARD_VERSIONS.automations}` : ""}</div>
      </ha-card>`, this && this._config);
    this._renderBody();
  }

  _renderBody() {
    const el = this.shadowRoot.getElementById("body");
    const T = snT(this._config, this._hass);
    if (this._err) {
      el.innerHTML = snIconify(`<div class="err">⚠️ ${this._esc(T.aut_err)}<br>
        <span style="opacity:.7">${this._esc(this._config.manifest_url)} — ${this._esc(this._err)}</span></div>`, this && this._config);
      return;
    }
    if (!this._manifest) {
      el.innerHTML = snIconify(`<div class="empty">…</div>`, this && this._config);
      return;
    }
    const items = this._items();
    const cats = this._cats(items);
    el.innerHTML = snIconify(`
      <div class="top">
        <input type="search" id="q" placeholder="${this._esc(T.aut_search)}"
          value="${this._esc(this._q)}" aria-label="${this._esc(T.aut_search)}">
        <span class="tot">${items.length} ${T.aut_count} · v${SN_CARD_VERSIONS.automations}</span>
      </div>
      <div class="chips" id="chips"></div>
      <div id="list" class="flow"></div>`, this && this._config);
    const q = el.querySelector("#q");
    q.addEventListener("input", () => { this._q = q.value; this._renderList(); });
    this._renderChips();
    this._renderList();
    const gen = this._manifest.generated;
    if (gen) {
      const f = this.shadowRoot.getElementById("foot");
      f.innerText = `${T.aut_updated} ${this._rel(gen)}` + (this._config.show_version ? ` · supernotify-automations-card v${SN_CARD_VERSIONS.automations}` : "");
    }
  }

  _renderChips() {
    const el = this.shadowRoot.getElementById("chips");
    if (!el) return;
    const T = snT(this._config, this._hass);
    const items = this._items();
    const cats = this._cats(items);
    const offCount = items.filter((a) => !(a.st && a.st.state === "on")).length;
    const chip = (label, val, n) =>
      `<span class="chip ${this._cat === val ? "sel" : ""}" data-c="${this._esc(val || "")}">${this._esc(label)} · ${n}</span>`;
    el.innerHTML = snIconify(chip(T.aut_all, null, items.length) +
      cats.map((c) => chip(c, c, items.filter((a) => a.c === c).length)).join("") +
      `<span class="chip warn ${this._onlyDisabled ? "sel" : ""}" id="offOnly">🔕 ${this._esc(T.aut_disabled_only)} · ${offCount}</span>`, this && this._config);
    el.querySelectorAll(".chip[data-c]").forEach((ch) => {
      ch.addEventListener("click", () => {
        const v = ch.dataset.c || null;
        this._cat = this._cat === v ? null : v;
        this._renderChips();
        this._renderList();
      });
    });
    const offCh = el.querySelector("#offOnly");
    if (offCh) offCh.addEventListener("click", () => {
      this._onlyDisabled = !this._onlyDisabled;
      this._renderChips();
      this._renderList();
    });
  }

  _renderList() {
    const el = this.shadowRoot.getElementById("list");
    if (!el) return;
    const T = snT(this._config, this._hass);
    const rows = this._filtered(this._items());
    if (!rows.length) {
      el.innerHTML = snIconify(`<div class="empty">${this._esc(T.aut_none)}</div>`, this && this._config);
      return;
    }
    let html = "", lastCat = null;
    for (const a of rows) {
      if (a.c !== lastCat && !this._cat) {
        html += `<div class="grp">${this._esc(a.c)}</div>`;
        lastCat = a.c;
      }
      const on = a.st && a.st.state === "on";
      const lt = a.st && a.st.attributes.last_triggered;
      html += `
        <div class="row ${on ? "" : "off"}" data-e="${this._esc(a.e)}">
          <div class="who"><div class="nm">${this._esc(a.n)}</div>
            <div class="sub"><span class="lt">${this._esc(this._rel(lt))}</span> · ${this._esc(a.s)}</div></div>
          <label class="sw"><input type="checkbox" ${on ? "checked" : ""}
            aria-label="${this._esc(a.n)}"><span class="sl"></span></label>
        </div>`;
    }
    el.innerHTML = snIconify(html, this && this._config);
    el.querySelectorAll(".row").forEach((row) => {
      const inp = row.querySelector("input");
      inp.addEventListener("change", () => this._toggle(row.dataset.e, inp.checked));
      const who = row.querySelector(".who");
      if (who) who.addEventListener("click", () => this._moreInfo(row.dataset.e));
    });
  }

  _updateRows() {
    if (!this.shadowRoot || !this._manifest) return;
    this.shadowRoot.querySelectorAll(".row[data-e]").forEach((row) => {
      const st = this._hass.states[row.dataset.e];
      if (!st) return;
      const on = st.state === "on";
      row.classList.toggle("off", !on);
      const inp = row.querySelector("input");
      if (inp && inp.checked !== on) inp.checked = on;
      const lt = row.querySelector(".lt");
      if (lt) lt.innerText = this._rel(st.attributes.last_triggered);
    });
  }
}
customElements.define("supernotify-automations-card", SupernotifyAutomationsCard);

window.customCards.push({
  type: "supernotify-automations-card",
  name: "SuperNotify Automations Card",
  description: "Live list of the automations that notify via SuperNotify: search, category filters, enable/disable.",
});


/* ════════════════════════════════════════════════════════════════════════
 * supernotify-stats-card — usage analytics (NEW, 2026-09-10)
 * Everything is derived from entities that already exist, no extra sensor:
 *   • daily series   → long-term statistics of the daily utility_meter
 *                      (sent_today_entity, default sensor.supernotify_inviate_oggi),
 *                      so it survives recorder purges;
 *   • per-notification detail (hour, weekday, priority, day period, channels)
 *                    → recorder history of the "last notification" helpers
 *                      written by the user's logging automation: one change of
 *                      input_datetime.supernotify_last_time = one notification,
 *                      joined with the value the other helpers had at that time;
 *   • channels       → input_text.supernotify_last_channels, written AFTER
 *                      delivery by the "Log canali consegnati" automation as
 *                      "a, b, ✖c" (✖ = that channel errored). Older values
 *                      like "auto (scenari)" are counted as "unknown";
 *   • versions       → HACS update entities (update.supernotify_update and
 *                      update.supernotify_cards_update): installed vs latest,
 *                      release link, brand icon.
 * Charts are inline SVG, no libraries. Palette follows the other cards.
 * ════════════════════════════════════════════════════════════════════════ */

const SN_STATS_STRINGS = {
  en: {
    st_title: "Usage", st_days: "days", st_days_short: "d",
    st_hist_note: "hours, channels and priorities over the last {n} days of history", st_total: "Notifications", st_avg: "per day",
    st_today: "Today", st_vs_avg: "vs. average", st_peak_hour: "Peak hour", st_top_channel: "Top channel",
    st_errors: "Channel errors", st_of_sends: "of channel sends", st_daily: "Per day", st_hourly: "By hour of day",
    st_weekday: "By weekday", st_channels: "Channels — most used", st_priority: "Priority", st_period: "Day period",
    st_insights: "Insights", st_no_data: "No history yet — data appears after the first notifications.",
    st_unknown: "unknown", st_loading: "loading…", st_versions: "Versions",
    st_installed: "installed", st_latest: "latest", st_uptodate: "up to date", st_update: "update available",
    st_restart: "restart required", st_cards: "cards", st_logged: "logged",
    st_wd: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    st_i_share: "{p}% of all channel sends go through {c}.",
    st_i_peak: "Busiest hour is {h}:00 ({n} notifications in {d} days).",
    st_i_night: "{p}% of notifications arrive between 23:00 and 07:00 — consider a DND scenario if that's unwanted.",
    st_i_night_ok: "Only {p}% of notifications arrive at night (23–07): quiet hours are working.",
    st_i_weekend: "Weekend days carry {p}% {dir} notifications than weekdays.",
    st_i_errors: "{n} channel errors in {d} days, mostly on {c}.",
    st_i_noerr: "No channel errors in the last {d} days.",
    st_i_prio: "{p}% of notifications are {prio} priority.",
    st_i_trend: "Last 7 days: {n}/day, {dir} {p}% vs. the 7 before.",
    st_more: "more", st_less: "fewer", st_up: "up", st_down: "down",
  },
  it: {
    st_title: "Utilizzo", st_days: "giorni", st_days_short: "gg",
    st_hist_note: "ore, canali e priorità sugli ultimi {n} giorni di cronologia", st_total: "Notifiche", st_avg: "al giorno",
    st_today: "Oggi", st_vs_avg: "vs. media", st_peak_hour: "Ora di punta", st_top_channel: "Canale principale",
    st_errors: "Errori canale", st_of_sends: "degli invii per canale", st_daily: "Per giorno", st_hourly: "Per ora del giorno",
    st_weekday: "Per giorno della settimana", st_channels: "Canali — più usati", st_priority: "Priorità", st_period: "Periodo del giorno",
    st_insights: "Osservazioni", st_no_data: "Ancora nessuna cronologia — i dati compaiono dopo le prime notifiche.",
    st_unknown: "sconosciuto", st_loading: "caricamento…", st_versions: "Versioni",
    st_installed: "installata", st_latest: "ultima", st_uptodate: "aggiornato", st_update: "aggiornamento disponibile",
    st_restart: "riavvio richiesto", st_cards: "card", st_logged: "registrate",
    st_wd: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
    st_i_share: "{c} assorbe il {p}% degli invii per canale.",
    st_i_peak: "Ora più carica: le {h}:00 ({n} notifiche in {d} giorni).",
    st_i_night: "Notifiche notturne (23–07): {p}% — se non le vuoi, valuta uno scenario DND.",
    st_i_night_ok: "Notifiche notturne (23–07): solo {p}% — le fasce di silenzio funzionano.",
    st_i_weekend: "Nel weekend arrivano {p}% notifiche {dir} rispetto ai giorni feriali.",
    st_i_errors: "{n} errori di canale in {d} giorni, soprattutto su {c}.",
    st_i_noerr: "Nessun errore di canale negli ultimi {d} giorni.",
    st_i_prio: "Priorità {prio}: {p}% delle notifiche.",
    st_i_trend: "Ultimi 7 giorni: {n}/giorno, {dir} del {p}% rispetto ai 7 precedenti.",
    st_more: "in più", st_less: "in meno", st_up: "in aumento", st_down: "in calo",
  },
};
Object.assign(SN_STRINGS.en, SN_STATS_STRINGS.en);
Object.assign(SN_STRINGS.it, SN_STATS_STRINGS.it);

const SN_PRIO_COLORS = { critical: "#e23c3c", high: "#f0a020", medium: "#03a9f4", low: "#8fa1b4", minimum: "#c3ccd6" };

class SupernotifyStatsCard extends HTMLElement {
  static getStubConfig() {
    return { days: 14 };
  }

  setConfig(config) {
    this._config = {
      style: "supernotify",
      days: 14,
      time_entity: "input_datetime.supernotify_last_time",
      priority_entity: "input_text.supernotify_last_priority",
      channels_entity: "input_text.supernotify_last_channels",
      period_entity: "input_text.supernotify_last_day_period",
      sent_today_entity: "sensor.supernotify_inviate_oggi",
      update_entity: "update.supernotify_update",
      cards_update_entity: "update.supernotify_cards_update",
      refresh_minutes: 10,
      top_channels: 8,
      periods: [7, 14, 30],
      ...(config || {}),
    };
    // the window picked in the header wins over `days`, and is remembered per browser
    let saved = null;
    try { saved = +window.localStorage.getItem("supernotify-stats-days"); } catch (e) { /* private mode */ }
    const periods = (this._config.periods || []).map(Number).filter((n) => n >= 2);
    this._days = saved && periods.includes(saved) ? saved : Math.max(2, +this._config.days || 14);
    this._rendered = false;
    this._data = null;
  }

  _setDays(n) {
    if (n === this._days) return;
    this._days = n;
    try { window.localStorage.setItem("supernotify-stats-days", String(n)); } catch (e) { /* ignore */ }
    this._data = null;
    if (this._rendered) this._render();
    this._load(true);
  }

  set hass(hass) {
    const first = !this._hass;
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._updateVersions();
    if (first) this._load();
  }

  connectedCallback() {
    const m = (this._config && this._config.refresh_minutes) || 10;
    this._timer = setInterval(() => this._load(), m * 60000);
    // redraw the bars when the card changes width (phone rotation, sidebar, column span)
    if (window.ResizeObserver && !this._ro) {
      this._ro = new ResizeObserver(() => {
        if (this._data && this._svgW && Math.abs(this._chartWidth() - this._svgW) > 40) this._draw();
      });
    }
    if (this._ro) this._ro.observe(this);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    if (this._ro) this._ro.disconnect();
  }

  _chartWidth() {
    const w = this.getBoundingClientRect ? this.getBoundingClientRect().width : 0;
    return Math.max(300, Math.min(600, Math.round((w || 600) - 28)));
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() {
    return 12;
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  // ── data ──────────────────────────────────────────────────────────────

  async _load(force) {
    if (!this._hass) return;
    if (this._loading && !force) return;
    const seq = (this._seq = (this._seq || 0) + 1);
    this._loading = true;
    const c = this._config;
    const days = Math.max(2, +this._days || +c.days || 14);
    const now = new Date();
    const start = new Date(now.getTime() - days * 86400000);
    start.setHours(0, 0, 0, 0);
    const ids = [c.time_entity, c.priority_entity, c.channels_entity, c.period_entity].filter(Boolean);
    let hist = {};
    let stats = {};
    try {
      [hist, stats] = await Promise.all([
        this._hass.callWS({
          type: "history/history_during_period",
          start_time: start.toISOString(), end_time: now.toISOString(),
          entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
        }),
        c.sent_today_entity
          ? this._hass.callWS({
              type: "recorder/statistics_during_period",
              start_time: start.toISOString(), end_time: now.toISOString(),
              statistic_ids: [c.sent_today_entity], period: "day", types: ["change"],
            }).catch(() => ({}))
          : Promise.resolve({}),
      ]);
    } catch (e) {
      this._error = String(e && (e.message || e));
    }
    if (seq !== this._seq) return;          // a newer window was picked meanwhile
    this._data = this._compute(hist || {}, stats || {}, start, now, days);
    this._loading = false;
    if (this._rendered) this._draw();
  }

  // history rows: {s: state, lu: seconds}. The first row is the state at
  // start_time (its lu is older than start) — used only as the carry-in value.
  _rows(hist, id) {
    const raw = (id && hist[id]) || [];
    return raw.map((r) => ({ s: r.s, t: (r.lu || r.lc || 0) * 1000 })).sort((a, b) => a.t - b.t);
  }

  _valueAt(rows, t, slackMs) {
    // last row with time <= t + slack
    let v = null;
    for (const r of rows) {
      if (r.t <= t + slackMs) v = r.s; else break;
    }
    return v;
  }

  _compute(hist, stats, start, now, days) {
    const c = this._config;
    const startMs = start.getTime();
    const spine = this._rows(hist, c.time_entity).filter((r) => r.t >= startMs && r.s && r.s !== "unknown");
    const prio = this._rows(hist, c.priority_entity);
    const chan = this._rows(hist, c.channels_entity);
    const per = this._rows(hist, c.period_entity);

    const perHour = new Array(24).fill(0);
    const perWd = new Array(7).fill(0);
    const perDayHist = {};
    const prioCount = {};
    const periodCount = {};
    const chanOk = {};
    const chanKo = {};
    let chanKnown = 0;
    let chanUnknown = 0;
    let night = 0;

    spine.forEach((ev, i) => {
      const d = new Date(ev.t);
      perHour[d.getHours()]++;
      perWd[(d.getDay() + 6) % 7]++;
      const key = this._dayKey(d);
      perDayHist[key] = (perDayHist[key] || 0) + 1;
      if (d.getHours() >= 23 || d.getHours() < 7) night++;
      const p = (this._valueAt(prio, ev.t, 2000) || "").toLowerCase();
      if (p) prioCount[p] = (prioCount[p] || 0) + 1;
      const dp = this._valueAt(per, ev.t, 2000);
      if (dp) periodCount[dp] = (periodCount[dp] || 0) + 1;
      // channels: value written for THIS notification — the last change before
      // the next notification (the post-delivery automation writes it a moment
      // after the spine), else the carried-over value (unchanged string).
      const next = i + 1 < spine.length ? spine[i + 1].t : Infinity;
      let cv = null;
      for (const r of chan) {
        if (r.t <= ev.t + 2000) { cv = r.s; continue; }
        if (r.t < next) { cv = r.s; continue; }
        break;
      }
      const parsed = this._parseChannels(cv);
      if (!parsed) { chanUnknown++; return; }
      chanKnown++;
      parsed.ok.forEach((n) => { chanOk[n] = (chanOk[n] || 0) + 1; });
      parsed.ko.forEach((n) => { chanKo[n] = (chanKo[n] || 0) + 1; });
    });

    // daily series: prefer long-term statistics (complete + independent from
    // purge), fall back to the spine count when the meter has no stats.
    const statRows = (c.sent_today_entity && stats[c.sent_today_entity]) || [];
    const perDay = [];
    const dayCursor = new Date(start);
    const todayKey = this._dayKey(now);
    const statByKey = {};
    statRows.forEach((r) => { statByKey[this._dayKey(new Date(r.start))] = Math.round(+r.change || 0); });
    // today: long-term statistics are compiled hourly, so prefer the live
    // state of the daily meter (it resets at midnight = today's count).
    const liveToday = c.sent_today_entity && this._hass.states[c.sent_today_entity];
    const liveVal = liveToday && !["unknown", "unavailable"].includes(liveToday.state) ? Math.round(+liveToday.state) : null;
    while (dayCursor <= now) {
      const k = this._dayKey(dayCursor);
      let v = statByKey[k];
      if (k === todayKey && liveVal != null && (v == null || liveVal >= v)) v = liveVal;
      if (v == null) v = perDayHist[k] || 0;
      perDay.push({ key: k, d: new Date(dayCursor), n: v, today: k === todayKey });
      dayCursor.setDate(dayCursor.getDate() + 1);
    }
    const completeDays = perDay.filter((x) => !x.today);
    const total = perDay.reduce((a, x) => a + x.n, 0);
    const avg = completeDays.length ? completeDays.reduce((a, x) => a + x.n, 0) / completeDays.length : 0;
    const today = perDay.length ? perDay[perDay.length - 1].n : 0;
    const last7 = completeDays.slice(-7);
    const prev7 = completeDays.slice(-14, -7);
    const m7 = last7.length ? last7.reduce((a, x) => a + x.n, 0) / last7.length : 0;
    const mp7 = prev7.length ? prev7.reduce((a, x) => a + x.n, 0) / prev7.length : 0;

    const peakHour = perHour.indexOf(Math.max(...perHour));
    const channels = Object.keys(chanOk).map((n) => ({ name: n, ok: chanOk[n], ko: chanKo[n] || 0 }));
    Object.keys(chanKo).forEach((n) => { if (!chanOk[n]) channels.push({ name: n, ok: 0, ko: chanKo[n] }); });
    channels.sort((a, b) => (b.ok + b.ko) - (a.ok + a.ko));
    const sends = channels.reduce((a, x) => a + x.ok + x.ko, 0);
    const errors = channels.reduce((a, x) => a + x.ko, 0);
    const wdCount = perWd.slice(0, 5).reduce((a, b) => a + b, 0);
    const weCount = perWd[5] + perWd[6];
    // normalise on the days that actually have recorded events (recorder
    // history can start later than the window, e.g. after a DB purge)
    const daysWithData = perDay.filter((x) => perDayHist[x.key]);
    const wdDays = daysWithData.filter((x) => (x.d.getDay() + 6) % 7 < 5).length;
    const weDays = daysWithData.filter((x) => (x.d.getDay() + 6) % 7 >= 5).length;

    return {
      days, histDays: daysWithData.length, spineCount: spine.length, perHour, perWd, perDay, prioCount, periodCount, channels, sends, errors,
      chanKnown, chanUnknown, total, avg, today, peakHour, night, m7, mp7,
      wdPerDay: wdDays ? wdCount / wdDays : null, wePerDay: weDays ? weCount / weDays : null,
    };
  }

  _parseChannels(s) {
    if (!s || typeof s !== "string") return null;
    const t = s.trim();
    if (!t || /^auto\b/i.test(t) || /^nessun/i.test(t) || t === "unknown" || t === "—") return null;
    const ok = [];
    const ko = [];
    t.split(",").map((x) => x.trim()).filter(Boolean).forEach((x) => {
      const clean = x.replace(/…$/, "");
      if (/^[✖✗]/.test(clean)) ko.push(clean.replace(/^[✖✗]\s*/, ""));
      else ok.push(clean);
    });
    if (!ok.length && !ko.length) return null;
    return { ok, ko };
  }

  _dayKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // ── render ────────────────────────────────────────────────────────────

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = snT(this._config, this._hass);
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; container-type: inline-size; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .hdr { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .hdr h3 { margin: 0; font-size: 15px; font-weight: 800; }
        .hdr .win { font-size: 11.5px; color: ${p.muted}; }
        .per { display: inline-flex; gap: 4px; margin-left: auto; }
        .pb { font: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer; border-radius: 999px;
              border: 1.5px solid ${p.line}; background: ${p.panel}; color: ${p.muted}; padding: 3px 10px; }
        .pb.on { background: ${p.brand}; border-color: ${p.brand}; color: ${p.onBrand}; }
        .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 10px; margin-top: 12px; }
        .kpi { border: 1.5px solid ${p.line}; border-radius: 14px; padding: 10px 12px; background: ${p.panel}; }
        .kpi .k { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; white-space: nowrap; }
        .kpi .v { font-size: 21px; font-weight: 800; margin-top: 2px; }
        .kpi .s { font-size: 11px; color: ${p.muted}; margin-top: 1px; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; margin: 16px 0 6px; display:flex; justify-content: space-between; }
        .sec .n { font-weight: 650; text-transform: none; letter-spacing: 0; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @container (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
        @container (max-width: 460px) { .hrow .nm { width: 46%; min-width: 90px; } .hrow .ct { width: 48px; } }
        svg { width: 100%; height: auto; display: block; overflow: visible; }
        .bars text { font-size: 9px; fill: ${p.muted}; }
        .bars .val { font-size: 9.5px; fill: ${p.ink}; font-weight: 700; }
        .hrow { display: flex; align-items: center; gap: 8px; font-size: 12.5px; padding: 4px 0; }
        .hrow .nm { width: 38%; min-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hrow .nm small { font-size: 10.5px; font-weight: 400; }
        .hrow .tr { flex: 1; height: 12px; background: ${p.soft}; border-radius: 6px; overflow: hidden; display: flex; }
        .hrow .ok { background: ${p.brand}; height: 100%; }
        .hrow .ko { background: ${p.crit}; height: 100%; }
        .hrow .ct { width: 64px; text-align: right; font-variant-numeric: tabular-nums; font-size: 11.5px; color: ${p.muted}; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid ${p.line}; border-radius: 999px; padding: 4px 10px; font-size: 11.5px; font-weight: 650; background: ${p.soft}; color: ${p.brandD}; }
        .chip i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .ins { margin: 0; padding-left: 18px; font-size: 12.5px; line-height: 1.55; }
        .ins li { margin: 2px 0; }
        .ver { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid ${p.line}; }
        .vbox { display: flex; align-items: center; gap: 10px; border: 1.5px solid ${p.line}; border-radius: 12px; padding: 8px 12px; flex: 1; min-width: 220px; text-decoration: none; color: inherit; }
        .vbox img { width: 28px; height: 28px; border-radius: 6px; }
        .vbox .ic { width: 28px; height: 28px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size: 18px; background: ${p.soft}; }
        .vbox b { font-size: 13px; }
        .vbox .sm { font-size: 11px; color: ${p.muted}; }
        .badge { border-radius: 999px; padding: 2px 9px; font-size: 10.5px; font-weight: 750; margin-left: auto; white-space: nowrap; }
        .b-ok { background: rgba(46,158,91,.14); color: ${p.ok}; }
        .b-upd { background: rgba(240,160,32,.16); color: ${p.warn}; }
        .empty { color: ${p.muted}; font-size: 12.5px; padding: 8px 0; }
        .foot { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}
        <div class="hdr"><h3>📊 ${T.st_title}</h3>
          <span class="per">${(this._config.periods || []).map(Number).filter((n) => n >= 2).map((n) =>
            `<button class="pb${n === this._days ? " on" : ""}" data-d="${n}">${n} ${T.st_days_short}</button>`).join("")}</span>
          <span class="win" id="win">${T.st_loading}</span></div>
        <div id="body"><div class="empty">${T.st_loading}</div></div>
        <div class="ver" id="ver"></div>
        ${this._config && this._config.show_version ? `<div class="foot">supernotify-stats-card v${SN_CARD_VERSIONS.stats}</div>` : ""}
      </ha-card>`, this && this._config);
    this.shadowRoot.querySelectorAll(".pb").forEach((b) => { b.onclick = () => this._setDays(+b.dataset.d); });
    this._updateVersions();
    if (this._data) this._draw();
  }

  _fmt(n, dec) {
    return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: dec == null ? 0 : dec });
  }

  _esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  _t(key, vars) {
    const T = snT(this._config, this._hass);
    let s = T[key] || key;
    Object.keys(vars || {}).forEach((k) => { s = s.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]); });
    return s;
  }

  _draw() {
    const sr = this.shadowRoot;
    if (!sr) return;
    this._svgW = this._chartWidth();
    const d = this._data;
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const esc = (s) => this._esc(s);
    // daily series = long-term statistics (whole window); hours / channels /
    // priorities = recorder history, which may keep fewer days than the window
    const completeDays = Math.max(1, d.days);
    sr.getElementById("win").textContent = d.histDays && d.histDays < completeDays
      ? this._t("st_hist_note", { n: d.histDays })
      : "";
    const body = sr.getElementById("body");
    if (!d.total && !d.spineCount) {
      body.innerHTML = snIconify(`<div class="empty">${T.st_no_data}${this._error ? ` <small>(${esc(this._error)})</small>` : ""}</div>`, this && this._config);
      return;
    }
    const top = d.channels[0];
    const delta = d.avg ? Math.round(((d.today - d.avg) / d.avg) * 100) : 0;
    const kpi = (k, v, s, color) =>
      `<div class="kpi"><div class="k">${k}</div><div class="v"${color ? ` style="color:${color}"` : ""}>${v}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
    const errRate = d.sends ? Math.round((d.errors / d.sends) * 1000) / 10 : 0;
    const kpis =
      kpi("📨 " + T.st_total, this._fmt(d.total), `≈ ${this._fmt(d.avg, 1)} ${T.st_avg}`) +
      kpi("📅 " + T.st_today, this._fmt(d.today), d.avg ? `${delta >= 0 ? "+" : ""}${delta}% ${T.st_vs_avg}` : "", d.avg && Math.abs(delta) >= 50 ? p.warn : undefined) +
      kpi("⏰ " + T.st_peak_hour, d.spineCount ? `${String(d.peakHour).padStart(2, "0")}:00` : "—", d.spineCount ? `${d.perHour[d.peakHour]} ${T.st_total.toLowerCase()}` : "") +
      kpi("🏆 " + T.st_top_channel, top ? esc(top.name) : "—", top && d.sends ? `${Math.round(((top.ok + top.ko) / d.sends) * 100)}%` : "") +
      kpi("⚠️ " + T.st_errors, this._fmt(d.errors), d.sends ? `${errRate}% ${T.st_of_sends}` : "", d.errors ? p.crit : p.ok);

    // daily bars
    // long windows: label one day in k so the labels never overlap (30 days -> every 2nd)
    const every = Math.max(1, Math.ceil(d.perDay.length / Math.max(6, Math.min(16, Math.floor(this._svgW / 34)))));
    const daily = this._barsSvg(d.perDay.map((x, i) => ({
      l: (d.perDay.length - 1 - i) % every === 0 ? `${x.d.getDate()}/${x.d.getMonth() + 1}` : "",
      v: x.n, hi: x.today })), p, { avg: d.avg });
    // hourly
    const hourly = this._barsSvg(d.perHour.map((v, h) => ({ l: h % 3 === 0 ? String(h) : "", v, hi: h === d.peakHour })), p, { thin: true });
    // weekday
    const wd = this._barsSvg(d.perWd.map((v, i) => ({ l: T.st_wd[i], v })), p, {});
    // channels
    const maxCh = d.channels.length ? d.channels[0].ok + d.channels[0].ko : 1;
    const chRows = d.channels.slice(0, this._config.top_channels).map((ch) => {
      const tot = ch.ok + ch.ko;
      const alias = this._aliasFor(ch.name);
      return `<div class="hrow"><span class="nm" title="${esc(ch.name)}">${this._iconFor(ch.name)} ${alias ? `${esc(alias)} <small style="color:${p.muted}">${esc(ch.name)}</small>` : esc(ch.name)}</span>
        <span class="tr"><span class="ok" style="width:${(ch.ok / maxCh) * 100}%"></span><span class="ko" style="width:${(ch.ko / maxCh) * 100}%"></span></span>
        <span class="ct">${tot}${ch.ko ? ` <span style="color:${p.crit}">✖${ch.ko}</span>` : ""}</span></div>`;
    }).join("");
    const chNote = d.chanUnknown
      ? `<div class="empty" style="font-size:11px">${d.chanKnown}/${d.chanKnown + d.chanUnknown} ${T.st_total.toLowerCase()} · ${d.chanUnknown} ${T.st_unknown}</div>`
      : "";
    // priority chips
    const prioOrder = ["critical", "high", "medium", "low", "minimum"];
    const prioTot = Object.values(d.prioCount).reduce((a, b) => a + b, 0) || 1;
    const prioChips = prioOrder.filter((k) => d.prioCount[k]).map((k) =>
      `<span class="chip"><i style="background:${SN_PRIO_COLORS[k]}"></i>${T["prio_" + k] || k} ${Math.round((d.prioCount[k] / prioTot) * 100)}%</span>`).join("") || `<span class="empty">—</span>`;
    const perTot = Object.values(d.periodCount).reduce((a, b) => a + b, 0) || 1;
    const perChips = Object.keys(d.periodCount).sort((a, b) => d.periodCount[b] - d.periodCount[a]).map((k) =>
      `<span class="chip">${esc(k)} ${Math.round((d.periodCount[k] / perTot) * 100)}%</span>`).join("") || `<span class="empty">—</span>`;

    body.innerHTML = snIconify(`
      <div class="kpis">${kpis}</div>
      <div class="sec"><span>${T.st_daily}</span><span class="n">${this._fmt(d.total)}</span></div>
      <div class="bars">${daily}</div>
      <div class="grid2">
        <div><div class="sec"><span>${T.st_hourly}</span><span class="n">${this._fmt(d.spineCount)} ${T.st_logged}</span></div><div class="bars">${hourly}</div></div>
        <div><div class="sec"><span>${T.st_weekday}</span><span class="n">${this._fmt(d.spineCount)} ${T.st_logged}</span></div><div class="bars">${wd}</div></div>
      </div>
      <div class="sec"><span>${T.st_channels}</span><span class="n">${this._fmt(d.sends)}</span></div>
      ${chRows || `<div class="empty">${T.st_no_data}</div>`}${chNote}
      <div class="grid2">
        <div><div class="sec"><span>${T.st_priority}</span></div><div class="chips">${prioChips}</div></div>
        <div><div class="sec"><span>${T.st_period}</span></div><div class="chips">${perChips}</div></div>
      </div>
      <div class="sec"><span>💡 ${T.st_insights}</span></div>
      <ul class="ins">${this._insights(d).map((s) => `<li>${s}</li>`).join("")}</ul>`, this && this._config);
  }

  // Channel names are DELIVERY names; look the transport up on the delivery
  // entity so the icon matches the deliveries card.
  _iconFor(deliveryName) {
    const st = snDeliveryEntity(this._hass, deliveryName);
    const tr = (st && st.attributes && st.attributes.transport) || deliveryName;
    return SN_TRANSPORT_ICONS[tr] || "📤";
  }

  // Delivery `alias:` (surfaced as friendly_name on the delivery entity).
  _aliasFor(deliveryName) {
    const alias = snDeliveryAlias(this._hass, deliveryName);
    return alias && alias !== deliveryName ? alias : null;
  }

  _barsSvg(items, p, opt) {
    const n = items.length || 1;
    // drawn at the card's own width (300-600), so 9 px labels stay 9 px on a phone
    const W = this._svgW || 600, H = 110, padB = 18, padT = 14;
    const max = Math.max(1, ...items.map((i) => i.v));
    const gap = opt.thin ? 2 : 4;
    const bw = (W - gap * (n - 1)) / n;
    const y = (v) => padT + (H - padT - padB) * (1 - v / max);
    let s = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
    if (opt.avg) {
      const ya = y(opt.avg);
      s += `<line x1="0" x2="${W}" y1="${ya}" y2="${ya}" stroke="${p.muted}" stroke-dasharray="4 4" stroke-width="1" opacity=".7"/>`;
    }
    items.forEach((it, i) => {
      const x = i * (bw + gap);
      const h = Math.max(it.v ? 2 : 0, H - padB - y(it.v));
      const fill = it.hi ? p.brandD : p.brand;
      s += `<rect x="${x}" y="${H - padB - h}" width="${bw}" height="${h}" rx="3" fill="${fill}" opacity="${it.hi ? 1 : 0.8}"/>`;
      if (it.v && (n <= 16 || it.hi)) s += `<text class="val" x="${x + bw / 2}" y="${H - padB - h - 3}" text-anchor="middle">${it.v}</text>`;
      if (it.l) s += `<text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle">${this._esc(it.l)}</text>`;
    });
    return s + "</svg>";
  }

  _insights(d) {
    const T = snT(this._config, this._hass);
    const out = [];
    const top = d.channels[0];
    if (top && d.sends) out.push(this._t("st_i_share", { p: Math.round(((top.ok + top.ko) / d.sends) * 100), c: this._esc(top.name) }));
    if (d.spineCount) {
      out.push(this._t("st_i_peak", { h: String(d.peakHour).padStart(2, "0"), n: d.perHour[d.peakHour], d: d.days }));
      const np = Math.round((d.night / d.spineCount) * 100);
      out.push(this._t(np >= 15 ? "st_i_night" : "st_i_night_ok", { p: np }));
      if (d.wdPerDay > 0 && d.wePerDay != null) {
        const diff = Math.round(((d.wePerDay - d.wdPerDay) / d.wdPerDay) * 100);
        if (Math.abs(diff) >= 15) out.push(this._t("st_i_weekend", { p: Math.abs(diff), dir: diff > 0 ? T.st_more : T.st_less }));
      }
      const prioTot = Object.values(d.prioCount).reduce((a, b) => a + b, 0);
      const topPrio = Object.keys(d.prioCount).sort((a, b) => d.prioCount[b] - d.prioCount[a])[0];
      if (topPrio && prioTot) out.push(this._t("st_i_prio", { p: Math.round((d.prioCount[topPrio] / prioTot) * 100), prio: (T["prio_" + topPrio] || topPrio).toLowerCase() }));
    }
    if (d.mp7 > 0 && d.m7 >= 0) {
      const tr = Math.round(((d.m7 - d.mp7) / d.mp7) * 100);
      out.push(this._t("st_i_trend", { n: this._fmt(d.m7, 1), dir: tr >= 0 ? T.st_up : T.st_down, p: Math.abs(tr) }));
    }
    if (d.sends) {
      if (d.errors) {
        const worst = d.channels.slice().sort((a, b) => b.ko - a.ko)[0];
        out.push(this._t("st_i_errors", { n: d.errors, d: d.days, c: this._esc(worst ? worst.name : "—") }));
      } else out.push(this._t("st_i_noerr", { d: d.days }));
    }
    return out;
  }

  _updateVersions() {
    const sr = this.shadowRoot;
    if (!sr || !this._hass) return;
    const el = sr.getElementById("ver");
    if (!el) return;
    const T = snT(this._config, this._hass);
    const box = (id, fallbackName, fallbackVer, emoji) => {
      const st = this._hass.states[id];
      if (!st) {
        if (!fallbackVer) return "";
        return `<div class="vbox"><span class="ic">${emoji}</span><div><b>${this._esc(fallbackName)}</b><div class="sm">v${this._esc(fallbackVer)}</div></div></div>`;
      }
      const a = st.attributes || {};
      const inst = a.installed_version || "—";
      const latest = a.latest_version || "—";
      const upd = st.state === "on";
      const restart = /restart/i.test(a.release_summary || "");
      const name = (a.title || a.friendly_name || fallbackName || "").replace(/\s*update$/i, "");
      const icon = a.entity_picture
        ? `<img src="${this._esc(a.entity_picture)}" alt="">`
        : `<span class="ic">${emoji}</span>`;
      const badge = upd
        ? `<span class="badge b-upd">⬆ ${T.st_update}</span>`
        : `<span class="badge b-ok">✔ ${restart ? T.st_restart : T.st_uptodate}</span>`;
      const sub = upd
        ? `${T.st_installed} ${this._esc(inst)} → ${T.st_latest} <b>${this._esc(latest)}</b>`
        : `${this._esc(inst)} · ${T.st_latest} ${this._esc(latest)}`;
      const href = a.release_url ? ` href="${this._esc(a.release_url)}" target="_blank" rel="noopener"` : "";
      return `<a class="vbox"${href}>${icon}<div><b>${this._esc(name)}</b><div class="sm">${sub}</div></div>${badge}</a>`;
    };
    el.innerHTML =
      snIconify(box(this._config.update_entity, "SuperNotify", null, "🔔") +
      box(this._config.cards_update_entity, "SuperNotify Cards", VERSION, "🃏"), this && this._config);
  }
}

customElements.define("supernotify-stats-card", SupernotifyStatsCard);

window.customCards.push({
  type: "supernotify-stats-card",
  name: "SuperNotify Stats Card",
  description: "Usage analytics from existing entities: per-day/hour/weekday, channels most used (alias-aware) with errors, priority and period mix, insights, installed vs latest version.",
});

console.info(`%c SUPERNOTIFY-CARDS %c v${VERSION} `, "background:#03a9f4;color:#fff;font-weight:700", "");
class SupernotifyArchiveCard extends HTMLElement {
  static getStubConfig() {
    return { entity: "sensor.supernotify_archivio" };
  }

  setConfig(config) {
    this._config = {
      entity: "sensor.supernotify_archivio",
      style: "supernotify",
      ...config,
    };
    this._q = "";
    this._filter = "all";
    this._open = new Set();
    this._rendered = false;
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (snArchiveNative(hass, this._config)) {
      // the store redraws this card through the "supernotify-archive" event
      snArchiveStore.ensure(hass, this._config.limit, this._config.trigger_entity);
      if (!this._rendered || wasDark !== this._dark) this._render();
      else if (this._storeVer !== snArchiveStore.version) { this._renderChips(); this._renderList(); }
      this._storeVer = snArchiveStore.version;
      return;
    }
    const st = hass.states[this._config.entity];
    const stamp = st ? st.last_updated : "none";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (stamp !== this._stamp) this._renderList();
    this._stamp = stamp;
  }

  connectedCallback() {
    this._onArchive = () => {
      if (!this._rendered) return;
      this._storeVer = snArchiveStore.version;
      this._renderChips();
      this._renderList();
    };
    window.addEventListener("supernotify-archive", this._onArchive);
    this._onArchive();   // catch up with a fetch that finished before the card was in the page
  }

  disconnectedCallback() {
    window.removeEventListener("supernotify-archive", this._onArchive);
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() { return 12; }

  _loc() { return (this._config.language || (this._hass && this._hass.language) || undefined); }

  _T() { return SN_ARCH_STRINGS[((this._config.language || (this._hass && this._hass.language) || "en").split("-")[0])] || SN_ARCH_STRINGS.en; }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  /**
   * L'indice pubblicato negli attributi di sensor.supernotify_archivio dal
   * sensore command_line che lancia tools/sn_archive_index.py:
   *   chan: ["mobile_push", …]   tabella dei nomi di canale
   *   scen: ["dnd_globale", …]   tabella dei nomi di scenario
   *   items: [{ id, t (epoch s), ti (titolo), m (messaggio), mt (troncato),
   *             p (priorita', assente = medium), o (esito, assente = success),
   *             d/f/s (consegnati/falliti/saltati, assenti se 0),
   *             c: [indice | [indice,"e"] | [indice,"s",motivo]],
   *             sc: [indici scenario], ms (durata) }]
   * Le tabelle condivise e i default omessi sono cio' che tiene l'indice sotto
   * i ~16 KB oltre i quali gli attributi di stato diventano un peso per HA.
   * With SuperNotify 2.10+ the same index is built in the card from
   * supernotify.enquire_archive (snArchiveStore), and the sensor is not needed.
   */
  _index() {
    if (this._hass && snArchiveNative(this._hass, this._config)) return snArchiveStore.getIndex();
    const st = this._hass && this._hass.states[this._config.entity];
    if (!st) return null;
    const a = st.attributes || {};
    return { items: a.items || [], chan: a.chan || [], scen: a.scen || [],
      total: a.total_files, oldest: a.oldest, generated: a.generated, error: a.error };
  }

  /** Canali di una riga, nel formato dell'indice, espansi in oggetti leggibili. */
  _channels(row, idx) {
    return (row.c || []).map((c) => {
      if (typeof c === "number") return { name: idx.chan[c] || "?", state: "ok" };
      const [i, e, r] = c;
      // the index keeps short Italian reasons (tools/sn_archive_index.py): shown in the UI language
      const T = this._T();
      return { name: idx.chan[i] || "?", state: e === "e" ? "err" : "skip", reason: (r && T.reasons && T.reasons[r]) || r };
    });
  }

  _dayLabel(d, T) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = new Date(d); day.setHours(0, 0, 0, 0);
    const diff = Math.round((today - day) / 86400000);
    if (diff === 0) return T.today;
    if (diff === 1) return T.yesterday;
    return day.toLocaleDateString(this._loc(), { weekday: "long", day: "numeric", month: "long" });
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = this._T();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
        .srch { flex: 1; min-width: 180px; border: 1.5px solid ${p.line}; border-radius: 10px;
                padding: 9px 12px; font-size: 13px; background: ${p.panel}; color: ${p.ink}; }
        .srch:focus { outline: none; border-color: ${p.brand}; box-shadow: 0 0 0 3px rgba(3,169,244,.14); }
        .chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .chip { border: 1.5px solid ${p.line}; background: ${p.panel}; border-radius: 999px;
                padding: 7px 13px; font-size: 12.5px; font-weight: 650; cursor: pointer; user-select: none; }
        .chip:hover { border-color: ${p.brand}; }
        .chip.on { border-color: ${p.brand}; color: ${p.brandD}; background: ${p.soft}; }
        .meta { font-size: 11px; color: ${p.muted}; margin-bottom: 10px; }
        .day { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800;
               color: ${p.muted}; margin: 14px 0 6px; position: sticky; top: 0; background: ${p.panel}; padding: 4px 0; }
        .row { border: 1px solid ${p.line}; border-radius: 12px; padding: 9px 12px; margin-bottom: 6px;
               cursor: pointer; }
        .row:hover { border-color: ${p.brand}; }
        .r1 { display: flex; gap: 9px; align-items: baseline; }
        .hm { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 12.5px; color: ${p.muted}; flex: none; }
        .ti { font-weight: 700; font-size: 13.5px; flex: 1; min-width: 0; overflow: hidden;
              text-overflow: ellipsis; white-space: nowrap; }
        .msg { font-size: 12.5px; color: ${p.muted}; margin: 3px 0 0 46px; line-height: 1.4;
               overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .row.open .msg { white-space: normal; }
        .tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0 0 46px; }
        .tg { display: inline-flex; align-items: center; gap: 4px; border-radius: 999px;
              padding: 2px 8px; font-size: 10.5px; font-weight: 700; background: ${p.soft}; color: ${p.muted}; }
        .tg.ok { color: ${p.ok}; background: rgba(46,158,91,.12); }
        .tg.err { color: ${p.crit}; background: rgba(226,60,60,.12); }
        .tg.skip { color: ${p.muted}; background: transparent; border: 1px dashed ${p.line}; }
        .tg.pr { color: ${p.warn}; background: rgba(240,160,32,.14); }
        .tg.wh { color: ${p.brandD}; background: ${p.soft}; }
        .said { margin-top: 4px; padding: 6px 9px; border-radius: 9px;
                background: ${p.soft}; border-left: 3px solid ${p.brand};
                font-size: 12px; line-height: 1.45; }
        .said b { color: ${p.brandD}; }
        .det { margin: 8px 0 2px 46px; font-size: 11.5px; color: ${p.muted}; display: none; }
        .row.open .det { display: block; }
        .det b { color: ${p.ink}; font-weight: 650; }
        .empty { text-align: center; color: ${p.muted}; font-size: 13px; padding: 22px 0; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 10px; }
        .why { color: ${p.brandD}; font-weight: 650; cursor: pointer; text-decoration: underline; }
        ${SN_FLOW_CSS}
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}
        <div class="head">
          <input class="srch" id="q" placeholder="${T.search}">
          <div class="chips" id="chips"></div>
        </div>
        <div class="meta" id="meta"></div>
        <div id="list" class="flow"${this._config.max_height ? ` style="max-height:${String(this._config.max_height).replace(/[<>"]/g, "")};overflow-y:auto;padding-right:4px"` : ""}></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-archive-card v${SN_CARD_VERSIONS.archive}</div>` : ""}
      </ha-card>`, this && this._config);
    const q = this.shadowRoot.getElementById("q");
    q.addEventListener("input", () => { this._q = q.value.toLowerCase(); this._renderList(); });
    this._renderChips();
    this._renderList();
  }

  _renderChips() {
    const T = this._T();
    const defs = [["all", T.f_all], ["problems", T.f_problems], ["today", T.f_today]];
    // Il filtro del sussurro compare solo se l'archivio ne contiene: a
    // sussurro spento e' rumore, se qualcuno lo riaccende si nota.
    const withIdx = this._index();
    if (withIdx && (withIdx.items || []).some((r) => r.w)) defs.push(["whisper", T.f_whisper]);
    const el = this.shadowRoot.getElementById("chips");
    el.innerHTML = snIconify(defs.map(([k, label]) =>
      `<span class="chip ${this._filter === k ? "on" : ""}" data-k="${k}">${label}</span>`).join(""), this && this._config);
    el.querySelectorAll(".chip").forEach((n) => {
      n.onclick = () => { this._filter = n.dataset.k; this._renderChips(); this._renderList(); };
    });
  }

  _renderList() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("list");
    if (!el) return;
    const T = this._T();
    const p = this._palette();
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const idx = this._index();
    const meta = this.shadowRoot.getElementById("meta");
    if (!idx) {
      meta.textContent = "";
      el.innerHTML = snIconify(`<div class="empty"><b>${T.no_sensor}</b> — <code>${esc(this._config.entity)}</code><br>${T.no_sensor_hint}</div>`, this && this._config);
      return;
    }
    if (idx.error) {
      el.innerHTML = snIconify(`<div class="empty">⚠️ ${esc(idx.error)}</div>`, this && this._config);
      return;
    }
    if (idx.loading) {
      meta.textContent = "";
      el.innerHTML = snIconify(`<div class="empty">${T.loading}</div>`, this && this._config);
      return;
    }
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const rows = idx.items.filter((r) => {
      if (this._filter === "today" && r.t * 1000 < todayStart.getTime()) return false;
      if (this._filter === "problems" && !snArchiveProblem(r)) return false;
      if (this._filter === "whisper" && !r.w) return false;
      if (this._q) {
        const hay = ((r.ti || "") + " " + (r.m || "")).toLowerCase();
        if (!hay.includes(this._q)) return false;
      }
      return true;
    });
    const parts = [];
    const gen = idx.generated ? new Date(idx.generated).toLocaleTimeString(this._loc(), { hour: "2-digit", minute: "2-digit" }) : "";
    const old = idx.oldest ? new Date(idx.oldest).toLocaleDateString(this._loc()) : "";
    meta.innerHTML = snIconify(idx.native
      ? `${idx.items.length} ${T.recent}` + (gen ? ` · ${T.read_at} ${gen}` : "")
      : `${idx.items.length} ${T.of} ${idx.total || "?"} ${T.in_archive}` +
        (old ? ` · ${T.since}: ${old}` : "") + (gen ? ` · ${T.updated} ${gen}` : ""), this && this._config);
    if (!rows.length) {
      el.innerHTML = snIconify(`<div class="empty">${T.none}</div>`, this && this._config);
      return;
    }
    let lastDay = "";
    rows.forEach((r, i) => {
      const d = new Date(r.t * 1000);
      const day = this._dayLabel(d, T);
      if (day !== lastDay) { parts.push(`<div class="day">${esc(day)}</div>`); lastDay = day; }
      const hm = d.toLocaleTimeString(this._loc(), { hour: "2-digit", minute: "2-digit" });
      const chans = this._channels(r, idx).map((c) =>
        `<span class="tg ${c.state}" title="${esc(c.name)}">${c.state === "ok" ? "✔" : c.state === "err" ? "✖" : "⊘"} ${esc(snDeliveryAlias(this._hass, c.name) || c.name)}` +
        `${c.reason ? " · " + esc(c.reason) : ""}</span>`).join("");
      const prio = r.p ? `<span class="tg pr">${esc((T.prio && T.prio[r.p]) || r.p)}</span>` : "";
      const wh = r.w ? `<span class="tg wh">\u{1F92B} ${T.wh}</span>` : "";
      const scen = (r.sc || []).map((s) => esc(idx.scen[s] || "?")).join(", ");
      const open = this._open.has(r.id) ? " open" : "";
      parts.push(
        `<div class="row${open}" data-id="${esc(r.id)}">
           <div class="r1"><span class="hm">${hm}</span><span class="ti">${esc(r.ti || "—")}</span>${prio}${wh}</div>
           ${r.m ? `<div class="msg">${esc(r.m)}${r.mt ? "…" : ""}</div>` : ""}
           <div class="tags">${chans}</div>
           <div class="det">
             ${r.sp ? `<div class="said">\u{1F50A} <b>${T.said}:</b> \u00ab${esc(r.sp)}\u00bb</div>` : ""}
             ${scen ? `<div><b>${T.scenarios}:</b> ${scen}</div>` : ""}
             <div>${r.d ? `<b>${r.d}</b> ${T.delivered} ` : ""}${r.f ? `· <b>${r.f}</b> ${T.failed} ` : ""}${r.s ? `· <b>${r.s}</b> ${T.skipped} ` : ""}${r.mi ? `· ⚠ <b>${r.mi}</b> ${T.missed} ` : ""}
             ${r.ms ? `· ${T.dur} ${r.ms} ms` : ""} · ${T.id} <code>${esc(r.id)}</code>${r.mt ? ` · ${T.truncated}` : ""}</div>
             ${window.__snWhyCards ? `<div><a class="why" data-why="${esc(r.id)}">🔎 ${T.why}</a></div>` : ""}
           </div>
         </div>`);
    });
    el.innerHTML = snIconify(parts.join(""), this && this._config);
    el.querySelectorAll(".why").forEach((a) => {
      a.onclick = (e) => { e.stopPropagation(); snWhyOpen(a.dataset.why); };
    });
    el.querySelectorAll(".row").forEach((node) => {
      node.onclick = () => {
        const id = node.dataset.id;
        if (this._open.has(id)) { this._open.delete(id); node.classList.remove("open"); }
        else { this._open.add(id); node.classList.add("open"); }
      };
    });
  }
}

customElements.define("supernotify-archive-card", SupernotifyArchiveCard);

window.customCards.push({
  type: "supernotify-archive-card",
  name: "SuperNotify Archive Card",
  description: "Notification history from the SuperNotify archive: search, filters, per-channel outcome.",
});

const SN_ARCH_STRINGS = {
  en: {
    title: "Notification history", search: "Search title or message…",
    f_all: "All", f_problems: "Problems only", f_today: "Today",
    f_whisper: "Whispered", wh: "whispered", said: "Alexa said",
    none: "no notification matches", no_sensor: "sensor not found",
    no_sensor_hint: "Update SuperNotify to 2.10 or later, which has the supernotify.enquire_archive action, or add the command_line sensor that indexes the archive (see README).",
    loading: "reading the archive…", recent: "latest notifications", read_at: "read at",
    of: "of", in_archive: "in the archive", since: "oldest", updated: "index updated",
    today: "Today", yesterday: "Yesterday",
    delivered: "delivered", failed: "failed", skipped: "skipped", missed: "missed",
    reasons: { doppione: "duplicate", "nessun target": "no target", errore: "error", condizione: "condition",
      scenario: "scenario", presenza: "presence", priorita: "priority", spento: "off", pausa: "snoozed",
      "transport spento": "transport off", "nessuna azione": "no action", "dati non validi": "invalid data",
      sconosciuto: "unknown" },
    scenarios: "Scenarios in force", truncated: "message truncated in the index",
    dur: "took", id: "id", why: "Why? - full detail",
  },
  it: {
    title: "Storico notifiche", search: "Cerca nel titolo o nel messaggio…",
    f_all: "Tutte", f_problems: "Solo con problemi", f_today: "Oggi",
    f_whisper: "Sussurrate", wh: "sussurrata", said: "Alexa ha detto",
    none: "nessuna notifica corrisponde", no_sensor: "sensore non trovato",
    no_sensor_hint: "Aggiorna SuperNotify alla 2.10 o successiva, che ha l'azione supernotify.enquire_archive, oppure aggiungi il sensore command_line che indicizza l'archivio (vedi README).",
    loading: "lettura dell'archivio…", recent: "notifiche più recenti", read_at: "lette alle",
    of: "di", in_archive: "nell'archivio", since: "più vecchia", updated: "indice aggiornato",
    today: "Oggi", yesterday: "Ieri",
    delivered: "consegnata", failed: "fallita", skipped: "saltata", missed: "mancata",
    prio: { critical: "critica", high: "alta", low: "bassa", minimum: "minima", medium: "media" },
    scenarios: "Scenari in vigore", truncated: "messaggio troncato nell'indice",
    dur: "in", id: "id", why: "Perché? - dettaglio completo",
  },
};



/* ════════════════════════════════════════════════════════════════════════
 * supernotify-why-card — "Why?" for one notification
 *
 * The question it answers: why did this notification go out (or not) on
 * this channel, to these targets? Everything comes from what SuperNotify
 * archived for that notification:
 *   - with SuperNotify 2.10+, both the list and the detail come from the
 *     supernotify.enquire_archive action, through the store shared with
 *     supernotify-archive-card (snArchiveStore / snArchiveDetail);
 *   - before that, or with `source: sensor`: the list is the archive index in
 *     sensor.supernotify_archivio, and the detail is fetched on demand
 *     through shell_command.sn_archive_detail, which runs
 *     tools/sn_archive_index.py --detail <id> and returns its JSON as the
 *     service response (so it never weighs on any entity's attributes).
 * Channels that did not start at all are not in the archive: for those the
 * reason is reconstructed from the current configuration (delivery switch,
 * transport, inclusion, the scenarios in force, the call's own overrides)
 * and labelled as such. When the archive holds the full selection trace
 * (SuperNotify diagnostics), that is shown too and wins.
 * Other cards open a notification here with snWhyOpen(id).
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyWhyCard extends HTMLElement {
  static getStubConfig() {
    return { entity: "sensor.supernotify_archivio", service: "shell_command.sn_archive_detail" };
  }

  setConfig(config) {
    this._config = {
      entity: "sensor.supernotify_archivio",
      service: "shell_command.sn_archive_detail",
      limit: 15,
      style: "supernotify",
      ...(config || {}),
    };
    this._cache = this._cache || new Map();
    this._rendered = false;
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    if (snArchiveNative(hass, this._config)) {
      snArchiveStore.ensure(hass, Math.max(this._config.limit, 40), this._config.trigger_entity);
      if (!this._rendered || wasDark !== this._dark) this._render();
      else if (this._storeVer !== snArchiveStore.version) this._renderList();
      this._storeVer = snArchiveStore.version;
      return;
    }
    const st = hass.states[this._config.entity];
    const stamp = st ? st.last_updated : "none";
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (stamp !== this._stamp) this._renderList();
    this._stamp = stamp;
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() { return 12; }

  connectedCallback() {
    this._onArchive = () => {
      if (!this._rendered) return;
      this._storeVer = snArchiveStore.version;
      this._renderList();
    };
    window.addEventListener("supernotify-archive", this._onArchive);
    this._onArchive();
    window.__snWhyCards = (window.__snWhyCards || 0) + 1;
    this._onWhy = (e) => {
      const id = e.detail && e.detail.id;
      if (!id) return;
      this._select(String(id).slice(0, 8));
      this.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("supernotify-why", this._onWhy);
  }

  disconnectedCallback() {
    window.removeEventListener("supernotify-archive", this._onArchive);
    window.__snWhyCards = Math.max(0, (window.__snWhyCards || 1) - 1);
    window.removeEventListener("supernotify-why", this._onWhy);
  }

  _T() {
    const lang = ((this._config.language || (this._hass && this._hass.language) || "en").split("-")[0]);
    return SN_WHY_STRINGS[lang] || SN_WHY_STRINGS.en;
  }

  _loc() { return this._config.language || (this._hass && this._hass.language) || undefined; }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _index() {
    if (this._hass && snArchiveNative(this._hass, this._config)) return snArchiveStore.getIndex();
    const st = this._hass && this._hass.states[this._config.entity];
    if (!st) return null;
    const a = st.attributes || {};
    return { items: a.items || [], chan: a.chan || [] };
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = this._T();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; font-size: 13px; }
        h3 { margin: 0 0 8px; font-size: 15px; }
        .list { max-height: 230px; overflow-y: auto; border: 1px solid ${p.line}; border-radius: 10px; }
        .it { display: flex; gap: 8px; align-items: center; padding: 7px 10px; cursor: pointer;
              border-bottom: 1px solid ${p.line}; }
        .it:last-child { border-bottom: 0; }
        .it:hover { background: ${p.soft}; }
        .it.sel { background: ${p.soft}; box-shadow: inset 3px 0 0 ${p.brand}; }
        .it .hm { color: ${p.muted}; font-variant-numeric: tabular-nums; flex-shrink: 0; font-size: 12px; }
        .it .ti { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .d-ok { background: ${p.ok}; } .d-warn { background: ${p.warn}; } .d-err { background: ${p.crit}; }
        .det { margin-top: 12px; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800;
               color: ${p.muted}; margin: 14px 0 6px; }
        .hd .meta { color: ${p.muted}; font-size: 12.5px; } .hd .ttl { display: block; font-size: 18px; margin-top: 3px; }
        .det { container-type: inline-size; }
        @container (min-width: 620px) { .path { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; } }
        .path { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px;
                background: ${p.line}; border: 1px solid ${p.line}; border-radius: 10px; overflow: hidden; margin: 14px 0; }
        .step { background: ${p.panel}; padding: 10px 12px; }
        .step .sk { font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: ${p.muted}; }
        .step .sb { margin-top: 4px; line-height: 1.4; } .step .sm { margin-top: 3px; font-size: 11.5px; color: ${p.muted}; }
        .c-ok { color: ${p.ok}; } .c-pb { color: ${p.warn}; }
        .pb { border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
        .pb.warn { background: ${p.warnSoft}; color: ${p.warnInk}; border: 1px solid ${p.warnLine}; }
        .pb.crit { background: rgba(226,60,60,.08); color: ${p.ink}; border: 1px solid rgba(198,40,40,.35); }
        .pb.crit .pbt { color: ${p.crit}; }
        .pbt { font-size: 15px; font-weight: 700; } .pbw { margin-top: 4px; line-height: 1.45; }
        .pbf { margin-top: 6px; line-height: 1.45; font-size: 12.5px; opacity: .9; }
        details.fold { border: 1px dashed ${p.line}; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
        details.fold summary { cursor: pointer; font-weight: 600; color: ${p.muted}; }
        details.fold[open] summary { margin-bottom: 8px; }
        .ch.quiet { opacity: .85; }
        .msg { margin-top: 6px; line-height: 1.45; }
        .chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .chip { border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD}; border-radius: 7px;
                padding: 2px 8px; font-size: 11.5px; font-weight: 650; }
        .chip.strong { border-color: ${p.brand}; }
        .chip.off { color: ${p.crit}; }
        .ch { border: 1px solid ${p.line}; border-radius: 10px; padding: 8px 10px; margin-bottom: 6px; }
        .ch .r1 { display: flex; gap: 8px; align-items: baseline; }
        .ch .st { flex-shrink: 0; font-weight: 800; }
        .st.ok { color: ${p.ok}; } .st.skip, .st.supp { color: ${p.muted}; } .st.err { color: ${p.crit}; }
        .ch .nm { font-weight: 700; } .ch .al { color: ${p.muted}; font-size: 12px; }
        .tech { font-family: ui-monospace, 'Roboto Mono', monospace; font-size: 11px; }
        .ch .why { margin-top: 3px; } .ch .src { margin-top: 3px; color: ${p.muted}; font-size: 12px; }
        .ch .tg { margin-top: 4px; font-size: 12px; color: ${p.muted}; word-break: break-word; }
        .ch.not { opacity: .85; border-style: dashed; }
        .note { color: ${p.muted}; font-size: 11.5px; margin-top: 4px; line-height: 1.45; }
        .trace { font-size: 12px; } .trace code { font-size: 11px; }
        .trace .stg { display: flex; gap: 6px; padding: 2px 0; }
        .trace .stg span:first-child { color: ${p.muted}; min-width: 190px; font-family: monospace; font-size: 11px; }
        .empty { color: ${p.muted}; padding: 10px; text-align: center; }
        .err { color: ${p.crit}; }
        code { background: ${p.soft}; padding: 1px 4px; border-radius: 4px; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}
        <h3>🔎 ${T.title}</h3>
        <div class="list" id="list"></div>
        <div class="det" id="det"${this._config.max_height ? ` style="max-height:${String(this._config.max_height).replace(/[<>"]/g, "")};overflow-y:auto;padding-right:4px"` : ""}><div class="empty">${T.pick}</div></div>
        ${this._config && this._config.show_version ? `<div class="ver">supernotify-why-card v${SN_CARD_VERSIONS.why}</div>` : ""}
      </ha-card>`, this && this._config);
    this._renderList();
    if (this._sel) this._renderDetail();
  }

  _outcomeClass(r) {
    const c = r.c || [];
    if (r.f || c.some((x) => Array.isArray(x) && x[1] === "e")) return "d-err";
    if (!r.d) return "d-warn";
    // routine skips (snooze, presence, priority, no target on an implicit channel...) are
    // fine; missed channels, odd skip reasons, dupes and fallbacks are worth a look
    return snArchiveProblem(r) ? "d-warn" : "d-ok";
  }

  _renderList() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("list");
    if (!el) return;
    const T = this._T();
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const idx = this._index();
    if (!idx) {
      el.innerHTML = snIconify(`<div class="empty">${T.no_sensor} <code>${esc(this._config.entity)}</code></div>`, this && this._config);
      return;
    }
    if (idx.error) { el.innerHTML = snIconify(`<div class="empty">⚠️ ${esc(idx.error)}</div>`, this && this._config); return; }
    if (idx.loading) { el.innerHTML = snIconify(`<div class="empty">${T.loading}</div>`, this && this._config); return; }
    const items = idx.items.slice(0, this._config.limit);
    if (!items.length) { el.innerHTML = snIconify(`<div class="empty">${T.none}</div>`, this && this._config); return; }
    el.innerHTML = snIconify(items.map((r) => {
      const d = new Date(r.t * 1000);
      const hm = d.toLocaleString(this._loc(), { weekday: "short", hour: "2-digit", minute: "2-digit" });
      return `<div class="it${this._sel === r.id ? " sel" : ""}" data-id="${esc(r.id)}">
        <span class="dot ${this._outcomeClass(r)}"></span><span class="hm">${esc(hm)}</span>
        <span class="ti">${esc(r.ti || r.m || "—")}</span></div>`;
    }).join(""), this && this._config);
    el.querySelectorAll(".it").forEach((n) => { n.onclick = () => this._select(n.dataset.id); });
    // open the latest notification by itself, once, so the card is never an empty box
    if (!this._sel && !this._autoDone && this._config.auto_select !== false) {
      this._autoDone = true;
      this._select(items[0].id);
    }
  }

  async _select(id) {
    this._sel = id;
    this._renderList();
    if (!this._cache.has(id)) {
      this._loading = id;
      this._renderDetail();
      this._cache.set(id, await this._fetch(id));
      this._loading = null;
    }
    if (this._sel === id) this._renderDetail();
  }

  async _fetch(id) {
    if (snArchiveNative(this._hass, this._config)) {
      try {
        const doc = await snArchiveStore.doc(this._hass, id);
        return doc ? { ok: true, n: snArchiveDetail(doc) } : { ok: false, error: this._T().gone };
      } catch (e) {
        return { ok: false, error: (e && e.message) || String(e) };
      }
    }
    const [domain, service] = String(this._config.service).split(".");
    const svc = this._hass.services && this._hass.services[domain];
    if (!svc || !svc[service]) return { ok: false, error: "no_service" };
    try {
      const r = await this._hass.callWS({
        type: "call_service", domain, service, service_data: { id }, return_response: true,
      });
      const out = r && r.response && r.response.stdout;
      if (!out) return { ok: false, error: (r && r.response && r.response.stderr) || "empty" };
      return JSON.parse(out);
    } catch (e) {
      return { ok: false, error: (e && e.message) || String(e) };
    }
  }

  // -- configuration lookups, for the channels that did not start ---------

  _deliveryRows() {
    const m = new Map();
    for (const d of snEntityRows(this._hass, "delivery")) m.set(d.name, d);
    return m;
  }

  _scenarioDeliveries(name) {
    for (const dom of ["switch", "binary_sensor"]) {
      const st = this._hass.states[`${dom}.supernotify_scenario_${name}`];
      if (st && st.attributes && st.attributes.delivery && typeof st.attributes.delivery === "object") {
        return st.attributes.delivery;
      }
    }
    return {};
  }

  _scenarioLabel(name) {
    for (const dom of ["switch", "binary_sensor"]) {
      const st = this._hass.states[`${dom}.supernotify_scenario_${name}`];
      const c = st && snCleanName(st.attributes.friendly_name, name);
      if (c) return c;
    }
    return name;
  }

  _personLabel(pid) {
    const st = this._hass.states[pid];
    return (st && st.attributes && st.attributes.friendly_name) || String(pid).replace(/^person\./, "");
  }

  /**
   * Label for a source in the trace's delivery_provenance: default / call /
   * scenario:<name> / recipient:<name>.
   */
  _provLabel(src, T) {
    const [kind, name] = String(src).split(/:(.*)/s);
    if (kind === "default") return T.src_default;
    if (kind === "call") return T.src_call;
    if (kind === "scenario") return `${T.src_scen} ${this._scenarioLabel(name)}`;
    if (kind === "recipient") return `${T.src_recipient} ${name}`;
    return String(src);
  }

  /** Which scenarios in force switch a delivery on, and which switch it off. */
  _scenarioSources(dname, scen) {
    const on = [], off = [];
    for (const s of scen) {
      const cfg = this._scenarioDeliveries(s)[dname];
      if (cfg === undefined) continue;
      if (cfg && cfg.enabled === false) off.push(s); else on.push(s);
    }
    return { on, off };
  }

  _inclusion(row) {
    const r = row && (row.a.inclusion ?? row.a.selection);
    return Array.isArray(r) ? r : r ? [r] : ["default"];
  }

  /** Best reconstruction of why a delivery never started, from the current configuration. */
  _whyNotStarted(dname, row, n, scen, T) {
    const prov = (snProvOf(n) || {})[dname];
    if (prov && (prov.disabled_by || []).length) {
      return `${T.r_off_by}: ${prov.disabled_by.map((s) => this._provLabel(s, T)).join(", ")}`;
    }
    const ov = (n.ov || {})[dname];
    if (ov && ov.en === false) return T.r_call_off;
    const tsel = n.trace && n.trace.sel;
    if (tsel) {
      const hit = (k) => Array.isArray(tsel[k]) && tsel[k].includes(dname);
      if (hit("override_disable_deliveries")) return T.r_call_off;
      if (hit("scenario_disable_deliveries")) return T.r_scen_off;
    }
    if (row && !row.on) return T.r_disabled;
    if (row && row.a.transport_enabled === false) return T.r_transport_off;
    const src = this._scenarioSources(dname, scen);
    if (src.off.length) return `${T.r_scen_off}: ${src.off.map((s) => this._scenarioLabel(s)).join(", ")}`;
    const inc = this._inclusion(row);
    if (!inc.includes("default") && !src.on.length && !ov) {
      if (inc.includes("scenario")) return T.r_only_scen;
      if (inc.some((x) => String(x).startsWith("fallback"))) return T.r_only_fallback;
      return T.r_only_explicit;
    }
    if (n.p && row && Array.isArray(row.a.priority) && !row.a.priority.includes(n.p)) return T.r_priority;
    return T.r_unknown;
  }

  _reasonText(code, T) {
    if (!code) return "";
    const key = String(code).toUpperCase();
    return (T.reasons && T.reasons[key]) || String(code);
  }

  _renderDetail() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("det");
    if (!el) return;
    const T = this._T();
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    if (!this._sel) { el.innerHTML = snIconify(`<div class="empty">${T.pick}</div>`, this && this._config); return; }
    if (this._loading === this._sel) { el.innerHTML = snIconify(`<div class="empty">${T.loading}</div>`, this && this._config); return; }
    const res = this._cache.get(this._sel) || {};
    if (!res.ok) {
      const msg = res.error === "no_service"
        ? `${T.no_service} <code>${esc(this._config.service)}</code>. ${T.no_service_hint}`
        : esc(res.error || T.none);
      el.innerHTML = snIconify(`<div class="empty err">${msg}</div>`, this && this._config);
      return;
    }
    const n = res.n || {};
    const sc = n.sc || {};
    const scen = sc.sel || sc.on || [];
    const rows = this._deliveryRows();
    const tgText = (tg) => Object.entries(tg || {}).map(([cat, vals]) =>
      `${esc(T.cats[cat] || cat)}: ${vals.map((v) => esc(String(v).replace(/^(mobile_app_|person\.|media_player\.|notify\.)/, ""))).join(", ")}`).join(" · ");
    const out = [];
    const det = (open) => (open || this._config.expand ? " open" : "");

    // header: what and when
    const d = new Date((n.t || 0) * 1000);
    const when = d.toLocaleString(this._loc(), { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    const prioTxt = snT(this._config, this._hass)["prio_" + (n.p || "medium")] || n.p || "medium";
    out.push(`<div class="hd"><div class="meta">${esc(when)} · ${T.priority} ${esc(prioTxt)} · ${esc(T.outcomes[n.o] || n.o || "—")}${n.dupe ? ` · ♻ ${T.dupe}` : ""}</div>
      <b class="ttl">${esc(n.ti || "—")}</b>
      ${n.m && n.m !== n.ti ? `<div class="msg">${esc(n.m)}</div>` : ""}
      ${n.sp ? `<div class="note">🔊 ${esc(n.sp)}</div>` : ""}</div>`);

    // sort the archived channels: sent, problems (failed / missed), routine skips
    const SN_ROUTINE = new Set(["SNOOZE", "SNOOZED", "PRIORITY", "DELIVERY_CONDITION", "OCCUPANCY", "DELIVERY_DISABLED",
      "SCENARIO", "TRANSPORT_DISABLED", "NO_SCENARIO", "DUPE"]);
    const sent = [], problems = [], skipped = [];
    for (const ch of n.dl || []) {
      if (ch.r === "ok") sent.push(ch);
      else if (ch.r === "err") problems.push(ch);
      else if (ch.r === "skip" && !SN_ROUTINE.has(String(ch.why || "").toUpperCase())) problems.push(ch);
      else skipped.push(ch);
    }
    const seen = new Set((n.dl || []).map((ch) => ch.n));
    const notStarted = [...rows.keys()].filter((k) => !seen.has(k) && !/^default_/i.test(k)).sort();
    const nameOf = (k) => { const al = snDeliveryAlias(this._hass, k); return al || k; };

    // the path in four steps
    const ovNames = Object.entries(n.ov || {}).filter(([, ov]) => ov && ov.en !== false).map(([k]) => nameOf(k));
    const callTxt = ovNames.length ? `${T.call_named} ${ovNames.join(", ")}` : T.call_auto;
    const scenTxt = scen.length ? scen.map((x) => this._scenarioLabel(x)).join(", ") : T.no_scenarios;
    const scenMore = [["ap", T.applied], ["rq", T.required], ["cs", T.constrain]]
      .filter(([k]) => (sc[k] || []).length).map(([k, l]) => `${l}: ${sc[k].map((x) => this._scenarioLabel(x)).join(", ")}`);
    const home = n.occ ? (n.occ.home || []).map((pid) => this._personLabel(pid)) : null;
    const away = n.occ ? (n.occ.away || []).map((pid) => this._personLabel(pid)) : [];
    const peopleTxt = home === null ? "—" : home.length ? `${T.home}: ${home.join(", ")}` : T.nobody;
    const chTxt = [`<b class="c-ok">${sent.length}</b> ${T.ch_sent}`,
      problems.length ? `<b class="c-pb">${problems.length}</b> ${T.ch_problems}` : "",
      skipped.length ? `${skipped.length} ${T.ch_skipped}` : ""].filter(Boolean).join(" · ");
    const step = (i, label, body, more) => `<div class="step"><div class="sk">${i} · ${label}</div><div class="sb">${body}</div>${more ? `<div class="sm">${more}</div>` : ""}</div>`;
    out.push(`<div class="path">
      ${step(1, T.step_call, esc(callTxt), n.trace ? esc(T.call_debug) : "")}
      ${step(2, T.step_scen, esc(scenTxt), esc(scenMore.join(" · ")))}
      ${step(3, T.step_people, esc(peopleTxt), away.length ? `${T.away}: ${esc(away.join(", "))}` : "")}
      ${step(4, T.step_ch, chTxt, "")}</div>`);

    // one channel, the same row everywhere
    const chRow = (ch, cls) => {
      const row = rows.get(ch.n);
      const alias = snDeliveryAlias(this._hass, ch.n);
      const src = this._scenarioSources(ch.n, scen);
      const ov = (n.ov || {})[ch.n];
      const prov = (snProvOf(n) || {})[ch.n];
      let by = [], offBy = [];
      if (prov) {
        by = (prov.enabled_by || []).map((x) => this._provLabel(x, T));
        const dis = (prov.disabled_by || []).map(String);
        src.off = dis.filter((x) => /^scenario:/.test(x)).map((x) => x.replace(/^scenario:/, ""));
        offBy = dis.filter((x) => !/^scenario:/.test(x)).map((x) => this._provLabel(x, T));
      } else {
        if (this._inclusion(row).includes("default")) by.push(T.src_default);
        if (src.on.length) by.push(`${T.src_scen} ${src.on.map((x) => this._scenarioLabel(x)).join(", ")}`);
        if (ov && ov.en) by.push(T.src_call);
      }
      const icon = { ok: "✔", skip: "⊘", supp: "⊘", err: "✖" }[ch.r] || "?";
      let why = "";
      if (ch.r === "ok") why = T.st_ok + (ch.calls ? ` (${ch.calls} ${T.calls})` : "");
      else if (ch.r === "err") why = `${T.st_err}${ch.err ? ": " + esc(ch.err.join(" / ")) : ""}`;
      else why = `${esc(this._reasonText(ch.why, T))}${ch.tr ? ` (${T.target_required} ${esc(ch.tr)})` : ""}`;
      const tg = ch.tg ? tgText(ch.tg) : "";
      const meta = [by.length ? `${T.started_by}: ${esc(by.join(" · "))}` : "",
        src.off.length ? `${T.scen_would_off}: ${esc(src.off.map((x) => this._scenarioLabel(x)).join(", "))}` : "",
        offBy.length ? `${T.r_off_by}: ${esc(offBy.join(", "))}` : ""].filter(Boolean);
      return `<div class="ch ${cls || ""}"><div class="r1"><span class="st ${ch.r}">${icon}</span>
        <span class="nm">${esc(alias || ch.n)}</span>${alias && alias.toLowerCase() !== ch.n.toLowerCase() ? `<span class="al tech">${esc(ch.n)}</span>` : ""}</div>
        <div class="why">${why}${tg ? ` · ${tg}` : ""}</div>
        ${meta.length ? `<div class="src">${meta.join("<br>")}</div>` : ""}
        ${ov && ov.tg && tgText(ov.tg) !== tg ? `<div class="src">📝 ${T.call_targets}: ${tgText(ov.tg)}</div>` : ""}
      </div>`;
    };

    // problems first, each with what it means and what to do
    for (const ch of problems) {
      const failed = ch.r === "err";
      const code = failed ? "ERROR" : String(ch.why || "").toUpperCase();
      const fix = (T.fix || {})[code];
      out.push(`<div class="pb ${failed ? "crit" : "warn"}"><div class="pbt">${failed ? "✖" : "⚠"} ${esc(nameOf(ch.n))}: ${failed ? T.pb_failed : T.pb_missed}</div>
        <div class="pbw">${failed ? esc((ch.err || []).join(" / ") || T.st_err) : esc(this._reasonText(ch.why, T))}${ch.tr ? ` (${T.target_required} ${esc(ch.tr)})` : ""}</div>
        ${fix ? `<div class="pbf">${esc(fix).replace(/`([^`]+)`/g, "<code>$1</code>")}</div>` : ""}</div>`);
    }

    // what went out
    if (sent.length) out.push(sent.map((ch) => chRow(ch, "")).join(""));
    if (!(n.dl || []).length) out.push(`<div class="note">${T.no_channels}</div>`);

    // routine skips and channels never involved, folded
    if (skipped.length) {
      out.push(`<details class="fold"${det(false)}><summary>${skipped.length} ${T.grp_skipped}</summary>${skipped.map((ch) => chRow(ch, "quiet")).join("")}</details>`);
    }
    if (notStarted.length) {
      out.push(`<details class="fold"${det(false)}><summary>${notStarted.length} ${T.grp_not}</summary>${notStarted.map((k) => {
        const alias = snDeliveryAlias(this._hass, k);
        return `<div class="ch not"><div class="r1"><span class="st">·</span><span class="nm">${esc(alias || k)}</span>${alias && alias.toLowerCase() !== k.toLowerCase() ? `<span class="al tech">${esc(k)}</span>` : ""}</div>
          <div class="why">${esc(this._whyNotStarted(k, rows.get(k), n, scen, T))}</div></div>`;
      }).join("")}<div class="note">${snProvOf(n) || n.trace ? T.from_trace : T.from_config}</div></details>`);
    }

    // full trace - only with debug: true, and `prov` alone is not a trace
    const hasTrace = n.trace && (Object.keys(n.trace.sel || {}).length || Object.keys(n.trace.res || {}).length);
    if (hasTrace) {
      const tr = [];
      for (const [stage, list] of Object.entries(n.trace.sel || {})) {
        tr.push(`<div class="stg"><span>${esc(stage)}</span><span>${esc((list || []).join(", ") || "—")}</span></div>`);
      }
      for (const [dname, chain] of Object.entries(n.trace.res || {})) {
        tr.push(`<div class="note"><b>${esc(dname)}</b></div>`);
        for (const [stage, val] of chain) {
          tr.push(`<div class="stg"><span>${esc(stage)}</span><span>${typeof val === "object" ? tgText(val) || "∅" : esc(val)}</span></div>`);
        }
      }
      out.push(`<details class="fold"${det(false)}><summary>${T.trace_title}</summary><div class="trace">${tr.join("")}</div></details>`);
    } else {
      out.push(`<div class="note">ℹ️ ${T.no_trace}</div>`);
    }
    if (n.ctx && n.ctx.id) out.push(`<div class="note">context <code>${esc(n.ctx.id)}</code>${n.ctx.parent_id ? ` ← <code>${esc(n.ctx.parent_id)}</code>` : ""}</div>`);
    el.innerHTML = snIconify(out.join(""), this && this._config);
  }
}

customElements.define("supernotify-why-card", SupernotifyWhyCard);

window.customCards.push({
  type: "supernotify-why-card",
  name: "SuperNotify Why?",
  description: "Why a notification went out, or not, on each channel: scenarios, presence, targets and the selection trace.",
});

const SN_WHY_STRINGS = {
  en: {
    title: "Why?", pick: "Pick a notification to see why it went where it went.",
    loading: "loading…", none: "no notification", no_sensor: "sensor not found:",
    no_service: "Missing service", no_service_hint: "Update SuperNotify to 2.10 or later (supernotify.enquire_archive), or add the shell_command sn_archive_detail (see README) and restart Home Assistant.",
    gone: "this notification is no longer in the archive",
    priority: "priority", outcome: "outcome", dupe: "duplicate",
    outcomes: { success: "delivered", partial_delivery: "partly delivered", dupe: "duplicate", failed: "failed", error: "failed",
      fallback_delivery: "delivered by the fallback channel", no_delivery: "not delivered" },
    missed: "missed (asked for, not sent)",
    step_call: "Call", step_scen: "Scenarios", step_people: "People", step_ch: "Channels",
    call_auto: "no channel named: normal routing", call_named: "named in the call:", call_debug: "with debug",
    nobody: "nobody home", ch_sent: "sent", ch_problems: "to look at", ch_skipped: "skipped",
    pb_failed: "failed", pb_missed: "asked for but not sent",
    grp_skipped: "skipped by a rule: normal", grp_not: "not involved", trace_title: "Full selection trace",
    fix: { NO_TARGET: "No recipient has an address for this channel: add one to a recipient, give the channel fixed targets, or leave it out of this call.",
      ERROR: "The integration behind this channel answered with an error: check its own log entry.",
      NO_ACTION: "The channel has no action to call: set `action:` on the delivery.",
      INVALID_ACTION_DATA: "The data passed to the action was rejected: check the `data:` of the call or of the delivery." },
    scenarios: "Scenarios in force", no_scenarios: "no scenario in force",
    applied: "forced by the call", required: "required by the call", constrain: "limited by the call to",
    presence: "Presence", home: "home", away: "away",
    channels: "Channels", no_channels: "no channel was selected",
    st_ok: "delivered", st_err: "failed", st_skip: "skipped", st_supp: "suppressed", calls: "calls",
    target_required: "target required:", started_by: "selected by", scen_would_off: "switched off by (overruled)",
    src_default: "always on (default)", src_scen: "scenario", src_call: "the call itself",
    src_recipient: "recipient", r_off_by: "switched off by",
    call_targets: "targets in the call",
    cats: { entity_id: "entities", mobile_app_id: "devices", person_id: "people", email: "email", phone: "phone", device_id: "devices" },
    not_started: "Channels that did not start",
    r_call_off: "excluded by the call", r_scen_off: "switched off by a scenario in force",
    r_disabled: "switched off", r_transport_off: "its transport is off",
    r_only_scen: "starts only when a scenario turns it on", r_only_fallback: "only a fallback",
    r_only_explicit: "starts only when asked for by name", r_priority: "not for this priority",
    r_unknown: "not reconstructable without the trace",
    from_config: "Reasons for channels that did not start are reconstructed from the configuration as it is NOW, not as it was then.",
    from_trace: "Reasons come from the selection trace archived with the notification.",
    trace: "Selection trace", no_trace: "The full selection trace is only recorded when the notify call has debug: true, and archived when the archive diagnostics include it.",
    reasons: { NO_TARGET: "no usable target", DUPE: "duplicate of a recent notification", PRIORITY: "not for this priority",
      SNOOZE: "snoozed", SNOOZED: "snoozed", DELIVERY_CONDITION: "delivery condition false", OCCUPANCY: "presence rule", ERROR: "error",
      DELIVERY_DISABLED: "switched off", SCENARIO: "scenario", TRANSPORT_DISABLED: "its transport is off",
      NO_SCENARIO: "a required scenario is not in force", NO_ACTION: "no action to call",
      INVALID_ACTION_DATA: "invalid action data", UNKNOWN: "unknown reason" },
  },
  it: {
    title: "Perché?", pick: "Scegli una notifica per vedere perché è andata dove è andata.",
    loading: "carico…", none: "nessuna notifica", no_sensor: "sensore non trovato:",
    no_service: "Manca il servizio", no_service_hint: "Aggiorna SuperNotify alla 2.10 o successiva (supernotify.enquire_archive), oppure aggiungi lo shell_command sn_archive_detail (vedi README) e riavvia Home Assistant.",
    gone: "questa notifica non è più nell'archivio",
    priority: "priorità", outcome: "esito", dupe: "doppione",
    outcomes: { success: "consegnata", partial_delivery: "consegnata in parte", dupe: "doppione", failed: "fallita", error: "fallita",
      fallback_delivery: "consegnata dal canale di riserva", no_delivery: "non consegnata" },
    missed: "mancati (richiesti, non partiti)",
    step_call: "Chiamata", step_scen: "Scenari", step_people: "Persone", step_ch: "Canali",
    call_auto: "nessun canale scelto: instradamento normale", call_named: "canali chiesti:", call_debug: "con debug",
    nobody: "nessuno in casa", ch_sent: "partiti", ch_problems: "da guardare", ch_skipped: "saltati",
    pb_failed: "fallito", pb_missed: "chiesto ma non partito",
    grp_skipped: "saltati per regola: normale", grp_not: "non coinvolti", trace_title: "Trace di selezione completo",
    fix: { NO_TARGET: "Nessun destinatario ha un indirizzo per questo canale: aggiungilo a un destinatario, dai al canale dei target fissi, oppure toglilo da questa chiamata.",
      ERROR: "L'integrazione dietro questo canale ha risposto con un errore: guarda la sua voce nel log.",
      NO_ACTION: "Il canale non ha un'azione da chiamare: imposta `action:` nella delivery.",
      INVALID_ACTION_DATA: "I dati passati all'azione sono stati rifiutati: controlla il `data:` della chiamata o della delivery." },
    scenarios: "Scenari in vigore", no_scenarios: "nessuno scenario in vigore",
    applied: "forzati dalla chiamata", required: "richiesti dalla chiamata", constrain: "limitati dalla chiamata a",
    presence: "Presenza", home: "in casa", away: "fuori",
    channels: "Canali", no_channels: "nessun canale selezionato",
    st_ok: "consegnata", st_err: "fallita", st_skip: "saltata", st_supp: "scartata", calls: "chiamate",
    target_required: "target richiesto:", started_by: "scelto da", scen_would_off: "spento da (ma ha perso)",
    src_default: "sempre attivo (default)", src_scen: "scenario", src_call: "la chiamata stessa",
    src_recipient: "destinatario", r_off_by: "spento da",
    call_targets: "target nella chiamata",
    cats: { entity_id: "entità", mobile_app_id: "dispositivi", person_id: "persone", email: "email", phone: "telefono", device_id: "dispositivi" },
    not_started: "Canali che non sono partiti",
    r_call_off: "escluso dalla chiamata", r_scen_off: "spento da uno scenario in vigore",
    r_disabled: "spento", r_transport_off: "il suo transport è spento",
    r_only_scen: "parte solo se uno scenario lo accende", r_only_fallback: "è solo un canale di riserva",
    r_only_explicit: "parte solo se chiesto per nome", r_priority: "non per questa priorità",
    r_unknown: "non ricostruibile senza il trace",
    from_config: "I motivi dei canali non partiti sono ricostruiti dalla configurazione di ADESSO, non da quella di allora.",
    from_trace: "I motivi vengono dal trace di selezione archiviato con la notifica.",
    trace: "Trace di selezione", no_trace: "Il trace completo viene registrato solo se la chiamata ha debug: true, e archiviato se la diagnostica dell'archivio lo include.",
    reasons: { NO_TARGET: "nessun destinatario utilizzabile", DUPE: "doppione di una notifica recente", PRIORITY: "non per questa priorità",
      SNOOZE: "in pausa", SNOOZED: "in pausa", DELIVERY_CONDITION: "condizione del canale falsa", OCCUPANCY: "regola di presenza", ERROR: "errore",
      DELIVERY_DISABLED: "spento", SCENARIO: "scenario", TRANSPORT_DISABLED: "il suo transport è spento",
      NO_SCENARIO: "manca uno scenario richiesto", NO_ACTION: "nessuna azione da chiamare",
      INVALID_ACTION_DATA: "dati dell'azione non validi", UNKNOWN: "motivo sconosciuto" },
  },
};
