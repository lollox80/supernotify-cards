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
 * 2026-10-07 - v0.81.0. archive 0.40.0: with `pause_sender: true` the pause bar also offers the
 *   automation or script that sent the notification (from the logbook, as the why card finds it),
 *   so almost every notification can be paused, not only those with entity_id in their data.
 *   It needs a SuperNotify whose tag snooze matches the sender (PR #270): off by default until a
 *   release has it - with an older SuperNotify the pause would be accepted and match nothing.
 *   The entity, when there is one, stays first: it is narrower than the whole automation.
 *   Fix: a pause made while the pauses were being read could show as not made until the next read.
 * 2026-10-07 - v0.80.0. archive 0.39.0: pause one notification. An open row gets a pause bar:
 *   30 min, 1 h, 4 h or 24 h, for everyone (default) or only for me. It is SuperNotify's tag
 *   snooze (supernotify.snooze, scope tag) on the entity the notification is about - entity_id in
 *   its data, or its camera - so it holds back every notification about that entity, the "offline"
 *   and the "back online" alike, until the pause ends. A row whose entity is already paused says
 *   until when, with Resume. Not offered for critical notifications (a tag snooze would hold back a
 *   critical too) nor when the call names no entity: the bar then says to add entity_id to the
 *   call's data. "Only for me" takes you off the people the notification goes to; channels with
 *   fixed targets (speakers, the dashboard) still play. Needs SuperNotify with supernotify.snooze
 *   and the archive read through enquire_archive. Pause labels: a tag that is an entity shows its name.
 *   Fix: a pause made a moment ago read as already over when Home Assistant's clock is a few
 *   seconds ahead of the browser's (snoozed_at "in the future" was taken as yesterday).
 * 2026-10-05 - v0.79.0. why 0.15.0, for a notification dropped as a duplicate: (1) a box on top says
 *   when the same text went out before and how many seconds earlier, with a link that opens the
 *   original; when both came from the same run of an automation or script (same context) it says
 *   so - that run calls SuperNotify twice with the same text (two branches, Alexa + Google, are the
 *   usual cause) - and names it. (2) "duplicate" once in the header (it was there twice), the spoken
 *   text only when it differs from the message, (3) the folded group says why the channels were
 *   skipped ("3 skipped · duplicate 2, channel condition 1") instead of "skipped by a rule: normal",
 *   (4) "target required: always" only next to a missing target, where it means something.
 * 2026-10-05 - v0.78.0. Why a scenario is on and what it does, without opening anything.
 *   scenarios 0.31.0: (1) the channel chips say what the scenario changes, not only on/off - the
 *   volume it sets ("🔇 Alexa · muted", "🔉 TTS · vol 20%"), with templates rendered now by Home
 *   Assistant (render_template, refreshed every minute), ⚙ when it changes other options, 🎯 when it
 *   sends to other targets; before, late_night with volume 0 showed a green "✓ Alexa". (2) Under the
 *   name, the conditions with their result now (from enquire_active_scenarios trace: true, one read
 *   every 30 s shared by the cards), no tap needed. (3) When an active scenario turns on a channel
 *   that another active scenario turns off (the "off" wins in SuperNotify) or that is switched off,
 *   the chip is marked ⚠ and a line says by whom. overview 0.37.0: each active scenario chip adds
 *   what it silences or turns down ("· 🔇 Alexa, TTS") and its conditions as tooltip. A time
 *   condition bound to an input_datetime shows its name instead of the entity id (also in why).
 * 2026-10-05 - v0.77.0. channels: a channel with a `fallback:` list (the switch's `fallback` attribute,
 *   SuperNotify PR #260) shows "fallback: <channels>", and a channel named in another's list shows
 *   "fallback for <channel>". Nothing changes without the attribute.
 * 2026-10-05 - v0.76.2. why: a channel that went out as the fallback of another (SuperNotify 2.13.0,
 *   delivery `fallback:`) reads "fallback for <channel>" instead of the raw "fallback:<name>".
 * 2026-10-05 - v0.76.1. Cards stuck on "loading" (overview without last notification, who is home
 *   or active scenarios, stats and archive "reading") on a page opened straight on a view: a
 *   request sent while the page was still connecting could stay unanswered, and the card waited for
 *   it for ever. Every read the cards make (SuperNotify's enquire_* actions, the archive, history,
 *   statistics, repairs, the dashboard configuration) now gives up after a time (10 s for the
 *   enquire_* actions, 20 s for the others, 60-90 s for the archive counts) so the next update asks again.
 * 2026-10-05 - v0.76.0. control: "while you were paused". When no pause is in force, the control
 *   card with the snooze tile asks SuperNotify's archive (enquire_archive, summary) for what a
 *   pause held back since the last time you saw it (at most the last 24 h): notifications
 *   suppressed as SNOOZED, wholly or on some channels. It shows how many, the most frequent ones and
 *   the list; OK hides them until the next pause. `catch_up: false` turns it off.
 * 2026-10-05 - v0.75.2. Stats: SuperNotify reads every archive file for the daily counts, about 11 s
 *   for 30 days on a real installation, and meanwhile the archive and why cards wait too. The daily
 *   counts are now kept in this browser like the per-notification rows: a finished day does not
 *   change, so after the first opening only the days since the last reading are asked for.
 * 2026-10-05 - v0.75.1. Pauses on SuperNotify 2.13.0: the snooze action became three,
 *   supernotify.snooze (minutes), supernotify.silence (until resumed) and supernotify.unsnooze, with
 *   no `command`. The cards call the one that fits; the single action with `command` of the first
 *   draft is still understood when it is the only one there.
 * 2026-10-05 - v0.75.0. "Changed by hand" on the rows, from the switches' `overridden` attribute
 *   (SuperNotify after 2.12.1-beta2; nothing changes before it). Channels, transports, recipients
 *   and scenarios switched at runtime, on or off, show "changed by hand" with a tooltip that says
 *   "Undo the changes made by hand" (tools card) puts them back. Channels: a channel off in the
 *   configuration now reads "off in the configuration", one switched off "switched off by hand".
 * 2026-10-04 - v0.74.1. Archive and why: opened straight on their view, the list could stay on
 *   "reading the archive" although the archive had been read (the redraw was missed). The card
 *   now redraws on the next update whenever it still shows "reading" and the archive is there,
 *   and a reading that never answers is given up after 20 s and tried again.
 * 2026-10-04 - v0.74.0. Ready for the next SuperNotify release, and four fixes. Each new SuperNotify
 *   feature is used only when the installed version has it; older ones keep working as before.
 *   (1) pauses go through supernotify.snooze when it exists: any user gets the full pause panel
 *   (what, for whom, how long) and its Resume buttons, no admin needed and no voice commands
 *   (`snooze_via: action`; `event` and `voice` still force the old ways). The tile features too.
 *   (2) status badge and overview count as "channels off" only those switched off by hand (the
 *   switch's `overridden` attribute), so a channel meant to be off needs no `ignore`. (3) stats:
 *   with enquire_archive `verbosity: daily` the whole window is one call of a few KB instead of a
 *   day-by-day read of every notification (`daily: false` keeps the old way). (4) automations: one
 *   heading per category even when the manifest mixes them. (5) composer: channels switched off,
 *   or whose transport is off, are not offered (`show_off: true` shows them). (6) control:
 *   `status: false` hides the status row, for a second control card in the same view.
 * 2026-10-04 - v0.73.2. From a look at every view on a real installation. (1) why: a channel
 *   skipped for no target is a problem only when the call asked for it by name or SuperNotify
 *   counted a missed channel; an automatic channel with nobody to reach (e.g. notify_entity) is
 *   routine, as SuperNotify 2.11 counts it.
 *   (2) archive and why: messages with markdown links show the link text, also when the archive
 *   index cut the link in half. (3) overview: `ignore: [channel, ...]` as on the status badge.
 *   (4) Italian: the snooze tile is "Pausa". (5) strategy: view tabs show their names (no icons),
 *   a view with one section (Stats, Tools) uses the full width.
 * 2026-10-04 - v0.73.1. Status badge: channels off that are meant to be off no longer keep it amber.
 *   `ignore: [channel, ...]` leaves channels out of the count (e.g. fallbacks switched off in the
 *   YAML); `channels_off: false` leaves the count out altogether. Channels off alone now show in
 *   grey (bell-off), no longer as a warning: amber stays for nothing, red for transports with errors,
 *   blue for pauses.
 * 2026-10-04 - v0.73.0. Eleven languages, the same as SuperNotify's own: German, Spanish, French,
 *   Dutch, Polish, Portuguese, Japanese, Simplified Chinese and Hindi besides English and Italian.
 *   Every card, the visual editor, the badge, the tile features and the dashboard strategy follow
 *   Home Assistant's language (or `language:`). Words shared with SuperNotify (priority, scenario,
 *   transport, recipient, outcomes, dry run...) are taken from SuperNotify's own translations of that
 *   language. SN_I18N_EXTRA at the end of the file, merged over English at load: a string still
 *   missing in a language shows in English. The voice commands for pauses stay English/Italian,
 *   the only languages SuperNotify's sentences have.
 * 2026-10-04 - v0.72.0. SuperNotify in Home Assistant's own cards, no card of ours needed.
 *   (1) Badge `custom:supernotify-status-badge` for any view: SuperNotify's health in one pill -
 *   transports with errors, channels off, pauses in force, else "All good" - colour and icon to
 *   match, the detail in its tooltip; a tap opens `navigation_path` or the counter's dialog.
 *   (2) Tile card features: `custom:supernotify-pause` on the tile of
 *   sensor.supernotify_notifications (30 min / 1 h / 2 h, Resume while paused; administrators
 *   through the push-button event, everyone else through SuperNotify's voice commands, as in the
 *   control card), `custom:supernotify-test` on the tile of a notify.recipient_<name> (send a test
 *   through the whole pipeline, two taps), `custom:supernotify-last` on the counter's tile (title
 *   and age of the last notification). Both the old (stateObj) and new (context) feature APIs.
 * 2026-10-04 - v0.71.0. A dashboard that builds itself: `strategy: {type: custom:supernotify}` in a
 *   dashboard's raw configuration (or "SuperNotify" in Add dashboard, where Home Assistant lists
 *   custom strategies). Views Home, Send, Setup, Stats and - for administrators only - Tools, each
 *   card with the configuration its card picker would suggest (bands from the helpers named like the
 *   README's, automations only when the manifest is there, transports/scenarios/recipients only when
 *   SuperNotify has them). Options: title, views (which and in what order), hide (card kinds),
 *   cards (extra configuration per card kind, e.g. control tiles). Links between views work on it
 *   too: the view map is built from the generated views. "Take control" in the dashboard menu turns
 *   it into an ordinary editable dashboard, as for Home Assistant's own strategies.
 * 2026-10-04 - v0.70.0. SuperNotify 2.12.1. (1) stats: on 2.12.1 or later the figures come from
 *   SuperNotify's own archive (enquire_archive, verbosity summary): hour, weekday, priority,
 *   channels sent and failed, band of the day (the applied scenario named like a band,
 *   `period_scenarios`). No helper, automation or daily meter is needed any more. Each
 *   notification is kept as a small row in the browser, so only new days are read after the
 *   first opening (one call per day, with progress). `source: archive|history` forces one.
 *   (2) composer: "Try without sending" checks duplicates like a real send would (2.12.1 keeps
 *   simulations in their own cache), and Send after a try is never held back - no force_resend.
 * 2026-10-04 - v0.69.0. Daily counts from SuperNotify's own counter: sensor.supernotify_notifications
 *   is a total_increasing RestoreSensor, so Home Assistant keeps its long-term statistics with no
 *   helper. (1) stats 0.30.0: `count_entity` (default sensor.supernotify_notifications) fills the
 *   days the daily utility_meter (`sent_today_entity`) has no statistics for - or all of them when
 *   there is no meter; today = live counter minus its value at midnight. (2) overview 0.35.0:
 *   without a utility meter, "Sent today" and yesterday come from the same statistics instead of
 *   "since startup" (snDailyCounts, read once every 5 minutes).
 * 2026-10-04 - v0.68.0. Phone and accessibility, every card: whatever can be tapped can also be
 *   reached with Tab and used with Enter or Space, has role button and a name for screen readers
 *   (its text, else its tooltip); switches are named after their row, emoji icons are left out
 *   (the text beside them says it), toasts and results are announced. On touch screens rows are
 *   at least 48 px high and buttons and chips 40 px, the switches' touch area is larger; a visible focus ring; no
 *   animations when the system asks for reduced motion.
 * 2026-10-04 - v0.67.0. Links across views: the overview's "Show ›", its people and scenario chips,
 *   and the control card's status links now also reach a card on another view of the same
 *   dashboard - the card reads the dashboard's configuration once (lovelace/config, views the user
 *   cannot see left out), opens that view and the target card shows what was asked when it is drawn.
 * 2026-10-04 - v0.66.0. (1) Active scenarios: SuperNotify's own list (enquire_active_scenarios)
 *   first in control and overview too - from 2.12.1 the binary_sensors stay "unknown" unless
 *   scenario_control.refresh is on. (2) deliveries 0.28.0: "Try this channel" in the detail - a dry
 *   run through that channel only. (3) scenarios 0.27.0: a tap opens why it applies or not (each
 *   condition with its result, from enquire_active_scenarios trace: true) and "What changes if it
 *   applies / without it" (two dry runs compared); "All attributes" opens HA's dialog.
 * 2026-10-04 - v0.65.0. Cards linked, fewer repeats. (1) The cards on a page know each other
 *   (snCards, snGo, snFlash): in the overview, transports with errors open the transports card on
 *   those rows, channels off the channels card, a pause the control card's pause panel, a person
 *   the recipients card, an active scenario the scenarios card; in the control card, who is home
 *   and the active scenarios do the same. (2) overview: the last notification is left out when a
 *   control card on the page already shows it (`last_notification: true|false` decides).
 *   (3) "Undo the changes made by hand" only in the tools card (gone from transports and channels).
 *   (4) simulator: SuperNotify's own dry run (2.12+), the picked scenarios applied and only those,
 *   with a priority; same view as the composer's (snDryHtml, snDryCss). `dry_run: false` keeps the
 *   estimate.
 * 2026-10-04 - v0.64.0. Code cleanup, nothing changes on screen. Every card extends SnCard (the
 *   hass setter, palette, state read, more-info dialog and default grid size were copied in each
 *   card; a card now says what to do with a new hass in _onHass). One snEsc instead of 19 local
 *   copies, snVer for the version footer, snActiveScenarioIds (control, overview),
 *   snLastDeliveries + snPrioColor for the last notification (control, overview), one
 *   _resumeAll in the control card.
 * 2026-10-04 - v0.63.2. control 0.33.2: with a pause for everyone already in force, SuperNotify held
 *   back the announcement of the next pause too (is_global_snooze, seen on the real archive at
 *   09:29). Then the card calls the announce channel's own action with its targets and data.
 * 2026-10-04 - v0.63.1. control 0.33.1: `snooze_announce: true` (off by default, also in the visual
 *   editor) says a pause out loud on the announce channel (`announce_delivery`): before pausing,
 *   since the pause would stop its own announcement, and after resuming one or all.
 * 2026-10-04 - v0.63.0. (1) control 0.33.0 / overview 0.31.0: who is home for SuperNotify
 *   (enquire_occupancy) - names and the occupancy its conditions see; `occupancy: false` hides it.
 *   (2) overview: SuperNotify's own repairs (repairs/list_issues, admin) in the health list, with
 *   their title, opening Settings > Repairs. (3) transports 0.24.0: when the last error happened,
 *   in which step, and the transport's defaults (action, targets, options) under a tap.
 *   (4) deliveries 0.27.0: options, data and targets of each channel under a tap; "All
 *   attributes" opens HA's dialog. (5) archive 0.37.0: what a voice channel said is read from the
 *   envelopes that carry `spoken_message`, and named after that channel. (6) why a pause was set
 *   (by hand, by voice, by the assistant) in the pause list and the health detail. (7) composer
 *   0.21.0: text for email (message_html), clip URL, buttons (actions, action_groups) and
 *   per-channel settings (delivery_control). (8) control: users who are not admin pause through
 *   SuperNotify's voice commands (conversation/process, their own pauses); `snooze_via` forces one way.
 * 2026-10-04 - v0.62.0. (1) New supernotify-tools-card 0.1.0: maintenance with the result on the
 *   spot (refresh entities, resume every pause, archive / picture cleanup older than N days,
 *   reset hand-made changes by kind with the list of what went back) and every enquire_* shown
 *   readable in the card instead of a persistent notification, with Copy JSON. (3)
 *   recipients-card 0.27.0: a person's devices (model, system, app version) on request, and
 *   "Send a test" (two taps) through notify.recipient_<name>, i.e. the whole pipeline.
 *   (4) composer-card 0.20.0: advanced options - spoken message, scenarios to apply / require /
 *   consider, picture from a URL, debug.
 * 2026-10-04 - v0.61.0. (B1) control-card 0.32.0: the snooze tile opens a pause panel - what
 *   (non-critical, everything, one channel, one priority), for whom (everyone or only me), how
 *   long (15 min ... 4 h, or until resumed), and the pauses in force, each with Resume, plus
 *   Resume everything. Same mobile_app_notification_action event as the push buttons
 *   (SNOOZE / SILENCE / NORMAL). `snooze_panel: false` keeps the one-tap snooze.
 *   (B2) snLive: one subscription per page to supernotify_notification - the archive store
 *   reads the newest entries and the cards their enquire_* data as soon as a notification is
 *   done, also when nothing was delivered. (C) why-card 0.13.0: who sent it (the automation or
 *   script from the logbook, else the person), how long it took and the slowest channel,
 *   targets no channel took, names that do not exist.
 * 2026-10-04 - v0.60.0. Real data (gap analysis of 03/10). (A1) Active scenarios come from
 *   enquire_active_scenarios (snActive, every 30 s and after a change) - SuperNotify 2.12.0 can leave
 *   the scenario binary_sensors at their startup value. (A2) snNotifTitle: the title lives in
 *   condition_variables / the delivery envelopes, not at the top level (overview and control showed
 *   no title). (A3) overview "Failures" = failed channel sends today from the archive;
 *   sensor.supernotify_failures only counts crashes inside SuperNotify. (A8) control: tiles and group
 *   pills toggle any domain (a switch.* DND did nothing). (A9) overview and composer list each
 *   delivery once, by its name (switch over the deprecated binary_sensor); transports count "used
 *   by" over every delivery.
 * 2026-10-03 - v0.59.2. No code change: README links the changelog near the top, so HACS shows it.
 * 2026-10-03 - v0.59.1. Contrast measured on every text of the 13 cards in both themes
 *   (tools/contrast_audit.mjs): light-theme green #1b7f45 -> #17733d (it was 4.2-4.4:1 on the green
 *   tints of delivered/active/now chips), okSoft added to the palette (bands and scenarios used it for
 *   the active row but it was never defined, so the row was never tinted), no opacity on the
 *   overview's health sentence, on the version/"list updated" lines and on the why card's skipped
 *   channels. Disabled rows stay faded on purpose.
 * 2026-10-03 - v0.59.0. Design review, part 2 (finishing touches). (A5) archive and why: times
 *   follow the HA profile's time format (snH12). (C3) bands-card 0.20.0: one line per band - name
 *   and "until 13:00", start time, volume slider, percent; about 40% shorter. (C4) scenarios: the
 *   manual scenario's "Apply now" is a button (Applied when on), one switch per row. (C5) control:
 *   the snooze tile reads "Snoozed · 25 min", "garden · until 22:05". (C6) transports: readable
 *   name first, technical name and "used by 2 channels" under it. (C1) stats: hour and weekday
 *   charts drawn at their real width, labels 10.5 px, hours every 6. (C2) stats: day periods by
 *   their band name. (C7) why: step 4 stacked. (C8) archive: scenarios in force by name. (C9)
 *   simulator: the reason sits next to the channel name.
 * 2026-10-03 - v0.58.0. Design review, consistency and visible defects. (A1) stats-card number
 *   tiles are filled like the overview's, no border. (A2) snTech()/snSame(): one rule for technical
 *   names - small monospace, hidden when they say the same as the readable name (deliveries,
 *   scenarios, composer result, stats, why). (A3) deliveries, transports, recipients, scenarios:
 *   a hairline between rows instead of a bottom border bent by the row radius. (A4) archive:
 *   priority in the shared scale (critical red, high orange, medium blue, low grey). (B1) archive:
 *   "6 in the archive" when the total is unknown, not "6 of ?". (B2) why: "1 call". (B3) composer:
 *   "loading the picker…" instead of an orphan "…", gone after 4 s if HA never defines it. (B4)
 *   stats: a channel with only errors shows "✖ 26", not "26 ✖26". (B5) overview/stats: tile labels
 *   wrap instead of spilling out. (B6) control: the last notification's title wraps to two lines,
 *   chips move below, before anything is cut.
 * 2026-10-03 - v0.57.0. (1) Shared reads: control, overview, scenarios and simulator ask
 *   enquire_last_notification / enquire_snoozes / enquire_active_scenarios / ... through
 *   snEnquire(), so cards on the same view share one call (in flight or < 2.5 s old) instead of
 *   one each; a snooze, clear or send forgets the cache and the other cards read again
 *   ("supernotify-refresh"). (2) Card picker: every card has a live preview and a documentation
 *   link; stubs fit any installation (control uses a DND switch only if one exists, archive and
 *   why use the native archive, bands finds helpers named like the README's). bands-card with no
 *   bands shows how to add them instead of an error.
 * 2026-10-03 - v0.56.1. Fixes seen on a real dashboard: overview-card 0.28.1 - with `stats: full`
 *   the five numbers sit 3+2 (one row when the card is wide) instead of leaving a hole, four sit
 *   2+2; a last notification without a title is shown as plain text, not as a bold headline,
 *   clamped to three lines instead of cut mid-word; space between icon and name in the scenario
 *   chips. control-card 0.29.1 and overview: markdown in the message ([text](url), **bold**,
 *   `code`) is shown as plain text (new shared helper snPlainMsg).
 * 2026-10-03 - v0.56.0. overview-card 0.28.0: the last notification reads like the control card's -
 *   title, message, priority and "4 min ago" instead of a raw timestamp, channel counts with the
 *   names in the tooltip ("2 delivered", "1 missed", "2 skipped"), and Why ›. `last_notification:
 *   false` hides the block when the control card already shows it (also in the visual editor).
 * 2026-10-03 - v0.55.0. Visual editor and a simulator that explains.
 *   - Every card answers getConfigForm(): "Add card" / "Edit card" shows a form drawn by Home
 *     Assistant (entity pickers, switches, numbers, dropdowns) for the common options, with a
 *     folded "Look and text" section (colours, icons, version, intro). Options a form cannot
 *     express (control tiles and groups, time bands, scenario groups) stay in the code editor;
 *     the form keeps them. Labels in English and Italian (snForm, SN_FORM_LABELS).
 *   - simulator-card: one row per channel with the reason - "would go out: starts on its own /
 *     turned on by <scenario>", "would not go out: turned off by <scenario> / only when named in
 *     the call / only with a scenario / backup / switched off" - instead of bare chips.
 * 2026-10-03 - v0.54.0. Polish after the redesign.
 *   - Singular and plural: "1 channel off", "1 failure", "1 device", "1 skipped by a rule"
 *     instead of "1 channels off" and the like (helpers snW / snPl, "_1" keys). In Italian the
 *     channel counts are masculine plural: "2 consegnati", "1 mancato" (archive and control
 *     said "consegnata", "consegnate").
 *   - Readable names where the technical ones were left: simulator (scenarios and channels),
 *     scenarios card (channel tags), stats card (top channel and insights); the technical name
 *     stays in the tooltip.
 *   - Time bands: translated names ("Late night" / "Notte fonda") and listed from the morning,
 *     the band that starts after midnight last (bands card, control status bar).
 *   - Archive card: priorities capitalised in English too; the notification id left the
 *     details (it is in the row's tooltip).
 * 2026-10-03 - v0.53.1. composer-card 0.17.1 and automations-card 0.18.1: their version (composer footer,
 *   automations header) was still shown, missed by 0.49.0's `show_version`. New README / docs screenshots of every card from tools/showcase.mjs.
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

const VERSION = "0.81.0"; // bundle / HACS release

/**
 * Per-card versions: bumped ONLY when that card changes (the bundle VERSION
 * above is what HACS tracks and moves at every release). Each card footer
 * prints its own entry, so "v0.16.0" on the deliveries card means the card
 * has not changed since 0.16.0 even if the bundle is newer.
 * tools/check_card_versions.py fails the release when a card's code changed
 * without a bump here.
 */
const SN_CARD_VERSIONS = {
  control: "0.38.1",
  overview: "0.37.0",
  bands: "0.21.0",
  deliveries: "0.32.0",
  transports: "0.27.0",
  recipients: "0.30.0",
  scenarios: "0.31.0",
  simulator: "0.17.0",
  composer: "0.25.0",
  automations: "0.21.4",
  stats: "0.32.2",
  archive: "0.40.0",
  tools: "0.2.2",
  why: "0.15.0",
};

/**
 * i18n: strings follow hass.language (override with `language:` in the card
 * config). English and Italian here; the other nine languages are in
 * SN_I18N_EXTRA at the end of the file (0.73.0). English fallback.
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
    yesterday: "yesterday", failures: "Failures", fail_today: "failed channel sends today", deliveries: "Deliveries",
    enabled_total: "enabled/total", last_notif: "Last notification",
    transports: "Transports", delivered: "delivered", failed: "failed",
    channels: "channels", none: "none", no_transports: "no transport entities found", tr_used: "used by", tr_unused: "no channel uses it",
    start: "start", volume: "volume", now: "now", crosses: "crosses midnight",
    no_voice: "no voice", mute_hint: "A band at <b>0%</b> sends <b>no voice announcement</b> at all (Alexa and TTS off, push and dashboard still delivered). Critical and high-priority alerts always speak.",
    enabled: "enabled", implicit: "always on", explicit: "on request",
    by_scenario: "scenario only", fallback: "backup", fallback_err: "backup on error",
    inc_sum: "of these channels", inc_always: "start on their own",
    inc_req: "only when asked for", inc_scen: "only with a scenario",
    grp_auto: "Start on their own", grp_named: "Only when named in the call", grp_scen: "Only with a scenario",
    grp_fallback: "Backup, when the others fail", ch_title: "Channels", ch_count: "{on} of {tot} on",
    off_manual: "switched off", off_config: "off in the configuration", fb_list: "fallback:", fb_for: "fallback for", hand: "changed by hand",
    hand_tip: "Switched at runtime, so it differs from the configuration. \"Undo the changes made by hand\" (tools) puts it back.",
    paused_by: "paused now by", on_by: "on now through",
    fixed_targets: "fixed targets", no_deliveries: "no delivery entities found",
    home: "home", away: "away", devices: "devices", devices_1: "device", rc_test: "Send a test", rc_test_confirm: "Tap again to send",
    rc_test_sent: "Test sent", rc_test_title: "SuperNotify test", rc_test_msg: "Test message from the dashboard,", overrides: "delivery overrides", overrides_1: "delivery override",
    no_contact: "no contact points", no_recipients: "no recipient entities found",
    details: "Details",
    h_update: "update available:", h_restart: "restart Home Assistant to finish the update",
    h_uptodate: "up to date", h_transport_err: "transports with errors", h_channels_off: "channels off",
    h_all_good: "All good", h_health: "Health",
    h_failures: "failures", h_failures_1: "failure", h_transport_err_1: "transport with errors",
    h_channels_off_1: "channel off", channels_1: "channel",
    band_early_morning: "Early morning", band_morning: "Morning", band_afternoon: "Afternoon",
    band_evening: "Evening", band_night: "Night", band_late_night: "Late night",
    h_look_1: "1 thing to look at", h_look_n: "{n} things to look at", h_rest_ok: "everything else works",
    h_ch_on: "{on} of {tot} channels on", h_open: "Open", ln_delivered: "delivered", ln_failed: "failed",
    ln_why: "Why", tgt_loading: "loading the picker…", bands_empty_t: "No time bands yet",
    bands_empty: "Add one band per part of the day: an input_datetime for its start and an input_number for the voice volume.",
    active_now: "active now", disabled: "disabled", other: "Other",
    manual: "manual", apply_now: "apply now", applied: "Applied", apply_off: "tap to stop applying it", enabled_lbl: "enabled",
    reset_overrides: "Reset overrides", reset_done: "overrides reset",
    transport_off: "transport off", last_notified: "last notified", never_notified: "never notified",
    media: "media", no_scenarios: "no scenario entities found",
    sim_pick: "🎬 Scenarios — tap to simulate", sim_fire: "📤 Channels",
    sim_hint: "Real engine data (enquire services). Priority-based delivery filtering happens engine-side and is not simulated here. Disabled wins over enabled, like the runtime merge.",
    sim_none: "no deliveries would fire", scenario_tag: "scenario",
    sim_go: "Would go out", sim_stop: "Would not go out", sim_r_default: "starts on its own",
    sim_r_on: "turned on by", sim_r_off: "turned off by", sim_r_named: "only when named in the call",
    sim_r_scen: "only with a scenario that turns it on", sim_r_fallback: "backup, when the others fail",
    sim_r_switched: "switched off",
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
    adv_title: "Advanced options", adv_spoken: "Spoken message (Alexa, TTS)", adv_spoken_ph: "what the speakers say, if different from the text",
    adv_apply: "Apply these scenarios", adv_require: "Send only if these scenarios are active", adv_constrain: "Consider only these scenarios",
    adv_snapshot: "Picture from a URL", adv_debug: "Debug: record the full selection trace (shown by the why card)",
    custom_target_ph: "e.g. user@example.com, 123456789",
    native_target_tag: "🎯 native area/floor/label",
    target_warn: "⚠️ Areas, floors and labels are only resolved by notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts and chime. With any other channel — or the default routing when no channel is picked above — the notification can silently end up with no target. Pick a compatible channel, or add a person/device directly.",
    aut_search: "Search automations…", aut_all: "All", aut_none: "No matches",
    aut_err: "Manifest not found — generate it with tools/genera_vista_automazioni.py",
    aut_updated: "list updated", aut_count: "automations", aut_count_1: "automation", never: "never",
    ago_now: "now", ago_min: "min ago", ago_h: "h ago", ago_d: "d ago",
    aut_disabled_only: "Disabled only",
    grp_active: "active", repeat: "Repeat", skipped_n: "skipped", left: "left", missed_n: "missed",
    snz_all: "everything", snz_nc: "non-critical", snz_prio: "priority", snz_transport: "transport", snz_for: "for",
    snz_choose: "choose what and how long", cu_title: "While notifications were paused", cu_held: "{n} held back", cu_part: "{n} only on some channels", cu_ok: "OK", cu_list: "Show them", cu_from: "from", cu_to: "to", snz_title: "Pause notifications", snz_what: "What", snz_nc_l: "Non-critical",
    snz_all_l: "Everything", snz_ch: "A channel", snz_pr: "A priority", snz_who: "For whom", snz_everyone: "Everyone",
    snz_me: "Only me", snz_len: "How long", snz_forever: "Until I resume", snz_go: "Pause", snz_close: "Close",
    rs_hand: "by hand", rs_voice: "by voice", rs_assist: "by the assistant",
    snz_voice_info: "Your pauses go through SuperNotify's voice commands: they are yours only.",
    snz_voice_off: "SuperNotify's voice commands are off: turn them on in the integration options.",
    snz_resume_mine: "Resume mine",
    go_open: "Show",
    dl_probe: "Try this channel", probe_msg: "Channel test from the dashboard",
    sc_why: "Why", sc_yes: "Applies now", sc_no: "Does not apply now", sc_manual_why: "Manual scenario: applied by hand",
    sc_no_cond: "No conditions", sc_off_sw: "Switched off", sc_not_eval: "not checked", sc_now: "now",
    sc_diff_btn_on: "What changes if it applies", sc_diff_btn_off: "What changes without it",
    sc_diff_on: "If it applied, for a medium notification now:", sc_diff_off: "Without it, for a medium notification now:",
    sc_diff_add: "would also send", sc_diff_rem: "would no longer send", sc_diff_none: "no difference",
    c_state: "{e} is {s}", c_template: "template condition", c_time: "time", c_after: "after", c_before: "before",
    c_numeric: "{e}", c_above: "above", c_below: "below", c_and: "all of these", c_or: "at least one of these", c_not: "none of these",
    c_or_join: " or ", sc_muted: "muted", sc_vol: "vol", sc_opts: "other options: {k}", sc_tgt: "other targets",
    sc_by: "{d}: turned off by {s} (turning off wins)", sc_chan_off: "{d}: the channel is switched off",
    sc_eff_off: "turns off {d}", sc_eff_on: "uses {d}", sc_when: "When", sim_hint_dry: "SuperNotify's own answer (dry run, nothing is sent): a notification now, with the priority and only the scenarios picked above.",
    sim_msg: "Simulator test", sim_prio: "Priority",
    sa_snooze: "{what} paused for {len}.", sa_silence: "{what} silenced until further notice.",
    sa_resume: "{what} back on.", sa_resume_one: "Pause over: {x}.", sa_resume_all: "Notifications back on.",
    sa_w_nc: "Non-critical notifications", sa_w_all: "All notifications", sa_w_ch: "Channel {x}",
    sa_w_pr: "{x} priority notifications", sa_w_mine: "Your notifications", sa_for: "for {x}",
    sa_min: "{n} minutes", sa_hour: "one hour", sa_hours: "{n} hours",
    occ_title: "Who is home", occ_home_l: "Home", occ_ALL_HOME: "Everyone home", occ_ALL_AWAY: "Everyone away",
    occ_LONE_HOME: "Only one home", occ_MULTI_HOME: "Some at home", occ_UNDEFINED_OCCUPANTS: "No one tracked",
    h_repairs: "SuperNotify repairs", h_repairs_1: "SuperNotify repair",
    det_more: "All attributes", det_yes: "yes", det_no: "no", det_action: "Action", det_target: "Fixed targets",
    det_target_req: "Needs a target", det_target_use: "Targets use", det_inclusion: "Used when", det_prio: "Priorities",
    det_occ: "Who must be home", det_transport: "Transport", det_data: "Data", det_debug: "Debug",
    det_err_last: "Last error", det_err_in: "In", det_err_n: "Errors since start", det_select: "Selection",
    adv_html: "Text for email (HTML)", adv_clip: "Video clip from a URL", adv_actions: "Buttons on the notification",
    adv_act_id: "action id", adv_act_title: "button text", adv_act_add: "+ button", adv_groups: "Button groups (comma)",
    adv_dc: "Channel settings for this notification", adv_dc_ph: "key: value, one per line", adv_dc_add: "+ channel",
    snz_active: "Paused now", snz_resume: "Resume", snz_resume_all: "Resume everything", snz_until_resumed: "until resumed",
    snz_done: "Paused", snz_resumed: "Resumed",
    no_notif: "no notification yet",
  },
  it: {
    presence: "Presenza", time_band: "Fascia oraria", quiet: "Silenzioso",
    act_scen: "Scenari attivi", on: "attivo", off: "spento", active: "attivo",
    dnd: "Non disturbare", tap_silence: "tocca per silenziare",
    snooze: "Pausa", min: "min", pause_nc: "pausa ai non critici",
    snoozed: "In pausa", until: "fino alle", tap_clear: "tocca per annullare",
    announce: "Annuncia", intercom: "interfono",
    announce_ph: "Annuncia su tutti gli Echo di casa…", send: "Invia",
    announced: "Annunciato", cleared: "Pause annullate",
    snoozed_for: "Notifiche non critiche in pausa per",
    sent: "Inviate", sent_today: "Inviate oggi", since_startup: "dall'avvio",
    yesterday: "ieri", failures: "Fallimenti", fail_today: "invii falliti oggi", deliveries: "Delivery",
    enabled_total: "attive/totali", last_notif: "Ultima notifica",
    transports: "Transport", delivered: "consegnata", failed: "fallite",
    channels: "canali", none: "nessuno", no_transports: "nessuna entità transport trovata", tr_used: "usato da", tr_unused: "nessun canale lo usa",
    start: "inizio", volume: "volume", now: "ora", crosses: "attraversa mezzanotte",
    no_voice: "niente voce", mute_hint: "Una fascia a <b>0%</b> <b>non manda proprio</b> l'annuncio vocale (Alexa e TTS spenti; push e notifica a schermo arrivano lo stesso). Gli avvisi critici e urgenti parlano sempre.",
    enabled: "attiva", implicit: "sempre attivo", explicit: "solo su richiesta",
    by_scenario: "solo con scenario", fallback: "riserva", fallback_err: "riserva su errore",
    inc_sum: "di questi canali", inc_always: "partono da soli",
    inc_req: "solo se richiesti", inc_scen: "solo con uno scenario",
    grp_auto: "Partono da soli", grp_named: "Solo se chiamati per nome", grp_scen: "Solo con uno scenario",
    grp_fallback: "Di riserva, se gli altri falliscono", ch_title: "Canali", ch_count: "{on} di {tot} accesi",
    off_manual: "spento a mano", off_config: "spento da configurazione", fb_list: "riserva:", fb_for: "riserva di", hand: "modificato a mano",
    hand_tip: "Cambiato con l'interruttore, quindi diverso dalla configurazione. «Annulla le modifiche fatte a mano» (Strumenti) lo rimette com'era.",
    paused_by: "in pausa ora:", on_by: "acceso ora da",
    fixed_targets: "target fissi", no_deliveries: "nessuna entità delivery trovata",
    home: "in casa", away: "fuori", devices: "dispositivi", devices_1: "dispositivo", rc_test: "Manda una prova", rc_test_confirm: "Tocca ancora per inviare",
    rc_test_sent: "Prova inviata", rc_test_title: "Prova SuperNotify", rc_test_msg: "Messaggio di prova dalla dashboard, ore", overrides: "override delivery",
    no_contact: "nessun recapito", no_recipients: "nessuna entità destinatario trovata",
    details: "Dettagli",
    h_update: "aggiornamento disponibile:", h_restart: "riavvia Home Assistant per completare l'aggiornamento",
    h_uptodate: "aggiornato", h_transport_err: "transport con errori", h_channels_off: "canali spenti",
    h_all_good: "Tutto ok", h_health: "Stato",
    h_failures: "fallimenti", h_failures_1: "fallimento", h_channels_off_1: "canale spento", channels_1: "canale",
    band_early_morning: "Mattina presto", band_morning: "Mattina", band_afternoon: "Pomeriggio",
    band_evening: "Sera", band_night: "Notte", band_late_night: "Notte fonda",
    h_look_1: "1 cosa da guardare", h_look_n: "{n} cose da guardare", h_rest_ok: "il resto funziona",
    h_ch_on: "{on} di {tot} canali accesi", h_open: "Apri", ln_delivered: "consegnati", ln_delivered_1: "consegnato", ln_failed: "falliti", ln_failed_1: "fallito",
    ln_why: "Perché", tgt_loading: "carico il selettore…", bands_empty_t: "Nessuna fascia oraria",
    bands_empty: "Aggiungi una fascia per ogni parte della giornata: un input_datetime per l'inizio e un input_number per il volume della voce.",
    active_now: "attivo ora", disabled: "disattivato", other: "Altro",
    manual: "manuale", apply_now: "applica ora", applied: "Applicato", apply_off: "tocca per non applicarlo più", enabled_lbl: "abilitato",
    reset_overrides: "Ripristina override", reset_done: "override ripristinati",
    transport_off: "transport spento", last_notified: "ultimo avviso", never_notified: "nessun avviso",
    media: "media", no_scenarios: "nessuna entità scenario trovata",
    sim_pick: "🎬 Scenari — tocca per simulare", sim_fire: "📤 Canali",
    sim_hint: "Dati reali del motore (servizi enquire). Il filtro per priorità delle delivery avviene lato motore e non è simulato qui. Lo spegnimento vince sull'accensione, come nel merge reale.",
    sim_none: "nessun canale partirebbe", scenario_tag: "scenario",
    sim_go: "Partirebbero", sim_stop: "Non partirebbero", sim_r_default: "parte da solo",
    sim_r_on: "acceso da", sim_r_off: "spento da", sim_r_named: "solo se chiamato per nome",
    sim_r_scen: "solo con uno scenario che lo accende", sim_r_fallback: "di riserva, se gli altri falliscono",
    sim_r_switched: "spento a mano",
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
    adv_title: "Opzioni avanzate", adv_spoken: "Frase parlata (Alexa, TTS)", adv_spoken_ph: "cosa dicono gli altoparlanti, se diverso dal testo",
    adv_apply: "Applica questi scenari", adv_require: "Invia solo se questi scenari sono attivi", adv_constrain: "Considera solo questi scenari",
    adv_snapshot: "Foto da un indirizzo", adv_debug: "Debug: registra il trace completo della selezione (lo mostra la card Perché)",
    custom_target_ph: "es. utente@esempio.com, 123456789",
    native_target_tag: "🎯 area/piano/etichetta nativi",
    target_warn: "⚠️ Aree, piani ed etichette vengono risolti solo da notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts e chime. Con qualsiasi altro canale — o con l'instradamento di default se non scegli nessun canale qui sopra — la notifica può restare senza target senza nessun errore visibile. Scegli un canale compatibile, oppure aggiungi anche una persona/dispositivo diretto.",
    aut_search: "Cerca automazione…", aut_all: "Tutte", aut_none: "Nessun risultato",
    aut_err: "Manifest non trovato — generalo con tools/genera_vista_automazioni.py",
    aut_updated: "elenco aggiornato", aut_count: "automazioni", aut_count_1: "automazione", never: "mai",
    ago_now: "ora", ago_min: "min fa", ago_h: "h fa", ago_d: "g fa",
    aut_disabled_only: "Solo disattivate",
    grp_active: "attivi", repeat: "Ripeti", skipped_n: "saltati", skipped_n_1: "saltato", left: "rimasti", missed_n: "mancati", missed_n_1: "mancato",
    snz_all: "tutto", snz_nc: "non critici", snz_prio: "priorità", snz_transport: "transport", snz_for: "per",
    snz_choose: "scegli cosa e per quanto", cu_title: "Mentre le notifiche erano in pausa", cu_held: "{n} trattenute", cu_part: "{n} solo su alcuni canali", cu_ok: "OK", cu_list: "Mostrale", cu_from: "dalle", cu_to: "alle", snz_title: "Metti in pausa le notifiche", snz_what: "Cosa", snz_nc_l: "Non critiche",
    snz_all_l: "Tutto", snz_ch: "Un canale", snz_pr: "Una priorità", snz_who: "Per chi", snz_everyone: "Tutti",
    snz_me: "Solo io", snz_len: "Per quanto", snz_forever: "Finché non riprendo", snz_go: "Metti in pausa", snz_close: "Chiudi",
    rs_hand: "a mano", rs_voice: "a voce", rs_assist: "dall'assistente",
    snz_voice_info: "Le tue pause passano dai comandi vocali di SuperNotify: valgono solo per te.",
    snz_voice_off: "I comandi vocali di SuperNotify sono spenti: accendili nelle opzioni dell'integrazione.",
    snz_resume_mine: "Riprendi le mie",
    go_open: "Mostra",
    dl_probe: "Prova questo canale", probe_msg: "Prova del canale dalla dashboard",
    sc_why: "Perché", sc_yes: "Attivo adesso", sc_no: "Non attivo adesso", sc_manual_why: "Scenario manuale: si attiva a mano",
    sc_no_cond: "Nessuna condizione", sc_off_sw: "Spento con l'interruttore", sc_not_eval: "non valutata", sc_now: "ora",
    sc_diff_btn_on: "Cosa cambia se si attiva", sc_diff_btn_off: "Cosa cambia senza",
    sc_diff_on: "Se si attivasse, per una notifica media adesso:", sc_diff_off: "Senza questo scenario, per una notifica media adesso:",
    sc_diff_add: "partirebbe anche", sc_diff_rem: "non partirebbe più", sc_diff_none: "nessuna differenza",
    c_state: "{e} è {s}", c_template: "condizione con modello", c_time: "orario", c_after: "dopo le", c_before: "prima delle",
    c_numeric: "{e}", c_above: "sopra", c_below: "sotto", c_and: "tutte vere", c_or: "almeno una vera", c_not: "nessuna vera",
    c_or_join: " o ", sc_muted: "muto", sc_vol: "vol", sc_opts: "altre opzioni: {k}", sc_tgt: "altri destinatari",
    sc_by: "{d}: la spegne {s} (vince lo spegnimento)", sc_chan_off: "{d}: il canale è spento",
    sc_eff_off: "spegne {d}", sc_eff_on: "usa {d}", sc_when: "Quando", sim_hint_dry: "Risposta vera di SuperNotify (prova senza inviare, non parte niente): una notifica adesso, con la priorità e solo gli scenari scelti sopra.",
    sim_msg: "Prova dal simulatore", sim_prio: "Priorità",
    sa_snooze: "{what} in pausa per {len}.", sa_silence: "{what} in silenzio fino a nuovo ordine.",
    sa_resume: "{what} di nuovo attive.", sa_resume_one: "Pausa finita: {x}.", sa_resume_all: "Notifiche di nuovo attive.",
    sa_w_nc: "Le notifiche non critiche", sa_w_all: "Tutte le notifiche", sa_w_ch: "Il canale {x}",
    sa_w_pr: "Le notifiche a priorità {x}", sa_w_mine: "Le tue notifiche", sa_for: "per {x}",
    sa_min: "{n} minuti", sa_hour: "un'ora", sa_hours: "{n} ore",
    occ_title: "Chi è in casa", occ_home_l: "In casa", occ_ALL_HOME: "Tutti in casa", occ_ALL_AWAY: "Tutti fuori",
    occ_LONE_HOME: "Uno solo in casa", occ_MULTI_HOME: "Alcuni in casa", occ_UNDEFINED_OCCUPANTS: "Nessuno da seguire",
    h_repairs: "riparazioni di SuperNotify", h_repairs_1: "riparazione di SuperNotify",
    det_more: "Tutti gli attributi", det_yes: "sì", det_no: "no", det_action: "Azione", det_target: "Destinatari fissi",
    det_target_req: "Serve un destinatario", det_target_use: "Uso dei destinatari", det_inclusion: "Si usa", det_prio: "Priorità",
    det_occ: "Chi deve essere in casa", det_transport: "Transport", det_data: "Dati", det_debug: "Debug",
    det_err_last: "Ultimo errore", det_err_in: "In", det_err_n: "Errori dall'avvio", det_select: "Selezione",
    adv_html: "Testo per l'email (HTML)", adv_clip: "Video da un indirizzo", adv_actions: "Pulsanti sulla notifica",
    adv_act_id: "id azione", adv_act_title: "testo del pulsante", adv_act_add: "+ pulsante", adv_groups: "Gruppi di pulsanti (virgola)",
    adv_dc: "Impostazioni di un canale per questa notifica", adv_dc_ph: "chiave: valore, uno per riga", adv_dc_add: "+ canale",
    snz_active: "In pausa adesso", snz_resume: "Riprendi", snz_resume_all: "Riprendi tutto", snz_until_resumed: "finché non riprendi",
    snz_done: "In pausa", snz_resumed: "Ripreso",
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
  else if (tt === "TAG") what = "🏷️ " + (fname(tg) || tg); // 0.80.0: a paused entity by name
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
        if (start - now > 300000) start.setDate(start.getDate() - 1); // 0.80.0: clock skew
      }
      end = new Date(start);
      end.setHours(u[0], u[1], u[2], 0);
      if (a ? end <= start : end < now) end.setDate(end.getDate() + 1);
    }
    if (end > now) out.push({ ...s, _end: end });
  }
  return out;
}

/* ── 0.64.0 shared helpers: one copy of what every card used to carry ── */
/** Text for innerHTML and attribute values. */
function snEsc(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The "supernotify-<kind>-card vX" footer of `show_version: true`. */
function snVer(config, kind, p) {
  if (!config || !config.show_version) return "";
  return `<div class="ver" style="text-align:right;font-size:10px;color:${p.muted};margin-top:8px">supernotify-${kind}-card v${SN_CARD_VERSIONS[kind]}</div>`;
}

/** Active scenarios from the binary_sensors (with snScenarioActive), null when not exposed. */
function snActiveScenarioIds(hass) {
  if (!hass) return null;
  // 0.66.0: SuperNotify's own answer first - from 2.12.1 the binary_sensors stay "unknown" unless
  // scenario_control.refresh is on
  snActiveEnsure(hass);
  if (snActive.names) {
    return [...snActive.names].filter((n) => {
      const sw = hass.states[`switch.supernotify_scenario_${n}`];
      return !sw || sw.state !== "off";
    }).map((n) => `binary_sensor.supernotify_scenario_${n}`);
  }
  const ids = Object.keys(hass.states).filter((e) => e.startsWith("binary_sensor.supernotify_scenario_"));
  if (!ids.length) return null;
  const known = ids.filter((e) => !["unknown", "unavailable"].includes(hass.states[e].state));
  if (!known.length) return null; // scenario state not exposed yet
  return known.filter((e) => snScenarioActive(hass, e));
}

/** Channels of a notification: delivered / failed (readable names) and how many were skipped. */
function snLastDeliveries(hass, n) {
  const ok = [], err = [];
  let skipped = 0;
  if (n && n.deliveries && typeof n.deliveries === "object") {
    for (const [name, d] of Object.entries(n.deliveries)) {
      const isOk = d && Array.isArray(d.success) && d.success.length;
      const isErr = d && Array.isArray(d.error) && d.error.length;
      if (!isOk && !isErr) { skipped++; continue; }
      (isErr ? err : ok).push(snDeliveryAlias(hass, name) || name);
    }
  }
  return { ok, err, skipped };
}

function snPrioColor(p, prio) {
  return { critical: p.crit, high: p.warn, medium: p.brandD, low: p.muted, minimum: p.muted }[prio];
}

/**
 * Base of every card (0.64.0). The hass setter, palette, state read, more-info dialog and the
 * default grid size were the same in each card. A card says what to do with a new hass in
 * _onHass(hass, fresh, changed, first): fresh = (re)draw from scratch, changed = something it
 * read before changed (only with `static snTracked = true`, the default), first = first hass.
 */
class SnCard extends HTMLElement {
  set hass(hass) {
    const first = !this._hass;
    snCardRegister(this);
    snDash.hass = hass;
    let changed = true;
    if (this.constructor.snTracked !== false) {
      const raw = hass;
      const tr = this._snTr || (this._snTr = snTracker());
      changed = snChanged(tr, raw);
      hass = snTrackedHass(raw, tr);
      queueMicrotask(() => snSnap(tr, raw)); // after this setter and its synchronous reads
    }
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    // native controls (time pickers, selects, scrollbars) follow the HA theme too
    this.style.colorScheme = this._dark ? "dark" : "light";
    this._onHass(hass, !this._rendered || wasDark !== this._dark, changed, first);
    snA11yInit(this);
  }

  _onHass(hass, fresh, changed) {
    if (fresh) this._render();
    else if (changed) this._update();
  }

  _palette() {
    return snPalette(this._dark, this._config && this._config.style);
  }

  _st(id) {
    const s = this._hass && this._hass.states[id];
    return s ? s.state : undefined;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }
}

/* ── 0.68.0: phone and accessibility, for every card ──
 * The cards draw with innerHTML and attach onclick to plain divs and spans. After every draw
 * (a MutationObserver on the shadow root, delivered once the drawing code has finished)
 * snA11yScan gives each tappable element that is not a native control: tabindex 0, role
 * button and a name (its title when it has no text); Enter and Space then click it. Switches
 * get the name of their row, toasts and results are announced (aria-live). SN_A11Y_CSS adds a
 * visible focus ring, 48 px rows / 40 px buttons on touch screens (pointer: coarse) and no
 * animations when the system asks for reduced motion.
 */
const SN_A11Y_CSS = `
  [data-sn-a11y]:focus-visible, button:focus-visible, select:focus-visible, input:focus-visible,
  textarea:focus-visible, a:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; border-radius: 6px; }
  .sw:has(input:focus-visible) { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; border-radius: 12px; }
  @media (pointer: coarse) {
    [data-sn-a11y="row"] { min-height: 48px; box-sizing: border-box; }
    [data-sn-a11y="tap"], button { min-height: 40px; }
    [data-sn-a11y="tap"].chip, [data-sn-a11y="tap"].go { display: inline-flex; align-items: center; }
    .sw input { position: absolute; inset: -13px -4px; width: auto; height: auto; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  }
`;
const SN_A11Y_NATIVE = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION|HA-CARD)$/;
const SN_A11Y_TAP = ".chip, .who";
const SN_A11Y_LIVE = ".toast, .res, .dres, .err";
const SN_A11Y_ROWTAG = /^(DIV|LI|TR|SECTION|ARTICLE)$/;

function snA11yText(el) {
  return (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function snA11yScan(root) {
  if (!root) return;
  if (!root.querySelector("style[data-sn-a11y-css]")) {
    const st = document.createElement("style");
    st.setAttribute("data-sn-a11y-css", "");
    st.textContent = SN_A11Y_CSS;
    root.appendChild(st);
  }
  const tap = new Set(root.querySelectorAll(SN_A11Y_TAP));
  root.querySelectorAll("*").forEach((el) => {
    if (el.hasAttribute("data-sn-a11y")) return;
    const tag = el.tagName;
    if (!(el.onclick || tap.has(el))) return;
    if (SN_A11Y_NATIVE.test(tag) || (tag.includes("-") && tag !== "HA-ICON")) return;
    el.setAttribute("data-sn-a11y", SN_A11Y_ROWTAG.test(tag) && !el.classList.contains("chip") ? "row" : "tap");
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    if (!el.hasAttribute("aria-label") && !snA11yText(el)) {
      const name = el.getAttribute("title") || el.dataset.label || el.getAttribute("icon") || "";
      if (name) el.setAttribute("aria-label", name);
    }
  });
  // icon-only native buttons: their title is their name
  root.querySelectorAll("button:not([aria-label])").forEach((b) => {
    if (!snA11yText(b) && b.title) b.setAttribute("aria-label", b.title);
  });
  // a switch says what it switches: the text of its row
  root.querySelectorAll('input[type="checkbox"]:not([aria-label])').forEach((i) => {
    if (i.id && root.querySelector(`label[for="${i.id}"]`)) return;
    const own = i.closest("label");
    if (own && snA11yText(own)) return;
    const row = i.closest("[data-e], [data-id], [data-n], [data-sn-a11y], .row, .it, .tile, li");
    const name = i.title || (row && snA11yText(row));
    if (name) i.setAttribute("aria-label", name);
  });
  root.querySelectorAll(SN_A11Y_LIVE).forEach((el) => {
    if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
  });
}

function snA11yInit(card) {
  const root = card.shadowRoot;
  if (!root || card._snA11y) return;
  card._snA11y = true;
  snA11yScan(root);
  if (typeof MutationObserver !== "undefined") {
    new MutationObserver(() => snA11yScan(root)).observe(root, { childList: true, subtree: true });
  }
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute("data-sn-a11y") || e.defaultPrevented) return;
    e.preventDefault();
    t.click();
  });
}

/* ── 0.65.0: the cards on the page know each other ── */
const snCards = new Set();
function snCardRegister(card) {
  if (snCards.has(card)) return;
  snCards.add(card);
  // the others may now show a link to this one
  setTimeout(() => window.dispatchEvent(new CustomEvent("supernotify-cards")), 0);
}

/** The first card of that kind on the page (connected), or null. */
function snCardOn(kind, filter) {
  const tag = `supernotify-${kind}-card`.toUpperCase();
  // 0.67.0: a card on another view is only disconnected - it comes back when that view opens
  for (const c of snCards) {
    if (c.isConnected && c.tagName === tag && (!filter || filter(c))) return c;
  }
  return null;
}

/**
 * 0.67.0: which view of this dashboard holds each kind of card, from the dashboard's own
 * configuration (WS lovelace/config), read once per dashboard. Views the user cannot see
 * (`visible:` users) are left out.
 */
const snDash = { key: null, map: null, busy: false, hass: null };
function snDashKey() {
  const seg = String((window.location && window.location.pathname) || "").split("/")[1] || "";
  return seg || "lovelace";
}
function snDashEnsure(hass) {
  if (!hass || !hass.callWS) return;
  const key = snDashKey();
  if (snDash.busy || (snDash.key === key && snDash.map)) return;
  snDash.busy = true;
  snDash.key = key;
  const uid = hass.user && hass.user.id;
  snWS(hass, { type: "lovelace/config", url_path: key === "lovelace" ? null : key }).then((cfg) => {
    // 0.71.0: a strategy dashboard stores only {strategy: ...}; build its views the same way HA does
    const strat = cfg && !cfg.views && cfg.strategy;
    const m0 = strat && typeof strat.type === "string" && strat.type.match(/^custom:(.+)$/);
    const gen = m0 && customElements.get(`ll-strategy-dashboard-${m0[1]}`);
    return gen && gen.generate ? gen.generate(strat, hass) : cfg;
  }).then((cfg) => {
    const map = {};
    const walk = (o, path) => {
      if (Array.isArray(o)) { o.forEach((x) => walk(x, path)); return; }
      if (!o || typeof o !== "object") return;
      const m = typeof o.type === "string" && o.type.match(/^custom:supernotify-(\w+)-card$/);
      if (m && !(m[1] in map)) map[m[1]] = path;
      for (const k of ["cards", "sections", "card", "elements"]) if (o[k]) walk(o[k], path);
    };
    ((cfg && cfg.views) || []).forEach((v, i) => {
      if (Array.isArray(v.visible) && uid && !v.visible.some((x) => x && x.user === uid)) return;
      walk([...(v.sections || []), ...(v.cards || [])], v.path || String(i));
    });
    snDash.map = map;
    window.dispatchEvent(new CustomEvent("supernotify-cards"));
  }).catch(() => { snDash.map = {}; }).finally(() => { snDash.busy = false; });
}

/** A card of that kind on this page or on another view of the dashboard. */
function snCardReach(kind) {
  if (snCardOn(kind)) return true;
  snDashEnsure(snDash.hass); // read only when a link might be needed
  return !!(snDash.map && snDash.key === snDashKey() && snDash.map[kind]);
}

/** Bring a card into view and let it show what was asked (its _focus) - on another view too. */
function snGo(kind, detail) {
  const show = (c) => {
    if (c._focus) c._focus(detail || {});
    c.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const c = snCardOn(kind);
  if (c) { show(c); return true; }
  const path = snDash.map && snDash.key === snDashKey() && snDash.map[kind];
  if (!path) return false;
  snNavigate(`/${snDash.key}/${path}`);
  // the view draws its cards after the navigation: wait for this one (at most 8 s)
  let n = 0;
  const t = setInterval(() => {
    const d = snCardOn(kind);
    if (d && d._rendered) { clearInterval(t); setTimeout(() => show(d), 150); }
    else if (++n > 40) clearInterval(t);
  }, 200);
  return true;
}

/** Outline the rows a link pointed at, for a moment. */
function snFlash(card, selector) {
  const root = card.shadowRoot;
  if (!root) return;
  const rows = [...root.querySelectorAll(selector)];
  const p = card._palette();
  rows.forEach((r) => { r.style.outline = `2px solid ${p.brand}`; r.style.outlineOffset = "-2px"; r.style.borderRadius = "10px"; });
  if (rows[0] && rows[0].scrollIntoView) setTimeout(() => rows[0].scrollIntoView({ behavior: "smooth", block: "center" }), 250);
  setTimeout(() => rows.forEach((r) => { r.style.outline = ""; }), 2600);
}

/**
 * Dashboard strategy (0.71.0): `strategy: {type: custom:supernotify}` builds the whole dashboard
 * from what SuperNotify has in this installation, for the user who opens it.
 *   title   - dashboard title (default "SuperNotify")
 *   views   - which views and in what order: home, send, setup, stats, tools (tools: admins only)
 *   hide    - card kinds to leave out, e.g. [automations, simulator]
 *   cards   - extra configuration per card kind, merged over the suggested one,
 *             e.g. {control: {tiles: [dnd, snooze]}, archive: {limit: 30}}
 */
const SN_STRATEGY_VIEWS = {
  home: { icon: "mdi:bell", cols: 2, sections: [["control"], ["overview", "archive"]] },
  send: { icon: "mdi:send", cols: 2, sections: [["composer"], ["why", "simulator"]] },
  setup: { icon: "mdi:tune-variant", cols: 3,
    sections: [["deliveries", "transports"], ["scenarios", "recipients"], ["bands", "automations"]] },
  stats: { icon: "mdi:chart-bar", cols: 1, sections: [["stats"]] },
  tools: { icon: "mdi:toolbox-outline", cols: 1, sections: [["tools"]], admin: true },
};
const SN_STRATEGY_TITLES = {
  en: { home: "Home", send: "Send", setup: "Setup", stats: "Stats", tools: "Tools", title: "SuperNotify" },
  it: { home: "Casa", send: "Invia", setup: "Configurazione", stats: "Statistiche", tools: "Strumenti", title: "SuperNotify" },
};

class SupernotifyDashboardStrategy extends HTMLElement {
  static async generate(config, hass) {
    const cfg = config || {};
    const st = (hass && hass.states) || {};
    const lang = String((hass && (hass.locale && hass.locale.language || hass.language)) || "en").slice(0, 2);
    const T = SN_STRATEGY_TITLES[lang] || SN_STRATEGY_TITLES.en;
    const admin = !hass || !hass.user || hass.user.is_admin !== false;
    const hide = new Set((cfg.hide || []).map(String));
    const extra = cfg.cards || {};
    const has = (re) => Object.keys(st).some((id) => re.test(id));
    let manifest = false;
    if (!hide.has("automations")) {
      const url = (extra.automations && extra.automations.manifest_url) || "/local/supernotify/automations.json";
      try { manifest = !!(await window.fetch(url, { method: "HEAD", cache: "no-store" })).ok; } catch (e) { manifest = false; }
    }
    const wanted = {
      transports: has(/^(switch|binary_sensor)\.supernotify_transport_/),
      scenarios: has(/^(switch|binary_sensor)\.supernotify_scenario_/),
      recipients: has(/^(switch|binary_sensor)\.supernotify_recipient_/) || has(/^notify\.recipient_/),
      automations: manifest,
    };
    const card = (kind) => {
      if (hide.has(kind) || wanted[kind] === false) return null;
      const cls = customElements.get(`supernotify-${kind}-card`);
      if (!cls) return null;
      let stub = {};
      try { stub = (cls.getStubConfig && cls.getStubConfig(hass)) || {}; } catch (e) { stub = {}; }
      if (kind === "bands" && !(extra.bands && extra.bands.bands) && !Object.keys(stub.bands || {}).length) return null;
      return { type: `custom:supernotify-${kind}-card`, ...stub, ...(extra[kind] || {}) };
    };
    const order = (Array.isArray(cfg.views) && cfg.views.length ? cfg.views : Object.keys(SN_STRATEGY_VIEWS)).map(String);
    const views = [];
    for (const key of order) {
      const v = SN_STRATEGY_VIEWS[key];
      if (!v || (v.admin && !admin)) continue;
      const sections = v.sections
        .map((kinds) => kinds.map(card).filter(Boolean))
        .filter((cards) => cards.length)
        .map((cards) => ({ type: "grid", cards }));
      if (!sections.length) continue;
      // 0.73.2: no icon, so the tabs show the view names; one section = the full width
      if (sections.length === 1) sections[0].column_span = 2;
      const view = { title: T[key], path: key, type: "sections",
        max_columns: sections.length === 1 ? 2 : Math.min(v.cols, sections.length), sections };
      // 0.72.0: SuperNotify's health as a badge on top of Home
      if (key === "home" && !hide.has("badge")) view.badges = [{ type: "custom:supernotify-status-badge", ...(extra.badge || {}) }];
      views.push(view);
    }
    return { title: cfg.title || T.title, views };
  }
}
if (!customElements.get("ll-strategy-dashboard-supernotify")) {
  customElements.define("ll-strategy-dashboard-supernotify", SupernotifyDashboardStrategy);
}
window.customStrategies = window.customStrategies || [];
if (!window.customStrategies.some((x) => x && x.type === "supernotify")) {
  window.customStrategies.push({
    type: "supernotify",
    strategyType: "dashboard",
    name: "SuperNotify",
    description: "Every SuperNotify card, in views built from what your installation has.",
    documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/dashboard.md",
  });
}

/**
 * 0.72.0: SuperNotify inside Home Assistant's own cards. Shared by the badge and the tile features.
 */
const SN_NATIVE_STR = {
  en: { all_good: "All good", paused: "Paused", until: "until", resume: "Resume", test: "Send a test",
    sure: "Tap again to send", sent: "Sent", last: "Last", none: "No notification yet", ago: "ago",
    min: "min", h: "h", err: "transports with errors", off: "channels off" },
  it: { all_good: "Tutto ok", paused: "In pausa", until: "fino alle", resume: "Riprendi", test: "Manda una prova",
    sure: "Tocca di nuovo per inviare", sent: "Inviata", last: "Ultima", none: "Nessuna notifica ancora", ago: "fa",
    min: "min", h: "h", err: "transport con errori", off: "canali spenti" },
};
function snNativeT(hass) {
  const l = String((hass && (hass.locale && hass.locale.language || hass.language)) || "en").slice(0, 2);
  return SN_NATIVE_STR[l] || SN_NATIVE_STR.en;
}
/** The entity a card feature is on: new API (context.entity_id) or old (stateObj). */
function snFeatureEntity(el) {
  return (el.context && el.context.entity_id) || (el.stateObj && el.stateObj.entity_id) || "";
}
/** customCardFeatures.supported: (stateObj) on older HA, (hass, context) on newer. */
function snFeatureSupports(test) {
  return (a, b) => {
    const id = (b && b.entity_id) || (a && a.entity_id) || "";
    return test(String(id));
  };
}
const SN_CU_KEY = "supernotify-catchup-seen"; // 0.76.0: last OK on "while you were paused"
/** 0.74.0: supernotify.snooze exists (SuperNotify after 2.12.1-beta2): open to any user. */
function snHasSnoozeAction(hass) {
  const svc = hass && hass.services && hass.services.supernotify;
  return !!(svc && svc.snooze);
}
/** supernotify.snooze: command snooze | silence | resume, scope, name, person, minutes. */
async function snSnoozeCall(hass, data) {
  const d = { reason: "Dashboard" };
  for (const [k, v] of Object.entries(data || {})) if (v !== undefined && v !== null && v !== "") d[k] = v;
  if (d.command === "resume") delete d.reason;
  const svc = (hass.services && hass.services.supernotify) || {};
  let service = "snooze";
  // 0.75.1: SuperNotify 2.13.0 has three actions - snooze (minutes), silence, unsnooze - and no `command`
  if (svc.unsnooze) {
    service = d.command === "resume" ? "unsnooze" : d.command === "silence" ? "silence" : "snooze";
    delete d.command;
    if (service !== "snooze") delete d.minutes;
  }
  return hass.callWS({ type: "call_service", domain: "supernotify", service, service_data: d, return_response: true });
}
/**
 * 0.80.0: what "pause this notification" can name an archived notification by - the entities
 * in its data (`entity_id`) and its camera. SuperNotify's tag snooze matches a notification on
 * these (Notification.snooze_tags), so a pause on the entity holds back every notification about it.
 */
function snPauseSubjects(doc) {
  if (!doc) return [];
  const ed = snIsObj(doc.extra_data) ? doc.extra_data : {};
  const raw = ed.entity_id;
  const ids = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(String);
  const cam = snIsObj(doc.media) ? doc.media.camera_entity_id : null;
  if (cam) ids.push(String(cam));
  return [...new Set(ids.map((x) => x.trim()).filter((x) => /^[a-z0-9_]+\.[a-z0-9_]+$/i.test(x)))];
}
/**
 * 0.81.0: the automations and scripts that sent an archived notification - the logbook entries in
 * its context, as the why card reads them. Cached per notification; [] when unknown.
 */
const SN_SENDERS = new Map();
function snSenders(hass, doc) {
  const ctx = (doc && snIsObj(doc.original_context)) ? doc.original_context : {};
  if (!hass || !hass.callWS || !ctx.id) return Promise.resolve([]);
  if (SN_SENDERS.has(doc.id)) return SN_SENDERS.get(doc.id);
  const t = Date.parse(doc.created || "") || Date.now();
  const p = hass.callWS({ type: "logbook/get_events", start_time: new Date(t - 120000).toISOString(),
    end_time: new Date(t + 5000).toISOString(), context_id: ctx.id })
    .then((ev) => [...new Set((ev || []).map((e) => e.entity_id || "").filter((id) => /^(automation|script)\./.test(id)))])
    .catch(() => []);
  SN_SENDERS.set(doc.id, p);
  return p;
}
/** A name as SuperNotify's spoken_name() has it: case, underscores and extra spaces ignored. */
function snSpoken(name) {
  return String(name || "").replace(/_/g, " ").toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}
/** The active tag pauses on this entity (from enquire_snoozes, see snLiveSnoozes). */
function snPausesOn(snoozes, entityId) {
  const want = snSpoken(entityId);
  return snLiveSnoozes(snoozes || []).filter((s) => String(s.target_type || "").toUpperCase() === "TAG"
    && typeof s.target === "string" && snSpoken(s.target) === want);
}
/** person.* linked to the logged-in user, or null. */
function snMyPerson(hass) {
  const uid = hass && hass.user && hass.user.id;
  if (!uid) return null;
  return Object.keys(hass.states).find((e) => e.startsWith("person.") &&
    (hass.states[e].attributes || {}).user_id === uid) || null;
}
/**
 * 0.74.0: delivery rows that count as "channels off". Once SuperNotify gives its switches the
 * `overridden` attribute, only the ones switched off by hand: a channel off in the YAML is meant
 * to be off. Before that, every channel off. DEFAULT_ ones and `ignore` are left out either way.
 */
function snChannelsOff(hass, rows, ignore) {
  const ign = ignore instanceof Set ? ignore : new Set((ignore || []).map((x) => String(x).toLowerCase()));
  const attrs = (d) => d.a || ((hass.states[d.id] || {}).attributes) || {};
  const known = rows.some((d) => "overridden" in attrs(d));
  return rows.filter((d) => {
    const off = d.state !== undefined ? d.state === "off" : !d.on;
    return off && !/^default_/i.test(d.name) && !ign.has(String(d.name).toLowerCase())
      && (!known || attrs(d).overridden === true);
  });
}
/** 0.75.0: the switch's `overridden` attribute - true/false, or null before SuperNotify had it. */
function snOverridden(a) {
  return a && typeof a.overridden === "boolean" ? a.overridden : null;
}
/** 0.75.0: the "changed by hand" tag for a row, or "" (raw: an HTML span, else plain text). */
function snHandTag(a, T, raw) {
  if (snOverridden(a) !== true) return "";
  return raw ? `<span class="tag" style="border-style:dashed;font-weight:600" title="${snEsc(T.hand_tip)}">✏️ ${snEsc(T.hand)}</span>` : `✏️ ${T.hand}`;
}
/** SuperNotify's health: [{k: crit|off|pause, n, text, title}] worst first, [] = all good. */
function snNativeHealth(hass, snoozes, opts) {
  opts = opts || {};
  const ignore = new Set((opts.ignore || []).map((x) => String(x).toLowerCase()));
  const T = snNativeT(hass);
  const out = [];
  const tr = snEntityRows(hass, "transport").filter((t) => {
    const st = hass.states[t.id];
    return st && st.state !== "unavailable" && +((st.attributes || {}).error_count || 0) > 0;
  });
  if (tr.length) out.push({ k: "crit", n: tr.length, text: `${tr.length} ${T.err}`,
    title: tr.map((t) => (t.a.last_error_message ? `${t.name}: ${t.a.last_error_message}` : t.name)).join(" · ") });
  const off = opts.channels_off === false ? [] : snChannelsOff(hass, snEntityRows(hass, "delivery"), ignore);
  if (off.length) out.push({ k: "off", n: off.length, text: `${off.length} ${T.off}`,
    title: off.map((d) => snDeliveryAlias(hass, d.name) || d.name).join(", ") });
  const live = snLiveSnoozes(snoozes || []);
  if (live.length) {
    const end = live.map((x) => x._end).filter(Boolean).sort((a, b) => b - a)[0];
    const hm = end ? `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}` : "";
    out.push({ k: "pause", n: live.length, text: hm ? `${T.paused} ${T.until} ${hm}` : T.paused,
      title: snSnoozeLabels(hass, live, snT({}, hass), 4) });
  }
  return out;
}
/** Pause for everyone (non-critical) or resume, as the control card does. */
async function snNativePause(hass, minutes) {
  const admin = !(hass.user && hass.user.is_admin === false);
  if (minutes && snHasSnoozeAction(hass)) {
    await snSnoozeCall(hass, { command: "snooze", scope: "noncritical", minutes });
  } else if (minutes) {
    if (admin) await hass.callApi("POST", "events/mobile_app_notification_action", { action: `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_${minutes}` });
    else {
      const it = String(hass.language || "en").startsWith("it");
      await hass.callWS({ type: "conversation/process", language: it ? "it" : "en",
        text: it ? `metti in pausa le mie notifiche per ${minutes} minuti` : `pause my notifications for ${minutes} minutes` });
    }
  } else {
    await hass.callWS({ type: "call_service", domain: "supernotify", service: "clear_snoozes", service_data: {}, return_response: true });
  }
  snEnquireBust(800);
}
const SN_NATIVE_CSS = `:host { display: block; }
  .row { display: flex; gap: 8px; height: var(--feature-height, 42px); align-items: stretch; }
  button { flex: 1 1 0; min-width: 0; border: 0; cursor: pointer; font: inherit; font-size: 13px; font-weight: 600;
    border-radius: var(--feature-border-radius, 12px); padding: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.15)); }
  button.on { background: var(--state-icon-color, var(--primary-color)); color: var(--text-primary-color, #fff); }
  button.arm { background: var(--warning-color, #e3a008); color: #fff; }
  button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .txt { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--secondary-text-color);
    height: var(--feature-height, 42px); overflow: hidden; white-space: nowrap; }
  .txt b { color: var(--primary-text-color); font-weight: 600; overflow: hidden; text-overflow: ellipsis; }`;

/** Badge: SuperNotify's health in one pill, for any view. */
class SupernotifyStatusBadge extends HTMLElement {
  setConfig(config) { this._config = { ...(config || {}) }; }
  set hass(hass) {
    this._hass = hass;
    const now = Date.now();
    if (!this._at || now - this._at > 60000) {
      this._at = now;
      snEnquire(hass, "enquire_snoozes").then((r) => { this._snz = ((r && r.response) || {}).snoozes || []; this._draw(); }).catch(() => {});
    }
    this._draw();
  }
  connectedCallback() {
    this._onRefresh = this._onRefresh || (() => { this._at = 0; if (this._hass) this.hass = this._hass; });
    window.addEventListener("supernotify-refresh", this._onRefresh);
  }
  disconnectedCallback() { window.removeEventListener("supernotify-refresh", this._onRefresh); }
  _draw() {
    if (!this._hass) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const T = snNativeT(this._hass);
    const h = snNativeHealth(this._hass, this._snz, this._config);
    const top = h[0];
    const icon = !top ? "mdi:bell-check" : top.k === "crit" ? "mdi:bell-alert" : top.k === "off" ? "mdi:bell-off" : "mdi:bell-sleep";
    const color = !top ? "var(--success-color, #43a047)" : top.k === "crit" ? "var(--error-color, #db4437)"
      : top.k === "off" ? "var(--secondary-text-color, #727272)" : "var(--info-color, #039be5)";
    const text = !top ? T.all_good : top.text + (h.length > 1 ? ` +${h.length - 1}` : "");
    const title = h.length ? h.map((x) => `${x.text}${x.title ? ": " + x.title : ""}`).join("\n") : T.all_good;
    const key = icon + text + title;
    if (key === this._key) return;
    this._key = key;
    const label = this._config.name || "SuperNotify";
    this.shadowRoot.innerHTML = `<style>
      :host { display: inline-block; }
      .b { display: inline-flex; align-items: center; gap: 8px; height: var(--ha-badge-size, 36px); box-sizing: border-box;
        padding: 0 12px 0 8px; border-radius: var(--ha-badge-border-radius, 18px); cursor: pointer;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
        -webkit-backdrop-filter: var(--ha-card-backdrop-filter, none); backdrop-filter: var(--ha-card-backdrop-filter, none); }
      .b:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
      ha-icon { --mdc-icon-size: 18px; color: ${color}; }
      .i { display: flex; flex-direction: column; line-height: 1.15; }
      .l { font-size: 10px; font-weight: 500; color: var(--secondary-text-color); }
      .c { font-size: 12px; font-weight: 500; color: var(--primary-text-color); white-space: nowrap; }
    </style><div class="b" role="button" tabindex="0" title="${snEsc(title)}" aria-label="${snEsc(label + ": " + text)}">
      <ha-icon icon="${icon}"></ha-icon><span class="i">${this._config.show_name === false ? "" : `<span class="l">${snEsc(label)}</span>`}
      <span class="c">${snEsc(text)}</span></span></div>`;
    const b = this.shadowRoot.querySelector(".b");
    const go = () => {
      if (this._config.navigation_path) snNavigate(this._config.navigation_path);
      else this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true,
        detail: { entityId: this._config.entity || "sensor.supernotify_notifications" } }));
    };
    b.onclick = go;
    b.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
  }
}
if (!customElements.get("supernotify-status-badge")) customElements.define("supernotify-status-badge", SupernotifyStatusBadge);
window.customBadges = window.customBadges || [];
if (!window.customBadges.some((x) => x && x.type === "supernotify-status-badge")) {
  window.customBadges.push({ type: "supernotify-status-badge", name: "SuperNotify status", preview: true,
    description: "SuperNotify's health in one badge: transports with errors, channels off, pauses, else all good.",
    documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/native.md" });
}

/** Base for the tile features: hass, entity from either feature API, config. */
class SnFeature extends HTMLElement {
  static getStubConfig() { return { type: this.featureType }; }
  setConfig(config) { if (!config) throw new Error("Invalid configuration"); this._config = config; }
  set hass(hass) { this._hass = hass; this._draw(); }
  get hass() { return this._hass; }
  set context(c) { this._context = c; this._draw(); }
  get context() { return this._context; }
  set stateObj(s) { this._stateObj = s; this._draw(); }
  get stateObj() { return this._stateObj; }
  _root() { if (!this.shadowRoot) this.attachShadow({ mode: "open" }); return this.shadowRoot; }
}

/** Tile feature: pause (non-critical, everyone) for 30 min / 1 h / 2 h, Resume while paused. */
class SupernotifyPauseFeature extends SnFeature {
  static get featureType() { return "custom:supernotify-pause"; }
  _draw() {
    const hass = this._hass;
    if (!hass) return;
    const now = Date.now();
    if (!this._at || now - this._at > 60000) {
      this._at = now;
      snEnquire(hass, "enquire_snoozes").then((r) => { this._snz = ((r && r.response) || {}).snoozes || []; this._paint(); }).catch(() => {});
    }
    this._paint();
  }
  _paint() {
    const hass = this._hass;
    if (!hass) return;
    const T = snNativeT(hass);
    const mins = (this._config && this._config.minutes) || [30, 60, 120];
    const live = snLiveSnoozes(this._snz || []);
    const lbl = (m) => (m % 60 === 0 ? `${m / 60} ${T.h}` : `${m} ${T.min}`);
    const html = live.length
      ? `<button class="on" data-m="0">${snEsc(T.resume)} · ${snEsc(snNativeHealth(hass, this._snz).find((x) => x.k === "pause").text)}</button>`
      : mins.map((m) => `<button data-m="${+m}" aria-label="${snEsc(T.paused + " " + lbl(+m))}">${snEsc(lbl(+m))}</button>`).join("");
    if (html === this._html) return;
    this._html = html;
    const root = this._root();
    root.innerHTML = `<style>${SN_NATIVE_CSS}</style><div class="row">${html}</div>`;
    root.querySelectorAll("button").forEach((b) => {
      b.onclick = async (e) => {
        e.stopPropagation();
        b.disabled = true;
        try { await snNativePause(hass, +b.dataset.m); } catch (err) { b.textContent = "✖"; }
        this._at = 0;
        setTimeout(() => this._draw(), 900);
      };
    });
  }
}

/** Tile feature on notify.recipient_<name>: a test through the whole pipeline, two taps. */
class SupernotifyTestFeature extends SnFeature {
  static get featureType() { return "custom:supernotify-test"; }
  _draw() {
    const hass = this._hass;
    const id = snFeatureEntity(this);
    if (!hass || !id) return;
    const T = snNativeT(hass);
    const txt = this._state === "sent" ? `✔ ${T.sent}` : this._state === "arm" ? T.sure : T.test;
    const html = `<button class="${this._state === "arm" ? "arm" : ""}">${snEsc(txt)}</button>`;
    if (html === this._html) return;
    this._html = html;
    const root = this._root();
    root.innerHTML = `<style>${SN_NATIVE_CSS}</style><div class="row">${html}</div>`;
    root.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      clearTimeout(this._t);
      if (this._state !== "arm") {
        this._state = "arm";
        this._t = setTimeout(() => { this._state = null; this._draw(); }, 4000);
        this._draw();
        return;
      }
      const T2 = snT({}, hass);
      const d = new Date();
      hass.callService("notify", "send_message", { entity_id: id, title: T2.rc_test_title,
        message: `${T2.rc_test_msg} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` })
        .then(() => { this._state = "sent"; this._draw(); this._t = setTimeout(() => { this._state = null; this._draw(); }, 4000); })
        .catch(() => { this._state = null; this._draw(); });
      snEnquireBust(1500);
    };
  }
}

/** Tile feature on the counter: title and age of the last notification. */
class SupernotifyLastFeature extends SnFeature {
  static get featureType() { return "custom:supernotify-last"; }
  _draw() {
    const hass = this._hass;
    if (!hass) return;
    const cnt = hass.states["sensor.supernotify_notifications"];
    const mark = cnt ? cnt.last_changed : "";
    if (mark !== this._mark || !this._at || Date.now() - this._at > 60000) {
      this._mark = mark;
      this._at = Date.now();
      snEnquire(hass, "enquire_last_notification").then((r) => { this._last = (r && r.response) || null; this._paint(); }).catch(() => {});
    }
    this._paint();
  }
  _paint() {
    const hass = this._hass;
    if (!hass) return;
    const T = snNativeT(hass);
    const n = this._last && Object.keys(this._last).length ? this._last : null;
    let html;
    if (!n) html = `<span>${snEsc(T.none)}</span>`;
    else {
      const title = snNotifTitle(n) || String(n.message || "").slice(0, 80);
      const t = n.created ? new Date(n.created) : null;
      const m = t && !isNaN(t) ? Math.max(0, Math.round((Date.now() - t) / 60000)) : null;
      const age = m == null ? "" : m < 60 ? `${m} ${T.min} ${T.ago}` : `${Math.round(m / 60)} ${T.h} ${T.ago}`;
      html = `<span>${snEsc(T.last)}:</span> <b>${snEsc(title)}</b>${age ? ` <span>· ${snEsc(age)}</span>` : ""}`;
    }
    if (html === this._html) return;
    this._html = html;
    const root = this._root();
    root.innerHTML = `<style>${SN_NATIVE_CSS}</style><div class="txt">${html}</div>`;
  }
}

for (const [tag, cls] of [["supernotify-pause", SupernotifyPauseFeature], ["supernotify-test", SupernotifyTestFeature],
  ["supernotify-last", SupernotifyLastFeature]]) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
}
window.customCardFeatures = window.customCardFeatures || [];
for (const x of [
  { type: "supernotify-pause", name: "SuperNotify pause", supported: snFeatureSupports((id) => id === "sensor.supernotify_notifications"), configurable: false },
  { type: "supernotify-last", name: "SuperNotify last notification", supported: snFeatureSupports((id) => id === "sensor.supernotify_notifications"), configurable: false },
  { type: "supernotify-test", name: "SuperNotify test", supported: snFeatureSupports((id) => /^notify\.recipient_/.test(id)), configurable: false },
]) {
  if (!window.customCardFeatures.some((y) => y && y.type === x.type)) window.customCardFeatures.push(x);
}

function snDryCss(p) {
  return `.dryBox { margin-top: 14px; border: 1.5px solid ${p.line}; border-radius: 12px;
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
        .dryBox pre { white-space: pre-wrap; font-size: 11px; max-height: 240px; overflow: auto; }`;
}

// The notification as SuperNotify would send it (dry run response, archive format) - composer, simulator.
function snDryHtml(hass, T, doc, noDupeCheck) {
  const esc = snEsc;
  const n = snIsObj(doc) && (doc.deliveries || doc.outcome || doc.id) ? snArchiveDetail(doc) : null;
  if (!n) return `<h4>🔍 ${T.dry_title}</h4><div class="dNo">${T.dry_empty}</div>`;
  const st = hass.states;
  const chan = (name) => {
    const alias = snDeliveryAlias(hass, name);
    return alias && !snSame(alias, name) ? `${esc(alias)} <span class="dNo">${snTech(name, alias)}</span>` : esc(alias || name);
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
  if (scen.length) meta.push(`${T.dry_scen}: ${esc(scen.map((x) => snScenarioName(hass, x)).join(", "))}`);
  if (n.occ && n.occ.home && n.occ.home.length)
    meta.push(`${T.dry_home}: ${esc(n.occ.home.map((p) => (st[p] && st[p].attributes.friendly_name) || short(p)).join(", "))}`);
  h += `<div class="dMeta">${meta.join(" · ")}</div>`;
  if (noDupeCheck) h += `<div class="dMeta">ℹ️ ${T.dry_no_dupe}</div>`;
  h += `<details class="dMeta"><summary>${T.dry_raw}</summary><pre>${esc(JSON.stringify(doc, null, 2))}</pre></details>`;
  return h;
}

/* ── 0.66.0: dry runs from any card ── */
function snDryAvailable(hass, config) {
  if (config && config.dry_run === false) return false;
  const svc = hass && hass.services && hass.services.supernotify;
  return !!(svc && svc.notify && svc.notify.response);
}

/** supernotify.notify with dry_run: simulate (nothing is sent, no duplicate check) -> the notification. */
async function snDryRun(hass, data) {
  const r = await hass.callWS({ type: "call_service", domain: "supernotify", service: "notify",
    service_data: { priority: "medium", ...data, dry_run: "simulate", force_resend: true }, return_response: true });
  return (r && r.response) || {};
}

/** Channels a dry run would send through. */
function snDrySending(doc) {
  const out = new Set();
  for (const [name, res] of Object.entries((doc && doc.deliveries) || {})) {
    if (res && Array.isArray(res.success) && res.success.length) out.add(name);
  }
  return out;
}

/** One condition of a scenario, in words. */
function snCondText(hass, c, T) {
  if (!c || typeof c !== "object") return String(c);
  const name = (id) => (hass.states[id] && hass.states[id].attributes && hass.states[id].attributes.friendly_name) || String(id);
  const ents = [].concat(c.entity_id || []).map(name).join(", ");
  const t = c.condition;
  if (t === "state") return T.c_state.replace("{e}", ents).replace("{s}", [].concat(c.state).join(T.c_or_join));
  if (t === "numeric_state") return [T.c_numeric.replace("{e}", ents), c.above != null ? `${T.c_above} ${c.above}` : "", c.below != null ? `${T.c_below} ${c.below}` : ""].filter(Boolean).join(" ");
  // 0.78.0: after/before can be an input_datetime or a time sensor - its name, not the entity id
  const hm = (v) => (/^(input_datetime|sensor)\./.test(String(v)) ? name(v) : String(v).replace(/^(\d{1,2}:\d{2}):00$/, "$1"));
  if (t === "time") return [T.c_time, c.after ? `${T.c_after} ${hm(c.after)}` : "", c.before ? `${T.c_before} ${hm(c.before)}` : "", c.weekday ? [].concat(c.weekday).join(", ") : ""].filter(Boolean).join(" ");
  if (t === "template") return T.c_template;
  if (t === "and" || t === "or" || t === "not") return T["c_" + t];
  return String(t || "?");
}

/* ── 0.78.0: what a scenario does and why, without a tap ── */

/**
 * A template rendered by Home Assistant (WS render_template, first result, then unsubscribed).
 * Returns the last value (undefined until the first answer) and asks again at most once a minute;
 * onDone runs when a new value arrives so the card can redraw.
 */
const snTplCache = new Map();
function snTpl(hass, tpl, onDone) {
  const k = String(tpl);
  let e = snTplCache.get(k);
  if (!e) { e = { v: undefined, t: 0, busy: false }; snTplCache.set(k, e); }
  const conn = hass && hass.connection;
  if (!e.busy && Date.now() - e.t > 60000 && conn && conn.subscribeMessage) {
    e.busy = true; e.t = Date.now();
    let unsub = null, done = false;
    const finish = (v) => {
      if (done) return;
      done = true; e.busy = false;
      if (unsub) { try { unsub(); } catch (x) { /* already gone */ } }
      if (v !== undefined && v !== e.v) { e.v = v; if (onDone) onDone(); }
    };
    try {
      conn.subscribeMessage((m) => finish(m ? m.result : undefined), { type: "render_template", template: k, strict: false })
        .then((u) => { if (done) { try { u(); } catch (x) { /* gone */ } } else unsub = u; })
        .catch(() => finish(undefined));
    } catch (x) { finish(undefined); }
    setTimeout(() => finish(undefined), 10000);
  }
  return e.v;
}

/** enquire_active_scenarios with trace: true, shared by the cards: one read every 30 s. */
const snTrace = { map: null, t: 0, busy: false, v: 0 };
function snTraceEnsure(hass, onDone) {
  if (!hass || !hass.callWS || snTrace.busy || Date.now() - snTrace.t < 30000) return snTrace.map;
  const svc = hass.services && hass.services.supernotify;
  if (svc && !svc.enquire_active_scenarios) return snTrace.map;
  snTrace.busy = true; snTrace.t = Date.now();
  snEnquire(hass, "enquire_active_scenarios", { trace: true }).then((r) => {
    const t = (r && r.response && r.response.trace) || [];
    const map = {};
    for (const list of [t[0] || [], t[1] || []]) for (const sc of list) if (sc && sc.name) map[sc.name] = sc;
    snTrace.map = map; snTrace.v++;
    if (onDone) onDone();
  }).catch(() => { snTrace.map = snTrace.map || {}; }).finally(() => { snTrace.busy = false; });
  return snTrace.map;
}

/**
 * What a scenario does to each channel it names: off, the volume it sets (templates rendered now),
 * other options, other targets. For an active scenario also who undoes it: another active scenario
 * turning the same channel off (in SuperNotify the "off" wins) or the channel's own switch off.
 */
function snScenarioEffects(hass, a, name, activeNames, onDone) {
  const out = [];
  const dels = a && a.delivery && typeof a.delivery === "object" ? Object.entries(a.delivery) : [];
  for (const [d, dc0] of dels) {
    const c = dc0 || {};
    const e = { d, alias: snDeliveryAlias(hass, d) || d, off: c.enabled === false, vol: null, volTpl: false,
      extra: [], target: !!(c.target && [].concat(c.target).length), by: [], chanOff: false };
    const data = c.data && typeof c.data === "object" ? c.data : {};
    for (const [k, v] of Object.entries(data)) {
      if (/^volume(_level)?$/.test(k)) {
        let x = v;
        if (typeof v === "string" && v.includes("{")) { e.volTpl = true; x = snTpl(hass, v, onDone); }
        const n = typeof x === "number" ? x : parseFloat(x);
        if (Number.isFinite(n)) e.vol = Math.round(n <= 1 ? n * 100 : n);
      } else e.extra.push(k);
    }
    if (!e.off && activeNames && activeNames.includes(name)) {
      const sw = hass.states[`switch.supernotify_delivery_${d}`];
      if (sw && sw.state === "off") e.chanOff = true;
      for (const o of activeNames) {
        if (o === name) continue;
        const st = hass.states[`switch.supernotify_scenario_${o}`] || hass.states[`binary_sensor.supernotify_scenario_${o}`];
        const od = st && st.attributes && st.attributes.delivery && st.attributes.delivery[d];
        if (od && od.enabled === false) e.by.push(o);
      }
    }
    out.push(e);
  }
  return out;
}

/** One channel chip of a scenario (scenarios card). */
function snEffectChip(hass, e, T) {
  const esc = snEsc;
  const warn = e.by.length || e.chanOff;
  const why = [];
  let cls = "on", txt;
  if (e.off) { cls = "off"; txt = `✕ ${esc(e.alias)}`; why.push(T.sc_eff_off.replace("{d}", e.alias)); }
  else {
    if (e.vol === 0) { cls = "mod"; txt = `🔇 ${esc(e.alias)} · ${esc(T.sc_muted)}`; }
    else if (e.vol !== null) { cls = "mod"; txt = `🔉 ${esc(e.alias)} · ${esc(T.sc_vol)} ${e.vol}%`; }
    else if (e.volTpl) { cls = "mod"; txt = `🔉 ${esc(e.alias)} · ${esc(T.sc_vol)} …`; }
    else txt = `✓ ${esc(e.alias)}`;
    why.push(T.sc_eff_on.replace("{d}", e.alias));
    if (e.extra.length) { txt += " · ⚙"; why.push(T.sc_opts.replace("{k}", e.extra.join(", "))); }
    if (e.target) { txt += " · 🎯"; why.push(T.sc_tgt); }
  }
  if (e.by.length) why.push(T.sc_by.replace("{d}", e.alias).replace("{s}", e.by.map((x) => snScenarioName(hass, x)).join(", ")));
  if (e.chanOff) why.push(T.sc_chan_off.replace("{d}", e.alias));
  return `<span class="tag ${warn ? "warn" : cls}" title="${esc(e.d + " — " + why.join("; "))}">${warn ? "⚠ " : ""}${txt}</span>`;
}

/** Short summary of what an active scenario silences or turns down, for a chip. */
function snEffectShort(effects) {
  const bits = [];
  for (const e of effects) {
    if (e.off) bits.push(`✕ ${e.alias}`);
    else if (e.vol === 0) bits.push(`🔇 ${e.alias}`);
    else if (e.vol !== null) bits.push(`🔉 ${e.alias} ${e.vol}%`);
  }
  return bits.length > 3 ? bits.slice(0, 3).join(", ") + ` +${bits.length - 3}` : bits.join(", ");
}

/** The conditions of a scenario with their result now, on one line (null until the trace is read). */
function snScenarioCondLine(hass, T, sc) {
  if (!sc) return null;
  const tr = (sc.trace && sc.trace.trace) || {};
  const res = (p) => { const v = tr[p]; const last = Array.isArray(v) && v.length ? v[v.length - 1] : null; return last && last.result ? last.result.result : undefined; };
  const conds = Array.isArray(sc.conditions) ? sc.conditions : sc.conditions ? [sc.conditions] : [];
  if (!conds.length) return { text: T.sc_no_cond, parts: [] };
  // and/or/not spelled out, nested ones in brackets ("at least one of these: A or (all of these: B, C)")
  const full = (c, depth) => {
    const t = snCondText(hass, c, T);
    if (!(c && Array.isArray(c.conditions) && ["and", "or", "not"].includes(c.condition))) return t;
    const sub = c.conditions.map((cc) => full(cc, depth + 1)).join(c.condition === "or" ? T.c_or_join : ", ");
    return depth ? `(${t}: ${sub})` : `${t}: ${sub}`;
  };
  const parts = conds.map((c, i) => {
    const r = res(`condition/conditions/condition/${i}`);
    const t = full(c, 0);
    return { ok: r === true ? true : r === false ? false : null, t };
  });
  return { parts, text: parts.map((p) => `${p.ok === true ? "✓" : p.ok === false ? "✕" : "·"} ${p.t}`).join(" · ") };
}

/**
 * Why a scenario applies or not (0.66.0), from enquire_active_scenarios trace: true - each condition
 * with its result; for a state condition also the state it has now. Paths as HA traces write them:
 * condition/conditions/condition/<i>[/conditions/<j>][/entity_id/0].
 */
function snScenarioWhyHtml(hass, T, sc, active) {
  const esc = snEsc;
  if (!sc) return "";
  const tr = (sc.trace && sc.trace.trace) || {};
  const res = (p) => { const v = tr[p]; const last = Array.isArray(v) && v.length ? v[v.length - 1] : null; return last && last.result ? last.result : null; };
  const line = (c, path, depth) => {
    const r = res(path);
    const ok = r ? r.result === true : null;
    const now = c && c.condition === "state" ? res(path + "/entity_id/0") : null;
    const icon = ok === true ? "✔" : ok === false ? "✖" : "–";
    const extra = ok === null ? ` <span class="wq">(${esc(T.sc_not_eval)})</span>`
      : (ok === false && now && now.state != null ? ` <span class="wq">(${esc(T.sc_now)}: ${esc(now.state)})</span>` : "");
    return `<div class="wl ${ok === true ? "y" : ok === false ? "n" : "q"}" style="padding-left:${depth * 16}px">${icon} ${esc(snCondText(hass, c, T))}${extra}</div>`;
  };
  const conds = Array.isArray(sc.conditions) ? sc.conditions : sc.conditions ? [sc.conditions] : [];
  let h = `<div class="wh">${esc(active ? T.sc_yes : T.sc_no)}</div>`;
  if (sc.enabled === false) h += `<div class="wl n">✖ ${esc(T.sc_off_sw)}</div>`;
  if (!conds.length) h += `<div class="wl q">${esc(T.sc_no_cond)}</div>`;
  conds.forEach((c, i) => {
    const base = `condition/conditions/condition/${i}`;
    h += line(c, base, 0);
    if (c && Array.isArray(c.conditions) && ["and", "or", "not"].includes(c.condition)) {
      c.conditions.forEach((cc, j) => { h += line(cc, `${base}/conditions/${j}`, 1); });
    }
  });
  return h;
}

/* ── 0.63.0 shared helpers ── */
/** Who paused it, readable: SuperNotify writes "User command", "Voice command" or "Assistant". */
function snSnoozeReason(s, T) {
  const r = String((s && s.reason) || "").trim();
  if (!r) return "";
  return { "user command": T.rs_hand, "voice command": T.rs_voice, "assistant": T.rs_assist }[r.toLowerCase()] || r;
}

/** enquire_occupancy -> names at home / away and the occupancy SuperNotify's conditions see. */
function snOccupancy(hass, resp) {
  const sc = (resp && (resp.scenarios || resp)) || {};
  if (!Array.isArray(sc.home) && !Array.isArray(sc.not_home)) return null;
  const nm = (r) => {
    const id = r && (r.person || r.entity_id);
    const st = id && hass && hass.states[id];
    return (r && r.alias) || (st && st.attributes && st.attributes.friendly_name) || String(id || "?").replace(/^person\./, "");
  };
  const on = (r) => r && r.enabled !== false;
  const home = (sc.home || []).filter(on).map(nm), away = (sc.not_home || []).filter(on).map(nm);
  const ids = [...(sc.home || []), ...(sc.not_home || [])].filter(on).map((r) => r.person || r.entity_id).filter(Boolean);
  const state = !home.length && !away.length ? "UNDEFINED_OCCUPANTS" : !away.length ? "ALL_HOME"
    : !home.length ? "ALL_AWAY" : home.length === 1 ? "LONE_HOME" : "MULTI_HOME";
  return { home, away, state, ids };
}

/**
 * SuperNotify's own repairs (WS repairs/list_issues, admin only), with their translated title.
 * One read a minute for the whole page.
 */
const snRepairs = { t: 0, p: null };
function snRepairsFetch(hass) {
  if (!hass || !hass.user || hass.user.is_admin === false || !hass.callWS) return Promise.resolve([]);
  const now = Date.now();
  if (snRepairs.p && now - snRepairs.t < 60000) return snRepairs.p;
  snRepairs.t = now;
  snRepairs.p = (async () => {
    const r = await snWS(hass, { type: "repairs/list_issues" });
    const mine = ((r && r.issues) || []).filter((i) => i && i.domain === "supernotify" && !i.ignored && !i.dismissed_version);
    if (mine.length && hass.loadBackendTranslation) { try { await hass.loadBackendTranslation("issues", "supernotify"); } catch (e) { /* titles stay technical */ } }
    return mine.map((i) => {
      let title = "";
      try {
        if (hass.localize && i.translation_key) title = hass.localize(`component.supernotify.issues.${i.translation_key}.title`, i.translation_placeholders || {});
      } catch (e) { title = ""; }
      return { id: i.issue_id, title: title || String(i.translation_key || i.issue_id || "?").replace(/_/g, " "), sev: i.severity };
    });
  })().catch(() => []);
  return snRepairs.p;
}

/** Go to a Home Assistant page without reloading it. */
function snNavigate(path) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

/** binary_sensor.supernotify_scenario_x (or x) -> x */
function snScenarioKey(s) {
  const m = String(s).match(/^(?:binary_sensor|switch)\.supernotify_scenario_(.+)$/);
  return m ? m[1] : String(s);
}

/** "14:05" today, "03/10 14:05" otherwise. */
function snWhen(v) {
  const d = v ? new Date(v) : null;
  if (!d || isNaN(d)) return "";
  const p2 = (n) => String(n).padStart(2, "0");
  const hm = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  return d.toDateString() === new Date().toDateString() ? hm : `${p2(d.getDate())}/${p2(d.getMonth() + 1)} ${hm}`;
}

const SN_OPT_LABELS = {
  en: { message_usage: "Message used", simplify_text: "Simplify the text", strip_urls: "Remove links",
    target_select: "Targets accepted", target_categories: "Kinds of target", media_auto_pause: "Pause the music",
    language: "Language", tts_entity_id: "Voice", device_discovery: "Find devices by itself", device_domain: "Devices from",
    device_manufacturer_select: "Makers", device_model_select: "Models", title_only: "Title only", timestamp: "Time stamp",
    chime_aliases: "Sounds", data_keys_select: "Data passed on", unique_targets: "Each target once" },
  it: { message_usage: "Messaggio usato", simplify_text: "Semplifica il testo", strip_urls: "Togli i link",
    target_select: "Destinatari accettati", target_categories: "Tipi di destinatario", media_auto_pause: "Mette in pausa la musica",
    language: "Lingua", tts_entity_id: "Voce", device_discovery: "Trova i dispositivi da solo", device_domain: "Dispositivi da",
    device_manufacturer_select: "Marche", device_model_select: "Modelli", title_only: "Solo titolo", timestamp: "Ora nel testo",
    chime_aliases: "Suoni", data_keys_select: "Dati passati", unique_targets: "Ogni destinatario una volta" },
};

/** A value of an entity attribute, readable (no JSON braces). */
function snValText(v, T) {
  if (v === true) return T.det_yes;
  if (v === false) return T.det_no;
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map((x) => snValText(x, T)).join(", ") : "—";
  if (typeof v === "object") {
    const e = Object.entries(v).filter(([, x]) => x != null && !(Array.isArray(x) && !x.length));
    return e.length ? e.map(([k, x]) => `${k}: ${snValText(x, T)}`).join("; ") : "—";
  }
  return String(v);
}

/** The expanded detail of a channel or transport row: label / value lines, then the attributes link. */
function snDetailHtml(rows, T, config, hass) {
  const esc = snEsc;
  const lang = (config && config.language) || (hass && hass.language) || "en";
  const L = SN_OPT_LABELS[String(lang).slice(0, 2)] || SN_OPT_LABELS.en;
  const lines = rows.filter((r) => r && r[1] !== undefined && r[1] !== null && r[1] !== "").map(([k, v, opt, cls]) =>
    `<div class="dr${cls ? " " + cls : ""}"><span class="dk">${esc(opt ? (L[k] || k.replace(/_/g, " ")) : k)}</span><span class="dv">${esc(snValText(v, T))}</span></div>`);
  return `<div class="det">${lines.join("")}<button class="dmore">${esc(T.det_more)} ›</button></div>`;
}

/** Targets as one list: {entity_id: [...], email: [...]} -> [...] */
function snTargetList(t) {
  if (!t) return undefined;
  const out = Array.isArray(t) ? t : typeof t === "object" ? Object.values(t).flat() : [t];
  return out.length ? out : undefined;
}

function snDetailCss(p) {
  return `.det { margin: 8px 0 2px; padding: 8px 10px; border-radius: 9px; background: ${p.soft}; font-size: 12.5px; cursor: default; }
    .dr { display: flex; gap: 10px; padding: 3px 0; }
    .dk { flex: 0 0 38%; color: ${p.muted}; }
    .dv { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .dr.err .dv { color: ${p.crit}; }
    .dmore { margin-top: 6px; border: 0; background: none; color: ${p.brandD}; font: inherit; font-weight: 650; cursor: pointer; padding: 4px 0; }
    .row[aria-expanded="true"] { align-items: flex-start; }
    .chev { color: ${p.muted}; font-size: 12px; flex: none; align-self: flex-start; padding-top: 4px; }`;
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
  if (/\.supernotify_scenario_/.test(entityId)) setTimeout(() => snEnquireBust(), 800);
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
 * #17733d (5.9:1, 0.59.1: also >= 4.9:1 on the green tints), error #c62828 (5.6:1), secondary text #5b6b7c (5.5:1).
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
  ["ℹ", "information-outline"], ["↺", "restore"], ["🃏", "cards-outline"], ["🗂", "archive-outline"], ["↩", "undo-variant"],
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
    '<ha-icon class="sn-i" aria-hidden="true" icon="mdi:' + SN_EMOJI_MAP.get(e.replace(/️$/, "")) +
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

/**
 * Singular or plural (0.54.0): T[key + "_1"] when n is 1 and the language has a singular,
 * else T[key]. snPl() gives "1 channel off" / "3 channels off".
 */
/**
 * Message text for a card (0.56.1): markdown links become their text, **bold**, `code` and
 * heading marks go, so "[Clock Weather Card Update](https://github.com/...)" reads as
 * "Clock Weather Card Update" instead of the raw link.
 */
function snPlainMsg(s) {
  return String(s == null ? "" : s)
    .replace(/!?\[([^\]]*)\]\((?:[^()]|\([^)]*\))*\)/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*$/, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n").trim();
}

/**
 * Technical name next to a readable one (0.58.0), the same everywhere: small monospace, and
 * nothing when it says the same thing ("Email" / "email", "Morning" / "morning").
 */
function snSame(a, b) {
  const k = (x) => String(x || "").toLowerCase().replace(/[_\-\s]+/g, " ").trim();
  return k(a) === k(b);
}
function snTech(name, shown) {
  if (!name || snSame(name, shown)) return "";
  return `<span class="tech sn-tech" style="font-family:ui-monospace,'Roboto Mono',monospace;font-size:11px;font-weight:400">${String(name).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`;
}

/**
 * 12 or 24 hours (0.59.0): the user's own choice in the HA profile (time_format "12" / "24"),
 * else the language's default (undefined lets toLocale* decide).
 */
function snH12(hass) {
  const f = hass && hass.locale && hass.locale.time_format;
  return f === "12" ? true : f === "24" ? false : undefined;
}

/**
 * Title of a notification document (0.60.0): SuperNotify keeps it in condition_variables and in
 * each delivery envelope, not at the top level, so `n.title` alone is empty.
 */
function snNotifTitle(n) {
  if (!n || typeof n !== "object") return "";
  if (n.title) return n.title;
  const cv = n.condition_variables;
  if (cv && cv.notification_title) return cv.notification_title;
  for (const d of Object.values(n.deliveries || {})) {
    for (const k of ["success", "error", "suppressed"]) {
      const env = d && Array.isArray(d[k]) && d[k].find((e) => e && e.title);
      if (env) return env.title;
    }
  }
  return "";
}

function snW(T, key, n) {
  return (+n === 1 && T[key + "_1"]) || T[key] || key;
}
function snPl(T, key, n) {
  return `${n} ${snW(T, key, n)}`;
}

/** Readable name of a time band: config name, else the translated standard one, else the key. */
function snBandName(T, key, custom) {
  return custom || (T && T["band_" + key]) || String(key).replace(/_/g, " ");
}

/* ════════════════════════════════════════════════════════════════════════
 * Visual editor (0.55.0)
 *
 * Every card answers getConfigForm(): Home Assistant draws the form with its own
 * selectors (entity pickers, switches, numbers) in "Add card" / "Edit card", so the
 * common options need no YAML. Options a form cannot express (control tiles and
 * groups, time bands, scenario groups) stay in the code editor: the form keeps the
 * keys it does not show. Labels follow the UI language (document lang).
 * ════════════════════════════════════════════════════════════════════════ */
const SN_FORM_LABELS = {
  en: {
    _common: "Look and text", style: "Colours", icons: "Icons", show_version: "Show the card version",
    intro: "Intro text on top", title: "Title", dnd_entity: "Do-not-disturb switch",
    quiet_entity: "Computed quiet state (optional)", presence_entity: "Person for the status bar",
    archive_days: "Archive cleanup: older than (days)", media_days: "Picture cleanup: older than (days)",
    occupancy: "Who is home (from SuperNotify)", repairs: "SuperNotify repairs in the health list",
    snooze_announce: "Say pauses out loud (announce channel)", snooze_via: "Pauses go through", o_event: "the push buttons event (admin)", o_voice: "the voice commands", o_action: "SuperNotify's snooze action",
    status: "Status row (who is home, time band, quiet)", catch_up: "After a pause: what it held back", show_off: "Also offer channels that are off", daily: "Daily counts from the archive when available",
    snooze_minutes: "Snooze length (minutes)", snooze_panel: "Snooze tile opens the pause panel", announce_delivery: "Channel for announcements",
    last_notification: "Show the last notification", last_channels: "One chip per channel in the last notification",
    repeat_entity: "Repeat-last button (optional)", tile_layout: "Tiles", tile_columns: "Tile columns (empty = automatic)",
    update_entity: "SuperNotify update entity", cards_update_entity: "Cards update entity",
    sent_today_entity: "Daily counter (utility meter, optional)", count_entity: "SuperNotify counter (long-term statistics)", health: "Health on top", stats: "Numbers",
    poll_seconds: "Refresh every (seconds)", group: "Group by how a channel starts",
    hide_defaults: "Hide automatic DEFAULT_ channels", limit: "Notifications in the list",
    expand: "Open the folded parts", max_height: "Maximum height (CSS, e.g. 70vh)",
    source: "Archive source", entity: "Archive sensor (bridge only)", trigger_entity: "Refresh when this changes",
    dry_run: "Show \"Try without sending\"", dry_run_dupe_check: "Simulate the duplicate check too",
    days: "Days shown by default", manifest_url: "Automations manifest URL",
    o_supernotify: "SuperNotify", o_theme: "Home Assistant theme", o_mdi: "Home Assistant icons", o_emoji: "Emoji",
    o_row: "Icon on the left", o_stacked: "Tall, icon on top", o_three: "Sent, failures, channels", o_full: "All five",
    o_auto: "Automatic", o_sensor: "Sensor bridge (before SuperNotify 2.10)",
    o_archive: "SuperNotify archive (2.12.1+)", o_history: "History of the helpers",
  },
  it: {
    _common: "Aspetto e testi", style: "Colori", icons: "Icone", show_version: "Mostra la versione della card",
    intro: "Testo introduttivo in alto", title: "Titolo", dnd_entity: "Interruttore non disturbare",
    quiet_entity: "Stato silenzioso calcolato (facoltativo)", presence_entity: "Persona nella barra di stato",
    archive_days: "Pulizia archivio: piu' vecchie di (giorni)", media_days: "Pulizia foto: piu' vecchie di (giorni)",
    occupancy: "Chi è in casa (da SuperNotify)", repairs: "Riparazioni di SuperNotify nella salute",
    snooze_announce: "Annuncia le pause a voce (canale annunci)", snooze_via: "Le pause passano da", o_event: "l'evento dei pulsanti push (admin)", o_voice: "i comandi vocali", o_action: "l'azione snooze di SuperNotify",
    status: "Riga di stato (chi è in casa, fascia, silenzio)", catch_up: "Dopo una pausa: cosa ha trattenuto", show_off: "Mostra anche i canali spenti", daily: "Conteggi giornalieri dall'archivio quando ci sono",
    snooze_minutes: "Durata dello snooze (minuti)", snooze_panel: "Il riquadro pausa apre il pannello delle pause", announce_delivery: "Canale per gli annunci",
    last_notification: "Mostra l'ultima notifica", last_channels: "Un chip per canale nell'ultima notifica",
    repeat_entity: "Pulsante ripeti ultima (facoltativo)", tile_layout: "Tile", tile_columns: "Colonne delle tile (vuoto = automatico)",
    update_entity: "Entità di aggiornamento di SuperNotify", cards_update_entity: "Entità di aggiornamento delle card",
    sent_today_entity: "Contatore giornaliero (utility meter, facoltativo)", count_entity: "Contatore di SuperNotify (statistiche a lungo termine)", health: "Stato in alto", stats: "Numeri",
    poll_seconds: "Aggiorna ogni (secondi)", group: "Raggruppa per come parte il canale",
    hide_defaults: "Nascondi i canali automatici DEFAULT_", limit: "Notifiche nell'elenco",
    expand: "Apri le parti chiuse", max_height: "Altezza massima (CSS, es. 70vh)",
    source: "Sorgente dell'archivio", entity: "Sensore archivio (solo ponte)", trigger_entity: "Aggiorna quando cambia",
    dry_run: "Mostra \"Prova senza inviare\"", dry_run_dupe_check: "Simula anche il controllo doppioni",
    days: "Giorni mostrati di default", manifest_url: "URL del manifest delle automazioni",
    o_supernotify: "SuperNotify", o_theme: "Tema di Home Assistant", o_mdi: "Icone di Home Assistant", o_emoji: "Emoji",
    o_row: "Icona a sinistra", o_stacked: "Alte, icona sopra", o_three: "Inviate, fallimenti, canali", o_full: "Tutti e cinque",
    o_auto: "Automatica", o_sensor: "Ponte con sensore (prima di SuperNotify 2.10)",
    o_archive: "Archivio di SuperNotify (2.12.1+)", o_history: "Cronologia degli helper",
  },
};

function snForm(kind) {
  const lang = String((document.documentElement && document.documentElement.lang) || navigator.language || "en").slice(0, 2);
  const L = SN_FORM_LABELS[lang] || SN_FORM_LABELS.en;
  const sel = (name, opts, extra = {}) => ({ name, ...extra, selector: { select: { mode: "dropdown",
    options: opts.map(([value, key]) => ({ value, label: L[key] || key })) } } });
  const ent = (name, domain) => ({ name, selector: { entity: { domain } } });
  const bool = (name, def) => ({ name, ...(def !== undefined ? { default: def } : {}), selector: { boolean: {} } });
  const num = (name, min, max, step = 1) => ({ name, selector: { number: { min, max, step, mode: "box" } } });
  const txt = (name, multiline) => ({ name, selector: { text: multiline ? { multiline: true } : {} } });
  const common = { type: "expandable", name: "", flatten: true, title: L._common, schema: [
    sel("style", [["supernotify", "o_supernotify"], ["theme", "o_theme"]]),
    sel("icons", [["", "o_mdi"], ["emoji", "o_emoji"]]),
    bool("show_version"), txt("intro", true)] };
  const archive = [num("limit", 5, 100), sel("source", [["", "o_auto"], ["sensor", "o_sensor"]]),
    ent("entity", "sensor"), ent("trigger_entity", "sensor")];
  const S = {
    control: [ent("dnd_entity", ["input_boolean", "switch"]), ent("quiet_entity", ["binary_sensor", "input_boolean"]),
      ent("presence_entity", "person"), bool("occupancy", true), num("snooze_minutes", 5, 240, 5), bool("snooze_panel", true),
      sel("snooze_via", [["", "o_auto"], ["action", "o_action"], ["event", "o_event"], ["voice", "o_voice"]]), bool("snooze_announce", false), txt("announce_delivery"),
      bool("last_notification"), bool("last_channels"), ent("repeat_entity", ["input_button", "button", "script"]),
      sel("tile_layout", [["", "o_row"], ["stacked", "o_stacked"]]), num("tile_columns", 1, 6), bool("status", true), bool("catch_up", true)],
    overview: [ent("update_entity", "update"), ent("sent_today_entity", "sensor"),
      ent("quiet_entity", ["binary_sensor", "input_boolean"]), bool("health", true),
      sel("stats", [["", "o_three"], ["full", "o_full"]]), bool("last_notification"), bool("occupancy", true),
      bool("repairs", true), num("poll_seconds", 10, 600, 10)],
    deliveries: [txt("title"), bool("group", true), bool("hide_defaults", true)],
    transports: [], recipients: [], simulator: [bool("dry_run")], bands: [],
    scenarios: [num("poll_seconds", 10, 600, 10)],
    composer: [ent("update_entity", "update"), bool("dry_run"), bool("dry_run_dupe_check"), bool("show_off")],
    automations: [txt("manifest_url")],
    stats: [num("days", 2, 90), sel("source", [["", "o_auto"], ["archive", "o_archive"], ["history", "o_history"]]), ent("sent_today_entity", "sensor"), ent("count_entity", "sensor"), ent("update_entity", "update"), ent("cards_update_entity", "update"), bool("daily", true)],
    archive, why: [...archive, bool("expand"), txt("max_height")],
    tools: [num("archive_days", 1, 365), num("media_days", 1, 365)],
  };
  return {
    schema: [...(S[kind] || []), common],
    computeLabel: (item) => L[item.name] || item.name,
  };
}

function snPalette(dark, style) {
  if (style === "theme") {
    return {
      brand: "var(--primary-color)", brandD: "var(--primary-color)",
      onBrand: "var(--text-primary-color, #fff)",
      ok: "var(--success-color, #17733d)", warn: "var(--warning-color, #a04f00)",
      okSoft: "rgba(var(--rgb-success-color, 23,115,61), .10)",
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
    ? { brand: "#03a9f4", brandD: "#8fd0ff", onBrand: "#06131d", ok: "#7fe0a5", okSoft: "rgba(127,224,165,.10)", warn: "#f0b050",
        crit: "#ff9a9a", warnSoft: "rgba(240,160,32,.18)", warnLine: "#8a5a10", warnInk: "#ffd8a3",
        line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#9aa8b6",
        dot: "#3a4653" }
    : { brand: "#0277bd", brandD: "#01579b", onBrand: "#fff", ok: "#17733d", okSoft: "#e8f5ed", warn: "#a04f00",
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
  if (!hass) return false;
  const sw = hass.states[bsId.replace(/^binary_sensor\./, "switch.")];
  // 0.60.0: SuperNotify 2.12.0 can leave the scenario binary_sensors at their startup value
  // (seen on a real install: 10 hours unchanged while the time-of-day scenarios moved on), so
  // the answer of enquire_active_scenarios, refreshed every 30 s, wins when it is known
  snActiveEnsure(hass);
  if (snActive.names) {
    const name = bsId.replace(/^(binary_sensor|switch)\.supernotify_scenario_/, "");
    return snActive.names.has(name) && (!sw || sw.state !== "off");
  }
  if (!hass.states[bsId] || hass.states[bsId].state !== "on") return false;
  return !sw || sw.state !== "off";
}

/**
 * Active scenarios as SuperNotify computes them (0.60.0): enquire_active_scenarios, at most
 * every 30 s (sooner after a change made from a card, see snEnquireBust). `v` grows when the
 * list changes, so the cards' change tracker (snChanged) redraws them.
 */
const snActive = { names: null, t: 0, busy: false, v: 0 };
function snActiveEnsure(hass) {
  if (!hass || !hass.callWS || snActive.busy || Date.now() - snActive.t < 30000) return;
  const svc = hass.services && hass.services.supernotify;
  if (svc && !svc.enquire_active_scenarios) return;
  snActive.busy = true;
  snActive.t = Date.now();
  snEnquire(hass, "enquire_active_scenarios").then((r) => {
    const list = (r && r.response && r.response.scenarios) || [];
    const next = new Set(list.map((x) => String(x).replace(/^(binary_sensor|switch)\.supernotify_scenario_/, "")));
    const prev = snActive.names;
    if (!prev || prev.size !== next.size || [...next].some((x) => !prev.has(x))) { snActive.names = next; snActive.v++; }
  }).catch(() => {}).finally(() => { snActive.busy = false; });
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

/**
 * What a voice channel actually said, and which channel. 0.63.0: SuperNotify keeps
 * `spoken_message` only in the envelopes of the voice transports (envelope.contents, minimal),
 * so that key - not the channel's name - says which channel spoke; the name is the fallback for
 * older archives.
 */
function snArchiveSpokenBy(doc) {
  for (const [name, res] of Object.entries((doc && doc.deliveries) || {})) {
    if (!snIsObj(res)) continue;
    for (const call of res.success || []) {
      if (!snIsObj(call)) continue;
      const voice = Object.prototype.hasOwnProperty.call(call, "spoken_message") || name.includes("alexa") || name.includes("tts");
      if (!voice) continue;
      let said = call.spoken_message || null;
      if (!said) {
        for (const c of call.calls || []) {
          if (snIsObj(c) && (c.action_data || {}).message) { said = c.action_data.message; break; }
        }
      }
      said = said || call.message;
      if (said) return { text: snCut(String(said).split(/\s+/).filter(Boolean).join(" "), SN_ARCHIVE_SPOKEN_CHARS), name };
    }
  }
  return null;
}

function snArchiveSpoken(doc) {
  const r = snArchiveSpokenBy(doc);
  return r ? r.text : null;
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
  const spk = snArchiveSpokenBy(doc);
  const said = spk && spk.text;
  if (said) {
    const flat = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const fs = flat(said);
    const same = [flat(message), flat(body), flat(title)].filter(Boolean)
      .some((f) => fs.startsWith(snCut(f, snLen(fs))) || f.startsWith(fs));
    if (fs && !same) { item.sp = said; item.spn = spk.name; }
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
    for (const k of ["id", "parent_id", "user_id", "user"]) if (ctx[k]) out.ctx[k] = ctx[k];
  }
  // 0.61.0: targets no channel took, names that do not exist, timings
  const flat = (v) => (snIsObj(v) ? Object.values(v).flat() : Array.isArray(v) ? v : []).map(String).filter(Boolean);
  const ua = flat(doc.unassigned_targets).concat(flat(doc.uncategorized_targets));
  if (ua.length) out.ua = [...new Set(ua)].slice(0, 12);
  if (snIsObj(doc.unknown_names)) {
    const un = Object.entries(doc.unknown_names).filter(([, v]) => Array.isArray(v) && v.length).map(([k, v]) => `${k}: ${v.join(", ")}`);
    if (un.length) out.un = un;
  }
  if (snIsObj(doc.stats) && doc.stats.total_duration_ms != null) {
    out.stt = { ms: doc.stats.total_duration_ms, slow: doc.stats.slowest_delivery || "", rate: doc.stats.delivery_success_rate };
  }
  const trace = snArchiveTrace(doc);
  if (trace) out.trace = trace;
  const prov = snArchiveProvenance(doc);
  if (prov) out.prov = prov;
  return out;
}

/** True when this card should read the archive through supernotify.enquire_archive. */
/**
 * Shared read of the supernotify enquire_* services (0.57.0). Cards on the same dashboard ask
 * for the same data (last notification, active scenarios, snoozes) and their timers start
 * together, so one call is shared: a request in flight, or answered less than SN_ENQ_TTL ms
 * ago, is reused. Every caller gets its own copy of the answer. snEnquireBust() forgets
 * everything after an action that changes the data (snooze, clear, send) and tells the other
 * cards to read again ("supernotify-refresh" on window).
 */
/**
 * Daily counts (0.69.0) from the long-term statistics of a total_increasing counter, by default
 * SuperNotify's own sensor.supernotify_notifications: Home Assistant compiles them for every such
 * sensor, so no utility_meter is needed. Returns { byDay: {YYYY-MM-DD: n}, today, yesterday } or
 * null when the counter has no statistics (yet). Today = live state minus the counter at the end
 * of the last complete day, so it does not wait for the hourly compile. Cached 5 minutes.
 */
const SN_DAILY = new Map();
function snDayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function snDailyCounts(hass, id, days, force) {
  if (!hass || !id || !hass.callWS) return Promise.resolve(null);
  const key = id + "|" + days;
  const hit = SN_DAILY.get(key);
  if (hit && !force && Date.now() - hit.t < 300000) return hit.p;
  const start = new Date(Date.now() - days * 86400000);
  start.setHours(0, 0, 0, 0);
  const p = Promise.resolve(snWS(hass, {
    type: "recorder/statistics_during_period",
    start_time: start.toISOString(), end_time: new Date().toISOString(),
    statistic_ids: [id], period: "day", types: ["change", "state"],
  })).then((r) => {
    const rows = (r && r[id]) || [];
    if (!rows.length) return null;
    const todayKey = snDayKey(new Date());
    const byDay = {};
    let before = null;
    rows.forEach((x) => {
      const k = snDayKey(new Date(x.start));
      byDay[k] = Math.round(+x.change || 0);
      if (k !== todayKey && x.state != null) before = +x.state;
    });
    const live = hass.states[id];
    const lv = live && !["unknown", "unavailable"].includes(live.state) ? +live.state : NaN;
    if (before != null && Number.isFinite(lv) && lv >= before) {
      byDay[todayKey] = Math.max(byDay[todayKey] || 0, Math.round(lv - before));
    }
    const y = new Date(); y.setDate(y.getDate() - 1);
    return { byDay, today: byDay[todayKey] != null ? byDay[todayKey] : null, yesterday: byDay[snDayKey(y)] ?? null };
  }).catch(() => null);
  SN_DAILY.set(key, { t: Date.now(), p });
  return p;
}

/**
 * 0.76.1: hass.callWS with a time limit. A read sent while the page was still connecting could stay
 * unanswered, and a card waiting on it never asked again; now it fails after `ms` and the next
 * update retries.
 */
function snWS(hass, msg, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms || 20000);
    Promise.resolve(hass.callWS(msg)).then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}
const SN_ENQ = new Map();
const SN_ENQ_TTL = 2500;
const snEnqStats = { calls: 0, shared: 0 };
function snEnquire(hass, service, data) {
  snLiveEnsure(hass);
  const key = service + "|" + JSON.stringify(data || {});
  const now = Date.now();
  let hit = SN_ENQ.get(key);
  if (hit && now - hit.t < SN_ENQ_TTL) snEnqStats.shared++;
  else {
    snEnqStats.calls++;
    const p = snWS(hass, {
      type: "call_service", domain: "supernotify", service,
      service_data: data || {}, return_response: true,
    }, 10000);
    hit = { t: now, p };
    SN_ENQ.set(key, hit);
    p.catch(() => { if (SN_ENQ.get(key) === hit) SN_ENQ.delete(key); });
  }
  return hit.p.then((r) => (r == null ? r : JSON.parse(JSON.stringify(r))));
}
/**
 * Live updates (0.61.0): SuperNotify (>= 2.10.3) fires `supernotify_notification` once a
 * notification is done and archived - also when nothing was delivered, which the
 * notifications counter does not count. One subscription per page: the archive store reads
 * the newest entries and every card reads its enquire_* data again straight away, instead of
 * waiting for its poll. Subscribing to a custom event needs an admin user; for anyone else
 * the cards keep polling as before.
 */
const snLive = { state: "", hass: null };
function snLiveEnsure(hass) {
  if (!hass) return;
  snLive.hass = hass;
  if (snLive.state || !hass.connection || !hass.connection.subscribeEvents) return;
  if (hass.user && hass.user.is_admin === false) { snLive.state = "no-admin"; return; }
  snLive.state = "pending";
  Promise.resolve(hass.connection.subscribeEvents(() => {
    snArchiveStore.poke(snLive.hass);
    snEnquireBust(300);
  }, "supernotify_notification")).then(() => { snLive.state = "on"; }).catch(() => { snLive.state = "denied"; });
}

function snEnquireBust(delay) {
  SN_ENQ.clear();
  snActive.t = 0; // a change made from a card: read the active scenarios again too
  const fire = () => { SN_ENQ.clear(); window.dispatchEvent(new CustomEvent("supernotify-refresh")); };
  if (delay) setTimeout(fire, delay); else fire();
}

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
  pokes: 0,            // 0.61.0: bumped by the supernotify_notification event (snLive)
  trigger: null,

  /** A notification just finished (live event): read the newest entries now. */
  poke(hass) {
    this.pokes += 1;
    if (hass && this.fetched) this.ensure(hass, this.limit, this.trigger);
  },

  async _call(hass, data) {
    const r = await snWS(hass, {
      type: "call_service", domain: "supernotify", service: "enquire_archive",
      service_data: data, return_response: true,
    });
    return (r && r.response) || {};
  },

  /** Keep the store current for this card: first load, then only the newest few. */
  ensure(hass, limit, trigger) {
    snLiveEnsure(hass);
    if (trigger) this.trigger = trigger;
    const st = hass.states[trigger || this.trigger || "sensor.supernotify_notifications"];
    const stamp = (st ? st.last_updated : "none") + "|" + this.pokes;
    const want = Math.max(1, Math.min(100, limit || 40));
    // 0.74.1: a reading that never answered (e.g. made while the page was still connecting)
    // is given up after 20 s, so the next update tries again
    if (this.loading && Date.now() - (this.loadingAt || 0) < 20000) return;
    let data = null;
    if (!this.fetched || want > this.limit) data = { limit: want };
    else if (stamp !== this.stamp) data = { limit: SN_ARCHIVE_REFRESH };
    if (!data) return;
    this.limit = Math.max(this.limit, want);
    this.stamp = stamp;
    const run = (this.run || 0) + 1;
    this.run = run;
    this.loadingAt = Date.now();
    this.loading = this._call(hass, data).then((resp) => {
      if (run !== this.run) return; // a newer reading replaced this one
      const got = (resp.notifications || []).filter(snIsObj);
      const seen = new Set(got.map((d) => d.id));
      const merged = got.concat(this.docs.filter((d) => !seen.has(d.id)));
      merged.sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
      this.docs = merged.slice(0, this.limit);
      this.index = null;
      this.error = null;
      this.fetched = new Date();
    }).catch((e) => {
      if (run === this.run) this.error = (e && e.message) || String(e);
    }).finally(() => {
      if (run !== this.run) return;
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
      p.services !== hass.services || p.minute !== Math.floor(Date.now() / 60000) || p.act !== snActive.v) return true;
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
    act: snActive.v,
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

class SupernotifyControlCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("control");
  }

  // card picker (0.57.0): a do-not-disturb switch only if this installation has one
  static getStubConfig(hass) {
    const ids = Object.keys((hass && hass.states) || {});
    const dnd = ids.find((e) => /^(input_boolean|switch)\..*(dnd|do_not_disturb|non_disturbare)/.test(e));
    return dnd
      ? { dnd_entity: dnd, tiles: ["dnd", "snooze"], last_notification: true }
      : { tiles: ["snooze"], last_notification: true };
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

  _onHass(hass, fresh, changed) {
    super._onHass(hass, fresh, changed);
    if (this._config.last_notification) {
      const cnt = this._st("sensor.supernotify_notifications");
      if (cnt !== this._lastCount) { this._lastCount = cnt; this._refreshLast(); }
    }
    // first hass after connect: connectedCallback may have run without hass
    if (!this._booted) { this._booted = true; this._refreshSnoozes(); this._refreshLast(); }
  }

  getCardSize() {
    return 4 + (this._config.groups || []).length + (this._config.last_notification ? 2 : 0);
  }

  connectedCallback() {
    this._pollTimer = setInterval(() => { this._refreshSnoozes(); this._refreshLast(); this._refreshOcc(); }, 60000);
    // 30 s tick: snooze countdown + relative time of the last notification
    this._tickTimer = setInterval(() => {
      if (!this._rendered) return;
      if ((this._snoozes || []).length) this._renderTiles(); // also hides a snooze that just ended
      if (this._config.last_notification) this._renderLast();
    }, 30000);
    this._refreshSnoozes();
    this._refreshLast();
    this._refreshOcc();
    this._onRefresh = this._onRefresh || (() => { this._refreshSnoozes(); this._refreshLast(); this._refreshOcc(); });
    this._onCards = this._onCards || (() => { if (this._rendered) this._renderStatus(); });
    window.addEventListener("supernotify-cards", this._onCards);
    window.addEventListener("supernotify-refresh", this._onRefresh);
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
    clearInterval(this._tickTimer);
    if (this._onRefresh) window.removeEventListener("supernotify-refresh", this._onRefresh);
    if (this._onCards) window.removeEventListener("supernotify-cards", this._onCards);
  }

  async _refreshLast() {
    if (!this._hass || !this._config.last_notification) return;
    try {
      const r = await snEnquire(this._hass, "enquire_last_notification");
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

  async _refreshOcc() {
    if (!this._hass || this._config.presence_entity || this._config.occupancy === false) return;
    try {
      const r = await snEnquire(this._hass, "enquire_occupancy");
      const o = snOccupancy(this._hass, r && r.response);
      const raw = JSON.stringify(o);
      if (raw !== this._occRaw) {
        this._occRaw = raw;
        this._occ = o;
        if (this._rendered) this._renderStatus();
      }
    } catch (e) {
      // supernotify may still be loading; retry on next poll
    }
  }

  async _refreshSnoozes() {
    if (!this._hass) return;
    try {
      const r = await snEnquire(this._hass, "enquire_snoozes");
      const list = (r && r.response && r.response.snoozes) || [];
      const raw = JSON.stringify(list);
      if (raw !== this._snoozesRaw) {
        this._snoozesRaw = raw;
        this._snoozes = list;
        if (this._rendered) this._renderTiles();
      }
      this._catchUp(list);
    } catch (e) {
      // supernotify may still be loading; retry on next poll
    }
  }

  /**
   * 0.76.0: what a pause held back. Read once when the card starts without a pause in force, and
   * again each time a pause ends: the archive's notifications suppressed as SNOOZED (all channels,
   * or some) since the last OK in this browser, at most the last 24 h.
   */
  async _catchUp(list) {
    const c = this._config;
    if (c.catch_up === false || !(c.tiles || []).includes("snooze") || !this._hass) return;
    const svc = this._hass.services && this._hass.services.supernotify;
    if (!svc || !svc.enquire_archive) return;
    const live = snLiveSnoozes(list).length > 0;
    if (live) { this._cuLive = true; return; }
    if (this._cuChecked && !this._cuLive) return;
    this._cuChecked = true;
    this._cuLive = false;
    let ack = 0;
    try { ack = +(window.localStorage.getItem(SN_CU_KEY) || 0); } catch (e) { /* private mode */ }
    const since = Math.max(ack, Date.now() - 86400000);
    try {
      const r = await snWS(this._hass, { type: "call_service", domain: "supernotify", service: "enquire_archive",
        service_data: { verbosity: "summary", after: new Date(since).toISOString(), limit: 500 }, return_response: true });
      const ns = ((r && r.response && r.response.notifications) || []).filter(snIsObj);
      const held = [];
      for (const n of ns) {
        const all = String(n.suppressed || "").toUpperCase() === "SNOOZED";
        const some = !all && Object.values(n.deliveries || {}).some((d) => d && String(d.skipped || "").toUpperCase() === "SNOOZED");
        if (all || some) held.push({ t: Date.parse(n.created) || 0, ti: String(n.title || n.message || "").trim(), all });
      }
      held.sort((a, b) => a.t - b.t);
      this._cu = held.length ? held : null;
    } catch (e) {
      this._cu = null;
    }
    this._renderCatchUp();
  }

  _renderCatchUp() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("cu");
    if (!el) return;
    const held = this._cu;
    if (!held || !held.length) { el.hidden = true; el.innerHTML = ""; return; }
    const T = snT(this._config, this._hass);
    const esc = snEsc;
    const hm = (t) => { const d = new Date(t); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
    const nAll = held.filter((h) => h.all).length;
    const nSome = held.length - nAll;
    const groups = {};
    for (const h of held) { const k = snCut(h.ti || "—", 40); groups[k] = (groups[k] || 0) + 1; }
    const top = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${n}× ${k}`).join(" · ");
    const span = `${T.cu_from} ${hm(held[0].t)} ${T.cu_to} ${hm(held[held.length - 1].t)}`;
    const rows = held.slice(-30).reverse().map((h) => `<div class="sr"><span class="sl">${esc(h.ti || "—")}</span><span class="su">${hm(h.t)}${h.all ? "" : " · " + esc(T.cu_part.replace("{n} ", ""))}</span></div>`).join("");
    el.hidden = false;
    el.innerHTML = snIconify(`<div class="sh"><b>😴 ${esc(T.cu_title)}</b><button class="sb" id="cuOk">${esc(T.cu_ok)}</button></div>
      <div class="sk">${esc(T.cu_held.replace("{n}", held.length))}${nSome ? ` (${esc(T.cu_part.replace("{n}", nSome))})` : ""} · ${esc(span)}</div>
      <div class="su">${esc(top)}</div>
      <details><summary class="su">${esc(T.cu_list)}</summary><div class="slist">${rows}</div></details>`, this._config);
    el.querySelector("#cuOk").onclick = () => {
      try { window.localStorage.setItem(SN_CU_KEY, String(Date.now())); } catch (e) { /* private mode */ }
      this._cu = null;
      this._renderCatchUp();
    };
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
  // 0.60.0: any domain (input_boolean, switch, light, fan...) - the visual editor also offers switch.*
  _toggle(entityId) {
    const dom = String(entityId).split(".")[0];
    if (["input_boolean", "switch", "light", "fan", "automation", "siren", "humidifier"].includes(dom))
      this._hass.callService(dom, "toggle", { entity_id: entityId });
    else this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
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
        return { name: snBandName(snT(this._config, this._hass), name, b.name), min: +h * 60 + +m, volume: b.volume };
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
    return snActiveScenarioIds(this._hass);
  }

  async _snooze() {
    // 0.61.0: the tile opens the pause panel (what, for whom, how long, and the pauses in
    // force, each one resumable); `snooze_panel: false` keeps the one-tap behaviour below
    if (this._config.snooze_panel !== false) {
      this._snzOpen = !this._snzOpen;
      this._renderSnz();
      if (this._snzOpen) {
        const el = this.shadowRoot.getElementById("snzp");
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      return;
    }
    // SuperNotify snoozing is event-driven (same mechanism as the push
    // notification buttons): fire a mobile_app_notification_action event
    // with a SUPERNOTIFY_<CMD>_<RECIPIENT>_<TARGET>_<minutes> action name.
    // NONCRITICAL keeps critical notifications flowing during the snooze.
    // When a snooze is already active, tapping the tile clears it instead.
    const T = snT(this._config, this._hass);
    if (snLiveSnoozes(this._snoozes).length) {
      await this._resumeAll();
      return;
    } else {
      const minutes = this._config.snooze_minutes || 30;
      const action =
        this._config.snooze_action || `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_${minutes}`;
      await this._snzSpeak(this._snzText("snooze", { what: /_EVERYTHING_/.test(action) ? "EVERYTHING" : "NONCRITICAL", min: minutes }));
      try {
        // 0.74.0: supernotify.snooze when there is one (any user); snooze_action keeps the event
        if (!this._config.snooze_action && this._snzUseAction()) await snSnoozeCall(this._hass, { command: "snooze", scope: "noncritical", minutes });
        else await this._hass.callApi("POST", "events/mobile_app_notification_action", { action });
        this._toast(`${T.snoozed_for} ${minutes} ${T.min}`);
      } catch (e) {
        this._toast(`✖ ${(e && e.message) || e}`);
      }
    }
    snEnquireBust(800); // this card and the others read the snoozes again
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
        .sseg.go { cursor: pointer; } .sseg.go .sv { text-decoration: underline dotted; text-underline-offset: 3px; }
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
        .lastn .lh { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; margin-bottom: 4px; }
        .lastn .lt { font-size: 14.5px; font-weight: 750; flex: 1 1 180px; min-width: 0; line-height: 1.3;
                     overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical;
                     -webkit-line-clamp: 2; overflow: hidden; }
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted};
               margin-top: 10px; user-select: none; }
        .toast { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%) translateY(20px);
                 background: ${p.ink}; color: ${p.panel};
                 border-radius: 10px; padding: 8px 16px; font-size: 12.5px; font-weight: 650;
                 opacity: 0; pointer-events: none; transition: .25s; }
        .toast.show { opacity: .95; transform: translateX(-50%) translateY(0); }
        .snzp { border: 1.5px solid ${p.warnLine}; border-radius: 14px; padding: 12px 14px; margin: 4px 0 12px;
                background: ${p.panel}; }
        .snzp .sh { display: flex; align-items: center; justify-content: space-between; }
        .snzp .sh b { font-size: 15px; }
        .snzp .sx { border: 0; background: none; color: ${p.muted}; font-size: 16px; cursor: pointer; min-width: 32px; min-height: 32px; }
        .snzp .sk { font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800;
                    color: ${p.muted}; margin: 10px 0 5px; }
        .snzp .srow { display: flex; flex-wrap: wrap; gap: 6px; }
        .snzp .sc { border: 1.5px solid ${p.line}; background: ${p.soft}; color: ${p.ink}; border-radius: 999px;
                    padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 650; cursor: pointer; min-height: 32px; }
        .snzp .sc.on { background: ${p.brand}; border-color: ${p.brand}; color: ${p.onBrand}; }
        .snzp select { font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 8px; border: 1.5px solid ${p.line};
                       background: ${p.panel}; color: ${p.ink}; max-width: 100%; }
        .snzp .sgo { display: flex; justify-content: flex-end; margin-top: 10px; }
        .snzp .sp { border: 0; border-radius: 10px; background: ${p.brand}; color: ${p.onBrand}; padding: 9px 16px;
                    font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; min-height: 38px; }
        .snzp .sb { border: 1.5px solid ${p.line}; background: ${p.panel}; color: ${p.brandD}; border-radius: 999px;
                    padding: 5px 12px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; min-height: 30px; }
        .snzp .sr { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-top: 1px solid ${p.line}; }
        .snzp .sr:first-child { border-top: 0; }
        .snzp .sl { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; }
        .snzp .su { font-size: 12px; color: ${p.muted}; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="statusbar" id="statusbar"></div>
        ${this._config.last_notification ? `<div class="lastn" id="lastn"></div>` : ""}
        <div class="tiles${this._config.tile_layout === "stacked" ? " stacked" : ""}" id="tiles"></div>
        <div class="snzp" id="snzp" hidden></div>
        <div class="snzp" id="cu" hidden></div>
        ${(this._config.tiles || []).includes("announce") ? `<div class="announce" id="announceRow">
          <ha-icon icon="mdi:bullhorn"></ha-icon>
          <input id="announceInput" placeholder="${snT(this._config, this._hass).announce_ph}">
          <button id="announceBtn">${snT(this._config, this._hass).send}</button>
        </div>` : ""}
        <div id="groups"></div>
        ${snVer(this._config, "control", p)}
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
    this._renderCatchUp();
  }

  _renderLast() {
    const el = this.shadowRoot.getElementById("lastn");
    if (!el) return;
    const c = this._config;
    const T = snT(c, this._hass);
    const esc = snEsc;
    const n = this._last;
    const titleFromEntity = c.last_notification_entity ? this._st(c.last_notification_entity) : undefined;
    const title = snNotifTitle(n) || (titleFromEntity && !["unknown", "unavailable", ""].includes(titleFromEntity) ? titleFromEntity : "");
    let msg = snPlainMsg(n && n.message);
    if (c.last_notification_strip) {
      try { msg = msg.replace(new RegExp(c.last_notification_strip, "m"), "").trim(); } catch (e) { /* bad regex: ignore */ }
    }
    if (!n && !title) { el.innerHTML = snIconify(`<div class="lm" style="opacity:.7">${T.no_notif}</div>`, this && this._config); return; }
    const prio = n && n.priority
      ? `<span class="lb" style="color:${snPrioColor(this._palette(), n.priority) || "inherit"}">● ${esc(T["prio_" + n.priority] || n.priority)}</span>` : "";
    let when = "";
    if (n && n.created) { const d = new Date(n.created); if (!isNaN(d)) when = `<span class="lb mut">🕐 ${esc(snAgo(d, T))}</span>`; }
    const chips = [];
    const { ok: okNames, err: errNames, skipped } = snLastDeliveries(this._hass, n);
    if (c.last_channels) {
      for (const l of okNames) chips.push(`<span class="lb ok">✔ ${esc(l)}</span>`);
      for (const l of errNames) chips.push(`<span class="lb err">✖ ${esc(l)}</span>`);
    }
    // 0.52.0: counts with the channel names in the tooltip (`last_channels: true` = one chip each)
    if (!c.last_channels) {
      if (okNames.length) chips.push(`<span class="lb ok" title="${esc(okNames.join(", "))}">✔ ${snPl(T, "ln_delivered", okNames.length)}</span>`);
      if (errNames.length) chips.push(`<span class="lb err" title="${esc(errNames.join(", "))}">✖ ${snPl(T, "ln_failed", errNames.length)}</span>`);
    }
    if (n && +n.missed > 0) chips.push(`<span class="lb mis">⚠ ${snPl(T, "missed_n", +n.missed)}</span>`);
    if (skipped) chips.push(`<span class="lb mut">${snPl(T, "skipped_n", skipped)}</span>`);
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
    } else if (c.occupancy !== false && this._occ) {
      // 0.63.0: who is home for SuperNotify (enquire_occupancy) - what its conditions see
      const o = this._occ;
      segs.push(seg("🏠 " + T.occ_home_l, o.home.length ? o.home.join(", ") : T["occ_" + o.state],
        o.home.length ? p.ok : undefined).replace('<div class="sseg"', snCardReach("recipients") ? '<div class="sseg go" data-go="recipients"' : '<div class="sseg"'));
    }
    const band = this._activeBand();
    if (band) {
      const vol = band.volume ? Math.round(+this._st(band.volume) || 0) + "%" : "";
      segs.push(seg("🕐 " + T.time_band, band.name + (vol ? " · vol " + vol : ""), p.brandD));
    }
    if (c.dnd_entity || c.quiet_entity) {
      // quiet_entity (optional): a COMPUTED quiet state (e.g. a template
      // binary_sensor combining DND switch, schedules, voice toggle) shown in
      // the status bar, while the DND tile keeps toggling the manual switch.
      const on = this._on(c.quiet_entity || c.dnd_entity);
      segs.push(seg("🔕 " + T.quiet, on ? T.on : T.off, on ? p.warn : p.ok));
    }
    const act = this._activeScenarios();
    if (act !== null) segs.push(seg("🎬 " + T.act_scen, String(act.length))
      .replace('<div class="sseg"', snCardReach("scenarios") ? '<div class="sseg go" data-go="scenarios"' : '<div class="sseg"'));
    const bar = this.shadowRoot.getElementById("statusbar");
    if (c.status === false) { bar.innerHTML = ""; bar.style.display = "none"; return; } // 0.74.0
    bar.innerHTML = snIconify(segs.join(""), this && this._config);
    // 0.65.0: who is home -> recipients card, active scenarios -> scenarios card
    bar.querySelectorAll("[data-go]").forEach((g) => {
      g.onclick = () => g.dataset.go === "recipients"
        ? snGo("recipients", { persons: (this._occ && this._occ.ids) || [] })
        : snGo("scenarios", { names: (act || []).map(snScenarioKey) });
    });
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
          left = `${T.snoozed} · ${mins} ${T.min}`;
        }
        const what = snSnoozeLabels(this._hass, act, T);
        return { cls: "warn", icon: "😴", name: left || T.snoozed,
          sub: what ? what + (until ? ` · ${T.until} ${until}` : "") : (until ? T.until + " " + until + " · " : "") + (c.snooze_panel === false ? T.tap_clear : T.snz_choose),
          act: () => this._snooze() };
      }
      return { cls: "", icon: "😴", name: `${T.snooze} ${c.snooze_minutes || 30} ${T.min}`,
        sub: c.snooze_panel === false ? T.pause_nc : T.snz_choose, act: () => this._snooze() };
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
    this._renderSnz();
  }

  /**
   * Pause panel (0.61.0). SuperNotify has no snooze action: a pause is the same event the
   * buttons of a push notification fire, mobile_app_notification_action with
   * SUPERNOTIFY_<SNOOZE|SILENCE|NORMAL>_<EVERYONE|USER>_<target>[_<minutes>] (snoozer.py).
   * USER = the person whose user_id is the one logged in. NORMAL resumes one pause.
   */
  _renderSnz() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("snzp");
    if (!el) return;
    if (!this._snzOpen) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    const T = snT(this._config, this._hass);
    const esc = snEsc;
    const st = this._snz || (this._snz = { what: "NONCRITICAL", target: "", who: "EVERYONE", min: this._config.snooze_minutes || 30 });
    const me = this._myPerson();
    const dels = snEntityRows(this._hass, "delivery").filter((d) => !/^default_/i.test(d.name));
    if (st.what === "DELIVERY" && !st.target && dels.length) st.target = dels[0].name;
    if (st.what === "PRIORITY" && !st.target) st.target = "low";
    const chip = (grp, val, label, on) => `<button class="sc${on ? " on" : ""}" data-g="${grp}" data-v="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
    const whatRow = [["NONCRITICAL", T.snz_nc_l], ["EVERYTHING", T.snz_all_l], ["DELIVERY", T.snz_ch], ["PRIORITY", T.snz_pr]]
      .map(([v, l]) => chip("what", v, l, st.what === v)).join("");
    let sub = "";
    if (st.what === "DELIVERY") {
      sub = `<select id="snzT" aria-label="${esc(T.snz_ch)}">${dels.map((d) =>
        `<option value="${esc(d.name)}"${d.name === st.target ? " selected" : ""}>${esc(snDeliveryAlias(this._hass, d.name) || d.name)}</option>`).join("")}</select>`;
    } else if (st.what === "PRIORITY") {
      sub = `<select id="snzT" aria-label="${esc(T.snz_pr)}">${["minimum", "low", "medium", "high"].map((p) =>
        `<option value="${p}"${p === st.target ? " selected" : ""}>${esc(T["prio_" + p] || p)}</option>`).join("")}</select>`;
    }
    const whoRow = chip("who", "EVERYONE", T.snz_everyone, st.who === "EVERYONE") + (me ? chip("who", "USER", T.snz_me, st.who === "USER") : "");
    const lens = [15, 30, 60, 120, 240];
    const lenRow = lens.map((m) => chip("min", m, m < 60 ? `${m} ${T.min}` : `${m / 60} h`, +st.min === m)).join("")
      + chip("min", 0, T.snz_forever, +st.min === 0);
    const live = snLiveSnoozes(this._snoozes);
    const myUser = this._hass && this._hass.user && this._hass.user.id;
    const canResume = (s) => String(s.recipient_type || "").toUpperCase() !== "USER" ||
      (s.recipient && this._hass.states[s.recipient] && (this._hass.states[s.recipient].attributes || {}).user_id === myUser);
    const pad = (n) => String(n).padStart(2, "0");
    const voice = this._snzVoice();
    const rows = live.map((s, i) => `<div class="sr"><span class="sl">${esc(snSnoozeLabel(this._hass, s, T))}</span>
        <span class="su">${s._end ? `${esc(T.until)} ${pad(s._end.getHours())}:${pad(s._end.getMinutes())}` : esc(T.snz_until_resumed)}${snSnoozeReason(s, T) ? ` · ${esc(snSnoozeReason(s, T))}` : ""}</span>
        ${canResume(s) && !voice ? `<button class="sb" data-r="${i}">${esc(T.snz_resume)}</button>` : ""}</div>`).join("");
    el.innerHTML = snIconify(`<div class="sh"><b>${esc(T.snz_title)}</b><button class="sx" id="snzX" aria-label="${esc(T.snz_close)}">✕</button></div>
      ${voice ? `<div class="sk">${esc(T.snz_voice_info)}</div>` : `<div class="sk">${esc(T.snz_what)}</div><div class="srow">${whatRow}</div>${sub ? `<div class="srow">${sub}</div>` : ""}
      <div class="sk">${esc(T.snz_who)}</div><div class="srow">${whoRow}</div>`}
      <div class="sk">${esc(T.snz_len)}</div><div class="srow">${lenRow}</div>
      <div class="sgo"><button class="sp" id="snzGo">😴 ${esc(T.snz_go)}</button>${voice ? `<button class="sb" id="snzMine">${esc(T.snz_resume_mine)}</button>` : ""}</div>
      ${live.length ? `<div class="sk">${esc(T.snz_active)}</div><div class="slist">${rows}</div>
        <div class="sgo"><button class="sb" id="snzAll">${esc(T.snz_resume_all)}</button></div>` : ""}`, this._config);
    el.querySelectorAll(".sc").forEach((b) => {
      b.onclick = () => {
        const g = b.dataset.g, v = b.dataset.v;
        if (g === "min") st.min = +v;
        else st[g] = v;
        if (g === "what") st.target = "";
        this._renderSnz();
      };
    });
    const sel = el.querySelector("#snzT");
    if (sel) sel.onchange = () => { st.target = sel.value; };
    el.querySelector("#snzX").onclick = () => { this._snzOpen = false; this._renderSnz(); };
    el.querySelector("#snzGo").onclick = async () => {
      const kind = +st.min > 0 ? "snooze" : "silence";
      await this._snzSpeak(this._snzText(kind, voice ? { ...st, mine: true } : st));
      if (voice) this._snzSay(kind, +st.min); else this._snzGo(st, T.snz_done);
    };
    const mine = el.querySelector("#snzMine");
    if (mine) mine.onclick = async () => { await this._snzSay("resume"); this._snzSpeak(this._snzText("resume", { mine: true })); };
    el.querySelectorAll(".sb[data-r]").forEach((b) => {
      const s0 = live[+b.dataset.r];
      b.onclick = async () => {
        await this._snzGo({ resume: true, what: String(s0.target_type || "").toUpperCase(),
          target: Array.isArray(s0.target) ? s0.target.join("_") : (s0.target || ""), who: String(s0.recipient_type || "EVERYONE").toUpperCase(),
          person: s0.recipient || "" }, T.snz_resumed);
        this._snzSpeak(this._snzText("resume_one", { label: snSnoozeLabel(this._hass, s0, T) }));
      };
    });
    const all = el.querySelector("#snzAll");
    if (all) all.onclick = () => this._resumeAll();
  }

  /**
   * 0.63.0: the mobile_app_notification_action event needs an admin. Anyone else pauses through
   * SuperNotify's own voice commands (conversation/process), which pause the person of the user
   * who asks. `snooze_via: event | voice` forces one way.
   */
  _snzVoice() {
    const v = this._config.snooze_via;
    if (v === "voice") return true;
    if (v === "event") return false;
    if (this._snzUseAction()) return false;
    return !!(this._hass && this._hass.user && this._hass.user.is_admin === false);
  }

  /**
   * 0.63.1: `snooze_announce: true` says the pause out loud on the announce channel
   * (`announce_delivery`). Before pausing - the pause would stop its own announcement - and
   * after resuming. Off by default.
   */
  async _snzSpeak(text) {
    if (!this._config.snooze_announce || !text || !this._hass) return;
    const name = this._config.announce_delivery || "alexa_announce";
    // 0.63.2: with a pause for everyone already in force (non-critical or everything) SuperNotify
    // would hold this announcement back too (is_global_snooze). Then the card calls the channel's
    // own action, with its targets and data, as SuperNotify would.
    const held = snLiveSnoozes(this._snoozes).some((x) => String(x.recipient_type || "").toUpperCase() === "EVERYONE"
      && ["EVERYTHING", "NONCRITICAL"].includes(String(x.target_type || "").toUpperCase()));
    const row = snEntityRows(this._hass, "delivery").find((d) => d.name === name);
    const a = (row && this._hass.states[row.id] && this._hass.states[row.id].attributes) || {};
    const m = String(a.action || "").match(/^([a-z0-9_]+)\.([a-z0-9_]+)$/);
    try {
      if (held && m) {
        const tl = snTargetList(a.target) || [];
        const payload = { message: text };
        if (m[1] === "notify") {
          if (tl.length) payload.target = tl;
          if (a.data && Object.keys(a.data).length) payload.data = a.data;
        } else if (tl.length) {
          payload.entity_id = tl;
        }
        await this._hass.callService(m[1], m[2], payload);
      } else {
        const delivery = {};
        delivery[name] = {};
        await this._hass.callService("notify", "supernotify", { message: text, data: { delivery_selection: "fixed", delivery } });
      }
    } catch (e) { /* the pause goes on anyway */ }
  }

  /** The sentence for a pause: kind snooze | silence | resume | resume_one | resume_all. */
  _snzText(kind, st) {
    const T = snT(this._config, this._hass);
    st = st || {};
    if (kind === "resume_all") return T.sa_resume_all;
    if (kind === "resume_one") return T.sa_resume_one.replace("{x}", st.label || "");
    let what;
    if (st.mine) what = T.sa_w_mine;
    else if (st.what === "EVERYTHING") what = T.sa_w_all;
    else if (st.what === "DELIVERY") what = T.sa_w_ch.replace("{x}", snDeliveryAlias(this._hass, st.target) || st.target || "");
    else if (st.what === "PRIORITY") what = T.sa_w_pr.replace("{x}", String(T["prio_" + st.target] || st.target || "").toLowerCase());
    else what = T.sa_w_nc;
    if (!st.mine && st.who === "USER") {
      const me = this._myPerson && this._myPerson();
      const nm = me && this._hass.states[me] && this._hass.states[me].attributes.friendly_name;
      if (nm) what += " " + T.sa_for.replace("{x}", nm);
    }
    if (kind === "resume") return T.sa_resume.replace("{what}", what);
    if (kind === "silence") return T.sa_silence.replace("{what}", what);
    const m = +st.min || 0;
    const len = m < 60 ? T.sa_min.replace("{n}", m) : m === 60 ? T.sa_hour : T.sa_hours.replace("{n}", Math.round(m / 6) / 10);
    return T.sa_snooze.replace("{what}", what).replace("{len}", len);
  }

  async _snzSay(cmd, min) {
    const T = snT(this._config, this._hass);
    const it = String((this._config.language || this._hass.language || "en")).startsWith("it");
    const text = cmd === "resume" ? (it ? "riattiva le mie notifiche" : "resume my notifications")
      : cmd === "silence" ? (it ? "silenzia le mie notifiche fino a nuovo ordine" : "silence my notifications until I say")
      : (it ? `metti in pausa le mie notifiche per ${min} minuti` : `pause my notifications for ${min} minutes`);
    try {
      const r = await this._hass.callWS({ type: "conversation/process", text, language: it ? "it" : "en" });
      const res = (r && r.response) || {};
      const said = (((res.speech || {}).plain || {}).speech) || "";
      this._toast(res.response_type === "error" ? T.snz_voice_off : said || T.snz_done);
    } catch (e) {
      this._toast(`✖ ${(e && e.message) || e}`);
    }
    snEnquireBust(800);
  }

  /** A link from another card (0.65.0): { snz: true } opens the pause panel. */
  _focus(d) {
    if (d && d.snz && this._config.snooze_panel !== false) { this._snzOpen = true; this._renderSnz(); }
  }

  /** clear_snoozes, said out loud with snooze_announce (0.64.0: one copy for tile and panel). */
  async _resumeAll() {
    const T = snT(this._config, this._hass);
    try {
      await this._hass.callWS({ type: "call_service", domain: "supernotify", service: "clear_snoozes", service_data: {}, return_response: true });
      this._toast(T.cleared);
      this._snzSpeak(this._snzText("resume_all"));
    } catch (e) {
      this._toast(`✖ ${(e && e.message) || e}`);
    }
    snEnquireBust(800);
  }

  /** 0.74.0: pauses through supernotify.snooze - when SuperNotify has it, unless snooze_via says otherwise. */
  _snzUseAction() {
    const v = this._config.snooze_via;
    if (v === "event" || v === "voice") return false;
    return snHasSnoozeAction(this._hass);
  }

  /** The panel's choice (or a pause in force, with `resume`) as supernotify.snooze data. */
  _snzData(st) {
    const scope = String(st.what || "NONCRITICAL").toLowerCase();
    const d = { scope };
    if (!["noncritical", "everything"].includes(scope)) d.name = st.target;
    if (st.who === "USER") d.person = st.person || this._myPerson();
    if (st.resume) d.command = "resume";
    else if (+st.min > 0) { d.command = "snooze"; d.minutes = +st.min; }
    else d.command = "silence";
    return d;
  }

  /** A pause from the panel: the action, or the event as before. */
  async _snzGo(st, msg) {
    if (!this._snzUseAction()) return this._snzFire(this._snzAction(st), msg);
    try {
      await snSnoozeCall(this._hass, this._snzData(st));
      this._toast(msg);
    } catch (e) {
      this._toast(`✖ ${(e && e.message) || e}`);
    }
    snEnquireBust(800);
  }

  /** The SUPERNOTIFY_... action name for a pause (or, with `resume`, for resuming it). */
  _snzAction(st) {
    const global = st.what === "NONCRITICAL" || st.what === "EVERYTHING";
    const tgt = global ? st.what : `${st.what}_${st.target}`;
    if (st.resume) return `SUPERNOTIFY_NORMAL_${st.who}_${tgt}`;
    return +st.min > 0 ? `SUPERNOTIFY_SNOOZE_${st.who}_${tgt}_${+st.min}` : `SUPERNOTIFY_SILENCE_${st.who}_${tgt}`;
  }

  async _snzFire(action, msg) {
    try {
      await this._hass.callApi("POST", "events/mobile_app_notification_action", { action });
      this._toast(msg);
    } catch (e) {
      this._toast(`✖ ${(e && e.message) || e}`);
    }
    snEnquireBust(800);
  }

  /** person.* linked to the logged-in user, for "only me" pauses. */
  _myPerson() {
    const uid = this._hass && this._hass.user && this._hass.user.id;
    if (!uid) return null;
    return Object.keys(this._hass.states).find((e) => e.startsWith("person.") &&
      (this._hass.states[e].attributes || {}).user_id === uid) || null;
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/control.md",
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

class SupernotifyOverviewCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("overview");
  }

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

  _onHass(hass, fresh, changed) {
    super._onHass(hass, fresh, changed);
    // connectedCallback may have run before hass: first data now, not at the first poll
    if (!this._booted) { this._booted = true; this._refresh(); }
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
    const failures = this._failures().n || 0;
    if (failures > 0) chips.push({ k: "crit", t: `✖ ${snPl(T, "h_failures", failures)}` });
    const trErr = this._scan("transport").filter((t) => {
      const st = this._hass.states[t.id];
      return st && st.state !== "unavailable" && +((st.attributes || {}).error_count || 0) > 0;
    });
    if (trErr.length) chips.push({ k: "crit", go: ["transports", { ids: trErr.map((t) => t.id) }], t: `⚠️ ${snPl(T, "h_transport_err", trErr.length)}`, title: trErr.map((t) => {
      const a = (this._hass.states[t.id] || {}).attributes || {};
      return a.last_error_message ? `${t.name}: ${a.last_error_message}` : t.name;
    }).join(" · ") });
    const ign = new Set((c.ignore || []).map((x) => String(x).toLowerCase()));
    const delsOff = snChannelsOff(this._hass, this._scan("delivery"), ign); // 0.74.0: switched off by hand
    if (delsOff.length) chips.push({ k: "off", go: ["deliveries", { ids: delsOff.map((d) => d.id) }], t: `🔕 ${snPl(T, "h_channels_off", delsOff.length)}`, title: delsOff.map((d) => snDeliveryAlias(this._hass, d.name) || d.name).join(", ") });
    if (c.quiet_entity && this._st(c.quiet_entity) === "on") chips.push({ k: "warn", t: `🌙 ${T.dnd} ${T.active}` });
    const snz = snLiveSnoozes(this._snoozes);
    const snzL = (x) => snSnoozeLabel(this._hass, x, T) + (snSnoozeReason(x, T) ? ` (${snSnoozeReason(x, T)})` : "");
    if (snz.length) chips.push({ k: "warn", go: ["control", { snz: true }],
      t: snz.length === 1 ? `😴 ${T.snoozed}: ${snSnoozeLabel(this._hass, snz[0], T)}` : `😴 ${snz.length} ${T.snoozed.toLowerCase()}`,
      title: snz.map(snzL).join(", ") });
    // 0.63.0: SuperNotify's own repairs (admin only), opened in Settings > Repairs
    const reps = this._repairs || [];
    if (reps.length) chips.push({ k: reps.some((r) => r.sev === "error" || r.sev === "critical") ? "crit" : "warn",
      t: `🛠 ${snPl(T, "h_repairs", reps.length)}`, title: reps.map((r) => r.title).join(" · "), href: "/config/repairs", nav: true });
    if (!chips.some((x) => x.k !== "ok" && x.k !== "off")) chips.unshift({ k: "ok", t: `✔ ${T.h_all_good}` });
    return chips;
  }

  connectedCallback() {
    const s = (this._config && this._config.poll_seconds) || 60;
    this._pollTimer = setInterval(() => this._refresh(), s * 1000);
    this._refresh();
    this._onRefresh = this._onRefresh || (() => this._refresh());
    window.addEventListener("supernotify-refresh", this._onRefresh);
    this._onArchive = this._onArchive || (() => { if (this._rendered) this._update(); });
    window.addEventListener("supernotify-archive", this._onArchive);
    // 0.65.0: a card that arrives later may hide the last notification or enable a link
    this._onCards = this._onCards || (() => {
      if (!this._rendered) return;
      const show = this._showLast();
      if (show !== this._lastShown) { this._render(); if (show) this._refresh(); } else this._update();
    });
    window.addEventListener("supernotify-cards", this._onCards);
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
    if (this._onRefresh) window.removeEventListener("supernotify-refresh", this._onRefresh);
    if (this._onArchive) window.removeEventListener("supernotify-archive", this._onArchive);
    if (this._onCards) window.removeEventListener("supernotify-cards", this._onCards);
  }

  // SuperNotify >= 2.4.0 (Live Scenarios): binary_sensor.supernotify_scenario_*
  // reports a real, reactive on/off state — read it directly instead of
  // waiting for the next enquire_active_scenarios poll. Returns null on
  // older versions (state stuck at "unknown"), so the caller falls back
  // to the polled count from _refresh().
  _activeScenarios() {
    return snActiveScenarioIds(this._hass);
  }

  async _ws(service, data) {
    const r = await snEnquire(this._hass, service, data);
    return (r && r.response) || {};
  }

  async _refresh() {
    if (!this._hass) return;
    try {
      const [act, last, snz, occ, rep] = await Promise.all([
        this._ws("enquire_active_scenarios"),
        !this._showLast() ? {} : this._ws("enquire_last_notification"),
        this._ws("enquire_snoozes"),
        this._config.occupancy === false ? {} : this._ws("enquire_occupancy").catch(() => ({})),
        this._config.repairs === false ? [] : snRepairsFetch(this._hass),
      ]);
      this._active = act.scenarios || [];
      this._last = last && Object.keys(last).length ? last : null;
      this._snoozes = snz.snoozes || [];
      this._occ = snOccupancy(this._hass, occ);
      this._repairs = rep || [];
      const meter = this._config.sent_today_entity && this._hass.states[this._config.sent_today_entity];
      this._daily = meter ? null : await snDailyCounts(this._hass, "sensor.supernotify_notifications", 2);
    } catch (e) {
      this._active = this._active || null;
      this._last = this._last || null;
      this._snoozes = this._snoozes || [];
    }
    if (this._rendered) this._update();
  }

  // 0.60.0: one row per delivery / transport (switch preferred over the deprecated
  // binary_sensor, so nothing is counted twice), named by its `name` attribute
  _scan(kind) {
    if (!this._hass) return [];
    return snEntityRows(this._hass, kind).map((r) => ({ id: r.id, name: r.name, state: this._hass.states[r.id].state }));
  }

  // 0.60.0: sensor.supernotify_failures only counts crashes inside SuperNotify, never a channel
  // that failed; with the native archive count the failed channel sends of today instead
  _failures() {
    if (this._hass && snArchiveNative(this._hass, this._config)) {
      snArchiveStore.ensure(this._hass, 40, this._config.trigger_entity);
      if (snArchiveStore.fetched) {
        const d0 = new Date(); d0.setHours(0, 0, 0, 0);
        let n = 0;
        for (const doc of snArchiveStore.docs) {
          const t = doc && doc.created ? new Date(doc.created) : null;
          if (t && t >= d0) n += +doc.failed || 0;
        }
        return { n, today: true };
      }
    }
    const v = this._st("sensor.supernotify_failures");
    return { n: v != null && v !== "unknown" && v !== "unavailable" ? +v || 0 : null, today: false };
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; container-type: inline-size; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
        /* 0.56.1: no hole in the grid - 4 numbers 2+2, 5 numbers 3+2 (one row when the card is wide) */
        .stats[data-n="4"] { grid-template-columns: repeat(2, 1fr); }
        .stats[data-n="5"] { grid-template-columns: repeat(6, 1fr); }
        .stats[data-n="5"] .stat { grid-column: span 2; }
        .stats[data-n="5"] .stat:nth-child(n+4) { grid-column: span 3; }
        @container (min-width: 620px) {
          .stats[data-n="4"] { grid-template-columns: repeat(4, 1fr); }
          .stats[data-n="5"] { grid-template-columns: repeat(5, 1fr); }
          .stats[data-n="5"] .stat, .stats[data-n="5"] .stat:nth-child(n+4) { grid-column: auto; }
        }
        .stat { border: 0; border-radius: 10px; padding: 12px 14px; background: ${p.soft}; }
        .stat .k { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; line-height: 1.35;
                   font-weight: 800; color: ${p.muted}; overflow-wrap: anywhere; }
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
        .lastmsg .t { color: ${p.muted}; font-size: 12.5px; margin-top: 3px; }
        .lastmsg .lt { font-size: 15px; font-weight: 600; overflow-wrap: anywhere; }
        .lastmsg .lmm { margin-top: 2px; line-height: 1.45; overflow-wrap: anywhere; white-space: pre-line;
                        display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
        .lastmsg .lmm.solo { margin-top: 0; font-size: 14px; }
        .lastmsg .lf { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 8px; }
        .lastmsg .badge { display: inline-flex; align-items: center; gap: 4px; }
        .whyb { margin-left: auto; border: 1.5px solid ${p.line}; background: ${p.panel}; color: ${p.brandD};
                border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .chip { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid ${p.line}; border-radius: 999px;
                padding: 5px 12px; font-size: 12px; font-weight: 650; margin: 0 6px 6px 0;
                background: ${p.soft}; color: ${p.brandD}; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 10px; }
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
        .hbt { font-size: 17px; font-weight: 700; } .hbs { font-size: 13px; margin-top: 2px; }
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
        .hgo { border: 0; background: none; font: inherit; cursor: pointer; }
        .chip.go { cursor: pointer; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="health" id="health"></div><div class="stats" id="stats"></div>
        ${!(this._lastShown = this._showLast()) ? "" : `<div class="sec">${snT(this._config, this._hass).last_notif}</div>
        <div class="lastmsg" id="last">—</div>`}
        ${this._config.occupancy === false ? "" : `<div class="sec">${snT(this._config, this._hass).occ_title}</div><div id="occ">—</div>`}
        <div class="sec">${snT(this._config, this._hass).act_scen}</div>
        <div id="scen">—</div>
        ${snVer(this._config, "overview", p)}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = snEsc;
    const sent = this._st("sensor.supernotify_notifications");
    const fail = this._failures();
    const failures = fail.n;
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
    } else if (this._daily && this._daily.today != null) {
      // 0.69.0: no utility meter - the long-term statistics of SuperNotify's own counter
      const yd = this._daily.yesterday;
      sentStat = stat("📨 " + T.sent_today, esc(this._daily.today), yd != null ? T.yesterday + ": " + esc(yd) : "");
    } else {
      sentStat = stat("📨 " + T.sent, sent != null ? esc(sent) : "—", T.since_startup);
    }
    const healthEl = this.shadowRoot.getElementById("health");
    let goesAll = [];
    if (healthEl) {
      let html = "";
      if (this._config.health === "chips") {
        html = this._health().map((h) => h.href
          ? `<a class="hc ${h.k}" href="${esc(h.href)}" target="_blank" rel="noopener">${esc(h.t)}</a>`
          : `<span class="hc ${h.k}"${h.title ? ` title="${esc(h.title)}"` : ""}>${esc(h.t)}</span>`).join("");
        html = html.replace(/ href="\/config\/repairs" target="_blank" rel="noopener"/g, ' href="/config/repairs" data-nav="1"');
      } else if (this._config.health) {
        // 0.52.0: one sentence on top, then what to look at, each with its detail and action
        goesAll = [];
        const all = this._health();
        const todo = all.filter((h) => h.k === "crit" || h.k === "warn" || h.k === "off");
        const fine = all.filter((h) => h.k === "ok" && !/^✔ (Tutto ok|All good)/.test(h.t));
        const chOn = T.h_ch_on.replace("{on}", delsOn).replace("{tot}", dels.length);
        const lvl = todo.some((h) => h.k === "crit") ? "crit" : todo.length ? "warn" : "ok";
        const head = todo.length
          ? (todo.length === 1 ? T.h_look_1 : T.h_look_n.replace("{n}", todo.length))
          : T.h_all_good;
        const sub = todo.length ? `${T.h_rest_ok}${dels.length ? " · " + chOn : ""}` : (dels.length ? chOn : "");
        const goes = [];
        const row = (h) => {
          const m = String(h.t).match(/^(\S+)\s+(.*)$/);
          const icon = m ? m[1] : "", text = m ? m[2] : h.t;
          return `<div class="hr ${h.k}"><span class="hi">${esc(icon)}</span>
            <div class="ht"><div>${esc(text)}</div>${h.title && !text.includes(h.title) ? `<div class="hd">${esc(h.title)}</div>` : ""}</div>
            ${h.href ? `<a class="ha" href="${esc(h.href)}"${h.nav ? ' data-nav="1"' : ' target="_blank" rel="noopener"'}>${esc(T.h_open)}</a>`
              : h.go && snCardReach(h.go[0]) ? `<button class="ha hgo" data-go="${goes.push(h.go) - 1}">${esc(T.go_open)} ›</button>` : ""}</div>`;
        };
        html = `<div class="hb ${lvl}"><span class="hbi">${lvl === "ok" ? "✔" : "⚠"}</span>
            <div><div class="hbt">${esc(head)}</div>${sub ? `<div class="hbs">${esc(sub)}</div>` : ""}</div></div>`
          + (todo.length || fine.length ? `<div class="hl">${todo.map(row).join("")}${fine.map(row).join("")}</div>` : "");
        goesAll = goes;
      }
      healthEl.innerHTML = snIconify(html, this && this._config);
      healthEl.querySelectorAll("a[data-nav]").forEach((a) => {
        a.onclick = (e) => { e.preventDefault(); snNavigate(a.getAttribute("href")); };
      });
      this._goes = goesAll;
      healthEl.querySelectorAll("[data-go]").forEach((b) => {
        b.onclick = () => { const g = this._goes[+b.dataset.go]; if (g) snGo(g[0], g[1]); };
      });
    }
    const statsEl = this.shadowRoot.getElementById("stats");
    statsEl.innerHTML =
      snIconify(sentStat +
      stat("⚠️ " + T.failures, failures != null ? esc(failures) : "—", fail.today ? T.fail_today : "", +failures > 0 ? p.crit : p.ok) +
      (this._config.stats === "full" ? stat("🎬 " + T.act_scen, act ? act.length : "—", "") : "") +
      stat("📤 " + T.deliveries, dels.length ? `${delsOn}/${dels.length}` : "—", T.enabled_total) +
      (this._config.stats !== "full" ? "" : stat("😴 " + T.snoozed, snz.length, snz.length && snz[0]._end ? T.until + " " + esc(String(snz[0]._end.getHours()).padStart(2, "0") + ":" + String(snz[0]._end.getMinutes()).padStart(2, "0")) : "", snz.length ? p.warn : undefined)), this && this._config);

    // 0.56.0: same reading as the control card - title, message, priority and "4 min ago",
    // channel counts, Why ›. `last_notification: false` hides the block (the control card has it).
    statsEl.dataset.n = statsEl.children.length;
    const lastEl = this.shadowRoot.getElementById("last");
    if (lastEl && this._last) {
      const n = this._last;
      const title = snPlainMsg(snNotifTitle(n));
      const msg = snPlainMsg(n.message).slice(0, 600);
      const prioCol = snPrioColor(p, n.priority);
      const d = n.created ? new Date(n.created) : null;
      const meta = [n.priority ? `<span style="color:${prioCol || p.muted};font-weight:600">● ${esc(T["prio_" + n.priority] || n.priority)}</span>` : "",
        d && !isNaN(d) ? `🕐 ${esc(snAgo(d, T))}` : ""].filter(Boolean).join(" · ");
      const { ok: okN, err: errN, skipped } = snLastDeliveries(this._hass, n);
      const chips = [];
      if (okN.length) chips.push(`<span class="badge b-ok" title="${esc(okN.join(", "))}">✔ ${snPl(T, "ln_delivered", okN.length)}</span>`);
      else if (+n.delivered > 0) chips.push(`<span class="badge b-ok">✔ ${snPl(T, "ln_delivered", +n.delivered)}</span>`);
      if (errN.length || +n.failed > 0) chips.push(`<span class="badge b-crit" title="${esc(errN.join(", "))}">✖ ${snPl(T, "ln_failed", errN.length || +n.failed)}</span>`);
      if (+n.missed > 0) chips.push(`<span class="badge" style="background:${p.warnSoft};color:${p.warnInk}">⚠ ${snPl(T, "missed_n", +n.missed)}</span>`);
      if (skipped) chips.push(`<span class="badge b-off">${snPl(T, "skipped_n", skipped)}</span>`);
      const why = n.id && window.__snWhyCards ? `<button class="whyb" id="whyBtn">${esc(T.ln_why)} ›</button>` : "";
      lastEl.innerHTML = snIconify(`${title ? `<div class="lt">${esc(title)}</div>` : ""}
        <div class="lmm${title ? "" : " solo"}">${esc(msg || "—")}</div>
        ${meta ? `<div class="t">${meta}</div>` : ""}
        <div class="lf">${chips.join("")}${why}</div>`, this && this._config);
      const wb = lastEl.querySelector("#whyBtn");
      if (wb) wb.onclick = () => snWhyOpen(n.id);
    } else if (lastEl) {
      lastEl.textContent = "—";
    }

    const occEl = this.shadowRoot.getElementById("occ");
    if (occEl) {
      const o = this._occ;
      occEl.innerHTML = o ? snIconify(`<div style="display:flex;flex-wrap:wrap;align-items:flex-start">`
        + `<span class="badge ${o.home.length ? "b-ok" : "b-off"}" style="padding:7px 12px;margin:0 6px 6px 0">${esc(T["occ_" + o.state] || o.state)}</span>`
        + o.home.map((n) => `<span class="chip${snCardReach("recipients") ? " go" : ""}" data-gor="1">🏠 ${esc(n)}</span>`).join("")
        + o.away.map((n) => `<span class="chip${snCardReach("recipients") ? " go" : ""}" data-gor="1" style="color:${p.muted}">🚶 ${esc(n)}</span>`).join("") + `</div>`, this && this._config) : "—";
      if (o && snCardReach("recipients")) occEl.querySelectorAll("[data-gor]").forEach((c) => { c.onclick = () => snGo("recipients", { persons: o.ids }); });
    }
    this.shadowRoot.getElementById("scen").innerHTML = snIconify(act && act.length
      ? act.map((s) => this._scenChip(s)).join("")
      : `<span class="badge b-off">${T.none}</span>`, this && this._config);
    if (snCardReach("scenarios")) this.shadowRoot.getElementById("scen").querySelectorAll("[data-gos]").forEach((c) => {
      c.onclick = () => snGo("scenarios", { names: [c.dataset.gos] });
    });
  }

  /**
   * 0.65.0: the last notification is shown here unless a control card on the same page already
   * shows it. `last_notification: true | false` decides instead.
   */
  _showLast() {
    const v = this._config.last_notification;
    if (v === true || v === false) return v;
    return !snCardOn("control", (c) => c._config && c._config.last_notification);
  }

  /** A link from this card: show it in the card of that kind (0.65.0). */
  _focus() { /* nothing to show in the overview */ }

  /**
   * 0.78.0: an active scenario chip says what it silences or turns down, and its conditions as
   * tooltip (enquire_active_scenarios trace, shared with the scenarios card).
   */
  _scenChip(s) {
    const esc = snEsc;
    const T = snT(this._config, this._hass);
    const key = snScenarioKey(s);
    const st = this._hass.states[`switch.supernotify_scenario_${key}`] || this._hass.states[`binary_sensor.supernotify_scenario_${key}`];
    const redraw = () => { if (this.shadowRoot) this._update(); };
    const actNames = [...(snActive.names || [key])];
    const eff = st ? snEffectShort(snScenarioEffects(this._hass, st.attributes || {}, key, actNames, redraw)) : "";
    const tr = snTraceEnsure(this._hass, redraw);
    const cl = snScenarioCondLine(this._hass, T, tr && tr[key]);
    const tip = [cl ? `${T.sc_when}: ${cl.text}` : "", eff].filter(Boolean).join("\n");
    const p = this._palette();
    return `<span class="chip${snCardReach("scenarios") ? " go" : ""}" data-gos="${esc(key)}"${tip ? ` title="${esc(tip)}"` : ""}>🎬 ${esc(this._scenLabel(s))}${eff ? `<span style="color:${p.muted};font-weight:500"> · ${esc(eff)}</span>` : ""}</span>`;
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/overview.md",
  name: "SuperNotify Overview Card",
  description: "Dashboard overview for SuperNotify: health strip (version, failures, transport errors, DND, snoozes), sent/failure counters, active scenarios, last notification.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-bands-card — time bands editor
 * One row per band: icon, name, active range, "now" badge on the active
 * band, inline start-time input (input_datetime) and volume slider
 * (input_number). Mirrors the prototype's "Fasce" page.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyBandsCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("bands");
  }

  // card picker (0.57.0): helpers named like the README's (…start_<band> + …<band>_volume)
  static getStubConfig(hass) {
    const st = (hass && hass.states) || {};
    const bands = {};
    for (const id of Object.keys(st)) {
      const m = id.match(/^input_datetime\.(\w*?)start_(\w+)$/);
      if (!m) continue;
      const vol = `input_number.${m[1]}${m[2]}_volume`;
      if (st[vol]) bands[m[2]] = { start: id, volume: vol };
    }
    return { bands };
  }

  setConfig(config) {
    if (!config || (config.bands != null && typeof config.bands !== "object"))
      throw new Error("bands: {name: {start: input_datetime.x, volume: input_number.y}}");
    config = { ...config, bands: config.bands || {} }; // 0.57.0: no bands yet = a hint, not an error
    this._config = { style: "supernotify", ...config };
    this._rendered = false;
  }

  getCardSize() {
    return 1 + Object.keys(this._config.bands).length;
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
        name: snBandName(snT(this._config, this._hass), key, b.name),
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
      // the day starts at 04:00, so a band starting after midnight (late night) comes last
      if (x.min === null) return y.min === null ? 0 : 1;
      if (y.min === null) return -1;
      const d = (m) => (m - 240 + 1440) % 1440;
      return d(x.min) - d(y.min);
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
    if (!Object.keys(this._config.bands).length) {
      const T = snT(this._config, this._hass);
      this.shadowRoot.innerHTML = snIconify(`<ha-card style="padding:16px;background:${p.panel};color:${p.ink}">
        <div style="font-weight:700;font-size:15px">🕐 ${T.bands_empty_t}</div>
        <div style="color:${p.muted};font-size:13px;line-height:1.5;margin-top:6px">${T.bands_empty}</div>
        <pre style="background:${p.soft};border-radius:10px;padding:10px 12px;font-size:12px;margin:10px 0 0;overflow:auto">bands:
  morning:
    start: input_datetime.notifier_start_morning
    volume: input_number.notifier_morning_volume</pre></ha-card>`, this._config);
      return;
    }
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        /* 0.59.0: one line per band - name and end, start time, volume slider, percent */
        .row { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(80px, 1fr) 42px;
               align-items: center; gap: 12px; padding: 10px 8px; border-radius: 12px; position: relative; }
        .row + .row::before { content: ""; position: absolute; left: 8px; right: 8px; top: 0;
               border-top: 1px solid ${p.line}; pointer-events: none; }
        .row.act::before, .row.act + .row::before { display: none; }
        @container (max-width: 380px) {
          .row { grid-template-columns: auto minmax(0, 1fr) 42px; row-gap: 6px; }
          .who { grid-column: 1 / -1; }
        }
        .pct { font-weight: 800; font-size: 14px; text-align: right; font-variant-numeric: tabular-nums; }
        .row.act { background: ${p.okSoft}; }
        .row.act .badge { background: ${p.panel}; }
        .who { min-width: 0; }
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
        .volwrap { min-width: 0; }
        input[type=range] { width: 100%; accent-color: ${p.brand}; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
        ${SN_FLOW_CSS}
        .flow { column-gap: 22px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        <div class="hint">🔇 ${snT(this._config, this._hass).mute_hint}</div>
        ${snVer(this._config, "bands", p)}
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
    if (!rows) return; // 0.68.0: nothing drawn yet (no bands configured)

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
          <div class="rng">${T.until} ${next.hhmm || "\u2014"}${i === bands.length - 1 ? " \u00b7 " + T.crosses : ""}</div>
        </div>
        <input type="time" value="${b.hhmm}" data-e="${b.start}" aria-label="${b.name} - ${T.start}" title="${T.start}">
        <input type="range" class="volwrap" min="0" max="100" value="${b.vol != null ? b.vol : 0}" data-e="${b.volume || ""}" data-k="${b.key}" aria-label="${b.name} - ${T.volume}" title="${T.volume}">
        <span class="pct"><span data-l="${b.key}">${b.vol != null ? b.vol : "\u2014"}</span>%</span>
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
        rng.textContent = `${T.until} ${next.hhmm || "\u2014"}`
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/bands.md",
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

// readable transport names (0.59.0); a transport not listed keeps its technical name
const SN_TRANSPORT_LABELS = {
  alexa_devices: "Alexa", alexa_media_player: "Alexa Media Player", chime: "Chime", email: "Email",
  mobile_push: "Mobile app", persistent: "Home Assistant", sms: "SMS", telegram: "Telegram", tts: "Text to speech",
  media: "Media player", notify_entity: "Notify entity", generic: "Notify action", pushover: "Pushover", ntfy: "ntfy",
  gotify: "Gotify", matrix: "Matrix", discord: "Discord", html5: "HTML5 push", kodi: "Kodi", google_cast: "Google Cast",
  mqtt: "MQTT", whatsapp: "WhatsApp", signal: "Signal",
};

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

class SupernotifyDeliveriesCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("deliveries");
  }

  static getStubConfig() {
    return { hide_defaults: true };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { hide_defaults: true, style: "supernotify", ...config };
    this._rendered = false;
  }

  getCardSize() {
    return 8;
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

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; position: relative;
               cursor: pointer; border-radius: 8px; }
        .row + .row::before { content: ""; position: absolute; left: 8px; right: 8px; top: 0;
               border-top: 1px solid ${p.line}; pointer-events: none; }
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
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
        ${snDetailCss(p)}
        ${snDryCss(p)}
        .dprobe { margin: 6px 0 2px; border: 1.5px solid ${p.brand}; background: ${p.panel}; color: ${p.brandD}; border-radius: 999px;
                  padding: 7px 14px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; min-height: 36px; }
        .dres { cursor: default; }
        .mid .tr { margin-top: 2px; }
        .st.warn { color: ${p.warn}; font-weight: 600; } .st.crit { color: ${p.crit}; font-weight: 600; }
        .st.ok { color: ${p.ok}; font-weight: 600; }
        .tag { color: ${p.muted}; background: transparent; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${snVer(this._config, "deliveries", p)}
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

  /** 0.66.0: a dry run through this channel only - SuperNotify says if it would send, to whom, or why not. */
  async _runProbe(name) {
    const T = snT(this._config, this._hass);
    this._probe = this._probe || {};
    this._probe[name] = "…";
    this._update();
    try {
      const doc = await snDryRun(this._hass, { message: T.probe_msg, delivery_selection: "fixed", delivery: { [name]: {} } });
      this._probe[name] = snDryHtml(this._hass, T, doc, false);
    } catch (e) {
      this._probe[name] = `✖ ${snEsc((e && (e.message || e.code)) || e)}`;
    }
    this._update();
  }

  /** A link from another card (0.65.0): open these rows. */
  _focus(d) {
    if (!d || !d.ids) return;
    this._open = new Set(d.ids);
    this._update();
    snFlash(this, '.row[aria-expanded="true"]');
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = snEsc;
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const dels = this._deliveries();
    const rows = this.shadowRoot.getElementById("rows");
    if (!dels.length) {
      rows.innerHTML = snIconify(`<span class="badge b-off">${T.no_deliveries}</span>`, this && this._config);
      return;
    }
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
      if (!d.on) { state = snOverridden(d.a) === false ? T.off_config : T.off_manual; }
      else if (d.a.transport_enabled === false) { state = `⛔ ${T.transport_off}`; cls = "crit"; }
      else {
        const fx = this._scenarioEffect(d.name);
        if (fx.off.length) { state = `${T.paused_by} ${fx.off.join(", ")}`; cls = "warn"; }
        else if (fx.on.length && this._group(d) === "scen") { state = `${T.on_by} ${fx.on.join(", ")}`; cls = "ok"; }
      }
      const tags = [];
      if (snOverridden(d.a) && d.on) tags.push(snHandTag(d.a, T)); // 0.75.0: switched on by hand
      // 0.77.0: per-delivery fallback (SuperNotify `fallback:` list on the switch)
      const fbName = (n) => snDeliveryAlias(this._hass, n) || n;
      if (Array.isArray(d.a.fallback) && d.a.fallback.length) tags.push(`🛟 ${T.fb_list} ${d.a.fallback.map(fbName).join(", ")}`);
      const fbOf = dels.filter((o) => Array.isArray(o.a.fallback) && o.a.fallback.includes(d.name)).map((o) => fbName(o.name));
      if (fbOf.length) tags.push(`🛟 ${T.fb_for} ${fbOf.join(", ")}`);
      if (d.a.action) tags.push(`⚙️ ${d.a.action}`);
      const tgt = d.a.target;
      const nTgt = Array.isArray(tgt) ? tgt.length : tgt && typeof tgt === "object" ? Object.keys(tgt).length : tgt ? 1 : 0;
      if (nTgt) tags.push(`🎯 ${nTgt} ${T.fixed_targets}`);
      if (d.a.target_usage && d.a.target_usage !== "no_action") tags.push(`↔️ ${d.a.target_usage}`);
      if (SN_NATIVE_TARGET_TRANSPORTS.includes(tr)) tags.push(T.native_target_tag);
      const meta = [state ? `<span class="st ${cls}">${esc(state)}</span>` : "",
        snTech(tech, alias || d.name), tr && !snSame(tr, d.name) && !snSame(tr, alias) ? snTech(tr, "") : ""].filter(Boolean).join(" · ");
      const open = this._open && this._open.has(d.id);
      const det = open ? snDetailHtml([
        [T.det_transport, tr || undefined],
        [T.det_action, d.a.action || undefined],
        [T.det_target, snTargetList(d.a.target)],
        [T.det_target_req, d.a.target_required || undefined],
        [T.det_target_use, d.a.target_usage || undefined],
        [T.det_inclusion, d.a.inclusion || undefined],
        [T.det_select, d.a.selection_rank || undefined],
        ...Object.entries(d.a.options || {}).map(([k, v]) => [k, v, true]),
        [T.det_data, d.a.data && Object.keys(d.a.data).length ? d.a.data : undefined],
        [T.det_debug, d.a.debug ? true : undefined],
      ], T, this._config, this._hass) + (snDryAvailable(this._hass, this._config)
        ? `<button class="dprobe" data-n="${esc(d.name)}">▶ ${esc(T.dl_probe)}</button>${this._probe && this._probe[d.name] ? `<div class="dryBox dres">${this._probe[d.name]}</div>` : ""}` : "") : "";
      return `<div class="row${d.on ? "" : " dim"}" data-i="${i}" aria-expanded="${open ? "true" : "false"}">
        <span class="em">${em}</span>
        <div class="mid"><b>${esc(alias || d.name)}</b>
          <div class="tr">${meta}</div>
          ${tags.length ? `<div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
          ${det}
        </div><span class="chev" aria-hidden="true">${open ? "▴" : "▾"}</span>
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
    // 0.65.0: "undo the changes made by hand" lives in the tools card (all or one kind)
    rows.innerHTML = snIconify(head + body, this && this._config);
    // 0.63.0: a tap opens the detail; "All attributes" opens HA's dialog
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = (e) => {
        if (e.target.closest(".sw")) return;
        const id = dels[+node.dataset.i].id;
        if (e.target.closest(".dmore")) { this._moreInfo(id); return; }
        const pb = e.target.closest(".dprobe");
        if (pb) { this._runProbe(pb.dataset.n); return; }
        if (e.target.closest(".det") || e.target.closest(".dres")) return;
        this._open = this._open || new Set();
        if (this._open.has(id)) this._open.delete(id); else this._open.add(id);
        this._update();
      };
    });
    rows.querySelectorAll(".sw").forEach((label) => {
      label.addEventListener("click", (e) => e.stopPropagation());
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        snToggle(this._hass, label.dataset.id, input.checked);
      });
    });
  }
}

customElements.define("supernotify-deliveries-card", SupernotifyDeliveriesCard);

window.customCards.push({
  type: "supernotify-deliveries-card",
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/deliveries.md",
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

class SupernotifyTransportsCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("transports");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
  }

  getCardSize() {
    return 6;
  }

  /** A link from another card (0.65.0): open these rows. */
  _focus(d) {
    if (!d || !d.ids) return;
    this._open = new Set(d.ids);
    this._update();
    snFlash(this, '.row[aria-expanded="true"]');
  }

  _transports() {
    const out = snEntityRows(this._hass, "transport");
    out.sort((x, y) => (x.on === y.on ? x.name.localeCompare(y.name) : x.on ? -1 : 1));
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
        .row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; position: relative;
               cursor: pointer; border-radius: 8px; }
        .row + .row::before { content: ""; position: absolute; left: 8px; right: 8px; top: 0;
               border-top: 1px solid ${p.line}; pointer-events: none; }
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
        ${snDetailCss(p)}
        .det { background: ${p.panel}; border: 1px solid ${p.line}; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${snVer(this._config, "transports", p)}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = snEsc;
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const trs = this._transports();
    const rows = this.shadowRoot.getElementById("rows");
    if (!trs.length) {
      rows.innerHTML = snIconify(`<span class="badge b-off">${T.no_transports}</span>`, this && this._config);
      return;
    }
    rows.innerHTML = snIconify(trs.map((t, i) => {
      const em = SN_TRANSPORT_ICONS[t.name] || "🔌";
      const tags = [];
      if (snHandTag(t.a, T, true)) tags.push(snHandTag(t.a, T, true)); // 0.75.0
      const errCount = +t.a.error_count || 0;
      if (errCount > 0) tags.push(`<span class="tag err">⚠️ ${errCount}${t.a.last_error_at ? ` · ${esc(snWhen(t.a.last_error_at))}` : ""} · ${esc(t.a.last_error_message || "")}</span>`);
      let alias = snCleanName(t.a.friendly_name, t.name);
      if (/Transport Adaptor$/i.test(alias)) alias = "";
      const label = alias || SN_TRANSPORT_LABELS[t.name] || t.name;
      const used = snEntityRows(this._hass, "delivery").filter((d) => d.a && d.a.transport === t.name).length;
      const use = used ? `${T.tr_used} ${snPl(T, "channels", used)}` : T.tr_unused;
      const open = this._open && this._open.has(t.id);
      const dd = t.a.delivery_defaults || {};
      const det = open ? snDetailHtml([
        [T.det_err_last, t.a.last_error_at ? snWhen(t.a.last_error_at) : undefined, false, "err"],
        [T.det_err_in, t.a.last_error_in || undefined, false, "err"],
        [T.det_err_n, errCount || undefined, false, "err"],
        [T.det_action, dd.action || undefined],
        [T.det_target, snTargetList(dd.target)],
        [T.det_target_req, dd.target_required || undefined],
        [T.det_target_use, dd.target_usage || undefined],
        [T.det_inclusion, dd.inclusion || undefined],
        [T.det_prio, dd.priority || undefined],
        [T.det_occ, dd.occupancy && dd.occupancy !== "all" ? dd.occupancy : undefined],
        ...Object.entries(dd.options || {}).map(([k, v]) => [k, v, true]),
        [T.det_data, dd.data && Object.keys(dd.data).length ? dd.data : undefined],
      ], T, this._config, this._hass) : "";
      return `<div class="row" data-i="${i}" aria-expanded="${open ? "true" : "false"}">
        <span class="em">${em}</span>
        <div class="mid"><b>${esc(label)}</b>
          <div class="sub">${[snTech(t.name, label), esc(use)].filter(Boolean).join(" · ")}</div>
          ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
          ${det}
        </div><span class="chev" aria-hidden="true">${open ? "▴" : "▾"}</span>
        <label class="sw" data-id="${esc(t.id)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${t.on ? "checked" : ""} aria-label="${esc(t.name)}">
          <span class="sl"></span>
        </label>
      </div>`;
    }).join(""), this && this._config);
    // 0.63.0: a tap opens the detail; "All attributes" opens HA's dialog
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = (e) => {
        if (e.target.closest(".sw")) return;
        const id = trs[+node.dataset.i].id;
        if (e.target.closest(".dmore")) { this._moreInfo(id); return; }
        if (e.target.closest(".det")) return;
        this._open = this._open || new Set();
        if (this._open.has(id)) this._open.delete(id); else this._open.add(id);
        this._update();
      };
    });
    rows.querySelectorAll(".sw").forEach((label) => {
      label.addEventListener("click", (e) => e.stopPropagation());
      const input = label.querySelector("input");
      input.addEventListener("change", () => {
        snToggle(this._hass, label.dataset.id, input.checked);
      });
    });
  }
}

customElements.define("supernotify-transports-card", SupernotifyTransportsCard);

window.customCards.push({
  type: "supernotify-transports-card",
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/transports.md",
  name: "SuperNotify Transports Card",
  description: "Transport adaptors dashboard: auto-discovered rows with icon, error tag if any, and a live on/off switch.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-recipients-card — recipients dashboard
 * Auto-discovers the recipient entities SuperNotify exposes: name, home
 * state from the linked person entity, contact tags (email, phone, mobile
 * devices, delivery overrides) and enabled badge. Tap for full attributes.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyRecipientsCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("recipients");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
  }

  getCardSize() {
    return 4;
  }

  _recipients() {
    // SuperNotify >= 2.7.0 has both switch.* (the real control) and a
    // deprecated binary_sensor.* mirror per recipient: one row each,
    // switch preferred; binary_sensor only on older versions.
    const out = snEntityRows(this._hass, "recipient");
    out.sort((x, y) => (x.on === y.on ? x.name.localeCompare(y.name) : x.on ? -1 : 1));
    return out;
  }

  /** A link from another card (0.65.0): outline these people. */
  _focus(d) {
    const ps = ((d && d.persons) || []).filter(Boolean);
    if (ps.length) snFlash(this, ps.map((n) => `.row[data-person="${CSS.escape(n)}"]`).join(","));
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
        .row { display: flex; align-items: center; gap: 12px; padding: 10px 8px; position: relative;
               cursor: pointer; border-radius: 8px; }
        .row + .row::before { content: ""; position: absolute; left: 8px; right: 8px; top: 0;
               border-top: 1px solid ${p.line}; pointer-events: none; }
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
        .last { margin-top: 5px; font-size: 11.5px; color: ${p.muted}; cursor: pointer; }
        .last b { color: ${p.ink}; text-transform: none; }
        .last.none { cursor: default; opacity: .7; }
        button.tag { font: inherit; font-size: 11px; font-weight: 650; cursor: pointer; }
        .devs { margin-top: 6px; display: flex; flex-direction: column; gap: 3px; }
        .dv { font-size: 12px; } .dv b { font-size: 12.5px; text-transform: none; margin-right: 6px; } .dv span { color: ${p.muted}; }
        .tst { margin-top: 7px; border: 1.5px solid ${p.line}; background: ${p.panel}; color: ${p.brandD}; border-radius: 999px;
               padding: 4px 12px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; min-height: 30px; }
        .tst.arm { background: ${p.brand}; border-color: ${p.brand}; color: ${p.onBrand}; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${snVer(this._config, "recipients", p)}
      </ha-card>`, this && this._config);
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = snEsc;
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
      const hand = snHandTag(r.a, T, true); // 0.75.0
      if (r.a.email) tags.push(`✉️ ${r.a.email}`);
      if (r.a.phone_number) tags.push(`💬 ${r.a.phone_number}`);
      const nDev = Array.isArray(r.a.mobile_devices) ? r.a.mobile_devices.length : 0;
      if (nDev) tags.push(`<button class="tag devb" data-dev="${esc(r.name)}" aria-expanded="${this._openDev && this._openDev.has(r.name) ? "true" : "false"}">📱 ${snPl(T, "devices", nDev)} ${this._openDev && this._openDev.has(r.name) ? "▴" : "▾"}</button>`);
      const nOvr = r.a.delivery && typeof r.a.delivery === "object" ? Object.keys(r.a.delivery).length : 0;
      if (nOvr) tags.push(`🔗 ${snPl(T, "overrides", nOvr)}`);
      if (!tags.length) tags.push(`<span class="tag warn">⚠️ ${T.no_contact}</span>`);
      if (hand) tags.unshift(hand);
      const alias = snCleanName(r.a.friendly_name, r.name);
      const last = this._lastNotified(r.name);
      const lastHtml = last
        ? `<div class="last" data-why="${esc(last.id || "")}" data-ent="${esc(last.entity)}">🔔 ${esc(T.last_notified)}: <b>${esc(snAgo(last.when, T))}</b>${last.title ? ` · ${esc(last.title)}` : ""}</div>`
        : (this._hass.states[`notify.recipient_${r.name}`] ? `<div class="last none">🔕 ${esc(T.never_notified)}</div>` : "");
      return `<div class="row" data-i="${i}" data-person="${esc(r.a.entity_id || r.a.person || "")}">
        <span class="em">👤</span>
        <div class="mid"><b>${esc(alias || r.name)}</b>
          <span class="sub">${esc(personId || "")}${pState !== undefined ? (home ? " · 🏠 " + T.home : " · 🚗 " + T.away) : ""}</span>
          <div class="tags">${tags.map((t) => t.startsWith("<") ? t : `<span class="tag">${esc(t)}</span>`).join("")}</div>
          ${nDev && this._openDev && this._openDev.has(r.name) ? `<div class="devs">${r.a.mobile_devices.map((d) => {
            const model = [d.manufacturer, d.model].filter(Boolean).join(" ");
            const os = [d.os_name, d.os_version].filter(Boolean).join(" ");
            return `<div class="dv"><b>${esc(d.device_name || d.mobile_app_id || "?")}</b><span>${esc([model, os, d.app_version ? "app " + d.app_version : ""].filter(Boolean).join(" · "))}</span></div>`;
          }).join("")}</div>` : ""}
          ${lastHtml}
          ${this._hass.states[`notify.recipient_${r.name}`] ? `<button class="tst${this._armed === r.name ? " arm" : ""}" data-tst="${esc(r.name)}">${this._armed === r.name ? "✉️ " + esc(T.rc_test_confirm) : "✉️ " + esc(T.rc_test)}</button>` : ""}
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
        if (e.target.closest(".sw") || e.target.closest(".devb") || e.target.closest(".tst")) return;
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
    // 0.62.0: the person's devices (model, system, app version) on request
    rows.querySelectorAll(".devb").forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        this._openDev = this._openDev || new Set();
        const n = b.dataset.dev;
        if (this._openDev.has(n)) this._openDev.delete(n); else this._openDev.add(n);
        this._update();
      };
    });
    // 0.62.0: test message through the whole pipeline (scenarios, snoozes, dupe check), two taps
    rows.querySelectorAll(".tst").forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const n = b.dataset.tst;
        if (this._armed !== n) {
          this._armed = n;
          clearTimeout(this._armT);
          this._armT = setTimeout(() => { this._armed = null; this._update(); }, 4000);
          this._update();
          return;
        }
        this._armed = null;
        clearTimeout(this._armT);
        const T2 = snT(this._config, this._hass);
        const when = new Date();
        this._hass.callService("notify", "send_message", {
          entity_id: `notify.recipient_${n}`, title: T2.rc_test_title,
          message: `${T2.rc_test_msg} ${String(when.getHours()).padStart(2, "0")}:${String(when.getMinutes()).padStart(2, "0")}`,
        }).then(() => { this._sent = n; this._update(); setTimeout(() => { this._sent = null; this._update(); }, 4000); })
          .catch((err) => { this._sentErr = `${n}: ${(err && err.message) || err}`; this._update(); });
        snEnquireBust(1500);
      };
    });
    if (this._sent || this._sentErr) {
      const tb = this._sent && rows.querySelector(`.tst[data-tst="${this._sent}"]`);
      if (tb) tb.textContent = "✔ " + T.rc_test_sent;
      if (this._sentErr) { rows.insertAdjacentHTML("afterbegin", `<div class="tag warn">${esc(this._sentErr)}</div>`); this._sentErr = null; }
    }
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/recipients.md",
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

class SupernotifyScenariosCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("scenarios");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { poll_seconds: 60, style: "supernotify", groups: null, ...(config || {}) };
    this._rendered = false;
  }

  _onHass(hass, fresh, changed) {
    super._onHass(hass, fresh, changed);
    // connectedCallback may have run before hass: first data now, not at the first poll
    if (!this._booted) { this._booted = true; this._refresh(); }
  }

  getCardSize() {
    return 10;
  }

  connectedCallback() {
    const s = (this._config && this._config.poll_seconds) || 60;
    this._pollTimer = setInterval(() => this._refresh(), s * 1000);
    this._refresh();
    this._onRefresh = this._onRefresh || (() => this._refresh());
    window.addEventListener("supernotify-refresh", this._onRefresh);
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
    if (this._onRefresh) window.removeEventListener("supernotify-refresh", this._onRefresh);
  }

  async _refresh() {
    if (!this._hass) return;
    try {
      const r = await snEnquire(this._hass, "enquire_active_scenarios");
      this._active = (r && r.response && r.response.scenarios) || [];
    } catch (e) { /* retry on next poll */ }
    this._loadTrace();
    if (this._rendered) this._update();
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
    snActiveEnsure(this._hass);
    if (snActive.names) return all.filter((s) => snActive.names.has(s.name) && s.enabled).map((s) => s.name);
    const known = all.filter((s) => !["unknown", "unavailable"].includes(s.state));
    if (!known.length) return null;
    return known.filter((s) => s.state === "on" && s.enabled).map((s) => s.name);
  }

  /** enquire_active_scenarios with trace: true, read when a row opens (at most every 30 s). */
  _loadTrace() {
    // 0.78.0: shared by the cards (snTraceEnsure) and read at every refresh, not only on a tap
    this._trace = snTraceEnsure(this._hass, () => { this._trace = snTrace.map; if (this._rendered) this._update(); }) || this._trace;
  }

  /** What a scenario changes: two dry runs, with and without it, compared channel by channel. */
  async _runDiff(name, isAct) {
    const T = snT(this._config, this._hass);
    this._diff = this._diff || {};
    this._diff[name] = "…";
    this._update();
    try {
      const act = [...(snActive.names || [])];
      const msg = { message: T.probe_msg };
      const base = await snDryRun(this._hass, msg);
      const other = isAct
        ? await snDryRun(this._hass, { ...msg, constrain_scenarios: act.filter((n) => n !== name).length ? act.filter((n) => n !== name) : ["__none__"] })
        : await snDryRun(this._hass, { ...msg, apply_scenarios: [name] });
      const a = snDrySending(base), b = snDrySending(other);
      const add = [...b].filter((x) => !a.has(x)), rem = [...a].filter((x) => !b.has(x));
      const nm = (x) => snEsc(snDeliveryAlias(this._hass, x) || x);
      this._diff[name] = `<div class="wh">${snEsc(isAct ? T.sc_diff_off : T.sc_diff_on)}</div>`
        + add.map((x) => `<div class="wl y">+ ${snEsc(T.sc_diff_add)} ${nm(x)}</div>`).join("")
        + rem.map((x) => `<div class="wl n">− ${snEsc(T.sc_diff_rem)} ${nm(x)}</div>`).join("")
        + (add.length || rem.length ? "" : `<div class="wl q">${snEsc(T.sc_diff_none)}</div>`);
    } catch (e) {
      this._diff[name] = `✖ ${snEsc((e && (e.message || e.code)) || e)}`;
    }
    this._update();
  }

  _detailHtml(s, isAct) {
    const T = snT(this._config, this._hass);
    const esc = snEsc;
    const sc = this._trace && this._trace[s.name];
    let h = `<div class="det"><div class="dsec">${esc(T.sc_why)}</div>`;
    h += s.manual ? `<div class="wl">${esc(T.sc_manual_why)}</div>` : sc ? snScenarioWhyHtml(this._hass, T, sc, isAct) : `<div class="wl q">…</div>`;
    if (snDryAvailable(this._hass, this._config)) {
      h += `<button class="sdiff" data-act="${isAct ? 1 : 0}">${esc(isAct ? T.sc_diff_btn_off : T.sc_diff_btn_on)}</button>`;
      if (this._diff && this._diff[s.name]) h += `<div class="sdres">${this._diff[s.name]}</div>`;
    }
    return h + `<button class="dmore">${esc(T.det_more)} ›</button></div>`;
  }

  /** A link from another card (0.65.0): outline these scenarios. */
  _focus(d) {
    const names = (d && d.names) || [];
    if (names.length) snFlash(this, names.map((n) => `.row[data-name="${CSS.escape(n)}"]`).join(","));
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
        .row { display: flex; align-items: center; gap: 12px; padding: 9px 8px; position: relative;
               cursor: pointer; border-radius: 8px; }
        .row + .row::before { content: ""; position: absolute; left: 8px; right: 8px; top: 0;
               border-top: 1px solid ${p.line}; pointer-events: none; }
        .row.act { background: ${p.okSoft}; }
        .row.act .badge { background: ${p.panel}; }
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
        .tag.mod { color: ${p.brandD}; }
        .tag.warn { color: ${p.warn || "#b26a00"}; border-color: ${p.warn || "#b26a00"}; }
        .cond { margin-top: 2px; font-size: 11.5px; color: ${p.muted}; line-height: 1.4; }
        .cond .y { color: ${p.ok}; } .cond .n { color: ${p.crit}; }
        .cwarn { margin-top: 3px; font-size: 11.5px; font-weight: 650; color: ${p.warn || "#b26a00"}; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750;
                 flex-shrink: 0; }
        .b-act { background: rgba(46,158,91,.16); color: ${p.ok}; }
        .b-dis { background: rgba(226,60,60,.10); color: ${p.crit}; }
        .row.dis .mid { opacity: .55; }
        .mlbl { font-size: 10.5px; color: ${p.muted}; flex-shrink: 0; }
        .apb { flex-shrink: 0; border: 1.5px solid ${p.brand}; background: ${p.panel}; color: ${p.brandD}; border-radius: 999px;
               padding: 6px 12px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; min-height: 32px; }
        .apb.on { background: ${p.ok}; border-color: ${p.ok}; color: #fff; }
        ${snDetailCss(p)}
        .det { cursor: default; }
        .dsec { font-size: 11px; letter-spacing: .05em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; margin-bottom: 4px; }
        .wh { font-weight: 700; margin: 2px 0 4px; }
        .wl { padding: 2px 0; } .wl.y { color: ${p.ok}; } .wl.n { color: ${p.crit}; } .wl.q, .wq { color: ${p.muted}; }
        .sdiff { margin: 8px 0 2px; border: 1.5px solid ${p.brand}; background: ${p.panel}; color: ${p.brandD}; border-radius: 999px;
                 padding: 7px 14px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; min-height: 36px; }
        .sdres { margin-top: 6px; }
        ${SN_SWITCH_CSS}
        ${SN_FLOW_CSS}
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows" class="flow"></div>
        ${snVer(this._config, "scenarios", p)}
      </ha-card>`, this && this._config);
    this._update();
  }

  _rowHtml(s, i, active) {
    const esc = snEsc;
    const T = snT(this._config, this._hass);
    const isAct = active.includes(s.name);
    const em = SN_SCENARIO_ICONS[s.name] || "🎬";
    const tags = [];
    // 0.78.0: what the scenario does to each channel (volume, options, who undoes it)
    const redraw = () => { if (this._rendered) this._update(); };
    const effs = snScenarioEffects(this._hass, s.a, s.name, active, redraw);
    for (const e of effs.slice(0, 6)) tags.push(snEffectChip(this._hass, e, T));
    if (effs.length > 6) tags.push(`<span class="tag">+${effs.length - 6}</span>`);
    const warns = effs.filter((e) => e.by.length || e.chanOff).map((e) => e.by.length
      ? T.sc_by.replace("{d}", e.alias).replace("{s}", e.by.map((x) => snScenarioName(this._hass, x)).join(", "))
      : T.sc_chan_off.replace("{d}", e.alias));
    const cl = s.manual ? null : snScenarioCondLine(this._hass, T, this._trace && this._trace[s.name]);
    const ags = Array.isArray(s.a.action_groups) ? s.a.action_groups : [];
    if (ags.length) tags.push(`<span class="tag">🔘 ${esc(ags.join(", "))}</span>`);
    if (s.a.media) tags.push(`<span class="tag">📷 ${T.media}</span>`);
    if (s.manual) tags.unshift(`<span class="tag">✋ ${T.manual}</span>`);
    if (snHandTag(s.a, T, true)) tags.unshift(snHandTag(s.a, T, true)); // 0.75.0
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
      ? `<button class="apb${s.state === "on" ? " on" : ""}" data-id="${esc(s.bsId)}" data-on="${s.state === "on" ? 1 : 0}"
          aria-pressed="${s.state === "on"}" title="${esc(s.state === "on" ? T.apply_off : T.apply_now)}">${s.state === "on" ? "✔ " + esc(T.applied) : esc(T.apply_now.charAt(0).toUpperCase() + T.apply_now.slice(1))}</button>`
      : "";
    return `<div class="row ${isAct ? "act" : ""} ${s.enabled === false ? "dis" : ""}" data-i="${i}" data-name="${esc(s.name)}" aria-expanded="${this._open && this._open.has(s.name) ? "true" : "false"}">
      <span class="em">${em}</span>
      <div class="mid"><b>${esc(alias || s.name)}</b>
        ${alias && !snSame(alias, s.name) ? `<span style="color:${p.muted}"> · ${snTech(s.name, alias)}</span>` : ""}
        ${cl ? `<div class="cond" title="${esc(T.sc_when + ": " + cl.text)}">⏱ ${cl.parts.length ? cl.parts.map((p) => `<span class="${p.ok === true ? "y" : p.ok === false ? "n" : "q"}">${p.ok === true ? "✓" : p.ok === false ? "✕" : "·"} ${esc(p.t)}</span>`).join(" · ") : esc(cl.text)}</div>` : ""}
        <div class="tags">${tags.join("")}</div>
        ${warns.map((w) => `<div class="cwarn">⚠ ${esc(w)}</div>`).join("")}
        ${this._open && this._open.has(s.name) ? this._detailHtml(s, isAct) : ""}
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
        if (e.target.closest(".sw") || e.target.closest(".apb")) return;
        const sc = all[+node.dataset.i];
        // 0.66.0: a tap opens why it applies and what it changes; "All attributes" = HA's dialog
        if (e.target.closest(".dmore")) { this._moreInfo(sc.id); return; }
        const db = e.target.closest(".sdiff");
        if (db) { this._runDiff(sc.name, db.dataset.act === "1"); return; }
        if (e.target.closest(".det")) return;
        this._open = this._open || new Set();
        if (this._open.has(sc.name)) this._open.delete(sc.name); else { this._open.add(sc.name); this._loadTrace(); }
        this._update();
      };
    });
    // the manual scenario's binary_sensor: SuperNotify applies the scenario while it is on
    rows.querySelectorAll(".apb").forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); snToggle(this._hass, b.dataset.id, b.dataset.on !== "1"); };
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/scenarios.md",
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

class SupernotifySimulatorCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("simulator");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
    this._sel = null;
  }

  static snTracked = false;

  _onHass(hass, fresh) {
    if (fresh) this._render();
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
    const r = await snEnquire(this._hass, service);
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
        .sh { font-size: 12px; font-weight: 700; color: ${p.muted}; margin: 10px 0 4px; }
        .sh.go { color: ${p.ok}; }
        .sr { display: grid; grid-template-columns: 22px minmax(0, min(15em, 42%)) minmax(0, 1fr); gap: 8px 14px; align-items: baseline;
              padding: 7px 2px; border-bottom: 1px solid ${p.line}; font-size: 13.5px; }
        .sr:last-child { border-bottom: 0; }
        .sr .si { color: ${p.muted}; } .sr.go .si { color: ${p.ok}; }
        .sr .sn { font-weight: 600; } .sr.stop .sn { color: ${p.muted}; font-weight: 500; }
        .sr .sw { color: ${p.muted}; font-size: 12.5px; }
        ${snDryCss(p)}
        .dryBox { margin-top: 0; }
        .sprio { margin-left: 8px; font: inherit; font-size: 12px; border: 1.5px solid ${p.line}; border-radius: 8px;
                 background: ${p.panel}; color: ${p.ink}; padding: 3px 6px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="sec">${snT(this._config, this._hass).sim_pick}</div>
        <div id="chips"></div>
        <div class="sec">${snT(this._config, this._hass).sim_fire}</div>
        <div id="result">—</div>
        <div class="hint" id="simHint">${snT(this._config, this._hass)[this._dryMode() ? "sim_hint_dry" : "sim_hint"]}</div>
        ${snVer(this._config, "simulator", p)}
      </ha-card>`, this && this._config);
    this._refresh();
  }

  /**
   * 0.65.0: with SuperNotify 2.12+ the simulator asks SuperNotify itself - supernotify.notify with
   * dry_run: simulate, the picked scenarios applied and nothing else considered - the same dry run
   * as the composer's "Try without sending". Older versions keep the estimate below.
   * `dry_run: false` in the card config forces the estimate.
   */
  _dryMode() {
    if (this._config.dry_run === false) return false;
    const svc = this._hass && this._hass.services && this._hass.services.supernotify;
    return !!(svc && svc.notify && svc.notify.response);
  }

  async _dry() {
    const res = this.shadowRoot.getElementById("result");
    const T = snT(this._config, this._hass);
    const sel = [...(this._sel || [])];
    const data = { message: T.sim_msg, priority: this._prio || "medium", dry_run: "simulate", force_resend: true,
      apply_scenarios: sel, constrain_scenarios: sel.length ? sel : ["__simulator_none__"] };
    const ticket = (this._dryTicket = (this._dryTicket || 0) + 1);
    try {
      const r = await this._hass.callWS({ type: "call_service", domain: "supernotify", service: "notify", service_data: data, return_response: true });
      if (ticket !== this._dryTicket) return;
      res.innerHTML = snIconify(`<div class="dryBox">${snDryHtml(this._hass, T, (r && r.response) || {}, false)}</div>`, this._config);
    } catch (e) {
      if (ticket === this._dryTicket) res.textContent = `✖ ${T.dry_err}: ${(e && (e.message || e.code)) || e}`;
    }
  }

  _simulate() {
    if (!this.shadowRoot) return;
    const esc = snEsc;
    const chips = this.shadowRoot.getElementById("chips");
    const names = Object.keys(this._byScen || {}).sort();
    chips.innerHTML = snIconify(names.map((n) =>
      `<span class="chip ${this._sel.has(n) ? "sel" : ""}" data-n="${esc(n)}" title="${esc(n)}">${SN_SCENARIO_ICONS[n] || "🎬"} ${esc(snScenarioName(this._hass, n))}</span>`
    ).join("") || "—", this && this._config);
    chips.querySelectorAll(".chip").forEach((node) => {
      node.onclick = () => {
        const n = node.dataset.n;
        if (this._sel.has(n)) this._sel.delete(n); else this._sel.add(n);
        this._simulate();
      };
    });
    if (this._dryMode()) {
      const T0 = snT(this._config, this._hass);
      chips.insertAdjacentHTML("beforeend", `<select class="sprio" id="sprio" aria-label="${esc(T0.sim_prio)}">${["minimum", "low", "medium", "high", "critical"].map((pr) =>
        `<option value="${pr}"${(this._prio || "medium") === pr ? " selected" : ""}>${esc(T0["prio_" + pr] || pr)}</option>`).join("")}</select>`);
      chips.querySelector("#sprio").onchange = (e) => { this._prio = e.target.value; this._simulate(); };
      clearTimeout(this._dryT);
      this._dryT = setTimeout(() => this._dry(), 250);
      return;
    }

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
    const T = snT(this._config, this._hass);
    const name = (d) => snDeliveryAlias(this._hass, d) || d;
    const scenName = (n) => snScenarioName(this._hass, n);
    const onBy = (d) => [...this._sel].filter((n) => this._byScen[n] && (this._byScen[n].enabled || []).includes(d)).map(scenName);
    const offBy = (d) => [...this._sel].filter((n) => this._byScen[n] && (this._byScen[n].disabled || []).includes(d)).map(scenName);
    const row = (d, cls, icon, why) => `<div class="sr ${cls}"><span class="si">${icon}</span><span class="sn" title="${esc(d)}">${esc(name(d))}</span><span class="sw">${esc(why)}</span></div>`;
    const goRows = fired.map((d) => {
      const by = onBy(d);
      const why = [(this._implicit || []).includes(d) ? T.sim_r_default : "", by.length ? `${T.sim_r_on} ${by.join(", ")}` : ""].filter(Boolean).join(" · ");
      return row(d, "go", "✔", why);
    });
    // channels that would not go out: switched off by a selected scenario, or never selected
    const known = snEntityRows(this._hass, "delivery").filter((x) => !/^default_/i.test(x.name));
    const stopRows = suppressed.map((d) => row(d, "stop", "⊘", `${T.sim_r_off} ${offBy(d).join(", ")}`));
    for (const x of known.filter((k) => !enabled.has(k.name)).sort((p, q) => name(p.name).localeCompare(name(q.name)))) {
      const r = x.a.inclusion ?? x.a.selection;
      const inc = Array.isArray(r) ? r : r ? [r] : ["default"];
      const why = !x.on ? T.sim_r_switched
        : inc.includes("scenario") ? T.sim_r_scen
        : inc.some((i) => /^fallback/.test(i)) ? T.sim_r_fallback
        : inc.includes("default") ? T.sim_r_default
        : T.sim_r_named;
      stopRows.push(row(x.name, "stop", "⊘", why));
    }
    res.innerHTML = snIconify(
      (goRows.length ? `<div class="sh go">${esc(T.sim_go)} · ${goRows.length}</div>${goRows.join("")}` : `<span class='hint'>${T.sim_none}</span>`) +
      (stopRows.length ? `<div class="sh">${esc(T.sim_stop)} · ${stopRows.length}</div>${stopRows.join("")}` : ""), this && this._config);
  }
}

customElements.define("supernotify-simulator-card", SupernotifySimulatorCard);

window.customCards.push({
  type: "supernotify-simulator-card",
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/simulator.md",
  name: "SuperNotify Simulator Card",
  description: "Who receives? Pick scenarios and see which deliveries would fire, from real engine data.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-composer-card — try & send
 * Free-form composer: title, message, priority, optional explicit delivery
 * chips, live phone preview, send via notify.supernotify.
 * ════════════════════════════════════════════════════════════════════════ */

class SupernotifyComposerCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("composer");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", ...(config || {}) };
    this._rendered = false;
    this._picked = new Set();
    this._targetValue = {};
  }

  static snTracked = false;

  _onHass(hass, fresh) {
    if (fresh) this._render();
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

  _deliveries() {
    // name + transport (the latter needed to tell whether an explicitly
    // picked channel actually resolves an area/floor/label target).
    if (!this._hass) return [];
    // 0.60.0: snEntityRows - switch over the deprecated binary_sensor, no double chips
    // 0.74.0: a channel switched off, or whose transport is off, can't go out - not offered
    // unless `show_off: true`
    const trOff = new Set(snEntityRows(this._hass, "transport").filter((t) => !t.on).map((t) => t.name));
    const can = (d) => this._config.show_off === true || (d.on && !trOff.has((d.a && d.a.transport) || ""));
    return snEntityRows(this._hass, "delivery").filter((d) => !/^default_/i.test(d.name) && can(d))
      .map((d) => ({ name: d.name, transport: (d.a && d.a.transport) || "" }))
      .sort((x, y) => x.name.localeCompare(y.name));
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = snT(this._config, this._hass);
    const esc = snEsc;
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
        details.adv { margin-top: 12px; border: 1.5px solid ${p.line}; border-radius: 10px; padding: 8px 12px; }
        details.adv summary { cursor: pointer; font-weight: 700; color: ${p.brandD}; }
        details.adv textarea { width: 100%; box-sizing: border-box; }
        .achips { display: flex; flex-wrap: wrap; gap: 6px; }
        .actr, .dcr { display: flex; gap: 6px; align-items: flex-start; margin-bottom: 6px; }
        .actr input, .dcr select, .dcr textarea { flex: 1; min-width: 0; }
        .rmx { flex: none; border: 1.5px solid ${p.line}; background: ${p.panel}; color: ${p.muted}; border-radius: 8px;
               padding: 7px 10px; cursor: pointer; font: inherit; }
        .addb { background: ${p.soft}; color: ${p.brandD}; }
        label.chk { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-weight: 600; margin-top: 10px; }
        .send { border: 0; border-radius: 10px; background: ${p.brand}; color: ${p.onBrand};
                font-weight: 750; padding: 11px 20px; cursor: pointer; font-size: 13.5px;
                margin-top: 14px; }
        .send:active { transform: scale(.97); }
        .send.dry { background: ${p.panel}; color: ${p.brandD}; border: 1.5px solid ${p.brand};
                    margin-left: 8px; }
        ${snDryCss(p)}
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
            <details class="adv" id="adv"><summary>${T.adv_title}</summary>
              <label>${T.adv_spoken}</label>
              <textarea id="spk" rows="2" placeholder="${T.adv_spoken_ph}"></textarea>
              ${this._scenNames().length ? [["apply_scenarios", T.adv_apply], ["require_scenarios", T.adv_require], ["constrain_scenarios", T.adv_constrain]].map(([k, l]) =>
                `<label>${l}</label><div class="chips achips" data-k="${k}">${this._scenNames().map((n) =>
                  `<button class="chip" data-s="${esc(n)}">${esc(snScenarioName(this._hass, n))}</button>`).join("")}</div>`).join("") : ""}
              <label>${T.adv_html}</label>
              <textarea id="mhtml" rows="2" placeholder="&lt;b&gt;…&lt;/b&gt;"></textarea>
              <label>${T.adv_snapshot}</label>
              <input type="text" id="snapUrl" placeholder="https://…/snapshot.jpg">
              <label>${T.adv_clip}</label>
              <input type="text" id="clipUrl" placeholder="https://…/clip.mp4">
              <label>${T.adv_actions}</label>
              <div id="acts"></div>
              <button class="chip addb" id="actAdd" type="button">${T.adv_act_add}</button>
              <input type="text" id="actGroups" placeholder="${T.adv_groups}" style="margin-top:6px">
              <label>${T.adv_dc}</label>
              <div id="dcs"></div>
              <button class="chip addb" id="dcAdd" type="button">${T.adv_dc_add}</button>
              <label class="chk"><input type="checkbox" id="dbg"> ${T.adv_debug}</label>
            </details>
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
        ${snVer(this._config, "composer", p)}
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
    this._adv = { apply_scenarios: new Set(), require_scenarios: new Set(), constrain_scenarios: new Set() };
    // 0.63.0: rows for the buttons and the per-channel settings
    const escA = snEsc;
    const addRow = (box, html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      const row = div.firstElementChild;
      row.querySelector(".rmx").onclick = () => row.remove();
      sr.getElementById(box).appendChild(row);
    };
    const actAdd = sr.getElementById("actAdd");
    if (actAdd) actAdd.onclick = () => addRow("acts", `<div class="actr"><input type="text" class="aid" placeholder="${escA(T.adv_act_id)}">`
      + `<input type="text" class="atl" placeholder="${escA(T.adv_act_title)}"><button type="button" class="rmx" aria-label="✕">✕</button></div>`);
    const dcAdd = sr.getElementById("dcAdd");
    if (dcAdd) dcAdd.onclick = () => addRow("dcs", `<div class="dcr"><select class="dcn">${this._deliveries().map((d) =>
      `<option value="${escA(d.name)}">${escA(snDeliveryAlias(this._hass, d.name) || d.name)}</option>`).join("")}</select>`
      + `<textarea class="dcv" rows="2" placeholder="${escA(T.adv_dc_ph)}"></textarea><button type="button" class="rmx" aria-label="✕">✕</button></div>`);
    sr.querySelectorAll(".achips .chip").forEach((b) => {
      b.onclick = () => {
        const set = this._adv[b.parentElement.dataset.k];
        const n = b.dataset.s;
        if (set.has(n)) set.delete(n); else set.add(n);
        b.classList.toggle("sel", set.has(n));
        b.setAttribute("aria-pressed", set.has(n));
      };
    });
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
      // 0.58.0: a short "loading" while HA defines the picker, nothing if it never comes
      // (the custom targets field below still works)
      container.innerHTML = `<span style="font-size:12px;opacity:.7">${snT(this._config, this._hass).tgt_loading || ""}</span>`;
      customElements.whenDefined("ha-selector").then(mount).catch(() => {
        container.textContent = "";
      });
      setTimeout(() => { if (!customElements.get("ha-selector")) container.textContent = ""; }, 4000);
    }
  }

  /** Scenario names (0.62.0), for the advanced options. */
  _scenNames() {
    if (!this._hass) return [];
    return snEntityRows(this._hass, "scenario").map((r) => r.name).sort();
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
      snEnquireBust(1500);
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
    // 0.62.0: advanced options
    const spk = ((sr.getElementById("spk") || {}).value || "").trim();
    if (spk) payload.spoken_message = spk;
    for (const k of ["apply_scenarios", "require_scenarios", "constrain_scenarios"]) {
      const set = this._adv && this._adv[k];
      if (set && set.size) payload[k] = [...set];
    }
    const snap = ((sr.getElementById("snapUrl") || {}).value || "").trim();
    if (snap) payload.snapshot_url = snap;
    // 0.63.0: the rest of supernotify.notify
    const mh = ((sr.getElementById("mhtml") || {}).value || "").trim();
    if (mh) payload.message_html = mh;
    const clip = ((sr.getElementById("clipUrl") || {}).value || "").trim();
    if (clip) payload.clip_url = clip;
    const acts = [...sr.querySelectorAll("#acts .actr")].map((r) => ({
      action: (r.querySelector(".aid").value || "").trim(), title: (r.querySelector(".atl").value || "").trim(),
    })).filter((a) => a.action).map((a) => (a.title ? a : { action: a.action }));
    if (acts.length) payload.actions = acts;
    const groups = ((sr.getElementById("actGroups") || {}).value || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (groups.length) payload.action_groups = groups;
    const dc = {};
    for (const r of sr.querySelectorAll("#dcs .dcr")) {
      const name = r.querySelector(".dcn").value;
      const data = {};
      for (const line of String(r.querySelector(".dcv").value || "").split("\n")) {
        const m = line.match(/^\s*([^:]+?)\s*:\s*(.*?)\s*$/);
        if (!m) continue;
        const v = m[2];
        data[m[1]] = v === "true" ? true : v === "false" ? false : v !== "" && !isNaN(+v) ? +v : v;
      }
      if (name && Object.keys(data).length) dc[name] = { ...(dc[name] || {}), data: { ...((dc[name] || {}).data || {}), ...data } };
    }
    if (Object.keys(dc).length) payload.delivery_control = dc;
    if ((sr.getElementById("dbg") || {}).checked) payload.debug = true;
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
    // 0.70.0: SuperNotify 2.12.1 keeps simulations in their own duplicate cache - the dry run
    // checks duplicates like a real send would, and the real Send after it is not held back
    const sep = snSupernotifyAtLeast(this._hass, "2.12.1", this._config.update_entity) === true;
    const dupeCheck = this._config.dry_run_dupe_check != null ? !!this._config.dry_run_dupe_check : sep;
    const data = { ...payload, dry_run: "simulate" };
    if (!dupeCheck) data.force_resend = true;
    box.style.display = "";
    box.textContent = "…";
    try {
      const res = await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "notify",
        service_data: data, return_response: true,
      });
      if (dupeCheck && !sep) this._dryKey = { key: JSON.stringify(payload), at: Date.now() };
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
    const box = this.shadowRoot.getElementById("dryBox");
    box.innerHTML = snIconify(snDryHtml(this._hass, snT(this._config, this._hass), doc, noDupeCheck), this && this._config);
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/composer.md",
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
class SupernotifyAutomationsCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("automations");
  }

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

  _onHass(hass, fresh, changed) {
    if (!this._manifest && !this._loading && !this._err) this._load();
    if (fresh) this._render();
    else if (changed) this._updateRows();
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

  _esc(s) {
    return snEsc(s);
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
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
        <span class="tot">${snPl(T, "aut_count", items.length)}${this._config.show_version ? ` · v${SN_CARD_VERSIONS.automations}` : ""}</span>
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
    const all = this._items();
    // 0.74.0: grouped by category (first appearance order), so a manifest that mixes them
    // does not repeat a heading; inside a category the manifest order stays (stable sort)
    const order = this._cats(all);
    const rows = this._filtered(all).sort((x, y) => order.indexOf(x.c) - order.indexOf(y.c));
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/automations.md",
  name: "SuperNotify Automations Card",
  description: "Live list of the automations that notify via SuperNotify: search, category filters, enable/disable.",
});


/**
 * 0.70.0: the stats card reads SuperNotify's own archive (2.12.1+: enquire_archive with
 * verbosity summary) instead of the "last notification" helpers and the automations that
 * wrote them. A month of archive is a few MB and takes seconds to read, so each notification
 * is kept as a small row in this browser (localStorage) and only the days not yet seen are
 * asked for, one day per call: the first opening reads the window once, the next ones only
 * what came after. Row: [time ms, priority, outcome, day band, [channels sent], [channels
 * failed], id]. The day band is the first applied scenario named like a band of the day
 * (`period_scenarios`, default the bands card's keys).
 */
const SN_STATS_KEY = "supernotify-stats-archive";
const SN_STATS_KEEP = 92;  // days kept in the browser
const SN_BAND_KEYS = ["early_morning", "morning", "afternoon", "evening", "night", "late_night"];
const snStatsArchive = {
  rows: null, from: 0, upto: 0, sig: "", busy: null, error: null,

  _open(sig) {
    if (this.rows && this.sig === sig) return;
    this.rows = []; this.from = 0; this.upto = 0; this.sig = sig;
    try {
      const c = JSON.parse(window.localStorage.getItem(SN_STATS_KEY) || "null");
      if (c && c.v === 1 && c.sig === sig && Array.isArray(c.rows)) {
        this.rows = c.rows; this.from = +c.from || 0; this.upto = +c.upto || 0;
      }
    } catch (e) { /* private mode or a broken cache: read again */ }
  },

  _save() {
    try {
      window.localStorage.setItem(SN_STATS_KEY, JSON.stringify({ v: 1, sig: this.sig, from: this.from, upto: this.upto, rows: this.rows }));
    } catch (e) { /* full or private: the rows stay in memory for this page */ }
  },

  row(n, bands) {
    const ok = [], ko = [];
    for (const [name, r] of Object.entries((n && n.deliveries) || {})) {
      if (!r || typeof r !== "object") continue;
      if (+r.success > 0) ok.push(name);
      if (+r.failed > 0 || +r.error > 0 || +r.errors > 0) ko.push(name);
    }
    // older archive files keep scenarios as an object keyed by name (seen on 2.12.1-beta1)
    const sc = n && n.scenarios;
    const names = Array.isArray(sc) ? sc : sc && typeof sc === "object" ? Object.keys(sc) : sc ? [String(sc)] : [];
    const band = names.find((x) => bands.includes(x)) || "";
    return [Date.parse(n.created) || 0, String(n.priority || "").toLowerCase(), String(n.outcome || "").toLowerCase(), band, ok, ko, String(n.id || "").slice(0, 8)];
  },

  async _ask(hass, after, before) {
    const data = { verbosity: "summary", after: new Date(after).toISOString(), limit: 5000 };
    if (before) data.before = new Date(before).toISOString();
    const r = await snWS(hass, { type: "call_service", domain: "supernotify", service: "enquire_archive",
      service_data: data, return_response: true }, 60000);
    return ((r && r.response && r.response.notifications) || []).filter(snIsObj);
  },

  /** Rows from startMs to now; progress(done, total) while whole days are read. */
  ensure(hass, startMs, bands, progress) {
    if (this.busy) return this.busy;
    this._open(bands.join(","));
    this.busy = (async () => {
      this.error = null;
      const now = Date.now();
      const seen = new Set(this.rows.map((r) => r[6]));
      const add = (list) => {
        for (const n of list) {
          let r;
          try { r = this.row(n, bands); } catch (e) { continue; } // one odd file never stops the rest
          if (!r[0] || seen.has(r[6])) continue;
          seen.add(r[6]); this.rows.push(r);
        }
      };
      try {
        // days before what this browser already has (all of them the first time)
        const end = this.from && this.from <= now ? this.from : now;
        if (!this.from || startMs < this.from) {
          const days = [];
          for (let t = end; t > startMs; ) {
            const d = new Date(t - 1); d.setHours(0, 0, 0, 0);
            const a = Math.max(startMs, d.getTime());
            days.push([a, t]); t = a;
          }
          let done = 0;
          for (const [a, b] of days) {
            add(await this._ask(hass, a, b));
            this.from = a;
            if (!this.upto) this.upto = end;
            if (progress) progress(++done, days.length);
          }
          if (!this.upto) this.upto = end;
        }
        // what came after the last reading
        if (this.upto < now) {
          add(await this._ask(hass, this.upto - 120000));
          this.upto = now;
        }
      } catch (e) {
        this.error = (e && e.message) || String(e);
      }
      const keep = now - SN_STATS_KEEP * 86400000;
      this.rows = this.rows.filter((r) => r[0] >= keep).sort((x, y) => x[0] - y[0]);
      if (this.from < keep) this.from = keep;
      this._save();
      return this.rows;
    })().finally(() => { this.busy = null; });
    return this.busy;
  },
};

/**
 * 0.74.0: enquire_archive `verbosity: daily` (SuperNotify after 2.12.1-beta2): totals per local
 * day, so the whole window is one call of a few KB. `ok` is null until the first answer, false
 * when this SuperNotify does not know `daily` - then the card reads notification by notification.
 */
const SN_DAILY_KEY = "supernotify-stats-daily";
const snStatsDaily = {
  ok: null, busy: null,

  // 0.75.2: kept in this browser - {v, from: first day covered (ms), at: last reading (ms), days: {date: totals}}
  _load() {
    try {
      const c = JSON.parse(window.localStorage.getItem(SN_DAILY_KEY) || "null");
      if (c && c.v === 1 && c.days && typeof c.days === "object") return c;
    } catch (e) { /* private mode or a broken cache */ }
    return { v: 1, from: 0, at: 0, days: {} };
  },

  _save(c) {
    try { window.localStorage.setItem(SN_DAILY_KEY, JSON.stringify(c)); } catch (e) { /* full or private */ }
  },

  async _ask(hass, afterMs) {
    const r = await snWS(hass, { type: "call_service", domain: "supernotify", service: "enquire_archive",
      service_data: { verbosity: "daily", after: new Date(afterMs).toISOString() }, return_response: true }, 90000);
    const days = r && r.response && r.response.days;
    if (!Array.isArray(days)) throw new Error("no days");
    return days.filter(snIsObj);
  },

  get(hass, startMs) {
    if (this.ok === false) return Promise.resolve(null);
    if (this.busy) return this.busy;
    this.busy = (async () => {
      const c = this._load();
      // a finished day does not change: once the window is covered, read again only from the
      // start of the day of the last reading
      let after = startMs;
      if (c.from && c.from <= startMs && c.at) {
        const d = new Date(c.at); d.setHours(0, 0, 0, 0);
        after = Math.max(startMs, d.getTime());
      }
      try {
        const got = await this._ask(hass, after);
        this.ok = true;
        for (const d of got) if (d.date) c.days[d.date] = d;
        if (after === startMs && (!c.from || startMs < c.from)) c.from = startMs;
        c.at = Date.now();
        const keep = new Date(Date.now() - SN_STATS_KEEP * 86400000);
        const keepKey = `${keep.getFullYear()}-${String(keep.getMonth() + 1).padStart(2, "0")}-${String(keep.getDate()).padStart(2, "0")}`;
        for (const k of Object.keys(c.days)) if (k < keepKey) delete c.days[k];
        if (c.from < keep.getTime()) c.from = keep.getTime();
        this._save(c);
      } catch (e) {
        if (this.ok === null) { this.ok = false; return null; }
        throw e;
      }
      const s0 = new Date(startMs);
      const startKey = `${s0.getFullYear()}-${String(s0.getMonth() + 1).padStart(2, "0")}-${String(s0.getDate()).padStart(2, "0")}`;
      return Object.keys(c.days).filter((k) => k >= startKey).sort().map((k) => c.days[k]);
    })().finally(() => { this.busy = null; });
    return this.busy;
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-stats-card — usage analytics (NEW, 2026-09-10)
 * Everything is derived from entities that already exist, no extra sensor:
 *   • daily series   → long-term statistics of the daily utility_meter
 *                      (sent_today_entity, default sensor.supernotify_inviate_oggi),
 *                      so it survives recorder purges; from 0.69.0 the days it has
 *                      nothing for (or all, without a meter) come from the
 *                      statistics of SuperNotify's own counter (count_entity);
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
    st_reading: "reading the archive: day {n} of {of}…", st_from_archive: "from SuperNotify's archive",
    st_archive_err: "archive partly read",
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
    st_reading: "lettura dell'archivio: giorno {n} di {of}…", st_from_archive: "dall'archivio di SuperNotify",
    st_archive_err: "archivio letto in parte",
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

class SupernotifyStatsCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("stats");
  }

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
      count_entity: "sensor.supernotify_notifications",
      update_entity: "update.supernotify_update",
      cards_update_entity: "update.supernotify_cards_update",
      refresh_minutes: 10,
      top_channels: 8,
      periods: [7, 14, 30],
      source: "",                 // 0.70.0: "" automatic, "archive" or "history"
      period_scenarios: SN_BAND_KEYS,
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

  static snTracked = false;

  _onHass(hass, fresh, changed, first) {
    if (fresh) this._render();
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
    this._cardW = w; // 0.59.0: the side-by-side charts are drawn at half of this
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
    if (this._fromArchive()) {
      const bands = (Array.isArray(c.period_scenarios) ? c.period_scenarios : SN_BAND_KEYS).map(String);
      if (c.daily !== false) {
        let dd = null;
        this._error = null;
        try { dd = await snStatsDaily.get(this._hass, start.getTime()); } catch (e) { this._error = (e && e.message) || String(e); }
        if (seq !== this._seq) return;
        if (dd || this._error) {
          this._data = this._compute({}, {}, start, now, days, this._dailyEvents(dd || [], bands, start.getTime()));
          this._data.archive = true;
          this._data.daily = true;
          this._loading = false;
          if (this._rendered) this._draw();
          return;
        }
      }
      const rows = await snStatsArchive.ensure(this._hass, start.getTime(), bands, (n, of) => {
        const w = this.shadowRoot && this.shadowRoot.getElementById("win");
        if (w && !this._data) w.textContent = this._t("st_reading", { n, of });
      });
      if (seq !== this._seq) return;
      this._error = snStatsArchive.error;
      this._data = this._compute({}, {}, start, now, days, this._archiveEvents(rows, start.getTime()));
      this._data.archive = true;
      this._loading = false;
      if (this._rendered) this._draw();
      return;
    }
    const ids = [c.time_entity, c.priority_entity, c.channels_entity, c.period_entity].filter(Boolean);
    let hist = {};
    let stats = {};
    try {
      [hist, stats] = await Promise.all([
        snWS(this._hass, {
          type: "history/history_during_period",
          start_time: start.toISOString(), end_time: now.toISOString(),
          entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
        }),
        c.sent_today_entity
          ? snWS(this._hass, {
              type: "recorder/statistics_during_period",
              start_time: start.toISOString(), end_time: now.toISOString(),
              statistic_ids: [c.sent_today_entity], period: "day", types: ["change"],
            }).catch(() => ({}))
          : Promise.resolve({}),
      ]);
      // 0.69.0: SuperNotify's own counter, for the days the meter has nothing for
      this._native = c.count_entity ? await snDailyCounts(this._hass, c.count_entity, days, force) : null;
    } catch (e) {
      this._error = String(e && (e.message || e));
    }
    if (seq !== this._seq) return;          // a newer window was picked meanwhile
    this._data = this._compute(hist || {}, stats || {}, start, now, days);
    this._loading = false;
    if (this._rendered) this._draw();
  }

  /** 0.70.0: archive (SuperNotify 2.12.1+) or the helpers' history. */
  _fromArchive() {
    const c = this._config;
    if (c.source === "archive") return true;
    if (c.source === "history") return false;
    const svc = this._hass && this._hass.services && this._hass.services.supernotify;
    return !!(svc && svc.enquire_archive) && snSupernotifyAtLeast(this._hass, "2.12.1", c.update_entity) === true;
  }

  /** Archive rows as the events _compute counts; duplicates left out (nothing was sent). */
  _archiveEvents(rows, startMs) {
    return rows.filter((r) => r[0] >= startMs && r[2] !== "dupe").map((r) => ({
      t: r[0], p: r[1], dp: r[3] || null, ch: r[4].length || r[5].length ? { ok: r[4], ko: r[5] } : null,
    }));
  }

  /**
   * 0.74.0: daily totals as weighted events for _compute: per hour (time of day and weekday),
   * per day (duplicates left out, nothing was sent), priority, band of the day and channels.
   * The hour and priority counts include the few duplicates: the archive does not split them.
   */
  _dailyEvents(list, bands, startMs) {
    const out = [];
    for (const d of list) {
      const [y, m, dd] = String(d.date || "").split("-").map(Number);
      if (!y || !m || !dd) continue;
      const day = new Date(y, m - 1, dd);
      if (day.getTime() + 86400000 <= startMs) continue;
      const count = +d.count || 0;
      const sent = Math.max(0, count - (+((d.outcome || {}).dupe) || 0));
      out.push({ dk: this._dayKey(day), dn: sent, noch: true });
      (Array.isArray(d.hour) ? d.hour : []).forEach((n, h) => {
        if (+n > 0) out.push({ t: new Date(y, m - 1, dd, h, 30).getTime(), w: +n, nd: true, noch: true });
      });
      for (const [p, n] of Object.entries(d.priority || {})) if (+n > 0 && p !== "unknown") out.push({ p, w: +n, noch: true });
      for (const [sc, n] of Object.entries(d.scenarios || {})) if (+n > 0 && bands.includes(sc)) out.push({ dp: sc, w: +n, noch: true });
      const ok = {}, ko = {};
      for (const [name, r] of Object.entries(d.deliveries || {})) {
        if (!snIsObj(r)) continue;
        if (+r.success > 0) ok[name] = +r.success;
        if (+r.failed > 0) ko[name] = +r.failed;
      }
      out.push({ cw: { known: sent, ok, ko } });
    }
    return out;
  }

  /** The helpers' history as events: one change of time_entity = one notification. */
  _historyEvents(hist, startMs) {
    const c = this._config;
    const spine = this._rows(hist, c.time_entity).filter((r) => r.t >= startMs && r.s && r.s !== "unknown");
    const prio = this._rows(hist, c.priority_entity);
    const chan = this._rows(hist, c.channels_entity);
    const per = this._rows(hist, c.period_entity);
    return spine.map((ev, i) => {
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
      return { t: ev.t, p: (this._valueAt(prio, ev.t, 2000) || "").toLowerCase(), dp: this._valueAt(per, ev.t, 2000), ch: this._parseChannels(cv) };
    });
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

  _compute(hist, stats, start, now, days, events) {
    const c = this._config;
    const startMs = start.getTime();
    const spine = events || this._historyEvents(hist, startMs);

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

    let spineCount = 0;
    // 0.74.0: an event may carry a weight `w` (daily totals); `nd` = not a day count of its own,
    // `dk`/`dn` = a day's count, `noch` = says nothing about channels, `cw` = channel totals
    spine.forEach((ev) => {
      const w = ev.w == null ? 1 : +ev.w;
      if (ev.t != null) {
        const d = new Date(ev.t);
        perHour[d.getHours()] += w;
        perWd[(d.getDay() + 6) % 7] += w;
        if (!ev.nd) {
          const key = this._dayKey(d);
          perDayHist[key] = (perDayHist[key] || 0) + w;
        }
        if (d.getHours() >= 23 || d.getHours() < 7) night += w;
        spineCount += w;
      }
      if (ev.dk) perDayHist[ev.dk] = (perDayHist[ev.dk] || 0) + (+ev.dn || 0);
      const p = ev.p;
      if (p) prioCount[p] = (prioCount[p] || 0) + w;
      const dp = ev.dp;
      if (dp) periodCount[dp] = (periodCount[dp] || 0) + w;
      if (ev.cw) {
        chanKnown += ev.cw.known;
        for (const [n, k] of Object.entries(ev.cw.ok)) chanOk[n] = (chanOk[n] || 0) + k;
        for (const [n, k] of Object.entries(ev.cw.ko)) chanKo[n] = (chanKo[n] || 0) + k;
        return;
      }
      if (ev.noch) return;
      const parsed = ev.ch;
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
    const liveToday = !events && c.sent_today_entity && this._hass.states[c.sent_today_entity];
    const liveVal = liveToday && !["unknown", "unavailable"].includes(liveToday.state) ? Math.round(+liveToday.state) : null;
    const nativeByKey = (this._native && this._native.byDay) || {};
    while (dayCursor <= now) {
      const k = this._dayKey(dayCursor);
      let v = statByKey[k];
      if (k === todayKey && liveVal != null && (v == null || liveVal >= v)) v = liveVal;
      if (v == null) v = nativeByKey[k];
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
      days, histDays: daysWithData.length, spineCount, perHour, perWd, perDay, prioCount, periodCount, channels, sends, errors,
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
        .kpi { border: 0; border-radius: 10px; padding: 12px 14px; background: ${p.soft}; }
        .kpi .k { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted};
                  line-height: 1.35; overflow-wrap: anywhere; }
        .kpi .v { font-size: 21px; font-weight: 800; margin-top: 2px; }
        .kpi .s { font-size: 11px; color: ${p.muted}; margin-top: 1px; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; margin: 16px 0 6px; display:flex; justify-content: space-between; }
        .sec .n { font-weight: 650; text-transform: none; letter-spacing: 0; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @container (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
        @container (max-width: 460px) { .hrow .nm { width: 46%; min-width: 90px; } .hrow .ct { width: 48px; } }
        svg { width: 100%; height: auto; display: block; overflow: visible; }
        .bars text { font-size: 10.5px; fill: ${p.muted}; }
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
        .foot { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
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
    return snEsc(s);
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
    sr.getElementById("win").textContent = d.archive
      ? (this._error ? `${T.st_archive_err}: ${this._error}` : T.st_from_archive)
      : d.histDays && d.histDays < completeDays
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
      kpi("🏆 " + T.st_top_channel, top ? ((n) => n.length > 12 ? `<span style="font-size:17px;line-height:1.25;display:inline-block">${esc(n)}</span>` : esc(n))(this._aliasFor(top.name) || top.name) : "—", top && d.sends ? `${Math.round(((top.ok + top.ko) / d.sends) * 100)}%` : "") +
      kpi("⚠️ " + T.st_errors, this._fmt(d.errors), d.sends ? `${errRate}% ${T.st_of_sends}` : "", d.errors ? p.crit : p.ok);

    // daily bars
    // long windows: label one day in k so the labels never overlap (30 days -> every 2nd)
    const every = Math.max(1, Math.ceil(d.perDay.length / Math.max(6, Math.min(16, Math.floor(this._svgW / 34)))));
    const daily = this._barsSvg(d.perDay.map((x, i) => ({
      l: (d.perDay.length - 1 - i) % every === 0 ? `${x.d.getDate()}/${x.d.getMonth() + 1}` : "",
      v: x.n, hi: x.today })), p, { avg: d.avg });
    // hourly
    const hourly = this._barsSvg(d.perHour.map((v, h) => ({ l: h % 6 === 0 ? String(h) : "", v, hi: h === d.peakHour })), p, { thin: true, half: true });
    // weekday
    const wd = this._barsSvg(d.perWd.map((v, i) => ({ l: T.st_wd[i], v })), p, { half: true });
    // channels
    const maxCh = d.channels.length ? d.channels[0].ok + d.channels[0].ko : 1;
    const chRows = d.channels.slice(0, this._config.top_channels).map((ch) => {
      const tot = ch.ok + ch.ko;
      const alias = this._aliasFor(ch.name);
      return `<div class="hrow"><span class="nm" title="${esc(ch.name)}">${this._iconFor(ch.name)} ${alias ? `${esc(alias)} <small style="color:${p.muted}">${snTech(ch.name, alias)}</small>` : esc(ch.name)}</span>
        <span class="tr"><span class="ok" style="width:${(ch.ok / maxCh) * 100}%"></span><span class="ko" style="width:${(ch.ko / maxCh) * 100}%"></span></span>
        <span class="ct">${ch.ko && !ch.ok ? `<span style="color:${p.crit}">✖ ${ch.ko}</span>` : `${tot}${ch.ko ? ` <span style="color:${p.crit}">✖${ch.ko}</span>` : ""}`}</span></div>`;
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
      `<span class="chip">${esc(snBandName(T, String(k).trim().toLowerCase().replace(/[\s-]+/g, "_")))} ${Math.round((d.periodCount[k] / perTot) * 100)}%</span>`).join("") || `<span class="empty">—</span>`;

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
    // 0.59.0: the hour and weekday charts sit side by side above 640 px, so they are drawn at
    // half the width - otherwise the browser shrinks them and their labels drop to ~5 px
    const full = this._svgW || 600, cw = this._cardW || 0;
    const W = opt.half && cw > 640 ? Math.max(260, Math.min(600, Math.round((cw - 28 - 18) / 2))) : full, H = 110, padB = 18, padT = 14;
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
    if (top && d.sends) out.push(this._t("st_i_share", { p: Math.round(((top.ok + top.ko) / d.sends) * 100), c: this._esc(this._aliasFor(top.name) || top.name) }));
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
        out.push(this._t("st_i_errors", { n: d.errors, d: d.days, c: this._esc(worst ? (this._aliasFor(worst.name) || worst.name) : "—") }));
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
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/stats.md",
  name: "SuperNotify Stats Card",
  description: "Usage analytics from existing entities: per-day/hour/weekday, channels most used (alias-aware) with errors, priority and period mix, insights, installed vs latest version.",
});

console.info(`%c SUPERNOTIFY-CARDS %c v${VERSION} `, "background:#03a9f4;color:#fff;font-weight:700", "");
class SupernotifyArchiveCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("archive");
  }

  // card picker (0.57.0): SuperNotify 2.12+ answers enquire_archive, no sensor needed
  static getStubConfig() {
    return {};
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
    this._pz = {};        // 0.80.0: per row - { who: "all"|"me", subj, msg, busy }
    this._senders = {};   // 0.81.0: per notification id - [automation/script ids], null while asked
    this._snz = null;     // active pauses (enquire_snoozes)
    this._snzAt = 0;
  }

  static snTracked = false;

  _onHass(hass, fresh) {
    if (snArchiveNative(hass, this._config)) {
      // the store redraws this card through the "supernotify-archive" event
      snArchiveStore.ensure(hass, this._config.limit, this._config.trigger_entity);
      if (fresh) this._render();
      else if (this._storeVer !== snArchiveStore.version || (this._waitStore && snArchiveStore.fetched)) { this._renderChips(); this._renderList(); }
      this._storeVer = snArchiveStore.version;
      return;
    }
    const st = hass.states[this._config.entity];
    const stamp = st ? st.last_updated : "none";
    if (fresh) this._render();
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
    // 0.80.0: a pause made here or elsewhere - read the pauses again
    this._onRefresh = () => { this._snzAt = 0; if (this._rendered && this._open.size) this._loadSnz(); };
    window.addEventListener("supernotify-refresh", this._onRefresh);
  }

  disconnectedCallback() {
    window.removeEventListener("supernotify-archive", this._onArchive);
    window.removeEventListener("supernotify-refresh", this._onRefresh);
  }

  /** 0.80.0: can a row be paused from here - supernotify.snooze and the archive's own documents. */
  _canPause() {
    return !!(this._hass && snHasSnoozeAction(this._hass) && snArchiveNative(this._hass, this._config)
      && this._config.pause !== false);
  }

  /** The active pauses, read at most every 30 s while a row is open. */
  _loadSnz(force) {
    if (!this._canPause()) return;
    if (this._snzBusy) { if (force) this._snzAgain = true; return; }
    if (!force && this._snz && Date.now() - this._snzAt < 30000) return;
    this._snzBusy = true;
    snEnquire(this._hass, "enquire_snoozes").then((r) => {
      this._snz = ((r && r.response) || {}).snoozes || [];
      this._snzAt = Date.now();
    }).catch(() => { this._snz = this._snz || []; }).finally(() => {
      this._snzBusy = false;
      if (this._snzAgain) { this._snzAgain = false; this._loadSnz(true); return; }
      this._renderPauses();
    });
  }

  /** The pause bar of one open row (0.80.0), see snPauseSubjects. */
  _pauseHtml(r) {
    const T = this._T();
    const E = SN_ARCH_STRINGS.en;
    const t = (k) => T[k] || E[k] || k;
    const esc = snEsc;
    if (r.p === "critical") return `<div class="pzn">${esc(t("pz_critical"))}</div>`;
    // the index keeps 8 characters in `id` and the full one in `fid`
    const doc = snArchiveStore.docs.find((d) => d.id === (r.fid || r.id))
      || snArchiveStore.docs.find((d) => String(d.id || "").startsWith(r.id));
    if (!doc) return "";
    // 0.81.0: the sender too, once the logbook has answered (then the bar is drawn again)
    let senders = [];
    if (this._config.pause_sender) {
      senders = this._senders[doc.id];
      if (senders === undefined) {
        this._senders[doc.id] = null;
        snSenders(this._hass, doc).then((s) => { this._senders[doc.id] = s; this._renderPauses(); });
      }
      if (!senders) return `<div class="pzn">⏸ …</div>`;
    }
    const subs = [...snPauseSubjects(doc), ...senders.filter((s) => !snPauseSubjects(doc).includes(s))];
    if (!subs.length) return `<div class="pzn">⏸ ${esc(t(this._config.pause_sender ? "pz_none_any" : "pz_none"))}</div>`;
    const st = this._pz[r.id] || (this._pz[r.id] = { who: "all", subj: subs[0] });
    if (!subs.includes(st.subj)) st.subj = subs[0];
    const fname0 = (id) => ((this._hass.states[id] || {}).attributes || {}).friendly_name || id;
    // 0.81.0: a sender reads "automation: name" / "script: name"
    const fname = (id) => /^automation\./.test(id) ? `${t("pz_auto")}: ${fname0(id)}`
      : /^script\./.test(id) ? `${t("pz_script")}: ${fname0(id)}` : fname0(id);
    const pad = (n) => String(n).padStart(2, "0");
    const live = this._snz ? snPausesOn(this._snz, st.subj) : [];
    const subjRow = subs.length > 1 ? `<div class="pzr"><span class="pzk">${esc(t("pz_what"))}</span>${subs.map((s) =>
      `<button class="pzc${s === st.subj ? " on" : ""}" data-subj="${esc(s)}">${esc(fname(s))}</button>`).join("")}</div>` : "";
    const msg = st.msg ? `<div class="pzm">${esc(st.msg)}</div>` : "";
    if (live.length) {
      const rows = live.map((s, i) => {
        const user = String(s.recipient_type || "").toUpperCase() === "USER";
        const who = user ? ` (${esc(t("pz_only"))} ${esc(fname(s.recipient || ""))})` : ` (${esc(t("pz_all"))})`;
        const until = s._end ? `${esc(t("pz_until"))} ${pad(s._end.getHours())}:${pad(s._end.getMinutes())}` : esc(t("pz_until_resumed"));
        return `<div class="pzr"><span class="pzl">⏸ <b>${esc(fname(st.subj))}</b> ${esc(t("pz_paused"))} ${until}${who}</span>
          <button class="pzb" data-resume="${i}"${st.busy ? " disabled" : ""}>▶ ${esc(t("pz_resume"))}</button></div>`;
      }).join("");
      return `<div class="pz">${subjRow}${rows}${msg}</div>`;
    }
    const me = snMyPerson(this._hass);
    const lens = [[30, "30 min"], [60, "1 h"], [240, "4 h"], [1440, "24 h"]];
    return `<div class="pz">${subjRow}
      <div class="pzr"><span class="pzl">⏸ ${esc(t("pz_title").replace("{x}", fname(st.subj)))}</span></div>
      <div class="pzr">${lens.map(([m, l]) => `<button class="pzb" data-min="${m}"${st.busy ? " disabled" : ""}>${l}</button>`).join("")}
        <span class="pzw">
          <button class="pzc${st.who === "all" ? " on" : ""}" data-who="all" title="${esc(t("pz_all_tip"))}">${esc(t("pz_all"))}</button>${me
            ? `<button class="pzc${st.who === "me" ? " on" : ""}" data-who="me" title="${esc(t("pz_me_tip"))}">${esc(t("pz_me"))}</button>` : ""}
        </span></div>${msg}</div>`;
  }

  /** Redraw the pause bars of the open rows only - the list stays as it is. */
  _renderPauses() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("list");
    if (!el || !this._canPause()) return;
    const idx = this._index();
    el.querySelectorAll(".row.open .pzh").forEach((h) => {
      const r = idx && (idx.items || []).find((x) => x.id === h.dataset.id);
      h.innerHTML = r ? snIconify(this._pauseHtml(r), this._config) : "";
      if (r) this._bindPause(h, r);
    });
  }

  _bindPause(h, r) {
    const st = this._pz[r.id];
    h.onclick = (e) => e.stopPropagation(); // the row opens and closes on its own clicks only
    if (!st) return;
    const T = this._T();
    const t = (k) => T[k] || SN_ARCH_STRINGS.en[k] || k;
    const run = async (data, done) => {
      st.busy = true; st.msg = ""; this._renderPauses();
      try {
        await snSnoozeCall(this._hass, data);
        st.msg = done;
      } catch (e) {
        st.msg = `✖ ${(e && e.message) || e}`;
      }
      st.busy = false;
      snEnquireBust(400);
      this._loadSnz(true);
    };
    h.querySelectorAll("[data-subj]").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); st.subj = b.dataset.subj; st.msg = ""; this._renderPauses(); }; });
    h.querySelectorAll("[data-who]").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); st.who = b.dataset.who; this._renderPauses(); }; });
    h.querySelectorAll("[data-min]").forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const data = { command: "snooze", scope: "tag", name: st.subj, minutes: +b.dataset.min, reason: "Dashboard: archive" };
        if (st.who === "me") { const me = snMyPerson(this._hass); if (me) data.person = me; }
        run(data, t("pz_done"));
      };
    });
    const live = this._snz ? snPausesOn(this._snz, st.subj) : [];
    h.querySelectorAll("[data-resume]").forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        const s = live[+b.dataset.resume];
        if (!s) return;
        const data = { command: "resume", scope: "tag", name: s.target };
        if (String(s.recipient_type || "").toUpperCase() === "USER" && s.recipient) data.person = s.recipient;
        run(data, t("pz_resumed"));
      };
    });
  }

  // Sections dashboards (0.47.0): the size HA gives the card by default; a card's own
  // `grid_options:` in the dashboard still wins.
  getGridOptions() {
    return { columns: "full", min_columns: 6 };
  }

  getCardSize() { return 12; }

  _loc() { return (this._config.language || (this._hass && this._hass.language) || undefined); }

  _T() { return SN_ARCH_STRINGS[((this._config.language || (this._hass && this._hass.language) || "en").split("-")[0])] || SN_ARCH_STRINGS.en; }

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
        /* 0.58.0: the same priority scale as the stats card (critical red, high orange, medium blue, low grey) */
        .tg.pr { color: ${p.warn}; background: ${p.warnSoft}; }
        .tg.pr.critical { color: ${p.crit}; background: ${this._dark ? "rgba(239,83,80,.16)" : "#fbe3e3"}; }
        .tg.pr.medium { color: ${p.brandD}; background: ${p.soft}; }
        .tg.pr.low, .tg.pr.minimum { color: ${p.muted}; background: ${p.soft}; }
        .tg.wh { color: ${p.brandD}; background: ${p.soft}; }
        .said { margin-top: 4px; padding: 6px 9px; border-radius: 9px;
                background: ${p.soft}; border-left: 3px solid ${p.brand};
                font-size: 12px; line-height: 1.45; }
        .said b { color: ${p.brandD}; }
        .det { margin: 8px 0 2px 46px; font-size: 11.5px; color: ${p.muted}; display: none; }
        .row.open .det { display: block; }
        .det b { color: ${p.ink}; font-weight: 650; }
        .empty { text-align: center; color: ${p.muted}; font-size: 13px; padding: 22px 0; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 10px; }
        .why { color: ${p.brandD}; font-weight: 650; cursor: pointer; text-decoration: underline; }
        .pz { margin-top: 8px; padding: 8px 10px; border: 1px solid ${p.line}; border-radius: 10px; cursor: default; }
        .pzr { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 3px 0; }
        .pzl { font-size: 12px; color: ${p.ink}; flex: 1 1 auto; }
        .pzb { border: 1.5px solid ${p.brand}; color: ${p.brandD}; background: ${p.panel}; border-radius: 999px;
               padding: 6px 12px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; min-height: 32px; }
        .pzb:hover:not([disabled]) { background: ${p.soft}; }
        .pzb[disabled] { opacity: .5; cursor: progress; }
        .pzw { display: inline-flex; gap: 4px; margin-left: auto; }
        .pzc { border: 1.5px solid ${p.line}; background: ${p.panel}; color: ${p.muted}; border-radius: 999px;
               padding: 5px 10px; font: inherit; font-size: 11.5px; font-weight: 650; cursor: pointer; min-height: 30px; }
        .pzc.on { border-color: ${p.brand}; color: ${p.brandD}; background: ${p.soft}; }
        .pzb:focus-visible, .pzc:focus-visible { outline: 2px solid ${p.brand}; outline-offset: 2px; }
        .pzm { font-size: 11.5px; color: ${p.muted}; margin-top: 4px; }
        .pzn { margin-top: 6px; font-size: 11.5px; color: ${p.muted}; }
        .pzk { font-size: 11px; color: ${p.muted}; }
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
        ${snVer(this._config, "archive", p)}
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
    const esc = snEsc;
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
    this._waitStore = !!idx.loading; // 0.74.1: redrawn on the next update once the archive is there
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
    const gen = idx.generated ? new Date(idx.generated).toLocaleTimeString(this._loc(), { hour: "2-digit", minute: "2-digit", hour12: snH12(this._hass) }) : "";
    const old = idx.oldest ? new Date(idx.oldest).toLocaleDateString(this._loc()) : "";
    meta.innerHTML = snIconify(idx.native
      ? `${idx.items.length} ${T.recent}` + (gen ? ` · ${T.read_at} ${gen}` : "")
      : (idx.total ? `${idx.items.length} ${T.of} ${idx.total} ${T.in_archive}` : `${idx.items.length} ${T.in_archive}`) +
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
      const hm = d.toLocaleTimeString(this._loc(), { hour: "2-digit", minute: "2-digit", hour12: snH12(this._hass) });
      const chans = this._channels(r, idx).map((c) =>
        `<span class="tg ${c.state}" title="${esc(c.name)}">${c.state === "ok" ? "✔" : c.state === "err" ? "✖" : "⊘"} ${esc(snDeliveryAlias(this._hass, c.name) || c.name)}` +
        `${c.reason ? " · " + esc(c.reason) : ""}</span>`).join("");
      const prio = r.p ? `<span class="tg pr ${esc(r.p)}">● ${esc((T.prio && T.prio[r.p]) || r.p)}</span>` : "";
      const wh = r.w ? `<span class="tg wh">\u{1F92B} ${T.wh}</span>` : "";
      const scen = (r.sc || []).map((s) => esc(idx.scen[s] ? snScenarioName(this._hass, idx.scen[s]) : "?")).join(", ");
      const open = this._open.has(r.id) ? " open" : "";
      parts.push(
        `<div class="row${open}" data-id="${esc(r.id)}" title="id ${esc(r.id)}">
           <div class="r1"><span class="hm">${hm}</span><span class="ti">${esc(r.ti || "—")}</span>${prio}${wh}</div>
           ${r.m ? `<div class="msg">${esc(snPlainMsg(r.m))}${r.mt ? "…" : ""}</div>` : ""}
           <div class="tags">${chans}</div>
           <div class="det">
             ${r.sp ? `<div class="said">\u{1F50A} <b>${r.spn && !/alexa/i.test(r.spn) ? esc(T.said_by.replace("{ch}", snDeliveryAlias(this._hass, r.spn) || r.spn)) : T.said}:</b> \u00ab${esc(r.sp)}\u00bb</div>` : ""}
             ${scen ? `<div><b>${T.scenarios}:</b> ${scen}</div>` : ""}
             <div>${r.d ? `<b>${r.d}</b> ${snW(T, "delivered", r.d)} ` : ""}${r.f ? `· <b>${r.f}</b> ${snW(T, "failed", r.f)} ` : ""}${r.s ? `· <b>${r.s}</b> ${snW(T, "skipped", r.s)} ` : ""}${r.mi ? `· ⚠ <b>${r.mi}</b> ${snW(T, "missed", r.mi)} ` : ""}
             ${r.ms ? `· ${T.dur} ${r.ms} ms` : ""}${r.mt ? ` · ${T.truncated}` : ""}</div>
             ${window.__snWhyCards ? `<div><a class="why" data-why="${esc(r.id)}">🔎 ${T.why}</a></div>` : ""}
             ${this._canPause() ? `<div class="pzh" data-id="${esc(r.id)}">${open ? this._pauseHtml(r) : ""}</div>` : ""}
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
        else { this._open.add(id); node.classList.add("open"); this._renderPauses(); this._loadSnz(); }
      };
    });
    if (this._open.size && this._canPause()) { this._renderPauses(); this._loadSnz(); }
  }
}

customElements.define("supernotify-archive-card", SupernotifyArchiveCard);

window.customCards.push({
  type: "supernotify-archive-card",
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/archive.md",
  name: "SuperNotify Archive Card",
  description: "Notification history from the SuperNotify archive: search, filters, per-channel outcome.",
});

const SN_ARCH_STRINGS = {
  en: {
    title: "Notification history", search: "Search title or message…",
    f_all: "All", f_problems: "Problems only", f_today: "Today",
    f_whisper: "Whispered", wh: "whispered", said: "Alexa said", said_by: "{ch} said",
    none: "no notification matches", no_sensor: "sensor not found",
    no_sensor_hint: "Update SuperNotify to 2.10 or later, which has the supernotify.enquire_archive action, or add the command_line sensor that indexes the archive (see README).",
    loading: "reading the archive…", recent: "latest notifications", read_at: "read at",
    of: "of", in_archive: "in the archive", since: "oldest", updated: "index updated",
    today: "Today", yesterday: "Yesterday",
    delivered: "delivered", failed: "failed", skipped: "skipped", missed: "missed",
    prio: { critical: "Critical", high: "High", low: "Low", minimum: "Minimum", medium: "Medium" },
    reasons: { doppione: "duplicate", "nessun target": "no target", errore: "error", condizione: "condition",
      scenario: "scenario", presenza: "presence", priorita: "priority", spento: "off", pausa: "snoozed",
      "transport spento": "transport off", "nessuna azione": "no action", "dati non validi": "invalid data",
      sconosciuto: "unknown" },
    scenarios: "Scenarios in force", truncated: "message truncated in the index",
    dur: "took", id: "id", why: "Why? - full detail",
    pz_title: "Pause notifications about {x}", pz_all: "for everyone", pz_me: "only for me", pz_only: "only for",
    pz_all_tip: "Nobody gets notifications about this entity until the pause ends",
    pz_me_tip: "You stop getting them; channels with fixed targets (speakers, dashboard) still play",
    pz_paused: "paused", pz_until: "until", pz_until_resumed: "until resumed", pz_resume: "Resume",
    pz_done: "Paused.", pz_resumed: "Resumed.",
    pz_none: "This one can't be paused on its own: the call doesn't say which entity it is about. Add entity_id to the call's data.",
    pz_critical: "Critical notifications can't be paused from here.",
    pz_auto: "automation", pz_script: "script", pz_what: "pause:",
    pz_none_any: "This one can't be paused: it names no entity and no automation or script sent it (sent by hand?).",
  },
  it: {
    title: "Storico notifiche", search: "Cerca nel titolo o nel messaggio…",
    f_all: "Tutte", f_problems: "Solo con problemi", f_today: "Oggi",
    f_whisper: "Sussurrate", wh: "sussurrata", said: "Alexa ha detto", said_by: "{ch} ha detto",
    none: "nessuna notifica corrisponde", no_sensor: "sensore non trovato",
    no_sensor_hint: "Aggiorna SuperNotify alla 2.10 o successiva, che ha l'azione supernotify.enquire_archive, oppure aggiungi il sensore command_line che indicizza l'archivio (vedi README).",
    loading: "lettura dell'archivio…", recent: "notifiche più recenti", read_at: "lette alle",
    of: "di", in_archive: "nell'archivio", since: "più vecchia", updated: "indice aggiornato",
    today: "Oggi", yesterday: "Ieri",
    delivered: "consegnati", delivered_1: "consegnato", failed: "falliti", failed_1: "fallito",
    skipped: "saltati", skipped_1: "saltato", missed: "mancati", missed_1: "mancato",
    prio: { critical: "Critica", high: "Alta", low: "Bassa", minimum: "Minima", medium: "Media" },
    scenarios: "Scenari in vigore", truncated: "messaggio troncato nell'indice",
    dur: "in", id: "id", why: "Perché? - dettaglio completo",
    pz_title: "Metti in pausa le notifiche su {x}", pz_all: "per tutti", pz_me: "solo per me", pz_only: "solo per",
    pz_all_tip: "Nessuno riceve notifiche su questa entità finché la pausa non finisce",
    pz_me_tip: "Smetti di riceverle tu; i canali con destinazione fissa (altoparlanti, dashboard) suonano comunque",
    pz_paused: "in pausa", pz_until: "fino alle", pz_until_resumed: "fino a quando la riprendi", pz_resume: "Riprendi",
    pz_done: "In pausa.", pz_resumed: "Ripresa.",
    pz_none: "Questa notifica non si può mettere in pausa da sola: la chiamata non dice di quale entità parla. Aggiungi entity_id ai data della chiamata.",
    pz_critical: "Le notifiche critiche non si mettono in pausa da qui.",
    pz_auto: "automazione", pz_script: "script", pz_what: "pausa su:",
    pz_none_any: "Questa notifica non si può mettere in pausa: non nomina un'entità e non l'ha mandata un'automazione o uno script (inviata a mano?).",
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

class SupernotifyWhyCard extends SnCard {
  // visual editor (0.55.0): Home Assistant draws the form, see snForm()
  static getConfigForm() {
    return snForm("why");
  }

  static getStubConfig() {
    return {};
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

  static snTracked = false;

  _onHass(hass, fresh) {
    if (snArchiveNative(hass, this._config)) {
      snArchiveStore.ensure(hass, Math.max(this._config.limit, 40), this._config.trigger_entity);
      if (fresh) this._render();
      else if (this._storeVer !== snArchiveStore.version || (this._waitStore && snArchiveStore.fetched)) this._renderList();
      this._storeVer = snArchiveStore.version;
      return;
    }
    const st = hass.states[this._config.entity];
    const stamp = st ? st.last_updated : "none";
    if (fresh) this._render();
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
        .ch.quiet { }
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
        .ch.not { border-style: dashed; }
        .note { color: ${p.muted}; font-size: 11.5px; margin-top: 4px; line-height: 1.45; }
        .trace { font-size: 12px; } .trace code { font-size: 11px; }
        .trace .stg { display: flex; gap: 6px; padding: 2px 0; }
        .trace .stg span:first-child { color: ${p.muted}; min-width: 190px; font-family: monospace; font-size: 11px; }
        .empty { color: ${p.muted}; padding: 10px; text-align: center; }
        .err { color: ${p.crit}; }
        code { background: ${p.soft}; padding: 1px 4px; border-radius: 4px; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}
        <h3>🔎 ${T.title}</h3>
        <div class="list" id="list"></div>
        <div class="det" id="det"${this._config.max_height ? ` style="max-height:${String(this._config.max_height).replace(/[<>"]/g, "")};overflow-y:auto;padding-right:4px"` : ""}><div class="empty">${T.pick}</div></div>
        ${snVer(this._config, "why", p)}
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
    const esc = snEsc;
    const idx = this._index();
    if (!idx) {
      el.innerHTML = snIconify(`<div class="empty">${T.no_sensor} <code>${esc(this._config.entity)}</code></div>`, this && this._config);
      return;
    }
    if (idx.error) { el.innerHTML = snIconify(`<div class="empty">⚠️ ${esc(idx.error)}</div>`, this && this._config); return; }
    this._waitStore = !!idx.loading; // 0.74.1
    if (idx.loading) { el.innerHTML = snIconify(`<div class="empty">${T.loading}</div>`, this && this._config); return; }
    const items = idx.items.slice(0, this._config.limit);
    if (!items.length) { el.innerHTML = snIconify(`<div class="empty">${T.none}</div>`, this && this._config); return; }
    el.innerHTML = snIconify(items.map((r) => {
      const d = new Date(r.t * 1000);
      const hm = d.toLocaleString(this._loc(), { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: snH12(this._hass) });
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
      const r = await snWS(this._hass, {
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
    // 0.76.2: SuperNotify 2.13.0 per-delivery fallback
    if (kind === "fallback" && T.src_fallback) return T.src_fallback.replace("{x}", snDeliveryAlias(this._hass, name) || name);
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
    const esc = snEsc;
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
    const when = d.toLocaleString(this._loc(), { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: snH12(this._hass) });
    const prioTxt = snT(this._config, this._hass)["prio_" + (n.p || "medium")] || n.p || "medium";
    out.push(`<div class="hd"><div class="meta">${esc(when)} · ${T.priority} ${esc(prioTxt)} · ${esc(T.outcomes[n.o] || n.o || "—")}${n.dupe && n.o !== "dupe" ? ` · ♻ ${T.dupe}` : ""}</div>
      <b class="ttl">${esc(n.ti || "—")}</b>
      ${n.m && n.m !== n.ti ? `<div class="msg">${esc(snPlainMsg(n.m))}</div>` : ""}
      ${n.sp && ![snPlainMsg(n.m || ""), n.m, n.ti].map((x) => String(x || "").trim()).includes(String(n.sp).trim()) ? `<div class="note">🔊 ${esc(n.sp)}</div>` : ""}
      ${n.ctx && n.ctx.id ? `<div class="note sentby" id="sentBy" title="context ${esc(n.ctx.id)}">…</div>` : ""}
      ${n.stt ? `<div class="note">⏱ ${esc(T.st_time)} ${esc(n.stt.ms)} ms${n.stt.slow ? ` · ${esc(T.st_slow)} ${esc(snDeliveryAlias(this._hass, n.stt.slow) || n.stt.slow)}` : ""}${n.stt.rate != null ? ` · ${Math.round(+n.stt.rate * 100)}% ${esc(T.st_rate)}` : ""}</div>` : ""}</div>`);
    // 0.79.0: a duplicate - when the original went out, and whether the same run sent both
    if (n.dupe || n.o === "dupe") out.push(`<div class="pb warn" id="dupeOf"><div class="pbt">♻ ${esc(T.dupe_no_orig)}</div></div>`);
    // 0.61.0: targets of the call that no channel took (e.g. a media_player no delivery accepts)
    if (n.ua && n.ua.length) out.push(`<div class="pb warn"><div class="pbt">⚠ ${esc(T.ua_title)}</div><div class="pbw">${esc(n.ua.join(", "))}</div><div class="pbf">${esc(T.ua_hint)}</div></div>`);
    if (n.un && n.un.length) out.push(`<div class="pb warn"><div class="pbt">⚠ ${esc(T.un_title)}</div><div class="pbw">${esc(n.un.join(" · "))}</div></div>`);

    // sort the archived channels: sent, problems (failed / missed), routine skips
    const SN_ROUTINE = new Set(["SNOOZE", "SNOOZED", "PRIORITY", "DELIVERY_CONDITION", "OCCUPANCY", "DELIVERY_DISABLED",
      "SCENARIO", "TRANSPORT_DISABLED", "NO_SCENARIO", "DUPE"]);
    const sent = [], problems = [], skipped = [];
    for (const ch of n.dl || []) {
      if (ch.r === "ok") sent.push(ch);
      else if (ch.r === "err") problems.push(ch);
      else if (ch.r === "skip" && !SN_ROUTINE.has(String(ch.why || "").toUpperCase())
        && !(String(ch.why || "").toUpperCase() === "NO_TARGET" && !((n.ov || {})[ch.n]) && !(+n.mi > 0))) problems.push(ch);
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
    const chTxt = [`<b class="c-ok">${sent.length}</b> ${snW(T, "ch_sent", sent.length)}`,
      problems.length ? `<b class="c-pb">${problems.length}</b> ${T.ch_problems}` : "",
      skipped.length ? `<span style="opacity:.8">${snPl(T, "ch_skipped", skipped.length)}</span>` : ""].filter(Boolean).map((x) => `<div>${x}</div>`).join("");
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
      if (ch.r === "ok") why = T.st_ok + (ch.calls ? ` (${snPl(T, "calls", ch.calls)})` : "");
      else if (ch.r === "err") why = `${T.st_err}${ch.err ? ": " + esc(ch.err.join(" / ")) : ""}`;
      else why = `${esc(this._reasonText(ch.why, T))}${ch.tr && String(ch.why || "").toUpperCase() === "NO_TARGET" ? ` (${T.target_required} ${esc(ch.tr)})` : ""}`;
      const tg = ch.tg ? tgText(ch.tg) : "";
      const meta = [by.length ? `${T.started_by}: ${esc(by.join(" · "))}` : "",
        src.off.length ? `${T.scen_would_off}: ${esc(src.off.map((x) => this._scenarioLabel(x)).join(", "))}` : "",
        offBy.length ? `${T.r_off_by}: ${esc(offBy.join(", "))}` : ""].filter(Boolean);
      return `<div class="ch ${cls || ""}"><div class="r1"><span class="st ${ch.r}">${icon}</span>
        <span class="nm">${esc(alias || ch.n)}</span>${alias && !snSame(alias, ch.n) ? `<span class="al tech">${esc(ch.n)}</span>` : ""}</div>
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
        <div class="pbw">${failed ? esc((ch.err || []).join(" / ") || T.st_err) : esc(this._reasonText(ch.why, T))}${ch.tr && code === "NO_TARGET" ? ` (${T.target_required} ${esc(ch.tr)})` : ""}</div>
        ${fix ? `<div class="pbf">${esc(fix).replace(/`([^`]+)`/g, "<code>$1</code>")}</div>` : ""}</div>`);
    }

    // what went out
    if (sent.length) out.push(sent.map((ch) => chRow(ch, "")).join(""));
    if (!(n.dl || []).length) out.push(`<div class="note">${T.no_channels}</div>`);

    // routine skips and channels never involved, folded
    if (skipped.length) {
      const whyCount = {};
      for (const ch of skipped) { const w = this._reasonText(ch.why, T) || T.st_skip; whyCount[w] = (whyCount[w] || 0) + 1; }
      const whySum = Object.entries(whyCount).sort((a, b) => b[1] - a[1]).map(([w, c]) => skipped.length > 1 && Object.keys(whyCount).length > 1 ? `${w} ${c}` : w).join(", ");
      out.push(`<details class="fold"${det(false)}><summary>${snPl(T, "grp_skipped", skipped.length)} · ${esc(whySum)}</summary>${skipped.map((ch) => chRow(ch, "quiet")).join("")}</details>`);
    }
    if (notStarted.length) {
      out.push(`<details class="fold"${det(false)}><summary>${snPl(T, "grp_not", notStarted.length)}</summary>${notStarted.map((k) => {
        const alias = snDeliveryAlias(this._hass, k);
        return `<div class="ch not"><div class="r1"><span class="st">·</span><span class="nm">${esc(alias || k)}</span>${alias && !snSame(alias, k) ? `<span class="al tech">${esc(k)}</span>` : ""}</div>
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
    el.innerHTML = snIconify(out.join(""), this && this._config);
    if (n.ctx && n.ctx.id) this._sentBy(n);
    if (n.dupe || n.o === "dupe") this._dupeOf(n);
  }
}

/**
 * 0.79.0: the notification a duplicate repeats - the newest one before it in the list with the
 * same title and text, sent within the two minutes SuperNotify keeps texts for. Same context id
 * = the same automation/script run called SuperNotify twice.
 */
SupernotifyWhyCard.prototype._dupeOf = async function (n) {
  const T = this._T();
  const esc = snEsc;
  const idx = this._index();
  const items = (idx && idx.items) || [];
  const norm = (x) => String(x || "").trim();
  const self = (r) => r.fid === n.id || r.id === n.id || String(n.id || "").startsWith(String(r.id)); // the index keeps 8 characters
  const orig = items.filter((r) => !self(r) && r.o !== "dupe" && r.t <= n.t && n.t - r.t <= 130
    && norm(r.ti) === norm(n.ti) && (!r.m || !n.m || norm(snPlainMsg(r.m)).slice(0, 60) === norm(snPlainMsg(n.m)).slice(0, 60)))
    .sort((a, b) => b.t - a.t)[0];
  const put = (html) => { const el = this.shadowRoot && this.shadowRoot.getElementById("dupeOf"); if (el && this._sel && String(n.id || "").startsWith(String(this._sel))) el.innerHTML = snIconify(html, this._config); };
  if (!orig) return;
  const at = new Date(orig.t * 1000).toLocaleTimeString(this._loc(), { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: snH12(this._hass) });
  const head = `<div class="pbt">♻ ${esc(T.dupe_of.replace("{s}", Math.max(0, Math.round(n.t - orig.t))).replace("{t}", at))}</div>`;
  const link = `<div class="pbf"><a href="#" id="dupeLink">${esc(T.dupe_open)} ›</a></div>`;
  put(head + link);
  const wire = () => { const a = this.shadowRoot && this.shadowRoot.getElementById("dupeLink"); if (a) a.onclick = (e) => { e.preventDefault(); this._select(orig.id); }; };
  wire();
  // same run? compare the contexts (the original's detail is read once and kept)
  if (!(n.ctx && n.ctx.id)) return;
  if (!this._cache.has(orig.id)) this._cache.set(orig.id, await this._fetch(orig.id));
  const o = (this._cache.get(orig.id) || {}).n || {};
  if (!(o.ctx && o.ctx.id === n.ctx.id)) return;
  let who = "";
  await this._sentBy(n).catch(() => {});
  const res = this._sentCache && this._sentCache.get(n.id);
  if (res && res.kind !== "person") who = `${res.kind === "automation" ? T.sent_auto : T.sent_script} «${res.name}»`;
  put(head + `<div class="pbw">${esc(who ? T.dupe_same_run.replace("{a}", who) : T.dupe_same_run_anon)}</div>` + link);
  wire();
};

SupernotifyWhyCard.prototype._sentBy = async function (n) {
  // 0.61.0: who sent it - the automation or script whose run carries the notification's context
  // (logbook), else the person of the user that made the call
  const T = this._T();
  const put = (html) => { const el = this.shadowRoot && this.shadowRoot.getElementById("sentBy"); if (el) el.innerHTML = snIconify(html, this._config); };
  const esc = snEsc;
  this._sentCache = this._sentCache || new Map();
  let res = this._sentCache.get(n.id);
  if (res === undefined) {
    res = null;
    try {
      const t = new Date((n.t || 0) * 1000);
      const ev = await this._hass.callWS({ type: "logbook/get_events", start_time: new Date(t.getTime() - 120000).toISOString(),
        end_time: new Date(t.getTime() + 5000).toISOString(), context_id: n.ctx.id });
      const hit = (ev || []).find((e) => /^(automation|script)\./.test(e.entity_id || "") && e.context_id === n.ctx.id)
        || (ev || []).find((e) => /^(automation|script)\./.test(e.entity_id || ""));
      if (hit) res = { kind: hit.entity_id.split(".")[0], id: hit.entity_id, name: hit.name || hit.entity_id };
    } catch (e) { /* logbook not available to this user: fall back below */ }
    if (!res && n.ctx.user_id) {
      const pid = Object.keys(this._hass.states).find((e) => e.startsWith("person.") && (this._hass.states[e].attributes || {}).user_id === n.ctx.user_id);
      if (pid) res = { kind: "person", id: pid, name: (this._hass.states[pid].attributes || {}).friendly_name || pid };
    }
    this._sentCache.set(n.id, res);
  }
  if (!res) { put(`📨 ${esc(T.sent_unknown)}`); return; }
  const what = res.kind === "automation" ? T.sent_auto : res.kind === "script" ? T.sent_script : T.sent_person;
  put(`📨 ${esc(T.sent_by)} ${esc(what)} <a href="#" id="sentLink">${esc(res.name)}</a>`);
  const a = this.shadowRoot.getElementById("sentLink");
  if (a) a.onclick = (e) => { e.preventDefault(); this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: res.id }, bubbles: true, composed: true })); };
};

customElements.define("supernotify-why-card", SupernotifyWhyCard);

window.customCards.push({
  type: "supernotify-why-card",
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/why.md",
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
    grp_skipped: "skipped", grp_not: "not involved", trace_title: "Full selection trace",
    fix: { NO_TARGET: "No recipient has an address for this channel: add one to a recipient, give the channel fixed targets, or leave it out of this call.",
      ERROR: "The integration behind this channel answered with an error: check its own log entry.",
      NO_ACTION: "The channel has no action to call: set `action:` on the delivery.",
      INVALID_ACTION_DATA: "The data passed to the action was rejected: check the `data:` of the call or of the delivery." },
    scenarios: "Scenarios in force", no_scenarios: "no scenario in force",
    applied: "forced by the call", required: "required by the call", constrain: "limited by the call to",
    presence: "Presence", home: "home", away: "away",
    channels: "Channels", no_channels: "no channel was selected",
    st_ok: "delivered", st_err: "failed", st_skip: "skipped", st_supp: "suppressed", calls: "calls", calls_1: "call",
    target_required: "target required:", started_by: "selected by", scen_would_off: "switched off by (overruled)",
    src_default: "always on (default)", src_fallback: "fallback for {x}", src_scen: "scenario", src_call: "the call itself",
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
    st_time: "took", st_slow: "slowest", st_rate: "of the channels succeeded",
    ua_title: "Targets no channel took", ua_hint: "They were in the call, but no selected channel accepts this kind of target.",
    dupe_of: "Duplicate: the same text went out {s} s earlier, at {t}. SuperNotify drops an identical text for two minutes.",
    dupe_open: "Open the original", dupe_same_run: "Both come from the same run of {a}: it calls SuperNotify twice with the same text. One call is enough - SuperNotify picks the speakers itself.",
    dupe_same_run_anon: "Both come from the same run (same context): whatever sent it calls SuperNotify twice with the same text.",
    dupe_no_orig: "Duplicate of a notification sent shortly before (not in the list).",
    un_title: "Names that do not exist", sent_by: "Sent by", sent_auto: "automation", sent_script: "script",
    sent_person: "", sent_unknown: "sender not known (no automation or person in its context)",
    trace: "Selection trace", no_trace: "The full selection trace is only recorded when the notify call has debug: true, and archived when the archive diagnostics include it.",
    reasons: { NO_TARGET: "no usable target", DUPE: "duplicate", PRIORITY: "not for this priority",
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
    nobody: "nessuno in casa", ch_sent: "partiti", ch_sent_1: "partito", ch_problems: "da guardare", ch_skipped: "saltati", ch_skipped_1: "saltato",
    pb_failed: "fallito", pb_missed: "chiesto ma non partito",
    grp_skipped: "saltati", grp_skipped_1: "saltato", grp_not: "non coinvolti", grp_not_1: "non coinvolto", trace_title: "Trace di selezione completo",
    fix: { NO_TARGET: "Nessun destinatario ha un indirizzo per questo canale: aggiungilo a un destinatario, dai al canale dei target fissi, oppure toglilo da questa chiamata.",
      ERROR: "L'integrazione dietro questo canale ha risposto con un errore: guarda la sua voce nel log.",
      NO_ACTION: "Il canale non ha un'azione da chiamare: imposta `action:` nella delivery.",
      INVALID_ACTION_DATA: "I dati passati all'azione sono stati rifiutati: controlla il `data:` della chiamata o della delivery." },
    scenarios: "Scenari in vigore", no_scenarios: "nessuno scenario in vigore",
    applied: "forzati dalla chiamata", required: "richiesti dalla chiamata", constrain: "limitati dalla chiamata a",
    presence: "Presenza", home: "in casa", away: "fuori",
    channels: "Canali", no_channels: "nessun canale selezionato",
    st_ok: "consegnata", st_err: "fallita", st_skip: "saltata", st_supp: "scartata", calls: "chiamate", calls_1: "chiamata",
    target_required: "target richiesto:", started_by: "scelto da", scen_would_off: "spento da (ma ha perso)",
    src_default: "sempre attivo (default)", src_fallback: "riserva di {x}", src_scen: "scenario", src_call: "la chiamata stessa",
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
    st_time: "durata", st_slow: "più lento", st_rate: "dei canali riusciti",
    ua_title: "Destinatari che nessun canale ha preso", ua_hint: "Erano nella chiamata, ma nessun canale scelto accetta questo tipo di destinatario.",
    dupe_of: "Doppione: lo stesso testo è partito {s} s prima, alle {t}. SuperNotify scarta un testo uguale per due minuti.",
    dupe_open: "Apri l'originale", dupe_same_run: "Arrivano tutte e due dalla stessa esecuzione di {a}: chiama SuperNotify due volte con lo stesso testo. Basta una chiamata: gli altoparlanti li sceglie SuperNotify.",
    dupe_same_run_anon: "Arrivano tutte e due dalla stessa esecuzione (stesso contesto): chi l'ha inviata chiama SuperNotify due volte con lo stesso testo.",
    dupe_no_orig: "Doppione di una notifica partita poco prima (non è nell'elenco).",
    un_title: "Nomi che non esistono", sent_by: "Inviata da", sent_auto: "automazione", sent_script: "script",
    sent_person: "", sent_unknown: "mittente non noto (nessuna automazione o persona nel suo contesto)",
    trace: "Trace di selezione", no_trace: "Il trace completo viene registrato solo se la chiamata ha debug: true, e archiviato se la diagnostica dell'archivio lo include.",
    reasons: { NO_TARGET: "nessun destinatario utilizzabile", DUPE: "doppione", PRIORITY: "non per questa priorità",
      SNOOZE: "in pausa", SNOOZED: "in pausa", DELIVERY_CONDITION: "condizione del canale falsa", OCCUPANCY: "regola di presenza", ERROR: "errore",
      DELIVERY_DISABLED: "spento", SCENARIO: "scenario", TRANSPORT_DISABLED: "il suo transport è spento",
      NO_SCENARIO: "manca uno scenario richiesto", NO_ACTION: "nessuna azione da chiamare",
      INVALID_ACTION_DATA: "dati dell'azione non validi", UNKNOWN: "motivo sconosciuto" },
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-tools-card — maintenance and enquiries (0.62.0)
 * The buttons a SuperNotify dashboard usually builds out of mushroom cards,
 * with the result shown in the card: cleanup counts, what an override reset
 * put back, and every enquire_* answer as a readable tree (Copy JSON).
 * ════════════════════════════════════════════════════════════════════════ */

const SN_TOOLS_ENQ = [
  ["enquire_configuration", "q_config"], ["enquire_scenarios", "q_scen"], ["enquire_active_scenarios", "q_active"],
  ["enquire_deliveries_by_scenario", "q_by_scen"], ["enquire_implicit_deliveries", "q_implicit"],
  ["enquire_recipients", "q_recipients"], ["enquire_occupancy", "q_occupancy"], ["enquire_snoozes", "q_snoozes"],
  ["enquire_last_notification", "q_last"],
];

const SN_TOOLS_STRINGS = {
  en: {
    maint: "Maintenance", enq: "Ask SuperNotify", refresh: "Publish every entity again", refresh_btn: "Refresh", resume_btn: "Resume", refreshed: "Entities published again.",
    resume_all: "Resume every pause", cleared_n: "pauses resumed", purge_arch: "Clean the archive", purge_media: "Clean the pictures",
    older: "older than", days: "days", purge_btn: "Clean", confirm: "Tap again to confirm", purged: "deleted", remaining: "left",
    reset: "Undo the changes made by hand", reset_btn: "Reset", reset_none: "Nothing to reset: everything is as configured.",
    reset_done: "Back to the configuration:", k_all: "everything", k_scenario: "scenarios", k_delivery: "channels",
    k_recipient: "people", k_transport: "transports",
    q_config: "Configuration", q_scen: "Scenarios", q_active: "Active scenarios", q_by_scen: "Channels by scenario",
    q_implicit: "Default channels", q_recipients: "Recipients", q_occupancy: "Who is home", q_snoozes: "Pauses",
    q_last: "Last notification", copy: "Copy JSON", copied: "Copied", close: "Close", empty: "(empty)",
    err: "SuperNotify answered with an error:", err_config: "SuperNotify 2.12.0 cannot return its configuration when a channel has template conditions (rhizomatics/supernotify#241).",
    settings: "Integration settings", running: "working…", more: "more",
  },
  it: {
    maint: "Manutenzione", enq: "Chiedi a SuperNotify", refresh: "Ripubblica tutte le entità", refresh_btn: "Aggiorna", resume_btn: "Riprendi", refreshed: "Entità ripubblicate.",
    resume_all: "Riprendi tutte le pause", cleared_n: "pause riprese", purge_arch: "Pulisci l'archivio", purge_media: "Pulisci le foto",
    older: "più vecchie di", days: "giorni", purge_btn: "Pulisci", confirm: "Tocca ancora per confermare", purged: "cancellati", remaining: "rimasti",
    reset: "Annulla le modifiche fatte a mano", reset_btn: "Ripristina", reset_none: "Niente da ripristinare: è tutto come da configurazione.",
    reset_done: "Tornati alla configurazione:", k_all: "tutto", k_scenario: "scenari", k_delivery: "canali",
    k_recipient: "persone", k_transport: "transport",
    q_config: "Configurazione", q_scen: "Scenari", q_active: "Scenari attivi", q_by_scen: "Canali per scenario",
    q_implicit: "Canali predefiniti", q_recipients: "Destinatari", q_occupancy: "Chi è in casa", q_snoozes: "Pause",
    q_last: "Ultima notifica", copy: "Copia JSON", copied: "Copiato", close: "Chiudi", empty: "(vuoto)",
    err: "SuperNotify ha risposto con un errore:", err_config: "SuperNotify 2.12.0 non riesce a restituire la configurazione quando un canale ha condizioni con template (rhizomatics/supernotify#241).",
    settings: "Impostazioni dell'integrazione", running: "in corso…", more: "altri",
  },
};

class SupernotifyToolsCard extends SnCard {
  static getConfigForm() {
    return snForm("tools");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { style: "supernotify", archive_days: 30, media_days: 7, ...(config || {}) };
    this._rendered = false;
  }

  static snTracked = false;

  _onHass(hass, fresh) {
    if (fresh) this._render();
  }

  getCardSize() {
    return 6;
  }

  _T() {
    const lang = String(this._config.language || (this._hass && this._hass.language) || "en").split("-")[0];
    return SN_TOOLS_STRINGS[lang] || SN_TOOLS_STRINGS.en;
  }

  async _call(service, data, withResponse = true) {
    const msg = { type: "call_service", domain: "supernotify", service, service_data: data || {} };
    if (withResponse) msg.return_response = true;
    const r = await this._hass.callWS(msg);
    return withResponse ? (r && r.response) : r;
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    const T = this._T();
    const c = this._config;
    const esc = snEsc;
    this.shadowRoot.innerHTML = snIconify(`
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; margin: 14px 0 8px; }
        .sec:first-of-type { margin-top: 0; }
        .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 0; position: relative; }
        .row + .row::before { content: ""; position: absolute; left: 0; right: 0; top: 0; border-top: 1px solid ${p.line}; }
        .lbl { flex: 1 1 180px; font-size: 14px; font-weight: 600; }
        .lbl small { display: block; font-weight: 400; color: ${p.muted}; font-size: 12px; }
        button { font: inherit; cursor: pointer; }
        .b { border: 1.5px solid ${p.line}; background: ${p.soft}; color: ${p.brandD}; border-radius: 999px;
             padding: 6px 14px; font-size: 13px; font-weight: 700; min-height: 34px; }
        .b.arm { background: ${p.crit}; border-color: ${p.crit}; color: #fff; }
        .b:disabled { opacity: .6; cursor: default; }
        input[type=number], select { font: inherit; font-size: 13px; padding: 6px 8px; border-radius: 8px; border: 1.5px solid ${p.line};
             background: ${p.panel}; color: ${p.ink}; }
        input[type=number] { width: 64px; }
        .res { font-size: 12.5px; color: ${p.muted}; flex-basis: 100%; }
        .res.ok { color: ${p.ok}; } .res.err { color: ${p.crit}; }
        .qs { display: flex; flex-wrap: wrap; gap: 6px; }
        .q.on { background: ${p.brand}; border-color: ${p.brand}; color: ${p.onBrand}; }
        .out { margin-top: 10px; border: 1.5px solid ${p.line}; border-radius: 12px; padding: 10px 12px; }
        .oh { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .oh b { flex: 1; font-size: 14px; }
        .tree { font-size: 12.5px; line-height: 1.5; overflow-wrap: anywhere; max-height: 420px; overflow: auto; }
        .tree details { margin-left: 2px; } .tree summary { cursor: pointer; }
        .tree .k { color: ${p.brandD}; font-weight: 700; } .tree .v { color: ${p.ink}; } .tree .n { color: ${p.muted}; }
        .tree .kids { margin-left: 14px; border-left: 1px solid ${p.line}; padding-left: 8px; }
        .lnk { display: inline-block; margin-top: 12px; color: ${p.brandD}; font-size: 13px; font-weight: 700; text-decoration: none; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(c, this._dark)}
        <div class="sec">${esc(T.maint)}</div>
        <div class="row"><span class="lbl">🔄 ${esc(T.refresh)}</span><button class="b" id="refresh">${esc(T.refresh_btn)}</button><div class="res" id="r_refresh"></div></div>
        <div class="row"><span class="lbl">😴 ${esc(T.resume_all)}</span><button class="b" id="clear">${esc(T.resume_btn)}</button><div class="res" id="r_clear"></div></div>
        <div class="row"><span class="lbl">🗂 ${esc(T.purge_arch)}<small>${esc(T.older)} <input type="number" style="width:64px" id="dArch" min="1" value="${esc(c.archive_days)}"> ${esc(T.days)}</small></span>
          <button class="b" id="purgeArch">${esc(T.purge_btn)}</button><div class="res" id="r_purgeArch"></div></div>
        <div class="row"><span class="lbl">🖼️ ${esc(T.purge_media)}<small>${esc(T.older)} <input type="number" style="width:64px" id="dMedia" min="1" value="${esc(c.media_days)}"> ${esc(T.days)}</small></span>
          <button class="b" id="purgeMedia">${esc(T.purge_btn)}</button><div class="res" id="r_purgeMedia"></div></div>
        <div class="row"><span class="lbl">↩ ${esc(T.reset)}<small><select id="kind" aria-label="${esc(T.reset)}">
            ${["", "scenario", "delivery", "recipient", "transport"].map((k) => `<option value="${k}">${esc(T["k_" + (k || "all")])}</option>`).join("")}</select></small></span>
          <button class="b" id="reset">${esc(T.reset_btn)}</button><div class="res" id="r_reset"></div></div>
        <div class="sec">${esc(T.enq)}</div>
        <div class="qs">${SN_TOOLS_ENQ.map(([svc, key]) => `<button class="b q" data-q="${svc}">${esc(T[key])}</button>`).join("")}</div>
        <div id="out"></div>
        <a class="lnk" href="/config/integrations/integration/supernotify">⚙️ ${esc(T.settings)} ›</a>
        ${snVer(c, "tools", p)}
      </ha-card>`, c);
    const $ = (id) => this.shadowRoot.getElementById(id);
    const say = (id, text, cls) => { const el = $("r_" + id); if (el) { el.className = "res " + (cls || ""); el.textContent = text; } };
    const errText = (e) => (e && (e.message || e.code)) || String(e);
    // destructive buttons: first tap arms (red, "tap again"), second runs; disarms after 4 s
    const armed = (btn, run) => {
      btn.onclick = async () => {
        if (!btn.classList.contains("arm")) {
          btn.classList.add("arm"); btn.dataset.txt = btn.textContent; btn.textContent = T.confirm;
          clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove("arm"); btn.textContent = btn.dataset.txt; }, 4000);
          return;
        }
        clearTimeout(btn._t); btn.classList.remove("arm"); btn.textContent = btn.dataset.txt;
        btn.disabled = true;
        try { await run(); } finally { btn.disabled = false; }
      };
    };
    $("refresh").onclick = async () => {
      say("refresh", T.running);
      try { await this._call("refresh_entities", {}, false); say("refresh", "✔ " + T.refreshed, "ok"); } catch (e) { say("refresh", "✖ " + errText(e), "err"); }
    };
    $("clear").onclick = async () => {
      say("clear", T.running);
      try { const r = await this._call("clear_snoozes"); say("clear", `✔ ${(r && r.cleared) || 0} ${T.cleared_n}`, "ok"); snEnquireBust(300); }
      catch (e) { say("clear", "✖ " + errText(e), "err"); }
    };
    const purge = (id, svc, input) => async () => {
      const days = Math.max(1, +$(input).value || 1);
      say(id, T.running);
      try {
        const r = await this._call(svc, { days });
        say(id, `✔ ${(r && r.purged) || 0} ${T.purged} · ${(r && r.remaining) != null ? r.remaining : "?"} ${T.remaining}`, "ok");
        if (svc === "purge_archive") snArchiveStore.poke(this._hass);
      } catch (e) { say(id, "✖ " + errText(e), "err"); }
    };
    armed($("purgeArch"), purge("purgeArch", "purge_archive", "dArch"));
    armed($("purgeMedia"), purge("purgeMedia", "purge_media", "dMedia"));
    armed($("reset"), async () => {
      const kind = $("kind").value;
      say("reset", T.running);
      try {
        const r = await this._call("reset_overrides", kind ? { kind } : {});
        const done = Object.entries((r && r.reset) || {}).filter(([, v]) => Array.isArray(v) && v.length);
        say("reset", done.length ? `✔ ${T.reset_done} ${done.map(([k, v]) => `${T["k_" + k] || k}: ${v.join(", ")}`).join(" · ")}` : "✔ " + T.reset_none, "ok");
        snEnquireBust(300);
      } catch (e) { say("reset", "✖ " + errText(e), "err"); }
    });
    this.shadowRoot.querySelectorAll(".q").forEach((b) => {
      b.onclick = () => this._ask(b.dataset.q);
    });
  }

  async _ask(svc) {
    const T = this._T();
    const out = this.shadowRoot.getElementById("out");
    const esc = snEsc;
    this.shadowRoot.querySelectorAll(".q").forEach((b) => b.classList.toggle("on", b.dataset.q === svc));
    const title = T[(SN_TOOLS_ENQ.find(([s]) => s === svc) || [])[1]] || svc;
    out.innerHTML = `<div class="out"><div class="oh"><b>${esc(title)}</b></div><div class="res">${esc(T.running)}</div></div>`;
    let data, err;
    try { data = await this._call(svc); } catch (e) { err = e; }
    if (err) {
      const m = String((err && (err.message || err.code)) || err);
      const known = svc === "enquire_configuration" ? `<div class="res">${esc(T.err_config)}</div>` : "";
      out.innerHTML = `<div class="out"><div class="oh"><b>${esc(title)}</b><button class="b" id="oclose">${esc(T.close)}</button></div>
        <div class="res err">✖ ${esc(T.err)} ${esc(m)}</div>${known}</div>`;
    } else {
      out.innerHTML = snIconify(`<div class="out"><div class="oh"><b>${esc(title)}</b><button class="b" id="ocopy">${esc(T.copy)}</button>
        <button class="b" id="oclose">${esc(T.close)}</button></div><div class="tree">${this._tree(data, 0)}</div></div>`, this._config);
      const cp = this.shadowRoot.getElementById("ocopy");
      cp.onclick = async () => {
        try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); cp.textContent = "✔ " + T.copied; }
        catch (e) { cp.textContent = "✖"; }
      };
    }
    const cl = this.shadowRoot.getElementById("oclose");
    if (cl) cl.onclick = () => { out.innerHTML = ""; this.shadowRoot.querySelectorAll(".q").forEach((b) => b.classList.remove("on")); };
  }

  /** A JSON value as a readable tree: scalars inline, objects and lists foldable (first level open). */
  _tree(v, depth) {
    const T = this._T();
    const esc = snEsc;
    const scalar = (x) => x === null || x === undefined ? `<span class="n">—</span>`
      : typeof x === "boolean" ? `<span class="v">${x ? "✔" : "✖"} ${x}</span>`
      : `<span class="v">${esc(x)}</span>`;
    if (v === null || typeof v !== "object") return scalar(v);
    const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v);
    if (!entries.length) return `<span class="n">${esc(T.empty)}</span>`;
    if (Array.isArray(v) && v.every((x) => x === null || typeof x !== "object")) {
      const shown = v.slice(0, 40).map((x) => esc(x)).join(", ");
      return `<span class="v">${shown}${v.length > 40 ? ` … +${v.length - 40} ${esc(T.more)}` : ""}</span>`;
    }
    const lines = entries.slice(0, 200).map(([k, x]) => {
      if (x !== null && typeof x === "object" && (Array.isArray(x) ? x.some((y) => y !== null && typeof y === "object") : Object.keys(x).length)) {
        const n = Array.isArray(x) ? x.length : Object.keys(x).length;
        return `<details${depth < 1 ? " open" : ""}><summary><span class="k">${esc(k)}</span> <span class="n">(${n})</span></summary>
          <div class="kids">${depth > 6 ? `<span class="n">…</span>` : this._tree(x, depth + 1)}</div></details>`;
      }
      return `<div><span class="k">${esc(k)}</span>: ${this._tree(x, depth + 1)}</div>`;
    });
    if (entries.length > 200) lines.push(`<div class="n">… +${entries.length - 200} ${esc(T.more)}</div>`);
    return lines.join("");
  }
}

customElements.define("supernotify-tools-card", SupernotifyToolsCard);

window.customCards.push({
  type: "supernotify-tools-card",
  preview: true,
  documentationURL: "https://github.com/lollox80/supernotify-cards/blob/main/docs/cards/tools.md",
  name: "SuperNotify Tools",
  description: "Maintenance with the result on the spot (refresh, resume pauses, archive and picture cleanup, reset hand-made changes) and every SuperNotify enquiry shown readable.",
});

/**
 * 0.73.0: the other languages SuperNotify itself is translated into. Merged over English at load,
 * so a string a language does not have yet shows in English. Keys: the language part of
 * hass.language (zh-Hans -> zh, pt-BR -> pt).
 */
const SN_I18N_EXTRA = {"de":{"SN_STRINGS":{"presence":"Anwesenheit","time_band":"Zeitfenster","quiet":"Ruhe","act_scen":"Aktive Szenarien","on":"an","off":"aus","active":"aktiv","dnd":"Nicht stören","tap_silence":"tippen zum Stummschalten","snooze":"Pause","min":"Min.","pause_nc":"Nicht-Kritisches pausieren","snoozed":"Pausiert","until":"bis","tap_clear":"tippen zum Aufheben","announce":"Durchsage","intercom":"Gegensprechen","announce_ph":"Auf allen Lautsprechern durchsagen…","send":"Senden","announced":"Durchgesagt","cleared":"Pausen aufgehoben","snoozed_for":"Nicht-kritische Benachrichtigungen pausiert für","sent":"Gesendet","sent_today":"Heute gesendet","since_startup":"seit dem Start","yesterday":"gestern","failures":"Fehler","fail_today":"fehlgeschlagene Kanal-Sendungen heute","deliveries":"Kanäle","enabled_total":"aktiv/gesamt","last_notif":"Letzte Benachrichtigung","transports":"Transporte","delivered":"zugestellt","failed":"fehlgeschlagen","channels":"Kanäle","none":"keine","no_transports":"keine Transport-Entitäten gefunden","tr_used":"genutzt von","tr_unused":"kein Kanal nutzt ihn","start":"Start","volume":"Lautstärke","now":"jetzt","crosses":"über Mitternacht","no_voice":"keine Sprache","mute_hint":"Ein Zeitfenster mit <b>0%</b> sendet <b>keine Sprachdurchsage</b> (Alexa und TTS aus, Push und Dashboard werden trotzdem zugestellt). Kritische und hohe Priorität werden immer gesprochen.","enabled":"aktiv","implicit":"immer an","explicit":"auf Anfrage","by_scenario":"nur per Szenario","fallback":"Reserve","fallback_err":"Reserve bei Fehler","inc_sum":"dieser Kanäle","inc_always":"starten von selbst","inc_req":"nur wenn angefordert","inc_scen":"nur mit einem Szenario","grp_auto":"Starten von selbst","grp_named":"Nur wenn im Aufruf genannt","grp_scen":"Nur mit einem Szenario","grp_fallback":"Reserve, wenn die anderen scheitern","ch_title":"Kanäle","ch_count":"{on} von {tot} an","off_manual":"ausgeschaltet","paused_by":"gerade pausiert durch","on_by":"gerade an durch","fixed_targets":"feste Ziele","no_deliveries":"keine Zustellungs-Entitäten gefunden","home":"zu Hause","away":"unterwegs","devices":"Geräte","devices_1":"Gerät","rc_test":"Test senden","rc_test_confirm":"Zum Senden erneut tippen","rc_test_sent":"Test gesendet","rc_test_title":"SuperNotify-Test","rc_test_msg":"Testnachricht vom Dashboard,","overrides":"Zustellungs-Übersteuerungen","overrides_1":"Zustellungs-Übersteuerung","no_contact":"keine Kontaktpunkte","no_recipients":"keine Empfänger-Entitäten gefunden","details":"Details","h_update":"Update verfügbar:","h_restart":"Home Assistant neu starten, um das Update abzuschließen","h_uptodate":"aktuell","h_transport_err":"Transporte mit Fehlern","h_channels_off":"Kanäle aus","h_all_good":"Alles in Ordnung","h_health":"Zustand","h_failures":"Fehler","h_failures_1":"Fehler","h_transport_err_1":"Transport mit Fehlern","h_channels_off_1":"Kanal aus","channels_1":"Kanal","band_early_morning":"Früher Morgen","band_morning":"Morgen","band_afternoon":"Nachmittag","band_evening":"Abend","band_night":"Nacht","band_late_night":"Späte Nacht","h_look_1":"1 Sache zum Ansehen","h_look_n":"{n} Sachen zum Ansehen","h_rest_ok":"alles andere funktioniert","h_ch_on":"{on} von {tot} Kanälen an","h_open":"Öffnen","ln_delivered":"zugestellt","ln_failed":"fehlgeschlagen","ln_why":"Warum","tgt_loading":"Auswahl wird geladen…","bands_empty_t":"Noch keine Zeitfenster","bands_empty":"Füge ein Zeitfenster pro Tagesabschnitt hinzu: ein input_datetime für den Beginn und ein input_number für die Sprachlautstärke.","active_now":"gerade aktiv","disabled":"deaktiviert","other":"Sonstige","manual":"manuell","apply_now":"jetzt anwenden","applied":"Angewendet","apply_off":"tippen, um es nicht mehr anzuwenden","enabled_lbl":"aktiviert","reset_overrides":"Übersteuerungen zurücksetzen","reset_done":"Übersteuerungen zurückgesetzt","transport_off":"Transport aus","last_notified":"zuletzt benachrichtigt","never_notified":"nie benachrichtigt","media":"Medien","no_scenarios":"keine Szenario-Entitäten gefunden","sim_pick":"🎬 Szenarien — zum Simulieren tippen","sim_fire":"📤 Kanäle","sim_hint":"Echte Daten der Engine (enquire-Dienste). Die Filterung nach Priorität passiert in der Engine und wird hier nicht simuliert. Deaktiviert gewinnt gegen aktiviert, wie beim Zusammenführen zur Laufzeit.","sim_none":"keine Zustellung würde ausgelöst","scenario_tag":"Szenario","sim_go":"Würde gesendet","sim_stop":"Würde nicht gesendet","sim_r_default":"startet von selbst","sim_r_on":"eingeschaltet durch","sim_r_off":"ausgeschaltet durch","sim_r_named":"nur wenn im Aufruf genannt","sim_r_scen":"nur mit einem Szenario, das ihn einschaltet","sim_r_fallback":"Reserve, wenn die anderen scheitern","sim_r_switched":"ausgeschaltet","title":"Titel","message":"Nachricht","priority":"Priorität","channels_lbl":"Kanäle — keiner gewählt = normales Routing","camera_lbl":"Kamera-Schnappschuss","preview":"Vorschau","no_title":"(kein Titel)","no_message":"(keine Nachricht)","default_prio":"Standard (mittel)","comp_hint":"Gewählte Kanäle werden mit delivery_selection: fixed gesendet (nur diese lösen aus). Kritisch ist wirklich kritisch — Sirenen inklusive.","critical_confirm":"Eine KRITISCHE Benachrichtigung senden? Sirenen und maximale Lautstärke inklusive.","write_first":"Schreib zuerst eine Nachricht","sent_toast":"Gesendet","write_or_pick":"Schreib eine Nachricht oder wähle eine Kamera oder einen Kanal","need_2111":"Eine Benachrichtigung ohne Text braucht SuperNotify 2.11.1","send_err":"Nicht gesendet","dry_btn":"Testen ohne Senden","dry_title":"Wenn du es jetzt sendest","dry_err":"Testlauf fehlgeschlagen","dry_would":"würde senden","dry_skip":"übersprungen","dry_nobody":"kein Empfänger, nur direkte Ziele","dry_targets":"Ziele","dry_suppressed":"Die Benachrichtigung würde unterdrückt","dry_fallback":"Kein Kanal würde auslösen: Fallback auf","dry_none":"Kein Kanal ausgewählt","dry_scen":"Aktive Szenarien","dry_raw":"Rohe Antwort","dry_prio":"Priorität","dry_would_n":"Kanäle würden senden","dry_nothing":"Es würde nichts gesendet","dry_dupe":"Duplikat einer kürzlichen Benachrichtigung: sie würde verworfen","dry_no_dupe":"Duplikatprüfung nicht simuliert, damit das echte Senden direkt danach nicht blockiert wird.","dry_restart":"Das laufende SuperNotify kann nicht simulieren: Der Testlauf braucht 2.12, und Home Assistant muss nach dem Update neu gestartet werden.","dry_home":"Zu Hause","dry_empty":"SuperNotify hat nicht geantwortet: ist es 2.12 oder neuer?","dry_reasons":{"NO_TARGET":"kein nutzbares Ziel","DUPE":"Duplikat","PRIORITY":"nicht für diese Priorität","SNOOZED":"pausiert","DELIVERY_CONDITION":"Zustellungsbedingung falsch","OCCUPANCY":"Anwesenheitsregel","TRANSPORT_DISABLED":"Transport aus","DELIVERY_DISABLED":"ausgeschaltet","NO_SCENARIO":"erforderliches Szenario nicht aktiv","NO_ACTION":"keine Aktion","INVALID_ACTION_DATA":"ungültige Daten","UNKNOWN":"unbekannter Grund","ERROR":"Fehler"},"prio_minimum":"Minimal","prio_low":"Niedrig","prio_medium":"Mittel","prio_high":"Hoch","prio_critical":"Kritisch","target_lbl":"Ziel — Personen, Geräte, Bereiche, Etagen, Labels","custom_target_lbl":"Eigene Ziele (E-Mail, Telegram-IDs, …) — durch Komma getrennt","adv_title":"Erweiterte Optionen","adv_spoken":"Gesprochene Nachricht (Alexa, TTS)","adv_spoken_ph":"was die Lautsprecher sagen, falls anders als der Text","adv_apply":"Diese Szenarien anwenden","adv_require":"Nur senden, wenn diese Szenarien aktiv sind","adv_constrain":"Nur diese Szenarien berücksichtigen","adv_snapshot":"Bild von einer URL","adv_debug":"Debug: vollständige Auswahl-Ablaufverfolgung aufzeichnen (in der Warum-Karte angezeigt)","custom_target_ph":"z. B. user@example.com, 123456789","native_target_tag":"🎯 nativer Bereich/Etage/Label","target_warn":"⚠️ Bereiche, Etagen und Labels werden nur von notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts und chime aufgelöst. Mit jedem anderen Kanal — oder dem Standard-Routing, wenn oben kein Kanal gewählt ist — kann die Benachrichtigung unbemerkt ohne Ziel bleiben. Wähle einen kompatiblen Kanal oder füge direkt eine Person bzw. ein Gerät hinzu.","aut_search":"Automationen suchen…","aut_all":"Alle","aut_none":"Keine Treffer","aut_err":"Manifest nicht gefunden — erzeuge es mit tools/genera_vista_automazioni.py","aut_updated":"Liste aktualisiert","aut_count":"Automationen","aut_count_1":"Automation","never":"nie","ago_now":"jetzt","ago_min":"Min. her","ago_h":"Std. her","ago_d":"T. her","aut_disabled_only":"Nur deaktivierte","grp_active":"aktiv","repeat":"Wiederholen","skipped_n":"übersprungen","left":"übrig","missed_n":"verpasst","snz_all":"alles","snz_nc":"nicht kritisch","snz_prio":"Priorität","snz_transport":"Transport","snz_for":"für","snz_choose":"wähle was und wie lange","snz_title":"Benachrichtigungen pausieren","snz_what":"Was","snz_nc_l":"Nicht kritisch","snz_all_l":"Alles","snz_ch":"Ein Kanal","snz_pr":"Eine Priorität","snz_who":"Für wen","snz_everyone":"Alle","snz_me":"Nur ich","snz_len":"Wie lange","snz_forever":"Bis ich fortsetze","snz_go":"Pausieren","snz_close":"Schließen","rs_hand":"von Hand","rs_voice":"per Sprache","rs_assist":"vom Assistenten","snz_voice_info":"Deine Pausen laufen über die Sprachbefehle von SuperNotify: sie gelten nur für dich.","snz_voice_off":"Die Sprachbefehle von SuperNotify sind aus: schalte sie in den Integrationsoptionen ein.","snz_resume_mine":"Meine fortsetzen","go_open":"Anzeigen","dl_probe":"Diesen Kanal testen","probe_msg":"Kanaltest vom Dashboard","sc_why":"Warum","sc_yes":"Gilt jetzt","sc_no":"Gilt jetzt nicht","sc_manual_why":"Manuelles Szenario: von Hand angewendet","sc_no_cond":"Keine Bedingungen","sc_off_sw":"Ausgeschaltet","sc_not_eval":"nicht geprüft","sc_now":"jetzt","sc_diff_btn_on":"Was sich ändert, wenn es gilt","sc_diff_btn_off":"Was sich ohne es ändert","sc_diff_on":"Wenn es gälte, für eine mittlere Benachrichtigung jetzt:","sc_diff_off":"Ohne es, für eine mittlere Benachrichtigung jetzt:","sc_diff_add":"würde zusätzlich senden","sc_diff_rem":"würde nicht mehr senden","sc_diff_none":"kein Unterschied","c_state":"{e} ist {s}","c_template":"Template-Bedingung","c_time":"Zeit","c_after":"nach","c_before":"vor","c_numeric":"{e}","c_above":"über","c_below":"unter","c_and":"alle davon","c_or":"mindestens eine davon","c_not":"keine davon","c_or_join":" oder ","sim_hint_dry":"Die Antwort von SuperNotify selbst (Testlauf, nichts wird gesendet): eine Benachrichtigung jetzt, mit der Priorität und nur den oben gewählten Szenarien.","sim_msg":"Simulator-Test","sim_prio":"Priorität","sa_snooze":"{what} pausiert für {len}.","sa_silence":"{what} bis auf Weiteres stummgeschaltet.","sa_resume":"{what} wieder an.","sa_resume_one":"Pause beendet: {x}.","sa_resume_all":"Benachrichtigungen wieder an.","sa_w_nc":"Nicht-kritische Benachrichtigungen","sa_w_all":"Alle Benachrichtigungen","sa_w_ch":"Kanal {x}","sa_w_pr":"Benachrichtigungen mit Priorität {x}","sa_w_mine":"Deine Benachrichtigungen","sa_for":"für {x}","sa_min":"{n} Minuten","sa_hour":"eine Stunde","sa_hours":"{n} Stunden","occ_title":"Wer ist zu Hause","occ_home_l":"Zu Hause","occ_ALL_HOME":"Alle zu Hause","occ_ALL_AWAY":"Alle unterwegs","occ_LONE_HOME":"Nur eine Person zu Hause","occ_MULTI_HOME":"Einige zu Hause","occ_UNDEFINED_OCCUPANTS":"Niemand erfasst","h_repairs":"SuperNotify-Reparaturen","h_repairs_1":"SuperNotify-Reparatur","det_more":"Alle Attribute","det_yes":"ja","det_no":"nein","det_action":"Aktion","det_target":"Feste Ziele","det_target_req":"Braucht ein Ziel","det_target_use":"Ziele nutzen","det_inclusion":"Verwendet, wenn","det_prio":"Prioritäten","det_occ":"Wer zu Hause sein muss","det_transport":"Transport","det_data":"Daten","det_debug":"Debug","det_err_last":"Letzter Fehler","det_err_in":"In","det_err_n":"Fehler seit Start","det_select":"Auswahl","adv_html":"Text für E-Mail (HTML)","adv_clip":"Videoclip von einer URL","adv_actions":"Schaltflächen in der Benachrichtigung","adv_act_id":"Aktions-ID","adv_act_title":"Schaltflächentext","adv_act_add":"+ Schaltfläche","adv_groups":"Schaltflächengruppen (Komma)","adv_dc":"Kanaleinstellungen für diese Benachrichtigung","adv_dc_ph":"schlüssel: wert, einer pro Zeile","adv_dc_add":"+ Kanal","snz_active":"Gerade pausiert","snz_resume":"Fortsetzen","snz_resume_all":"Alles fortsetzen","snz_until_resumed":"bis zur Fortsetzung","snz_done":"Pausiert","snz_resumed":"Fortgesetzt","no_notif":"noch keine Benachrichtigung","st_title":"Nutzung","st_days":"Tage","st_days_short":"T","st_hist_note":"Uhrzeiten, Kanäle und Prioritäten der letzten {n} Tage im Verlauf","st_total":"Benachrichtigungen","st_avg":"pro Tag","st_today":"Heute","st_vs_avg":"ggü. Durchschnitt","st_peak_hour":"Spitzenstunde","st_top_channel":"Top-Kanal","st_errors":"Kanalfehler","st_of_sends":"der Kanal-Sendungen","st_daily":"Pro Tag","st_hourly":"Nach Tageszeit","st_weekday":"Nach Wochentag","st_channels":"Kanäle — meistgenutzt","st_priority":"Priorität","st_period":"Tagesabschnitt","st_insights":"Erkenntnisse","st_no_data":"Noch kein Verlauf — Daten erscheinen nach den ersten Benachrichtigungen.","st_unknown":"unbekannt","st_loading":"wird geladen…","st_versions":"Versionen","st_installed":"installiert","st_latest":"neueste","st_uptodate":"aktuell","st_update":"Update verfügbar","st_restart":"Neustart erforderlich","st_cards":"Karten","st_logged":"erfasst","st_reading":"Archiv wird gelesen: Tag {n} von {of}…","st_from_archive":"aus dem SuperNotify-Archiv","st_archive_err":"Archiv teilweise gelesen","st_wd":["Mo","Di","Mi","Do","Fr","Sa","So"],"st_i_share":"{p}% aller Kanal-Sendungen laufen über {c}.","st_i_peak":"Die meisten Benachrichtigungen kommen um {h}:00 ({n} in {d} Tagen).","st_i_night":"{p}% der Benachrichtigungen kommen zwischen 23:00 und 07:00 — erwäge ein Nicht-stören-Szenario, falls das unerwünscht ist.","st_i_night_ok":"Nur {p}% der Benachrichtigungen kommen nachts (23–07): die Ruhezeiten funktionieren.","st_i_weekend":"Am Wochenende gibt es {p}% {dir} Benachrichtigungen als an Werktagen.","st_i_errors":"{n} Kanalfehler in {d} Tagen, vor allem bei {c}.","st_i_noerr":"Keine Kanalfehler in den letzten {d} Tagen.","st_i_prio":"{p}% der Benachrichtigungen haben Priorität {prio}.","st_i_trend":"Letzte 7 Tage: {n}/Tag, {dir} {p}% ggü. den 7 davor.","st_more":"mehr","st_less":"weniger","st_up":"plus","st_down":"minus"},"SN_STATS_STRINGS":{"st_title":"Nutzung","st_days":"Tage","st_days_short":"T","st_hist_note":"Uhrzeiten, Kanäle und Prioritäten der letzten {n} Tage im Verlauf","st_total":"Benachrichtigungen","st_avg":"pro Tag","st_today":"Heute","st_vs_avg":"ggü. Durchschnitt","st_peak_hour":"Spitzenstunde","st_top_channel":"Top-Kanal","st_errors":"Kanalfehler","st_of_sends":"der Kanal-Sendungen","st_daily":"Pro Tag","st_hourly":"Nach Tageszeit","st_weekday":"Nach Wochentag","st_channels":"Kanäle — meistgenutzt","st_priority":"Priorität","st_period":"Tagesabschnitt","st_insights":"Erkenntnisse","st_no_data":"Noch kein Verlauf — Daten erscheinen nach den ersten Benachrichtigungen.","st_unknown":"unbekannt","st_loading":"wird geladen…","st_versions":"Versionen","st_installed":"installiert","st_latest":"neueste","st_uptodate":"aktuell","st_update":"Update verfügbar","st_restart":"Neustart erforderlich","st_cards":"Karten","st_logged":"erfasst","st_reading":"Archiv wird gelesen: Tag {n} von {of}…","st_from_archive":"aus dem SuperNotify-Archiv","st_archive_err":"Archiv teilweise gelesen","st_wd":["Mo","Di","Mi","Do","Fr","Sa","So"],"st_i_share":"{p}% aller Kanal-Sendungen laufen über {c}.","st_i_peak":"Die meisten Benachrichtigungen kommen um {h}:00 ({n} in {d} Tagen).","st_i_night":"{p}% der Benachrichtigungen kommen zwischen 23:00 und 07:00 — erwäge ein Nicht-stören-Szenario, falls das unerwünscht ist.","st_i_night_ok":"Nur {p}% der Benachrichtigungen kommen nachts (23–07): die Ruhezeiten funktionieren.","st_i_weekend":"Am Wochenende gibt es {p}% {dir} Benachrichtigungen als an Werktagen.","st_i_errors":"{n} Kanalfehler in {d} Tagen, vor allem bei {c}.","st_i_noerr":"Keine Kanalfehler in den letzten {d} Tagen.","st_i_prio":"{p}% der Benachrichtigungen haben Priorität {prio}.","st_i_trend":"Letzte 7 Tage: {n}/Tag, {dir} {p}% ggü. den 7 davor.","st_more":"mehr","st_less":"weniger","st_up":"plus","st_down":"minus"},"SN_ARCH_STRINGS":{"title":"Benachrichtigungsverlauf","search":"Titel oder Nachricht suchen…","f_all":"Alle","f_problems":"Nur Probleme","f_today":"Heute","f_whisper":"Geflüstert","wh":"geflüstert","said":"Alexa sagte","said_by":"{ch} sagte","none":"keine passende Benachrichtigung","no_sensor":"Sensor nicht gefunden","no_sensor_hint":"Aktualisiere SuperNotify auf 2.10 oder neuer, das die Aktion supernotify.enquire_archive hat, oder füge den command_line-Sensor hinzu, der das Archiv indiziert (siehe README).","loading":"Archiv wird gelesen…","recent":"neueste Benachrichtigungen","read_at":"gelesen um","of":"von","in_archive":"im Archiv","since":"älteste","updated":"Index aktualisiert","today":"Heute","yesterday":"Gestern","delivered":"zugestellt","failed":"fehlgeschlagen","skipped":"übersprungen","missed":"verpasst","prio":{"critical":"Kritisch","high":"Hoch","low":"Niedrig","minimum":"Minimal","medium":"Mittel"},"reasons":{"doppione":"Duplikat","nessun target":"kein Ziel","errore":"Fehler","condizione":"Bedingung","scenario":"Szenario","presenza":"Anwesenheit","priorita":"Priorität","spento":"aus","pausa":"pausiert","transport spento":"Transport aus","nessuna azione":"keine Aktion","dati non validi":"ungültige Daten","sconosciuto":"unbekannt"},"scenarios":"Aktive Szenarien","truncated":"Nachricht im Index gekürzt","dur":"Dauer","id":"ID","why":"Warum? - alle Details"},"SN_WHY_STRINGS":{"title":"Warum?","pick":"Wähle eine Benachrichtigung, um zu sehen, warum sie dorthin ging, wo sie hinging.","loading":"wird geladen…","none":"keine Benachrichtigung","no_sensor":"Sensor nicht gefunden:","no_service":"Dienst fehlt","no_service_hint":"Aktualisiere SuperNotify auf 2.10 oder neuer (supernotify.enquire_archive) oder füge den shell_command sn_archive_detail hinzu (siehe README) und starte Home Assistant neu.","gone":"diese Benachrichtigung ist nicht mehr im Archiv","priority":"Priorität","outcome":"Ergebnis","dupe":"Duplikat","outcomes":{"success":"zugestellt","partial_delivery":"teilweise zugestellt","dupe":"Duplikat","failed":"fehlgeschlagen","error":"fehlgeschlagen","fallback_delivery":"über den Fallback-Kanal zugestellt","no_delivery":"nicht zugestellt"},"missed":"verpasst (angefordert, nicht gesendet)","step_call":"Aufruf","step_scen":"Szenarien","step_people":"Personen","step_ch":"Kanäle","call_auto":"kein Kanal genannt: normales Routing","call_named":"im Aufruf genannt:","call_debug":"mit Debug","nobody":"niemand zu Hause","ch_sent":"gesendet","ch_problems":"zum Ansehen","ch_skipped":"übersprungen","pb_failed":"fehlgeschlagen","pb_missed":"angefordert, aber nicht gesendet","grp_skipped":"per Regel übersprungen: normal","grp_not":"nicht beteiligt","trace_title":"Vollständige Auswahl-Ablaufverfolgung","fix":{"NO_TARGET":"Kein Empfänger hat eine Adresse für diesen Kanal: füge einem Empfänger eine hinzu, gib dem Kanal feste Ziele oder lass ihn bei diesem Aufruf weg.","ERROR":"Die Integration hinter diesem Kanal hat mit einem Fehler geantwortet: sieh in ihrem eigenen Logeintrag nach.","NO_ACTION":"Der Kanal hat keine Aktion zum Aufrufen: setze `action:` in der Zustellung.","INVALID_ACTION_DATA":"Die an die Aktion übergebenen Daten wurden abgelehnt: prüfe `data:` im Aufruf oder in der Zustellung."},"scenarios":"Aktive Szenarien","no_scenarios":"kein Szenario aktiv","applied":"vom Aufruf erzwungen","required":"vom Aufruf verlangt","constrain":"vom Aufruf beschränkt auf","presence":"Anwesenheit","home":"zu Hause","away":"unterwegs","channels":"Kanäle","no_channels":"kein Kanal wurde ausgewählt","st_ok":"zugestellt","st_err":"fehlgeschlagen","st_skip":"übersprungen","st_supp":"unterdrückt","calls":"Aufrufe","calls_1":"Aufruf","target_required":"Ziel erforderlich:","started_by":"ausgewählt durch","scen_would_off":"ausgeschaltet durch (überstimmt)","src_default":"immer an (Standard)","src_scen":"Szenario","src_call":"den Aufruf selbst","src_recipient":"Empfänger","r_off_by":"ausgeschaltet durch","call_targets":"Ziele im Aufruf","cats":{"entity_id":"Entitäten","mobile_app_id":"Geräte","person_id":"Personen","email":"E-Mail","phone":"Telefon","device_id":"Geräte"},"not_started":"Kanäle, die nicht gestartet sind","r_call_off":"vom Aufruf ausgeschlossen","r_scen_off":"von einem aktiven Szenario ausgeschaltet","r_disabled":"ausgeschaltet","r_transport_off":"sein Transport ist aus","r_only_scen":"startet nur, wenn ein Szenario ihn einschaltet","r_only_fallback":"nur ein Fallback","r_only_explicit":"startet nur, wenn namentlich angefordert","r_priority":"nicht für diese Priorität","r_unknown":"ohne Ablaufverfolgung nicht rekonstruierbar","from_config":"Gründe für nicht gestartete Kanäle werden aus der Konfiguration rekonstruiert, wie sie JETZT ist, nicht wie sie damals war.","from_trace":"Die Gründe stammen aus der Auswahl-Ablaufverfolgung, die mit der Benachrichtigung archiviert wurde.","st_time":"Dauer","st_slow":"langsamster","st_rate":"der Kanäle erfolgreich","ua_title":"Ziele, die kein Kanal übernommen hat","ua_hint":"Sie waren im Aufruf, aber kein ausgewählter Kanal akzeptiert diese Art von Ziel.","un_title":"Namen, die nicht existieren","sent_by":"Gesendet von","sent_auto":"Automation","sent_script":"Skript","sent_person":"","sent_unknown":"Absender unbekannt (keine Automation oder Person im Kontext)","trace":"Auswahl-Ablaufverfolgung","no_trace":"Die vollständige Auswahl-Ablaufverfolgung wird nur aufgezeichnet, wenn der notify-Aufruf debug: true hat, und archiviert, wenn die Archiv-Diagnose sie einschließt.","reasons":{"NO_TARGET":"kein nutzbares Ziel","DUPE":"Duplikat einer kürzlichen Benachrichtigung","PRIORITY":"nicht für diese Priorität","SNOOZE":"pausiert","SNOOZED":"pausiert","DELIVERY_CONDITION":"Zustellungsbedingung falsch","OCCUPANCY":"Anwesenheitsregel","ERROR":"Fehler","DELIVERY_DISABLED":"ausgeschaltet","SCENARIO":"Szenario","TRANSPORT_DISABLED":"sein Transport ist aus","NO_SCENARIO":"ein erforderliches Szenario ist nicht aktiv","NO_ACTION":"keine Aktion zum Aufrufen","INVALID_ACTION_DATA":"ungültige Aktionsdaten","UNKNOWN":"unbekannter Grund"}},"SN_TOOLS_STRINGS":{"maint":"Wartung","enq":"SuperNotify fragen","refresh":"Alle Entitäten neu veröffentlichen","refresh_btn":"Aktualisieren","resume_btn":"Fortsetzen","refreshed":"Entitäten neu veröffentlicht.","resume_all":"Alle Pausen fortsetzen","cleared_n":"Pausen fortgesetzt","purge_arch":"Archiv bereinigen","purge_media":"Bilder bereinigen","older":"älter als","days":"Tage","purge_btn":"Bereinigen","confirm":"Zum Bestätigen erneut tippen","purged":"gelöscht","remaining":"übrig","reset":"Manuelle Änderungen rückgängig machen","reset_btn":"Zurücksetzen","reset_none":"Nichts zurückzusetzen: alles ist wie konfiguriert.","reset_done":"Zurück zur Konfiguration:","k_all":"alles","k_scenario":"Szenarien","k_delivery":"Kanäle","k_recipient":"Personen","k_transport":"Transporte","q_config":"Konfiguration","q_scen":"Szenarien","q_active":"Aktive Szenarien","q_by_scen":"Kanäle nach Szenario","q_implicit":"Standardkanäle","q_recipients":"Empfänger","q_occupancy":"Wer ist zu Hause","q_snoozes":"Pausen","q_last":"Letzte Benachrichtigung","copy":"JSON kopieren","copied":"Kopiert","close":"Schließen","empty":"(leer)","err":"SuperNotify hat mit einem Fehler geantwortet:","err_config":"SuperNotify 2.12.0 kann seine Konfiguration nicht zurückgeben, wenn ein Kanal Template-Bedingungen hat (rhizomatics/supernotify#241).","settings":"Integrationseinstellungen","running":"läuft…","more":"mehr"},"SN_FORM_LABELS":{"_common":"Aussehen und Text","style":"Farben","icons":"Symbole","show_version":"Kartenversion anzeigen","intro":"Einleitungstext oben","title":"Titel","dnd_entity":"Nicht-stören-Schalter","quiet_entity":"Berechneter Ruhezustand (optional)","presence_entity":"Person für die Statusleiste","archive_days":"Archivbereinigung: älter als (Tage)","media_days":"Bilderbereinigung: älter als (Tage)","occupancy":"Wer ist zu Hause (von SuperNotify)","repairs":"SuperNotify-Reparaturen in der Zustandsliste","snooze_announce":"Pausen laut ansagen (Durchsage-Kanal)","snooze_via":"Pausen laufen über","o_event":"das Push-Schaltflächen-Ereignis (Admin)","o_voice":"die Sprachbefehle","snooze_minutes":"Pausendauer (Minuten)","snooze_panel":"Pause-Kachel öffnet das Pausen-Panel","announce_delivery":"Kanal für Durchsagen","last_notification":"Letzte Benachrichtigung anzeigen","last_channels":"Ein Chip pro Kanal der letzten Benachrichtigung","repeat_entity":"Schaltfläche „Letzte wiederholen“ (optional)","tile_layout":"Kacheln","tile_columns":"Kachelspalten (leer = automatisch)","update_entity":"SuperNotify-Update-Entität","cards_update_entity":"Karten-Update-Entität","sent_today_entity":"Tageszähler (Verbrauchszähler, optional)","count_entity":"SuperNotify-Zähler (Langzeitstatistik)","health":"Zustand oben","stats":"Zahlen","poll_seconds":"Aktualisieren alle (Sekunden)","group":"Nach Startart der Kanäle gruppieren","hide_defaults":"Automatische DEFAULT_-Kanäle ausblenden","limit":"Benachrichtigungen in der Liste","expand":"Eingeklappte Teile öffnen","max_height":"Maximale Höhe (CSS, z. B. 70vh)","source":"Archivquelle","entity":"Archivsensor (nur Bridge)","trigger_entity":"Aktualisieren, wenn sich dies ändert","dry_run":"„Testen ohne Senden“ anzeigen","dry_run_dupe_check":"Auch die Duplikatprüfung simulieren","days":"Standardmäßig angezeigte Tage","manifest_url":"URL des Automationen-Manifests","o_supernotify":"SuperNotify","o_theme":"Home Assistant-Design","o_mdi":"Home Assistant-Symbole","o_emoji":"Emoji","o_row":"Symbol links","o_stacked":"Hoch, Symbol oben","o_three":"Gesendet, Fehler, Kanäle","o_full":"Alle fünf","o_auto":"Automatisch","o_sensor":"Sensor-Bridge (vor SuperNotify 2.10)","o_archive":"SuperNotify-Archiv (2.12.1+)","o_history":"Verlauf der Helfer"},"SN_NATIVE_STR":{"all_good":"Alles in Ordnung","paused":"Pausiert","until":"bis","resume":"Fortsetzen","test":"Test senden","sure":"Zum Senden erneut tippen","sent":"Gesendet","last":"Zuletzt","none":"Noch keine Benachrichtigung","ago":"her","min":"Min.","h":"Std.","err":"Transporte mit Fehlern","off":"Kanäle aus"},"SN_STRATEGY_TITLES":{"home":"Start","send":"Senden","setup":"Einrichtung","stats":"Statistik","tools":"Werkzeuge","title":"SuperNotify"}},"es":{"SN_STRINGS":{"presence":"Presencia","time_band":"Franja horaria","quiet":"Silencio","act_scen":"Escenarios activos","on":"sí","off":"no","active":"activo","dnd":"No molestar","tap_silence":"toca para silenciar","snooze":"Pausa","min":"min","pause_nc":"pausar las no críticas","snoozed":"En pausa","until":"hasta","tap_clear":"toca para quitar","announce":"Anunciar","intercom":"intercomunicador","announce_ph":"Anunciar en todos los altavoces…","send":"Enviar","announced":"Anunciado","cleared":"Pausas quitadas","snoozed_for":"Notificaciones no críticas en pausa durante","sent":"Enviadas","sent_today":"Enviadas hoy","since_startup":"desde el arranque","yesterday":"ayer","failures":"Fallos","fail_today":"envíos a canales fallidos hoy","deliveries":"Entregas","enabled_total":"activas/total","last_notif":"Última notificación","transports":"Transportes","delivered":"entregada","failed":"fallida","channels":"canales","none":"ninguno","no_transports":"no se encontraron entidades de transporte","tr_used":"usado por","tr_unused":"ningún canal lo usa","start":"inicio","volume":"volumen","now":"ahora","crosses":"pasa la medianoche","no_voice":"sin voz","mute_hint":"Una franja al <b>0%</b> no envía <b>ningún anuncio de voz</b> (Alexa y TTS apagados; push y panel siguen recibiendo). Las alertas críticas y de prioridad alta siempre hablan.","enabled":"activo","implicit":"siempre activo","explicit":"bajo petición","by_scenario":"solo con escenario","fallback":"respaldo","fallback_err":"respaldo si hay error","inc_sum":"de estos canales","inc_always":"arrancan solos","inc_req":"solo cuando se piden","inc_scen":"solo con un escenario","grp_auto":"Arrancan solos","grp_named":"Solo si se nombran en la llamada","grp_scen":"Solo con un escenario","grp_fallback":"Respaldo, cuando los demás fallan","ch_title":"Canales","ch_count":"{on} de {tot} activos","off_manual":"apagado","paused_by":"en pausa ahora por","on_by":"activo ahora por","fixed_targets":"destinos fijos","no_deliveries":"no se encontraron entidades de entrega","home":"en casa","away":"fuera","devices":"dispositivos","devices_1":"dispositivo","rc_test":"Enviar una prueba","rc_test_confirm":"Toca otra vez para enviar","rc_test_sent":"Prueba enviada","rc_test_title":"Prueba de SuperNotify","rc_test_msg":"Mensaje de prueba desde el panel,","overrides":"ajustes de entrega","overrides_1":"ajuste de entrega","no_contact":"sin puntos de contacto","no_recipients":"no se encontraron entidades de destinatario","details":"Detalles","h_update":"actualización disponible:","h_restart":"reinicia Home Assistant para terminar la actualización","h_uptodate":"actualizado","h_transport_err":"transportes con errores","h_channels_off":"canales apagados","h_all_good":"Todo bien","h_health":"Estado","h_failures":"fallos","h_failures_1":"fallo","h_transport_err_1":"transporte con errores","h_channels_off_1":"canal apagado","channels_1":"canal","band_early_morning":"Madrugada","band_morning":"Mañana","band_afternoon":"Tarde","band_evening":"Noche temprana","band_night":"Noche","band_late_night":"Noche cerrada","h_look_1":"1 cosa que revisar","h_look_n":"{n} cosas que revisar","h_rest_ok":"todo lo demás funciona","h_ch_on":"{on} de {tot} canales activos","h_open":"Abrir","ln_delivered":"entregada","ln_failed":"fallida","ln_why":"Por qué","tgt_loading":"cargando el selector…","bands_empty_t":"Aún no hay franjas horarias","bands_empty":"Añade una franja por cada parte del día: un input_datetime para su inicio y un input_number para el volumen de voz.","active_now":"activo ahora","disabled":"desactivado","other":"Otros","manual":"manual","apply_now":"aplicar ahora","applied":"Aplicado","apply_off":"toca para dejar de aplicarlo","enabled_lbl":"activado","reset_overrides":"Restablecer ajustes","reset_done":"ajustes restablecidos","transport_off":"transporte apagado","last_notified":"última notificación","never_notified":"nunca notificado","media":"multimedia","no_scenarios":"no se encontraron entidades de escenario","sim_pick":"🎬 Escenarios — toca para simular","sim_fire":"📤 Canales","sim_hint":"Datos reales del motor (servicios de consulta). El filtrado de entregas por prioridad lo hace el motor y no se simula aquí. Desactivado gana sobre activado, como en la fusión en tiempo real.","sim_none":"no saldría ninguna entrega","scenario_tag":"escenario","sim_go":"Saldrían","sim_stop":"No saldrían","sim_r_default":"arranca solo","sim_r_on":"activado por","sim_r_off":"desactivado por","sim_r_named":"solo si se nombra en la llamada","sim_r_scen":"solo con un escenario que lo active","sim_r_fallback":"respaldo, cuando los demás fallan","sim_r_switched":"apagado","title":"Título","message":"Mensaje","priority":"Prioridad","channels_lbl":"Canales — ninguno elegido = envío normal","camera_lbl":"Instantánea de cámara","preview":"Vista previa","no_title":"(sin título)","no_message":"(sin mensaje)","default_prio":"predeterminada (media)","comp_hint":"Los canales elegidos se envían con delivery_selection: fixed (solo salen esos). Crítica es crítica de verdad — sirenas incluidas.","critical_confirm":"¿Enviar una notificación CRÍTICA? Incluye sirenas y volumen máximo.","write_first":"Escribe primero un mensaje","sent_toast":"Enviada","write_or_pick":"Escribe un mensaje, o elige una cámara o un canal","need_2111":"Una notificación sin texto necesita SuperNotify 2.11.1","send_err":"No enviada","dry_btn":"Probar sin enviar","dry_title":"Si la enviaras ahora","dry_err":"La simulación falló","dry_would":"enviaría","dry_skip":"omitido","dry_nobody":"sin destinatario, solo destinos directos","dry_targets":"destinos","dry_suppressed":"La notificación se suprimiría","dry_fallback":"No saldría ningún canal: respaldo a","dry_none":"Ningún canal elegido","dry_scen":"Escenarios activos","dry_raw":"Respuesta en bruto","dry_prio":"Prioridad","dry_would_n":"canales enviarían","dry_nothing":"No se enviaría nada","dry_dupe":"Duplicado de una notificación reciente: se descartaría","dry_no_dupe":"La comprobación de duplicados no se simula, así que el Enviar real justo después no se bloquea.","dry_restart":"El SuperNotify en marcha no puede simular: la simulación necesita la 2.12, y hay que reiniciar Home Assistant tras la actualización.","dry_home":"En casa","dry_empty":"SuperNotify no dio respuesta: ¿es la 2.12 o posterior?","dry_reasons":{"NO_TARGET":"sin destino utilizable","DUPE":"duplicado","PRIORITY":"no para esta prioridad","SNOOZED":"en pausa","DELIVERY_CONDITION":"condición de entrega falsa","OCCUPANCY":"regla de presencia","TRANSPORT_DISABLED":"transporte apagado","DELIVERY_DISABLED":"apagado","NO_SCENARIO":"falta el escenario requerido","NO_ACTION":"sin acción","INVALID_ACTION_DATA":"datos no válidos","UNKNOWN":"motivo desconocido","ERROR":"error"},"prio_minimum":"Mínima","prio_low":"Baja","prio_medium":"Media","prio_high":"Alta","prio_critical":"Crítica","target_lbl":"Destino — personas, dispositivos, áreas, plantas, etiquetas","custom_target_lbl":"Destinos personalizados (correo, IDs de Telegram, …) — separados por comas","adv_title":"Opciones avanzadas","adv_spoken":"Mensaje hablado (Alexa, TTS)","adv_spoken_ph":"lo que dicen los altavoces, si es distinto del texto","adv_apply":"Aplicar estos escenarios","adv_require":"Enviar solo si estos escenarios están activos","adv_constrain":"Tener en cuenta solo estos escenarios","adv_snapshot":"Imagen desde una URL","adv_debug":"Depuración: registrar la traza de selección completa (la muestra la tarjeta del porqué)","custom_target_ph":"p. ej. user@example.com, 123456789","native_target_tag":"🎯 área/planta/etiqueta nativa","target_warn":"⚠️ Las áreas, plantas y etiquetas solo las resuelven notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts y chime. Con cualquier otro canal — o con el envío normal si no eliges canal arriba — la notificación puede quedarse sin destino sin avisar. Elige un canal compatible, o añade directamente una persona o un dispositivo.","aut_search":"Buscar automatizaciones…","aut_all":"Todas","aut_none":"Sin resultados","aut_err":"Manifiesto no encontrado — genéralo con tools/genera_vista_automazioni.py","aut_updated":"lista actualizada","aut_count":"automatizaciones","aut_count_1":"automatización","never":"nunca","ago_now":"ahora","ago_min":"min atrás","ago_h":"h atrás","ago_d":"d atrás","aut_disabled_only":"Solo desactivadas","grp_active":"activos","repeat":"Repetir","skipped_n":"omitidos","left":"restantes","missed_n":"perdidos","snz_all":"todo","snz_nc":"no críticas","snz_prio":"prioridad","snz_transport":"transporte","snz_for":"para","snz_choose":"elige qué y cuánto tiempo","snz_title":"Pausar notificaciones","snz_what":"Qué","snz_nc_l":"No críticas","snz_all_l":"Todo","snz_ch":"Un canal","snz_pr":"Una prioridad","snz_who":"Para quién","snz_everyone":"Todos","snz_me":"Solo yo","snz_len":"Cuánto tiempo","snz_forever":"Hasta que reanude","snz_go":"Pausar","snz_close":"Cerrar","rs_hand":"a mano","rs_voice":"por voz","rs_assist":"por el asistente","snz_voice_info":"Tus pausas pasan por los comandos de voz de SuperNotify: son solo tuyas.","snz_voice_off":"Los comandos de voz de SuperNotify están apagados: actívalos en las opciones de la integración.","snz_resume_mine":"Reanudar las mías","go_open":"Mostrar","dl_probe":"Probar este canal","probe_msg":"Prueba de canal desde el panel","sc_why":"Por qué","sc_yes":"Se aplica ahora","sc_no":"No se aplica ahora","sc_manual_why":"Escenario manual: se aplica a mano","sc_no_cond":"Sin condiciones","sc_off_sw":"Apagado","sc_not_eval":"no comprobado","sc_now":"ahora","sc_diff_btn_on":"Qué cambia si se aplica","sc_diff_btn_off":"Qué cambia sin él","sc_diff_on":"Si se aplicara, para una notificación media ahora:","sc_diff_off":"Sin él, para una notificación media ahora:","sc_diff_add":"también enviaría","sc_diff_rem":"ya no enviaría","sc_diff_none":"ninguna diferencia","c_state":"{e} está en {s}","c_template":"condición de plantilla","c_time":"hora","c_after":"después de","c_before":"antes de","c_numeric":"{e}","c_above":"por encima de","c_below":"por debajo de","c_and":"todas estas","c_or":"al menos una de estas","c_not":"ninguna de estas","c_or_join":" o ","sim_hint_dry":"La respuesta del propio SuperNotify (simulación, no se envía nada): una notificación ahora, con la prioridad y solo los escenarios elegidos arriba.","sim_msg":"Prueba del simulador","sim_prio":"Prioridad","sa_snooze":"{what} en pausa durante {len}.","sa_silence":"{what} silenciadas hasta nuevo aviso.","sa_resume":"{what} reactivadas.","sa_resume_one":"Pausa terminada: {x}.","sa_resume_all":"Notificaciones reactivadas.","sa_w_nc":"Las notificaciones no críticas","sa_w_all":"Todas las notificaciones","sa_w_ch":"Canal {x}","sa_w_pr":"Las notificaciones de prioridad {x}","sa_w_mine":"Tus notificaciones","sa_for":"para {x}","sa_min":"{n} minutos","sa_hour":"una hora","sa_hours":"{n} horas","occ_title":"Quién está en casa","occ_home_l":"En casa","occ_ALL_HOME":"Todos en casa","occ_ALL_AWAY":"Todos fuera","occ_LONE_HOME":"Solo uno en casa","occ_MULTI_HOME":"Algunos en casa","occ_UNDEFINED_OCCUPANTS":"Nadie con seguimiento","h_repairs":"reparaciones de SuperNotify","h_repairs_1":"reparación de SuperNotify","det_more":"Todos los atributos","det_yes":"sí","det_no":"no","det_action":"Acción","det_target":"Destinos fijos","det_target_req":"Necesita un destino","det_target_use":"Destinos usados","det_inclusion":"Se usa cuando","det_prio":"Prioridades","det_occ":"Quién debe estar en casa","det_transport":"Transporte","det_data":"Datos","det_debug":"Depuración","det_err_last":"Último error","det_err_in":"En","det_err_n":"Errores desde el arranque","det_select":"Selección","adv_html":"Texto para correo (HTML)","adv_clip":"Videoclip desde una URL","adv_actions":"Botones en la notificación","adv_act_id":"id de acción","adv_act_title":"texto del botón","adv_act_add":"+ botón","adv_groups":"Grupos de botones (comas)","adv_dc":"Ajustes de canal para esta notificación","adv_dc_ph":"clave: valor, uno por línea","adv_dc_add":"+ canal","snz_active":"En pausa ahora","snz_resume":"Reanudar","snz_resume_all":"Reanudar todo","snz_until_resumed":"hasta reanudar","snz_done":"En pausa","snz_resumed":"Reanudado","no_notif":"aún no hay notificaciones","st_title":"Uso","st_days":"días","st_days_short":"d","st_hist_note":"horas, canales y prioridades de los últimos {n} días de historial","st_total":"Notificaciones","st_avg":"al día","st_today":"Hoy","st_vs_avg":"vs. media","st_peak_hour":"Hora punta","st_top_channel":"Canal principal","st_errors":"Errores de canal","st_of_sends":"de los envíos a canales","st_daily":"Por día","st_hourly":"Por hora del día","st_weekday":"Por día de la semana","st_channels":"Canales — más usados","st_priority":"Prioridad","st_period":"Parte del día","st_insights":"Observaciones","st_no_data":"Aún no hay historial — los datos aparecen tras las primeras notificaciones.","st_unknown":"desconocido","st_loading":"cargando…","st_versions":"Versiones","st_installed":"instalada","st_latest":"última","st_uptodate":"actualizado","st_update":"actualización disponible","st_restart":"hay que reiniciar","st_cards":"tarjetas","st_logged":"registradas","st_reading":"leyendo el archivo: día {n} de {of}…","st_from_archive":"del archivo de SuperNotify","st_archive_err":"archivo leído en parte","st_wd":["lun","mar","mié","jue","vie","sáb","dom"],"st_i_share":"El {p}% de los envíos a canales pasa por {c}.","st_i_peak":"La hora con más actividad es las {h}:00 ({n} notificaciones en {d} días).","st_i_night":"El {p}% de las notificaciones llega entre las 23:00 y las 07:00 — plantéate un escenario de No molestar si no lo quieres.","st_i_night_ok":"Solo el {p}% de las notificaciones llega de noche (23–07): las horas de silencio funcionan.","st_i_weekend":"Los fines de semana tienen un {p}% {dir} notificaciones que los días laborables.","st_i_errors":"{n} errores de canal en {d} días, sobre todo en {c}.","st_i_noerr":"Ningún error de canal en los últimos {d} días.","st_i_prio":"El {p}% de las notificaciones son de prioridad {prio}.","st_i_trend":"Últimos 7 días: {n}/día, {dir} un {p}% respecto a los 7 anteriores.","st_more":"más","st_less":"menos","st_up":"sube","st_down":"baja"},"SN_STATS_STRINGS":{"st_title":"Uso","st_days":"días","st_days_short":"d","st_hist_note":"horas, canales y prioridades de los últimos {n} días de historial","st_total":"Notificaciones","st_avg":"al día","st_today":"Hoy","st_vs_avg":"vs. media","st_peak_hour":"Hora punta","st_top_channel":"Canal principal","st_errors":"Errores de canal","st_of_sends":"de los envíos a canales","st_daily":"Por día","st_hourly":"Por hora del día","st_weekday":"Por día de la semana","st_channels":"Canales — más usados","st_priority":"Prioridad","st_period":"Parte del día","st_insights":"Observaciones","st_no_data":"Aún no hay historial — los datos aparecen tras las primeras notificaciones.","st_unknown":"desconocido","st_loading":"cargando…","st_versions":"Versiones","st_installed":"instalada","st_latest":"última","st_uptodate":"actualizado","st_update":"actualización disponible","st_restart":"hay que reiniciar","st_cards":"tarjetas","st_logged":"registradas","st_reading":"leyendo el archivo: día {n} de {of}…","st_from_archive":"del archivo de SuperNotify","st_archive_err":"archivo leído en parte","st_wd":["lun","mar","mié","jue","vie","sáb","dom"],"st_i_share":"El {p}% de los envíos a canales pasa por {c}.","st_i_peak":"La hora con más actividad es las {h}:00 ({n} notificaciones en {d} días).","st_i_night":"El {p}% de las notificaciones llega entre las 23:00 y las 07:00 — plantéate un escenario de No molestar si no lo quieres.","st_i_night_ok":"Solo el {p}% de las notificaciones llega de noche (23–07): las horas de silencio funcionan.","st_i_weekend":"Los fines de semana tienen un {p}% {dir} notificaciones que los días laborables.","st_i_errors":"{n} errores de canal en {d} días, sobre todo en {c}.","st_i_noerr":"Ningún error de canal en los últimos {d} días.","st_i_prio":"El {p}% de las notificaciones son de prioridad {prio}.","st_i_trend":"Últimos 7 días: {n}/día, {dir} un {p}% respecto a los 7 anteriores.","st_more":"más","st_less":"menos","st_up":"sube","st_down":"baja"},"SN_ARCH_STRINGS":{"title":"Historial de notificaciones","search":"Buscar en título o mensaje…","f_all":"Todas","f_problems":"Solo problemas","f_today":"Hoy","f_whisper":"Susurradas","wh":"susurrada","said":"Alexa dijo","said_by":"{ch} dijo","none":"ninguna notificación coincide","no_sensor":"sensor no encontrado","no_sensor_hint":"Actualiza SuperNotify a la 2.10 o posterior, que tiene la acción supernotify.enquire_archive, o añade el sensor command_line que indexa el archivo (ver README).","loading":"leyendo el archivo…","recent":"últimas notificaciones","read_at":"leído a las","of":"de","in_archive":"en el archivo","since":"la más antigua","updated":"índice actualizado","today":"Hoy","yesterday":"Ayer","delivered":"entregada","failed":"fallida","skipped":"omitida","missed":"perdida","prio":{"critical":"Crítica","high":"Alta","low":"Baja","minimum":"Mínima","medium":"Media"},"reasons":{"doppione":"duplicado","nessun target":"sin destino","errore":"error","condizione":"condición","scenario":"escenario","presenza":"presencia","priorita":"prioridad","spento":"apagado","pausa":"en pausa","transport spento":"transporte apagado","nessuna azione":"sin acción","dati non validi":"datos no válidos","sconosciuto":"desconocido"},"scenarios":"Escenarios vigentes","truncated":"mensaje recortado en el índice","dur":"tardó","id":"id","why":"¿Por qué? - detalle completo"},"SN_WHY_STRINGS":{"title":"¿Por qué?","pick":"Elige una notificación para ver por qué fue a donde fue.","loading":"cargando…","none":"ninguna notificación","no_sensor":"sensor no encontrado:","no_service":"Falta el servicio","no_service_hint":"Actualiza SuperNotify a la 2.10 o posterior (supernotify.enquire_archive), o añade el shell_command sn_archive_detail (ver README) y reinicia Home Assistant.","gone":"esta notificación ya no está en el archivo","priority":"prioridad","outcome":"resultado","dupe":"duplicado","outcomes":{"success":"entregada","partial_delivery":"entregada en parte","dupe":"duplicado","failed":"fallida","error":"fallida","fallback_delivery":"entregada por el canal de respaldo","no_delivery":"no entregada"},"missed":"perdida (pedida, no enviada)","step_call":"Llamada","step_scen":"Escenarios","step_people":"Personas","step_ch":"Canales","call_auto":"ningún canal nombrado: envío normal","call_named":"nombrados en la llamada:","call_debug":"con depuración","nobody":"nadie en casa","ch_sent":"enviados","ch_problems":"por revisar","ch_skipped":"omitidos","pb_failed":"fallido","pb_missed":"pedido pero no enviado","grp_skipped":"omitidos por una regla: normal","grp_not":"no implicados","trace_title":"Traza de selección completa","fix":{"NO_TARGET":"Ningún destinatario tiene una dirección para este canal: añade una a un destinatario, da al canal destinos fijos o déjalo fuera de esta llamada.","ERROR":"La integración detrás de este canal respondió con un error: revisa su propia entrada en el registro.","NO_ACTION":"El canal no tiene ninguna acción que llamar: define `action:` en la entrega.","INVALID_ACTION_DATA":"Los datos pasados a la acción fueron rechazados: revisa el `data:` de la llamada o de la entrega."},"scenarios":"Escenarios vigentes","no_scenarios":"ningún escenario vigente","applied":"forzado por la llamada","required":"requerido por la llamada","constrain":"limitado por la llamada a","presence":"Presencia","home":"en casa","away":"fuera","channels":"Canales","no_channels":"no se eligió ningún canal","st_ok":"entregado","st_err":"fallido","st_skip":"omitido","st_supp":"suprimido","calls":"llamadas","calls_1":"llamada","target_required":"destino requerido:","started_by":"elegido por","scen_would_off":"apagado por (anulado)","src_default":"siempre activo (predeterminado)","src_scen":"escenario","src_call":"la propia llamada","src_recipient":"destinatario","r_off_by":"apagado por","call_targets":"destinos en la llamada","cats":{"entity_id":"entidades","mobile_app_id":"dispositivos","person_id":"personas","email":"correo","phone":"teléfono","device_id":"dispositivos"},"not_started":"Canales que no arrancaron","r_call_off":"excluido por la llamada","r_scen_off":"apagado por un escenario vigente","r_disabled":"apagado","r_transport_off":"su transporte está apagado","r_only_scen":"solo arranca cuando un escenario lo activa","r_only_fallback":"solo de respaldo","r_only_explicit":"solo arranca si se pide por nombre","r_priority":"no para esta prioridad","r_unknown":"no se puede reconstruir sin la traza","from_config":"Los motivos de los canales que no arrancaron se reconstruyen a partir de la configuración ACTUAL, no de la de entonces.","from_trace":"Los motivos vienen de la traza de selección archivada con la notificación.","st_time":"tardó","st_slow":"el más lento","st_rate":"de los canales funcionaron","ua_title":"Destinos que ningún canal aceptó","ua_hint":"Estaban en la llamada, pero ningún canal elegido acepta este tipo de destino.","un_title":"Nombres que no existen","sent_by":"Enviada por","sent_auto":"automatización","sent_script":"script","sent_person":"","sent_unknown":"remitente desconocido (ninguna automatización ni persona en su contexto)","trace":"Traza de selección","no_trace":"La traza de selección completa solo se registra cuando la llamada notify tiene debug: true, y se archiva cuando los diagnósticos del archivo la incluyen.","reasons":{"NO_TARGET":"sin destino utilizable","DUPE":"duplicado de una notificación reciente","PRIORITY":"no para esta prioridad","SNOOZE":"en pausa","SNOOZED":"en pausa","DELIVERY_CONDITION":"condición de entrega falsa","OCCUPANCY":"regla de presencia","ERROR":"error","DELIVERY_DISABLED":"apagado","SCENARIO":"escenario","TRANSPORT_DISABLED":"su transporte está apagado","NO_SCENARIO":"falta un escenario requerido","NO_ACTION":"ninguna acción que llamar","INVALID_ACTION_DATA":"datos de acción no válidos","UNKNOWN":"motivo desconocido"}},"SN_TOOLS_STRINGS":{"maint":"Mantenimiento","enq":"Preguntar a SuperNotify","refresh":"Volver a publicar todas las entidades","refresh_btn":"Actualizar","resume_btn":"Reanudar","refreshed":"Entidades publicadas de nuevo.","resume_all":"Reanudar todas las pausas","cleared_n":"pausas reanudadas","purge_arch":"Limpiar el archivo","purge_media":"Limpiar las imágenes","older":"más antiguos de","days":"días","purge_btn":"Limpiar","confirm":"Toca otra vez para confirmar","purged":"eliminados","remaining":"restantes","reset":"Deshacer los cambios hechos a mano","reset_btn":"Restablecer","reset_none":"Nada que restablecer: todo está como en la configuración.","reset_done":"De vuelta a la configuración:","k_all":"todo","k_scenario":"escenarios","k_delivery":"canales","k_recipient":"personas","k_transport":"transportes","q_config":"Configuración","q_scen":"Escenarios","q_active":"Escenarios activos","q_by_scen":"Canales por escenario","q_implicit":"Canales predeterminados","q_recipients":"Destinatarios","q_occupancy":"Quién está en casa","q_snoozes":"Pausas","q_last":"Última notificación","copy":"Copiar JSON","copied":"Copiado","close":"Cerrar","empty":"(vacío)","err":"SuperNotify respondió con un error:","err_config":"SuperNotify 2.12.0 no puede devolver su configuración cuando un canal tiene condiciones de plantilla (rhizomatics/supernotify#241).","settings":"Ajustes de la integración","running":"trabajando…","more":"más"},"SN_FORM_LABELS":{"_common":"Aspecto y texto","style":"Colores","icons":"Iconos","show_version":"Mostrar la versión de la tarjeta","intro":"Texto de introducción arriba","title":"Título","dnd_entity":"Interruptor de No molestar","quiet_entity":"Estado de silencio calculado (opcional)","presence_entity":"Persona para la barra de estado","archive_days":"Limpieza del archivo: más antiguos de (días)","media_days":"Limpieza de imágenes: más antiguas de (días)","occupancy":"Quién está en casa (de SuperNotify)","repairs":"Reparaciones de SuperNotify en la lista de estado","snooze_announce":"Decir las pausas en voz alta (canal de anuncios)","snooze_via":"Las pausas pasan por","o_event":"el evento de los botones push (admin)","o_voice":"los comandos de voz","snooze_minutes":"Duración de la pausa (minutos)","snooze_panel":"La ficha de pausa abre el panel de pausas","announce_delivery":"Canal para anuncios","last_notification":"Mostrar la última notificación","last_channels":"Una etiqueta por canal en la última notificación","repeat_entity":"Botón de repetir la última (opcional)","tile_layout":"Fichas","tile_columns":"Columnas de fichas (vacío = automático)","update_entity":"Entidad de actualización de SuperNotify","cards_update_entity":"Entidad de actualización de las tarjetas","sent_today_entity":"Contador diario (utility meter, opcional)","count_entity":"Contador de SuperNotify (estadísticas a largo plazo)","health":"Estado arriba","stats":"Cifras","poll_seconds":"Actualizar cada (segundos)","group":"Agrupar según cómo arranca un canal","hide_defaults":"Ocultar los canales automáticos DEFAULT_","limit":"Notificaciones en la lista","expand":"Abrir las partes plegadas","max_height":"Altura máxima (CSS, p. ej. 70vh)","source":"Origen del archivo","entity":"Sensor del archivo (solo puente)","trigger_entity":"Actualizar cuando esto cambie","dry_run":"Mostrar \"Probar sin enviar\"","dry_run_dupe_check":"Simular también la comprobación de duplicados","days":"Días mostrados por defecto","manifest_url":"URL del manifiesto de automatizaciones","o_supernotify":"SuperNotify","o_theme":"Tema de Home Assistant","o_mdi":"Iconos de Home Assistant","o_emoji":"Emoji","o_row":"Icono a la izquierda","o_stacked":"Alta, icono arriba","o_three":"Enviadas, fallos, canales","o_full":"Las cinco","o_auto":"Automático","o_sensor":"Puente con sensor (antes de SuperNotify 2.10)","o_archive":"Archivo de SuperNotify (2.12.1+)","o_history":"Historial de los ayudantes"},"SN_NATIVE_STR":{"all_good":"Todo bien","paused":"En pausa","until":"hasta","resume":"Reanudar","test":"Enviar una prueba","sure":"Toca otra vez para enviar","sent":"Enviadas","last":"Última","none":"Aún no hay notificaciones","ago":"atrás","min":"min","h":"h","err":"transportes con errores","off":"canales apagados"},"SN_STRATEGY_TITLES":{"home":"Inicio","send":"Enviar","setup":"Configuración","stats":"Estadísticas","tools":"Herramientas","title":"SuperNotify"}},"fr":{"SN_STRINGS":{"presence":"Présence","time_band":"Plage horaire","quiet":"Calme","act_scen":"Scénarios actifs","on":"activé","off":"désactivé","active":"actif","dnd":"Ne pas déranger","tap_silence":"touchez pour couper le son","snooze":"Pause","min":"min","pause_nc":"mettre en pause le non critique","snoozed":"En pause","until":"jusqu'à","tap_clear":"touchez pour annuler","announce":"Annonce","intercom":"interphone","announce_ph":"Annoncer sur toutes les enceintes…","send":"Envoyer","announced":"Annoncé","cleared":"Pauses annulées","snoozed_for":"Notifications non critiques en pause pendant","sent":"Envoyées","sent_today":"Envoyées aujourd'hui","since_startup":"depuis le démarrage","yesterday":"hier","failures":"Échecs","fail_today":"envois par canal échoués aujourd'hui","deliveries":"Livraisons","enabled_total":"activées/total","last_notif":"Dernière notification","transports":"Transports","delivered":"livré","failed":"échoué","channels":"canaux","none":"aucun","no_transports":"aucune entité de transport trouvée","tr_used":"utilisé par","tr_unused":"aucun canal ne l'utilise","start":"début","volume":"volume","now":"maintenant","crosses":"passe minuit","no_voice":"pas de voix","mute_hint":"Une plage à <b>0 %</b> n'envoie <b>aucune annonce vocale</b> (Alexa et TTS coupés, push et tableau de bord toujours livrés). Les alertes critiques et de priorité haute parlent toujours.","enabled":"activé","implicit":"toujours actif","explicit":"sur demande","by_scenario":"scénario seulement","fallback":"secours","fallback_err":"secours en cas d'erreur","inc_sum":"de ces canaux","inc_always":"partent d'eux-mêmes","inc_req":"seulement sur demande","inc_scen":"seulement avec un scénario","grp_auto":"Partent d'eux-mêmes","grp_named":"Seulement si nommés dans l'appel","grp_scen":"Seulement avec un scénario","grp_fallback":"Secours, quand les autres échouent","ch_title":"Canaux","ch_count":"{on} sur {tot} actifs","off_manual":"désactivé","paused_by":"en pause à cause de","on_by":"actif grâce à","fixed_targets":"cibles fixes","no_deliveries":"aucune entité de livraison trouvée","home":"à la maison","away":"absent","devices":"appareils","devices_1":"appareil","rc_test":"Envoyer un test","rc_test_confirm":"Touchez encore pour envoyer","rc_test_sent":"Test envoyé","rc_test_title":"Test SuperNotify","rc_test_msg":"Message de test depuis le tableau de bord,","overrides":"modifications de livraison","overrides_1":"modification de livraison","no_contact":"aucun moyen de contact","no_recipients":"aucune entité de destinataire trouvée","details":"Détails","h_update":"mise à jour disponible :","h_restart":"redémarrez Home Assistant pour terminer la mise à jour","h_uptodate":"à jour","h_transport_err":"transports en erreur","h_channels_off":"canaux désactivés","h_all_good":"Tout va bien","h_health":"État","h_failures":"échecs","h_failures_1":"échec","h_transport_err_1":"transport en erreur","h_channels_off_1":"canal désactivé","channels_1":"canal","band_early_morning":"Petit matin","band_morning":"Matin","band_afternoon":"Après-midi","band_evening":"Soir","band_night":"Nuit","band_late_night":"Tard dans la nuit","h_look_1":"1 point à vérifier","h_look_n":"{n} points à vérifier","h_rest_ok":"tout le reste fonctionne","h_ch_on":"{on} canaux actifs sur {tot}","h_open":"Ouvrir","ln_delivered":"livré","ln_failed":"échoué","ln_why":"Pourquoi","tgt_loading":"chargement du sélecteur…","bands_empty_t":"Aucune plage horaire","bands_empty":"Ajoutez une plage par moment de la journée : un input_datetime pour son début et un input_number pour le volume de la voix.","active_now":"actif maintenant","disabled":"désactivé","other":"Autre","manual":"manuel","apply_now":"appliquer maintenant","applied":"Appliqué","apply_off":"touchez pour ne plus l'appliquer","enabled_lbl":"activé","reset_overrides":"Réinitialiser les modifications","reset_done":"modifications réinitialisées","transport_off":"transport désactivé","last_notified":"dernière notification","never_notified":"jamais notifié","media":"médias","no_scenarios":"aucune entité de scénario trouvée","sim_pick":"🎬 Scénarios — touchez pour simuler","sim_fire":"📤 Canaux","sim_hint":"Données réelles du moteur (services enquire). Le filtrage des livraisons par priorité se fait dans le moteur et n'est pas simulé ici. Désactivé l'emporte sur activé, comme la fusion à l'exécution.","sim_none":"aucune livraison ne partirait","scenario_tag":"scénario","sim_go":"Partiraient","sim_stop":"Ne partiraient pas","sim_r_default":"part de lui-même","sim_r_on":"activé par","sim_r_off":"désactivé par","sim_r_named":"seulement si nommé dans l'appel","sim_r_scen":"seulement avec un scénario qui l'active","sim_r_fallback":"secours, quand les autres échouent","sim_r_switched":"désactivé","title":"Titre","message":"Message","priority":"Priorité","channels_lbl":"Canaux — aucun choisi = routage normal","camera_lbl":"Instantané de caméra","preview":"Aperçu","no_title":"(sans titre)","no_message":"(sans message)","default_prio":"par défaut (moyenne)","comp_hint":"Les canaux choisis sont envoyés avec delivery_selection: fixed (seuls ceux-ci partent). Critique veut vraiment dire critique — sirènes comprises.","critical_confirm":"Envoyer une notification CRITIQUE ? Sirènes et volume maximal compris.","write_first":"Écrivez d'abord un message","sent_toast":"Envoyé","write_or_pick":"Écrivez un message, ou choisissez une caméra ou un canal","need_2111":"Une notification sans texte nécessite SuperNotify 2.11.1","send_err":"Non envoyé","dry_btn":"Essayer sans envoyer","dry_title":"Si vous l'envoyiez maintenant","dry_err":"La simulation a échoué","dry_would":"enverrait","dry_skip":"ignoré","dry_nobody":"aucun destinataire, cibles directes seulement","dry_targets":"cibles","dry_suppressed":"La notification serait supprimée","dry_fallback":"Aucun canal ne partirait : secours vers","dry_none":"Aucun canal sélectionné","dry_scen":"Scénarios actifs","dry_raw":"Réponse brute","dry_prio":"Priorité","dry_would_n":"canaux enverraient","dry_nothing":"Rien ne serait envoyé","dry_dupe":"Doublon d'une notification récente : elle serait écartée","dry_no_dupe":"Contrôle des doublons non simulé, donc le vrai Envoyer juste après n'est pas bloqué.","dry_restart":"Le SuperNotify en cours d'exécution ne peut pas simuler : la simulation nécessite la 2.12, et Home Assistant doit être redémarré après la mise à jour.","dry_home":"À la maison","dry_empty":"SuperNotify n'a pas répondu : est-ce la 2.12 ou plus récente ?","dry_reasons":{"NO_TARGET":"aucune cible utilisable","DUPE":"doublon","PRIORITY":"pas pour cette priorité","SNOOZED":"en pause","DELIVERY_CONDITION":"condition de livraison fausse","OCCUPANCY":"règle de présence","TRANSPORT_DISABLED":"transport désactivé","DELIVERY_DISABLED":"désactivé","NO_SCENARIO":"scénario requis non actif","NO_ACTION":"aucune action","INVALID_ACTION_DATA":"données non valides","UNKNOWN":"raison inconnue","ERROR":"erreur"},"prio_minimum":"Minimum","prio_low":"Faible","prio_medium":"Moyenne","prio_high":"Haute","prio_critical":"Critique","target_lbl":"Cible — personnes, appareils, pièces, étages, étiquettes","custom_target_lbl":"Cibles personnalisées (e-mail, ID Telegram, …) — séparées par des virgules","adv_title":"Options avancées","adv_spoken":"Message parlé (Alexa, TTS)","adv_spoken_ph":"ce que disent les enceintes, si différent du texte","adv_apply":"Appliquer ces scénarios","adv_require":"Envoyer seulement si ces scénarios sont actifs","adv_constrain":"Ne considérer que ces scénarios","adv_snapshot":"Image depuis une URL","adv_debug":"Débogage : enregistrer la trace complète de sélection (affichée par la carte Pourquoi)","custom_target_ph":"ex. user@example.com, 123456789","native_target_tag":"🎯 pièce/étage/étiquette natif","target_warn":"⚠️ Les pièces, étages et étiquettes ne sont résolus que par notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts et chime. Avec tout autre canal — ou le routage par défaut quand aucun canal n'est choisi ci-dessus — la notification peut se retrouver sans cible sans le signaler. Choisissez un canal compatible, ou ajoutez directement une personne/un appareil.","aut_search":"Rechercher des automatisations…","aut_all":"Toutes","aut_none":"Aucun résultat","aut_err":"Manifeste introuvable — générez-le avec tools/genera_vista_automazioni.py","aut_updated":"liste mise à jour","aut_count":"automatisations","aut_count_1":"automatisation","never":"jamais","ago_now":"maintenant","ago_min":"min","ago_h":"h","ago_d":"j","aut_disabled_only":"Désactivées seulement","grp_active":"actifs","repeat":"Répéter","skipped_n":"ignorés","left":"restant","missed_n":"manqués","snz_all":"tout","snz_nc":"non critique","snz_prio":"priorité","snz_transport":"transport","snz_for":"pour","snz_choose":"choisir quoi et combien de temps","snz_title":"Mettre les notifications en pause","snz_what":"Quoi","snz_nc_l":"Non critiques","snz_all_l":"Tout","snz_ch":"Un canal","snz_pr":"Une priorité","snz_who":"Pour qui","snz_everyone":"Tout le monde","snz_me":"Moi seulement","snz_len":"Combien de temps","snz_forever":"Jusqu'à ce que je reprenne","snz_go":"Pause","snz_close":"Fermer","rs_hand":"à la main","rs_voice":"à la voix","rs_assist":"par l'assistant","snz_voice_info":"Vos pauses passent par les commandes vocales de SuperNotify : elles ne concernent que vous.","snz_voice_off":"Les commandes vocales de SuperNotify sont désactivées : activez-les dans les options de l'intégration.","snz_resume_mine":"Reprendre les miennes","go_open":"Afficher","dl_probe":"Essayer ce canal","probe_msg":"Test du canal depuis le tableau de bord","sc_why":"Pourquoi","sc_yes":"S'applique maintenant","sc_no":"Ne s'applique pas maintenant","sc_manual_why":"Scénario manuel : appliqué à la main","sc_no_cond":"Aucune condition","sc_off_sw":"Désactivé","sc_not_eval":"non vérifié","sc_now":"maintenant","sc_diff_btn_on":"Ce qui change s'il s'applique","sc_diff_btn_off":"Ce qui change sans lui","sc_diff_on":"S'il s'appliquait, pour une notification moyenne maintenant :","sc_diff_off":"Sans lui, pour une notification moyenne maintenant :","sc_diff_add":"enverrait aussi","sc_diff_rem":"n'enverrait plus","sc_diff_none":"aucune différence","c_state":"{e} est {s}","c_template":"condition de modèle","c_time":"heure","c_after":"après","c_before":"avant","c_numeric":"{e}","c_above":"au-dessus de","c_below":"en dessous de","c_and":"toutes celles-ci","c_or":"au moins une de celles-ci","c_not":"aucune de celles-ci","c_or_join":" ou ","sim_hint_dry":"La réponse de SuperNotify lui-même (simulation, rien n'est envoyé) : une notification maintenant, avec la priorité et seulement les scénarios choisis ci-dessus.","sim_msg":"Test du simulateur","sim_prio":"Priorité","sa_snooze":"Pause de {len} : {what}.","sa_silence":"Silence jusqu'à nouvel ordre : {what}.","sa_resume":"Reprise : {what}.","sa_resume_one":"Fin de la pause : {x}.","sa_resume_all":"Notifications réactivées.","sa_w_nc":"Les notifications non critiques","sa_w_all":"Toutes les notifications","sa_w_ch":"Le canal {x}","sa_w_pr":"Les notifications de priorité {x}","sa_w_mine":"Vos notifications","sa_for":"pour {x}","sa_min":"{n} minutes","sa_hour":"une heure","sa_hours":"{n} heures","occ_title":"Qui est à la maison","occ_home_l":"À la maison","occ_ALL_HOME":"Tout le monde à la maison","occ_ALL_AWAY":"Tout le monde absent","occ_LONE_HOME":"Une seule personne à la maison","occ_MULTI_HOME":"Quelques-uns à la maison","occ_UNDEFINED_OCCUPANTS":"Personne n'est suivi","h_repairs":"réparations SuperNotify","h_repairs_1":"réparation SuperNotify","det_more":"Tous les attributs","det_yes":"oui","det_no":"non","det_action":"Action","det_target":"Cibles fixes","det_target_req":"Nécessite une cible","det_target_use":"Cibles utilisées","det_inclusion":"Utilisé quand","det_prio":"Priorités","det_occ":"Qui doit être à la maison","det_transport":"Transport","det_data":"Données","det_debug":"Débogage","det_err_last":"Dernière erreur","det_err_in":"Dans","det_err_n":"Erreurs depuis le démarrage","det_select":"Sélection","adv_html":"Texte pour l'e-mail (HTML)","adv_clip":"Clip vidéo depuis une URL","adv_actions":"Boutons sur la notification","adv_act_id":"id de l'action","adv_act_title":"texte du bouton","adv_act_add":"+ bouton","adv_groups":"Groupes de boutons (virgule)","adv_dc":"Réglages des canaux pour cette notification","adv_dc_ph":"clé: valeur, une par ligne","adv_dc_add":"+ canal","snz_active":"En pause maintenant","snz_resume":"Reprendre","snz_resume_all":"Tout reprendre","snz_until_resumed":"jusqu'à la reprise","snz_done":"En pause","snz_resumed":"Repris","no_notif":"aucune notification pour l'instant","st_title":"Utilisation","st_days":"jours","st_days_short":"j","st_hist_note":"heures, canaux et priorités sur les {n} derniers jours d'historique","st_total":"Notifications","st_avg":"par jour","st_today":"Aujourd'hui","st_vs_avg":"vs moyenne","st_peak_hour":"Heure de pointe","st_top_channel":"Canal principal","st_errors":"Erreurs de canal","st_of_sends":"des envois par canal","st_daily":"Par jour","st_hourly":"Par heure de la journée","st_weekday":"Par jour de la semaine","st_channels":"Canaux — les plus utilisés","st_priority":"Priorité","st_period":"Moment de la journée","st_insights":"Observations","st_no_data":"Pas encore d'historique — les données apparaissent après les premières notifications.","st_unknown":"inconnu","st_loading":"chargement…","st_versions":"Versions","st_installed":"installée","st_latest":"dernière","st_uptodate":"à jour","st_update":"mise à jour disponible","st_restart":"redémarrage requis","st_cards":"cartes","st_logged":"enregistrées","st_reading":"lecture de l'archive : jour {n} sur {of}…","st_from_archive":"depuis l'archive de SuperNotify","st_archive_err":"archive lue en partie","st_wd":["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],"st_i_share":"{p} % de tous les envois passent par {c}.","st_i_peak":"L'heure la plus chargée est {h}:00 ({n} notifications en {d} jours).","st_i_night":"{p} % des notifications arrivent entre 23:00 et 07:00 — envisagez un scénario Ne pas déranger si ce n'est pas voulu.","st_i_night_ok":"Seulement {p} % des notifications arrivent la nuit (23–07) : les heures calmes fonctionnent.","st_i_weekend":"Le week-end compte {p} % de notifications {dir} qu'en semaine.","st_i_errors":"{n} erreurs de canal en {d} jours, surtout sur {c}.","st_i_noerr":"Aucune erreur de canal ces {d} derniers jours.","st_i_prio":"{p} % des notifications sont de priorité {prio}.","st_i_trend":"7 derniers jours : {n}/jour, {dir} de {p} % par rapport aux 7 précédents.","st_more":"en plus","st_less":"en moins","st_up":"en hausse","st_down":"en baisse"},"SN_STATS_STRINGS":{"st_title":"Utilisation","st_days":"jours","st_days_short":"j","st_hist_note":"heures, canaux et priorités sur les {n} derniers jours d'historique","st_total":"Notifications","st_avg":"par jour","st_today":"Aujourd'hui","st_vs_avg":"vs moyenne","st_peak_hour":"Heure de pointe","st_top_channel":"Canal principal","st_errors":"Erreurs de canal","st_of_sends":"des envois par canal","st_daily":"Par jour","st_hourly":"Par heure de la journée","st_weekday":"Par jour de la semaine","st_channels":"Canaux — les plus utilisés","st_priority":"Priorité","st_period":"Moment de la journée","st_insights":"Observations","st_no_data":"Pas encore d'historique — les données apparaissent après les premières notifications.","st_unknown":"inconnu","st_loading":"chargement…","st_versions":"Versions","st_installed":"installée","st_latest":"dernière","st_uptodate":"à jour","st_update":"mise à jour disponible","st_restart":"redémarrage requis","st_cards":"cartes","st_logged":"enregistrées","st_reading":"lecture de l'archive : jour {n} sur {of}…","st_from_archive":"depuis l'archive de SuperNotify","st_archive_err":"archive lue en partie","st_wd":["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"],"st_i_share":"{p} % de tous les envois passent par {c}.","st_i_peak":"L'heure la plus chargée est {h}:00 ({n} notifications en {d} jours).","st_i_night":"{p} % des notifications arrivent entre 23:00 et 07:00 — envisagez un scénario Ne pas déranger si ce n'est pas voulu.","st_i_night_ok":"Seulement {p} % des notifications arrivent la nuit (23–07) : les heures calmes fonctionnent.","st_i_weekend":"Le week-end compte {p} % de notifications {dir} qu'en semaine.","st_i_errors":"{n} erreurs de canal en {d} jours, surtout sur {c}.","st_i_noerr":"Aucune erreur de canal ces {d} derniers jours.","st_i_prio":"{p} % des notifications sont de priorité {prio}.","st_i_trend":"7 derniers jours : {n}/jour, {dir} de {p} % par rapport aux 7 précédents.","st_more":"en plus","st_less":"en moins","st_up":"en hausse","st_down":"en baisse"},"SN_ARCH_STRINGS":{"title":"Historique des notifications","search":"Rechercher dans le titre ou le message…","f_all":"Toutes","f_problems":"Problèmes seulement","f_today":"Aujourd'hui","f_whisper":"Chuchotées","wh":"chuchoté","said":"Alexa a dit","said_by":"{ch} a dit","none":"aucune notification ne correspond","no_sensor":"capteur introuvable","no_sensor_hint":"Mettez à jour SuperNotify en 2.10 ou plus récente, qui dispose de l'action supernotify.enquire_archive, ou ajoutez le capteur command_line qui indexe l'archive (voir le README).","loading":"lecture de l'archive…","recent":"dernières notifications","read_at":"lu à","of":"sur","in_archive":"dans l'archive","since":"la plus ancienne","updated":"index mis à jour","today":"Aujourd'hui","yesterday":"Hier","delivered":"livré","failed":"échoué","skipped":"ignoré","missed":"manqué","prio":{"critical":"Critique","high":"Haute","low":"Faible","minimum":"Minimum","medium":"Moyenne"},"reasons":{"doppione":"doublon","nessun target":"aucune cible","errore":"erreur","condizione":"condition","scenario":"scénario","presenza":"présence","priorita":"priorité","spento":"désactivé","pausa":"en pause","transport spento":"transport désactivé","nessuna azione":"aucune action","dati non validi":"données non valides","sconosciuto":"inconnu"},"scenarios":"Scénarios actifs","truncated":"message tronqué dans l'index","dur":"durée","id":"id","why":"Pourquoi ? - détail complet"},"SN_WHY_STRINGS":{"title":"Pourquoi ?","pick":"Choisissez une notification pour voir pourquoi elle est allée là où elle est allée.","loading":"chargement…","none":"aucune notification","no_sensor":"capteur introuvable :","no_service":"Service manquant","no_service_hint":"Mettez à jour SuperNotify en 2.10 ou plus récente (supernotify.enquire_archive), ou ajoutez le shell_command sn_archive_detail (voir le README) et redémarrez Home Assistant.","gone":"cette notification n'est plus dans l'archive","priority":"priorité","outcome":"résultat","dupe":"doublon","outcomes":{"success":"livrée","partial_delivery":"livrée en partie","dupe":"doublon","failed":"échouée","error":"échouée","fallback_delivery":"livrée par le canal de secours","no_delivery":"non livrée"},"missed":"manqué (demandé, non envoyé)","step_call":"Appel","step_scen":"Scénarios","step_people":"Personnes","step_ch":"Canaux","call_auto":"aucun canal nommé : routage normal","call_named":"nommés dans l'appel :","call_debug":"avec débogage","nobody":"personne à la maison","ch_sent":"envoyé","ch_problems":"à vérifier","ch_skipped":"ignoré","pb_failed":"échoué","pb_missed":"demandé mais non envoyé","grp_skipped":"ignoré par une règle : normal","grp_not":"non concerné","trace_title":"Trace complète de sélection","fix":{"NO_TARGET":"Aucun destinataire n'a d'adresse pour ce canal : ajoutez-en une à un destinataire, donnez des cibles fixes au canal, ou laissez-le hors de cet appel.","ERROR":"L'intégration derrière ce canal a répondu par une erreur : consultez sa propre entrée dans le journal.","NO_ACTION":"Le canal n'a aucune action à appeler : définissez `action:` sur la livraison.","INVALID_ACTION_DATA":"Les données passées à l'action ont été refusées : vérifiez le `data:` de l'appel ou de la livraison."},"scenarios":"Scénarios actifs","no_scenarios":"aucun scénario actif","applied":"forcé par l'appel","required":"requis par l'appel","constrain":"limité par l'appel à","presence":"Présence","home":"à la maison","away":"absent","channels":"Canaux","no_channels":"aucun canal n'a été sélectionné","st_ok":"livré","st_err":"échoué","st_skip":"ignoré","st_supp":"supprimé","calls":"appels","calls_1":"appel","target_required":"cible requise :","started_by":"sélectionné par","scen_would_off":"désactivé par (outrepassé)","src_default":"toujours actif (par défaut)","src_scen":"scénario","src_call":"l'appel lui-même","src_recipient":"destinataire","r_off_by":"désactivé par","call_targets":"cibles dans l'appel","cats":{"entity_id":"entités","mobile_app_id":"appareils","person_id":"personnes","email":"e-mail","phone":"téléphone","device_id":"appareils"},"not_started":"Canaux qui ne sont pas partis","r_call_off":"exclu par l'appel","r_scen_off":"désactivé par un scénario actif","r_disabled":"désactivé","r_transport_off":"son transport est désactivé","r_only_scen":"ne part que si un scénario l'active","r_only_fallback":"secours uniquement","r_only_explicit":"ne part que si demandé par son nom","r_priority":"pas pour cette priorité","r_unknown":"impossible à reconstituer sans la trace","from_config":"Les raisons des canaux qui ne sont pas partis sont reconstituées à partir de la configuration ACTUELLE, pas de celle de l'époque.","from_trace":"Les raisons proviennent de la trace de sélection archivée avec la notification.","st_time":"durée","st_slow":"le plus lent","st_rate":"des canaux ont réussi","ua_title":"Cibles qu'aucun canal n'a prises","ua_hint":"Elles étaient dans l'appel, mais aucun canal sélectionné n'accepte ce type de cible.","un_title":"Noms qui n'existent pas","sent_by":"Envoyé par","sent_auto":"automatisation","sent_script":"script","sent_person":"","sent_unknown":"expéditeur inconnu (aucune automatisation ni personne dans son contexte)","trace":"Trace de sélection","no_trace":"La trace complète de sélection n'est enregistrée que lorsque l'appel notify contient debug: true, et archivée lorsque les diagnostics de l'archive l'incluent.","reasons":{"NO_TARGET":"aucune cible utilisable","DUPE":"doublon d'une notification récente","PRIORITY":"pas pour cette priorité","SNOOZE":"en pause","SNOOZED":"en pause","DELIVERY_CONDITION":"condition de livraison fausse","OCCUPANCY":"règle de présence","ERROR":"erreur","DELIVERY_DISABLED":"désactivé","SCENARIO":"scénario","TRANSPORT_DISABLED":"son transport est désactivé","NO_SCENARIO":"un scénario requis n'est pas actif","NO_ACTION":"aucune action à appeler","INVALID_ACTION_DATA":"données d'action non valides","UNKNOWN":"raison inconnue"}},"SN_TOOLS_STRINGS":{"maint":"Maintenance","enq":"Interroger SuperNotify","refresh":"Republier toutes les entités","refresh_btn":"Actualiser","resume_btn":"Reprendre","refreshed":"Entités republiées.","resume_all":"Reprendre toutes les pauses","cleared_n":"pauses reprises","purge_arch":"Nettoyer l'archive","purge_media":"Nettoyer les images","older":"plus anciennes que","days":"jours","purge_btn":"Nettoyer","confirm":"Touchez encore pour confirmer","purged":"supprimés","remaining":"restants","reset":"Annuler les modifications faites à la main","reset_btn":"Réinitialiser","reset_none":"Rien à réinitialiser : tout est comme configuré.","reset_done":"Retour à la configuration :","k_all":"tout","k_scenario":"scénarios","k_delivery":"canaux","k_recipient":"personnes","k_transport":"transports","q_config":"Configuration","q_scen":"Scénarios","q_active":"Scénarios actifs","q_by_scen":"Canaux par scénario","q_implicit":"Canaux par défaut","q_recipients":"Destinataires","q_occupancy":"Qui est à la maison","q_snoozes":"Pauses","q_last":"Dernière notification","copy":"Copier le JSON","copied":"Copié","close":"Fermer","empty":"(vide)","err":"SuperNotify a répondu par une erreur :","err_config":"SuperNotify 2.12.0 ne peut pas renvoyer sa configuration quand un canal a des conditions de modèle (rhizomatics/supernotify#241).","settings":"Paramètres de l'intégration","running":"en cours…","more":"plus"},"SN_FORM_LABELS":{"_common":"Apparence et textes","style":"Couleurs","icons":"Icônes","show_version":"Afficher la version de la carte","intro":"Texte d'introduction en haut","title":"Titre","dnd_entity":"Interrupteur Ne pas déranger","quiet_entity":"État calme calculé (facultatif)","presence_entity":"Personne pour la barre d'état","archive_days":"Nettoyage de l'archive : plus ancien que (jours)","media_days":"Nettoyage des images : plus ancien que (jours)","occupancy":"Qui est à la maison (depuis SuperNotify)","repairs":"Réparations SuperNotify dans la liste d'état","snooze_announce":"Annoncer les pauses à voix haute (canal d'annonce)","snooze_via":"Les pauses passent par","o_event":"l'événement des boutons push (admin)","o_voice":"les commandes vocales","snooze_minutes":"Durée de la pause (minutes)","snooze_panel":"La tuile Pause ouvre le panneau des pauses","announce_delivery":"Canal pour les annonces","last_notification":"Afficher la dernière notification","last_channels":"Une puce par canal dans la dernière notification","repeat_entity":"Bouton Répéter la dernière (facultatif)","tile_layout":"Tuiles","tile_columns":"Colonnes de tuiles (vide = automatique)","update_entity":"Entité de mise à jour SuperNotify","cards_update_entity":"Entité de mise à jour des cartes","sent_today_entity":"Compteur journalier (utility meter, facultatif)","count_entity":"Compteur SuperNotify (statistiques à long terme)","health":"État en haut","stats":"Chiffres","poll_seconds":"Actualiser toutes les (secondes)","group":"Grouper selon la façon dont un canal part","hide_defaults":"Masquer les canaux automatiques DEFAULT_","limit":"Notifications dans la liste","expand":"Ouvrir les parties repliées","max_height":"Hauteur maximale (CSS, ex. 70vh)","source":"Source de l'archive","entity":"Capteur d'archive (pont uniquement)","trigger_entity":"Actualiser quand ceci change","dry_run":"Afficher « Essayer sans envoyer »","dry_run_dupe_check":"Simuler aussi le contrôle des doublons","days":"Jours affichés par défaut","manifest_url":"URL du manifeste des automatisations","o_supernotify":"SuperNotify","o_theme":"Thème Home Assistant","o_mdi":"Icônes Home Assistant","o_emoji":"Emoji","o_row":"Icône à gauche","o_stacked":"Haute, icône en haut","o_three":"Envoyées, échecs, canaux","o_full":"Les cinq","o_auto":"Automatique","o_sensor":"Pont par capteur (avant SuperNotify 2.10)","o_archive":"Archive SuperNotify (2.12.1+)","o_history":"Historique des entrées"},"SN_NATIVE_STR":{"all_good":"Tout va bien","paused":"En pause","until":"jusqu'à","resume":"Reprendre","test":"Envoyer un test","sure":"Touchez encore pour envoyer","sent":"Envoyé","last":"Dernière","none":"Aucune notification pour l'instant","ago":"il y a","min":"min","h":"h","err":"transports en erreur","off":"canaux désactivés"},"SN_STRATEGY_TITLES":{"home":"Accueil","send":"Envoyer","setup":"Configuration","stats":"Statistiques","tools":"Outils","title":"SuperNotify"}},"nl":{"SN_STRINGS":{"presence":"Aanwezigheid","time_band":"Tijdvak","quiet":"Stil","act_scen":"Actieve scenario's","on":"aan","off":"uit","active":"actief","dnd":"Niet storen","tap_silence":"tik om te dempen","snooze":"Pauzeren","min":"min","pause_nc":"niet-kritieke pauzeren","snoozed":"Gepauzeerd","until":"tot","tap_clear":"tik om te wissen","announce":"Omroepen","intercom":"intercom","announce_ph":"Omroepen op alle speakers…","send":"Versturen","announced":"Omgeroepen","cleared":"Pauzes gewist","snoozed_for":"Niet-kritieke meldingen gepauzeerd voor","sent":"Verstuurd","sent_today":"Vandaag verstuurd","since_startup":"sinds opstarten","yesterday":"gisteren","failures":"Mislukt","fail_today":"mislukte kanaalverzendingen vandaag","deliveries":"Bezorgingen","enabled_total":"ingeschakeld/totaal","last_notif":"Laatste melding","transports":"Transporten","delivered":"bezorgd","failed":"mislukt","channels":"kanalen","none":"geen","no_transports":"geen transport-entiteiten gevonden","tr_used":"gebruikt door","tr_unused":"geen kanaal gebruikt het","start":"start","volume":"volume","now":"nu","crosses":"gaat over middernacht","no_voice":"geen stem","mute_hint":"Een tijdvak op <b>0%</b> stuurt <b>helemaal geen gesproken melding</b> (Alexa en TTS uit, push en dashboard worden nog wel bezorgd). Kritieke meldingen en meldingen met hoge prioriteit spreken altijd.","enabled":"ingeschakeld","implicit":"altijd aan","explicit":"op verzoek","by_scenario":"alleen scenario","fallback":"reserve","fallback_err":"reserve bij fout","inc_sum":"van deze kanalen","inc_always":"starten vanzelf","inc_req":"alleen op verzoek","inc_scen":"alleen met een scenario","grp_auto":"Starten vanzelf","grp_named":"Alleen als genoemd in de aanroep","grp_scen":"Alleen met een scenario","grp_fallback":"Reserve, als de andere mislukken","ch_title":"Kanalen","ch_count":"{on} van {tot} aan","off_manual":"uitgeschakeld","paused_by":"nu gepauzeerd door","on_by":"nu aan via","fixed_targets":"vaste doelen","no_deliveries":"geen bezorging-entiteiten gevonden","home":"thuis","away":"afwezig","devices":"apparaten","devices_1":"apparaat","rc_test":"Test versturen","rc_test_confirm":"Tik nogmaals om te versturen","rc_test_sent":"Test verstuurd","rc_test_title":"SuperNotify-test","rc_test_msg":"Testbericht vanaf het dashboard,","overrides":"bezorgingsaanpassingen","overrides_1":"bezorgingsaanpassing","no_contact":"geen contactpunten","no_recipients":"geen ontvanger-entiteiten gevonden","details":"Details","h_update":"update beschikbaar:","h_restart":"herstart Home Assistant om de update af te ronden","h_uptodate":"up-to-date","h_transport_err":"transporten met fouten","h_channels_off":"kanalen uit","h_all_good":"Alles in orde","h_health":"Status","h_failures":"mislukkingen","h_failures_1":"mislukking","h_transport_err_1":"transport met fouten","h_channels_off_1":"kanaal uit","channels_1":"kanaal","band_early_morning":"Vroege ochtend","band_morning":"Ochtend","band_afternoon":"Middag","band_evening":"Avond","band_night":"Nacht","band_late_night":"Late nacht","h_look_1":"1 ding om naar te kijken","h_look_n":"{n} dingen om naar te kijken","h_rest_ok":"de rest werkt","h_ch_on":"{on} van {tot} kanalen aan","h_open":"Openen","ln_delivered":"bezorgd","ln_failed":"mislukt","ln_why":"Waarom","tgt_loading":"kiezer laden…","bands_empty_t":"Nog geen tijdvakken","bands_empty":"Voeg één tijdvak per dagdeel toe: een input_datetime voor de start en een input_number voor het stemvolume.","active_now":"nu actief","disabled":"uitgeschakeld","other":"Overig","manual":"handmatig","apply_now":"nu toepassen","applied":"Toegepast","apply_off":"tik om niet meer toe te passen","enabled_lbl":"ingeschakeld","reset_overrides":"Aanpassingen resetten","reset_done":"aanpassingen gereset","transport_off":"transport uit","last_notified":"laatst gemeld","never_notified":"nooit gemeld","media":"media","no_scenarios":"geen scenario-entiteiten gevonden","sim_pick":"🎬 Scenario's — tik om te simuleren","sim_fire":"📤 Kanalen","sim_hint":"Echte gegevens van de engine (opvraagacties). Filteren van bezorgingen op prioriteit gebeurt in de engine en wordt hier niet gesimuleerd. Uitgeschakeld wint van ingeschakeld, net als bij het samenvoegen tijdens gebruik.","sim_none":"er zouden geen bezorgingen starten","scenario_tag":"scenario","sim_go":"Zou verstuurd worden","sim_stop":"Zou niet verstuurd worden","sim_r_default":"start vanzelf","sim_r_on":"aangezet door","sim_r_off":"uitgezet door","sim_r_named":"alleen als genoemd in de aanroep","sim_r_scen":"alleen met een scenario dat het aanzet","sim_r_fallback":"reserve, als de andere mislukken","sim_r_switched":"uitgeschakeld","title":"Titel","message":"Bericht","priority":"Prioriteit","channels_lbl":"Kanalen — niets gekozen = normale routering","camera_lbl":"Camera-snapshot","preview":"Voorbeeld","no_title":"(geen titel)","no_message":"(geen bericht)","default_prio":"standaard (gemiddeld)","comp_hint":"Gekozen kanalen worden verstuurd met delivery_selection: fixed (alleen die starten). Kritiek is echt kritiek — sirenes inbegrepen.","critical_confirm":"Een KRITIEKE melding versturen? Sirenes en maximaal volume inbegrepen.","write_first":"Schrijf eerst een bericht","sent_toast":"Verstuurd","write_or_pick":"Schrijf een bericht, of kies een camera of een kanaal","need_2111":"Een melding zonder tekst vereist SuperNotify 2.11.1","send_err":"Niet verstuurd","dry_btn":"Proberen zonder versturen","dry_title":"Als je het nu verstuurde","dry_err":"Testrun mislukt","dry_would":"zou versturen","dry_skip":"overgeslagen","dry_nobody":"geen ontvanger, alleen directe doelen","dry_targets":"doelen","dry_suppressed":"De melding zou worden onderdrukt","dry_fallback":"Geen kanaal zou starten: terugval op","dry_none":"Geen kanaal geselecteerd","dry_scen":"Actieve scenario's","dry_raw":"Ruw antwoord","dry_prio":"Prioriteit","dry_would_n":"kanalen zouden versturen","dry_nothing":"Er zou niets worden verstuurd","dry_dupe":"Duplicaat van een recente melding: zou worden weggegooid","dry_no_dupe":"Duplicaatcontrole niet gesimuleerd, dus het echte Versturen direct daarna wordt niet geblokkeerd.","dry_restart":"De SuperNotify die nu draait kan niet simuleren: een testrun vereist 2.12, en Home Assistant moet na de update worden herstart.","dry_home":"Thuis","dry_empty":"SuperNotify gaf geen antwoord: is het 2.12 of nieuwer?","dry_reasons":{"NO_TARGET":"geen bruikbaar doel","DUPE":"duplicaat","PRIORITY":"niet voor deze prioriteit","SNOOZED":"gepauzeerd","DELIVERY_CONDITION":"bezorgingsvoorwaarde onwaar","OCCUPANCY":"aanwezigheidsregel","TRANSPORT_DISABLED":"transport uit","DELIVERY_DISABLED":"uitgeschakeld","NO_SCENARIO":"vereist scenario niet actief","NO_ACTION":"geen actie","INVALID_ACTION_DATA":"ongeldige gegevens","UNKNOWN":"onbekende reden","ERROR":"fout"},"prio_minimum":"Minimaal","prio_low":"Laag","prio_medium":"Gemiddeld","prio_high":"Hoog","prio_critical":"Kritiek","target_lbl":"Doel — personen, apparaten, ruimtes, verdiepingen, labels","custom_target_lbl":"Eigen doelen (e-mail, Telegram-ID's, …) — gescheiden door komma's","adv_title":"Geavanceerde opties","adv_spoken":"Gesproken bericht (Alexa, TTS)","adv_spoken_ph":"wat de speakers zeggen, als het anders is dan de tekst","adv_apply":"Deze scenario's toepassen","adv_require":"Alleen versturen als deze scenario's actief zijn","adv_constrain":"Alleen deze scenario's meenemen","adv_snapshot":"Afbeelding van een URL","adv_debug":"Debug: volledige selectietrace vastleggen (getoond door de waarom-kaart)","custom_target_ph":"bijv. user@example.com, 123456789","native_target_tag":"🎯 native ruimte/verdieping/label","target_warn":"⚠️ Ruimtes, verdiepingen en labels worden alleen opgelost door notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts en chime. Met elk ander kanaal — of de standaardroutering als hierboven geen kanaal is gekozen — kan de melding ongemerkt zonder doel eindigen. Kies een compatibel kanaal, of voeg direct een persoon/apparaat toe.","aut_search":"Automatiseringen zoeken…","aut_all":"Alle","aut_none":"Geen resultaten","aut_err":"Manifest niet gevonden — genereer het met tools/genera_vista_automazioni.py","aut_updated":"lijst bijgewerkt","aut_count":"automatiseringen","aut_count_1":"automatisering","never":"nooit","ago_now":"nu","ago_min":"min geleden","ago_h":"u geleden","ago_d":"d geleden","aut_disabled_only":"Alleen uitgeschakeld","grp_active":"actief","repeat":"Herhalen","skipped_n":"overgeslagen","left":"over","missed_n":"gemist","snz_all":"alles","snz_nc":"niet-kritiek","snz_prio":"prioriteit","snz_transport":"transport","snz_for":"voor","snz_choose":"kies wat en hoe lang","snz_title":"Meldingen pauzeren","snz_what":"Wat","snz_nc_l":"Niet-kritiek","snz_all_l":"Alles","snz_ch":"Een kanaal","snz_pr":"Een prioriteit","snz_who":"Voor wie","snz_everyone":"Iedereen","snz_me":"Alleen ik","snz_len":"Hoe lang","snz_forever":"Tot ik hervat","snz_go":"Pauzeren","snz_close":"Sluiten","rs_hand":"handmatig","rs_voice":"met spraak","rs_assist":"door de assistent","snz_voice_info":"Je pauzes lopen via de spraakopdrachten van SuperNotify: ze gelden alleen voor jou.","snz_voice_off":"De spraakopdrachten van SuperNotify staan uit: zet ze aan in de integratie-opties.","snz_resume_mine":"Mijn pauzes hervatten","go_open":"Tonen","dl_probe":"Dit kanaal proberen","probe_msg":"Kanaaltest vanaf het dashboard","sc_why":"Waarom","sc_yes":"Geldt nu","sc_no":"Geldt nu niet","sc_manual_why":"Handmatig scenario: met de hand toegepast","sc_no_cond":"Geen voorwaarden","sc_off_sw":"Uitgeschakeld","sc_not_eval":"niet gecontroleerd","sc_now":"nu","sc_diff_btn_on":"Wat verandert als het geldt","sc_diff_btn_off":"Wat verandert zonder","sc_diff_on":"Als het gold, voor een gemiddelde melding nu:","sc_diff_off":"Zonder, voor een gemiddelde melding nu:","sc_diff_add":"zou ook versturen","sc_diff_rem":"zou niet meer versturen","sc_diff_none":"geen verschil","c_state":"{e} is {s}","c_template":"sjabloonvoorwaarde","c_time":"tijd","c_after":"na","c_before":"voor","c_numeric":"{e}","c_above":"boven","c_below":"onder","c_and":"al deze","c_or":"minstens één hiervan","c_not":"geen van deze","c_or_join":" of ","sim_hint_dry":"Het eigen antwoord van SuperNotify (testrun, er wordt niets verstuurd): een melding nu, met de prioriteit en alleen de scenario's die hierboven zijn gekozen.","sim_msg":"Simulatortest","sim_prio":"Prioriteit","sa_snooze":"{what} gepauzeerd voor {len}.","sa_silence":"{what} gedempt tot nader order.","sa_resume":"{what} weer aan.","sa_resume_one":"Pauze voorbij: {x}.","sa_resume_all":"Meldingen weer aan.","sa_w_nc":"Niet-kritieke meldingen","sa_w_all":"Alle meldingen","sa_w_ch":"Kanaal {x}","sa_w_pr":"Meldingen met prioriteit {x}","sa_w_mine":"Je meldingen","sa_for":"voor {x}","sa_min":"{n} minuten","sa_hour":"een uur","sa_hours":"{n} uur","occ_title":"Wie is er thuis","occ_home_l":"Thuis","occ_ALL_HOME":"Iedereen thuis","occ_ALL_AWAY":"Iedereen weg","occ_LONE_HOME":"Eén persoon thuis","occ_MULTI_HOME":"Enkelen thuis","occ_UNDEFINED_OCCUPANTS":"Niemand gevolgd","h_repairs":"SuperNotify-reparaties","h_repairs_1":"SuperNotify-reparatie","det_more":"Alle attributen","det_yes":"ja","det_no":"nee","det_action":"Actie","det_target":"Vaste doelen","det_target_req":"Vereist een doel","det_target_use":"Doelen gebruiken","det_inclusion":"Gebruikt wanneer","det_prio":"Prioriteiten","det_occ":"Wie thuis moet zijn","det_transport":"Transport","det_data":"Gegevens","det_debug":"Debug","det_err_last":"Laatste fout","det_err_in":"In","det_err_n":"Fouten sinds start","det_select":"Selectie","adv_html":"Tekst voor e-mail (HTML)","adv_clip":"Videoclip van een URL","adv_actions":"Knoppen op de melding","adv_act_id":"actie-id","adv_act_title":"knoptekst","adv_act_add":"+ knop","adv_groups":"Knopgroepen (komma)","adv_dc":"Kanaalinstellingen voor deze melding","adv_dc_ph":"sleutel: waarde, één per regel","adv_dc_add":"+ kanaal","snz_active":"Nu gepauzeerd","snz_resume":"Hervatten","snz_resume_all":"Alles hervatten","snz_until_resumed":"tot hervat","snz_done":"Gepauzeerd","snz_resumed":"Hervat","no_notif":"nog geen melding","st_title":"Gebruik","st_days":"dagen","st_days_short":"d","st_hist_note":"uren, kanalen en prioriteiten over de laatste {n} dagen geschiedenis","st_total":"Meldingen","st_avg":"per dag","st_today":"Vandaag","st_vs_avg":"t.o.v. gemiddelde","st_peak_hour":"Piekuur","st_top_channel":"Topkanaal","st_errors":"Kanaalfouten","st_of_sends":"van de kanaalverzendingen","st_daily":"Per dag","st_hourly":"Per uur van de dag","st_weekday":"Per weekdag","st_channels":"Kanalen — meest gebruikt","st_priority":"Prioriteit","st_period":"Dagdeel","st_insights":"Inzichten","st_no_data":"Nog geen geschiedenis — gegevens verschijnen na de eerste meldingen.","st_unknown":"onbekend","st_loading":"laden…","st_versions":"Versies","st_installed":"geïnstalleerd","st_latest":"nieuwste","st_uptodate":"up-to-date","st_update":"update beschikbaar","st_restart":"herstart vereist","st_cards":"kaarten","st_logged":"vastgelegd","st_reading":"archief lezen: dag {n} van {of}…","st_from_archive":"uit het archief van SuperNotify","st_archive_err":"archief deels gelezen","st_wd":["ma","di","wo","do","vr","za","zo"],"st_i_share":"{p}% van alle kanaalverzendingen gaat via {c}.","st_i_peak":"Drukste uur is {h}:00 ({n} meldingen in {d} dagen).","st_i_night":"{p}% van de meldingen komt binnen tussen 23:00 en 07:00 — overweeg een niet-storen-scenario als je dat niet wilt.","st_i_night_ok":"Slechts {p}% van de meldingen komt 's nachts binnen (23–07): de stille uren werken.","st_i_weekend":"Weekenddagen hebben {p}% {dir} meldingen dan doordeweekse dagen.","st_i_errors":"{n} kanaalfouten in {d} dagen, vooral bij {c}.","st_i_noerr":"Geen kanaalfouten in de laatste {d} dagen.","st_i_prio":"{p}% van de meldingen heeft prioriteit {prio}.","st_i_trend":"Laatste 7 dagen: {n}/dag, {dir} {p}% t.o.v. de 7 daarvoor.","st_more":"meer","st_less":"minder","st_up":"omhoog","st_down":"omlaag"},"SN_STATS_STRINGS":{"st_title":"Gebruik","st_days":"dagen","st_days_short":"d","st_hist_note":"uren, kanalen en prioriteiten over de laatste {n} dagen geschiedenis","st_total":"Meldingen","st_avg":"per dag","st_today":"Vandaag","st_vs_avg":"t.o.v. gemiddelde","st_peak_hour":"Piekuur","st_top_channel":"Topkanaal","st_errors":"Kanaalfouten","st_of_sends":"van de kanaalverzendingen","st_daily":"Per dag","st_hourly":"Per uur van de dag","st_weekday":"Per weekdag","st_channels":"Kanalen — meest gebruikt","st_priority":"Prioriteit","st_period":"Dagdeel","st_insights":"Inzichten","st_no_data":"Nog geen geschiedenis — gegevens verschijnen na de eerste meldingen.","st_unknown":"onbekend","st_loading":"laden…","st_versions":"Versies","st_installed":"geïnstalleerd","st_latest":"nieuwste","st_uptodate":"up-to-date","st_update":"update beschikbaar","st_restart":"herstart vereist","st_cards":"kaarten","st_logged":"vastgelegd","st_reading":"archief lezen: dag {n} van {of}…","st_from_archive":"uit het archief van SuperNotify","st_archive_err":"archief deels gelezen","st_wd":["ma","di","wo","do","vr","za","zo"],"st_i_share":"{p}% van alle kanaalverzendingen gaat via {c}.","st_i_peak":"Drukste uur is {h}:00 ({n} meldingen in {d} dagen).","st_i_night":"{p}% van de meldingen komt binnen tussen 23:00 en 07:00 — overweeg een niet-storen-scenario als je dat niet wilt.","st_i_night_ok":"Slechts {p}% van de meldingen komt 's nachts binnen (23–07): de stille uren werken.","st_i_weekend":"Weekenddagen hebben {p}% {dir} meldingen dan doordeweekse dagen.","st_i_errors":"{n} kanaalfouten in {d} dagen, vooral bij {c}.","st_i_noerr":"Geen kanaalfouten in de laatste {d} dagen.","st_i_prio":"{p}% van de meldingen heeft prioriteit {prio}.","st_i_trend":"Laatste 7 dagen: {n}/dag, {dir} {p}% t.o.v. de 7 daarvoor.","st_more":"meer","st_less":"minder","st_up":"omhoog","st_down":"omlaag"},"SN_ARCH_STRINGS":{"title":"Meldingsgeschiedenis","search":"Zoek in titel of bericht…","f_all":"Alle","f_problems":"Alleen problemen","f_today":"Vandaag","f_whisper":"Gefluisterd","wh":"gefluisterd","said":"Alexa zei","said_by":"{ch} zei","none":"geen melding komt overeen","no_sensor":"sensor niet gevonden","no_sensor_hint":"Werk SuperNotify bij naar 2.10 of nieuwer, met de actie supernotify.enquire_archive, of voeg de command_line-sensor toe die het archief indexeert (zie README).","loading":"archief lezen…","recent":"laatste meldingen","read_at":"gelezen om","of":"van","in_archive":"in het archief","since":"oudste","updated":"index bijgewerkt","today":"Vandaag","yesterday":"Gisteren","delivered":"bezorgd","failed":"mislukt","skipped":"overgeslagen","missed":"gemist","prio":{"critical":"Kritiek","high":"Hoog","low":"Laag","minimum":"Minimaal","medium":"Gemiddeld"},"reasons":{"doppione":"duplicaat","nessun target":"geen doel","errore":"fout","condizione":"voorwaarde","scenario":"scenario","presenza":"aanwezigheid","priorita":"prioriteit","spento":"uit","pausa":"gepauzeerd","transport spento":"transport uit","nessuna azione":"geen actie","dati non validi":"ongeldige gegevens","sconosciuto":"onbekend"},"scenarios":"Actieve scenario's","truncated":"bericht ingekort in de index","dur":"duurde","id":"id","why":"Waarom? - alle details"},"SN_WHY_STRINGS":{"title":"Waarom?","pick":"Kies een melding om te zien waarom die ging waar die heen ging.","loading":"laden…","none":"geen melding","no_sensor":"sensor niet gevonden:","no_service":"Ontbrekende actie","no_service_hint":"Werk SuperNotify bij naar 2.10 of nieuwer (supernotify.enquire_archive), of voeg het shell_command sn_archive_detail toe (zie README) en herstart Home Assistant.","gone":"deze melding staat niet meer in het archief","priority":"prioriteit","outcome":"resultaat","dupe":"duplicaat","outcomes":{"success":"bezorgd","partial_delivery":"deels bezorgd","dupe":"duplicaat","failed":"mislukt","error":"mislukt","fallback_delivery":"bezorgd via het reservekanaal","no_delivery":"niet bezorgd"},"missed":"gemist (gevraagd, niet verstuurd)","step_call":"Aanroep","step_scen":"Scenario's","step_people":"Personen","step_ch":"Kanalen","call_auto":"geen kanaal genoemd: normale routering","call_named":"genoemd in de aanroep:","call_debug":"met debug","nobody":"niemand thuis","ch_sent":"verstuurd","ch_problems":"om naar te kijken","ch_skipped":"overgeslagen","pb_failed":"mislukt","pb_missed":"gevraagd maar niet verstuurd","grp_skipped":"overgeslagen door een regel: normaal","grp_not":"niet betrokken","trace_title":"Volledige selectietrace","fix":{"NO_TARGET":"Geen enkele ontvanger heeft een adres voor dit kanaal: voeg er een toe aan een ontvanger, geef het kanaal vaste doelen, of laat het weg uit deze aanroep.","ERROR":"De integratie achter dit kanaal gaf een fout: bekijk de eigen logregel ervan.","NO_ACTION":"Het kanaal heeft geen actie om aan te roepen: stel `action:` in op de bezorging.","INVALID_ACTION_DATA":"De gegevens die aan de actie zijn doorgegeven werden geweigerd: controleer de `data:` van de aanroep of van de bezorging."},"scenarios":"Actieve scenario's","no_scenarios":"geen scenario actief","applied":"geforceerd door de aanroep","required":"vereist door de aanroep","constrain":"door de aanroep beperkt tot","presence":"Aanwezigheid","home":"thuis","away":"afwezig","channels":"Kanalen","no_channels":"er is geen kanaal geselecteerd","st_ok":"bezorgd","st_err":"mislukt","st_skip":"overgeslagen","st_supp":"onderdrukt","calls":"aanroepen","calls_1":"aanroep","target_required":"doel vereist:","started_by":"geselecteerd door","scen_would_off":"uitgezet door (overruled)","src_default":"altijd aan (standaard)","src_scen":"scenario","src_call":"de aanroep zelf","src_recipient":"ontvanger","r_off_by":"uitgezet door","call_targets":"doelen in de aanroep","cats":{"entity_id":"entiteiten","mobile_app_id":"apparaten","person_id":"personen","email":"e-mail","phone":"telefoon","device_id":"apparaten"},"not_started":"Kanalen die niet zijn gestart","r_call_off":"uitgesloten door de aanroep","r_scen_off":"uitgezet door een actief scenario","r_disabled":"uitgeschakeld","r_transport_off":"het transport staat uit","r_only_scen":"start alleen als een scenario het aanzet","r_only_fallback":"alleen reserve","r_only_explicit":"start alleen als het bij naam wordt gevraagd","r_priority":"niet voor deze prioriteit","r_unknown":"niet te reconstrueren zonder de trace","from_config":"Redenen voor kanalen die niet zijn gestart, zijn gereconstrueerd uit de configuratie zoals die NU is, niet zoals die toen was.","from_trace":"Redenen komen uit de selectietrace die met de melding is gearchiveerd.","st_time":"duurde","st_slow":"traagste","st_rate":"van de kanalen gelukt","ua_title":"Doelen die geen kanaal oppakte","ua_hint":"Ze stonden in de aanroep, maar geen geselecteerd kanaal accepteert dit soort doel.","un_title":"Namen die niet bestaan","sent_by":"Verstuurd door","sent_auto":"automatisering","sent_script":"script","sent_person":"","sent_unknown":"afzender onbekend (geen automatisering of persoon in de context)","trace":"Selectietrace","no_trace":"De volledige selectietrace wordt alleen vastgelegd als de notify-aanroep debug: true heeft, en gearchiveerd als de archiefdiagnostiek die bevat.","reasons":{"NO_TARGET":"geen bruikbaar doel","DUPE":"duplicaat van een recente melding","PRIORITY":"niet voor deze prioriteit","SNOOZE":"gepauzeerd","SNOOZED":"gepauzeerd","DELIVERY_CONDITION":"bezorgingsvoorwaarde onwaar","OCCUPANCY":"aanwezigheidsregel","ERROR":"fout","DELIVERY_DISABLED":"uitgeschakeld","SCENARIO":"scenario","TRANSPORT_DISABLED":"het transport staat uit","NO_SCENARIO":"een vereist scenario is niet actief","NO_ACTION":"geen actie om aan te roepen","INVALID_ACTION_DATA":"ongeldige actiegegevens","UNKNOWN":"onbekende reden"}},"SN_TOOLS_STRINGS":{"maint":"Onderhoud","enq":"SuperNotify bevragen","refresh":"Alle entiteiten opnieuw publiceren","refresh_btn":"Vernieuwen","resume_btn":"Hervatten","refreshed":"Entiteiten opnieuw gepubliceerd.","resume_all":"Alle pauzes hervatten","cleared_n":"pauzes hervat","purge_arch":"Archief opschonen","purge_media":"Afbeeldingen opschonen","older":"ouder dan","days":"dagen","purge_btn":"Opschonen","confirm":"Tik nogmaals om te bevestigen","purged":"verwijderd","remaining":"over","reset":"Handmatige wijzigingen ongedaan maken","reset_btn":"Resetten","reset_none":"Niets te resetten: alles is zoals geconfigureerd.","reset_done":"Terug naar de configuratie:","k_all":"alles","k_scenario":"scenario's","k_delivery":"kanalen","k_recipient":"personen","k_transport":"transporten","q_config":"Configuratie","q_scen":"Scenario's","q_active":"Actieve scenario's","q_by_scen":"Kanalen per scenario","q_implicit":"Standaardkanalen","q_recipients":"Ontvangers","q_occupancy":"Wie is er thuis","q_snoozes":"Pauzes","q_last":"Laatste melding","copy":"JSON kopiëren","copied":"Gekopieerd","close":"Sluiten","empty":"(leeg)","err":"SuperNotify antwoordde met een fout:","err_config":"SuperNotify 2.12.0 kan zijn configuratie niet teruggeven als een kanaal sjabloonvoorwaarden heeft (rhizomatics/supernotify#241).","settings":"Integratie-instellingen","running":"bezig…","more":"meer"},"SN_FORM_LABELS":{"_common":"Uiterlijk en tekst","style":"Kleuren","icons":"Pictogrammen","show_version":"Kaartversie tonen","intro":"Introtekst bovenaan","title":"Titel","dnd_entity":"Niet-storen-schakelaar","quiet_entity":"Berekende stille status (optioneel)","presence_entity":"Persoon voor de statusbalk","archive_days":"Archief opschonen: ouder dan (dagen)","media_days":"Afbeeldingen opschonen: ouder dan (dagen)","occupancy":"Wie is er thuis (van SuperNotify)","repairs":"SuperNotify-reparaties in de statuslijst","snooze_announce":"Pauzes hardop zeggen (omroepkanaal)","snooze_via":"Pauzes lopen via","o_event":"de gebeurtenis van de pushknoppen (beheerder)","o_voice":"de spraakopdrachten","snooze_minutes":"Pauzeduur (minuten)","snooze_panel":"Pauzetegel opent het pauzepaneel","announce_delivery":"Kanaal voor omroepen","last_notification":"Laatste melding tonen","last_channels":"Eén chip per kanaal in de laatste melding","repeat_entity":"Knop laatste herhalen (optioneel)","tile_layout":"Tegels","tile_columns":"Tegelkolommen (leeg = automatisch)","update_entity":"SuperNotify-update-entiteit","cards_update_entity":"Update-entiteit van de kaarten","sent_today_entity":"Dagteller (utility meter, optioneel)","count_entity":"SuperNotify-teller (langetermijnstatistieken)","health":"Status bovenaan","stats":"Cijfers","poll_seconds":"Vernieuwen elke (seconden)","group":"Groeperen op hoe een kanaal start","hide_defaults":"Automatische DEFAULT_-kanalen verbergen","limit":"Meldingen in de lijst","expand":"Ingeklapte delen openen","max_height":"Maximale hoogte (CSS, bijv. 70vh)","source":"Archiefbron","entity":"Archiefsensor (alleen brug)","trigger_entity":"Vernieuwen als dit verandert","dry_run":"\"Proberen zonder versturen\" tonen","dry_run_dupe_check":"Ook de duplicaatcontrole simuleren","days":"Standaard getoonde dagen","manifest_url":"URL van het automatiseringsmanifest","o_supernotify":"SuperNotify","o_theme":"Home Assistant-thema","o_mdi":"Home Assistant-pictogrammen","o_emoji":"Emoji","o_row":"Pictogram links","o_stacked":"Hoog, pictogram bovenaan","o_three":"Verstuurd, mislukt, kanalen","o_full":"Alle vijf","o_auto":"Automatisch","o_sensor":"Sensorbrug (vóór SuperNotify 2.10)","o_archive":"SuperNotify-archief (2.12.1+)","o_history":"Geschiedenis van de helpers"},"SN_NATIVE_STR":{"all_good":"Alles in orde","paused":"Gepauzeerd","until":"tot","resume":"Hervatten","test":"Test versturen","sure":"Tik nogmaals om te versturen","sent":"Verstuurd","last":"Laatste","none":"Nog geen melding","ago":"geleden","min":"min","h":"u","err":"transporten met fouten","off":"kanalen uit"},"SN_STRATEGY_TITLES":{"home":"Home","send":"Versturen","setup":"Instellingen","stats":"Statistieken","tools":"Hulpmiddelen","title":"SuperNotify"}},"pl":{"SN_STRINGS":{"presence":"Obecność","time_band":"Pora dnia","quiet":"Cisza","act_scen":"Aktywne scenariusze","on":"wł.","off":"wył.","active":"aktywny","dnd":"Nie przeszkadzać","tap_silence":"dotknij, aby wyciszyć","snooze":"Drzemka","min":"min","pause_nc":"wstrzymaj niekrytyczne","snoozed":"Wstrzymane","until":"do","tap_clear":"dotknij, aby wyczyścić","announce":"Ogłoś","intercom":"interkom","announce_ph":"Ogłoś na wszystkich głośnikach…","send":"Wyślij","announced":"Ogłoszono","cleared":"Drzemki wyczyszczone","snoozed_for":"Wstrzymano niekrytyczne powiadomienia na","sent":"Wysłane","sent_today":"Wysłane dzisiaj","since_startup":"od uruchomienia","yesterday":"wczoraj","failures":"Błędy","fail_today":"nieudane wysyłki kanałów dzisiaj","deliveries":"Dostarczenia","enabled_total":"włączone/wszystkie","last_notif":"Ostatnie powiadomienie","transports":"Transporty","delivered":"dostarczone","failed":"nieudane","channels":"kanałów","none":"brak","no_transports":"nie znaleziono encji transportów","tr_used":"używany przez","tr_unused":"żaden kanał go nie używa","start":"początek","volume":"głośność","now":"teraz","crosses":"przechodzi przez północ","no_voice":"bez głosu","mute_hint":"Pora z <b>0%</b> nie wysyła <b>żadnego ogłoszenia głosowego</b> (Alexa i TTS wyłączone, push i pulpit nadal dostarczane). Alerty krytyczne i o wysokim priorytecie zawsze są wypowiadane.","enabled":"włączone","implicit":"zawsze wł.","explicit":"na żądanie","by_scenario":"tylko scenariusz","fallback":"zapasowy","fallback_err":"zapasowy przy błędzie","inc_sum":"z tych kanałów","inc_always":"startuje samo","inc_req":"tylko na żądanie","inc_scen":"tylko ze scenariuszem","grp_auto":"Startują same","grp_named":"Tylko gdy wskazane w wywołaniu","grp_scen":"Tylko ze scenariuszem","grp_fallback":"Zapasowe, gdy inne zawiodą","ch_title":"Kanały","ch_count":"{on} z {tot} wł.","off_manual":"wyłączony","paused_by":"teraz wstrzymany przez","on_by":"teraz włączony przez","fixed_targets":"stałe cele","no_deliveries":"nie znaleziono encji dostarczeń","home":"w domu","away":"poza domem","devices":"urządzeń","devices_1":"urządzenie","rc_test":"Wyślij test","rc_test_confirm":"Dotknij ponownie, aby wysłać","rc_test_sent":"Test wysłany","rc_test_title":"Test SuperNotify","rc_test_msg":"Wiadomość testowa z pulpitu,","overrides":"nadpisań dostarczeń","overrides_1":"nadpisanie dostarczenia","no_contact":"brak danych kontaktowych","no_recipients":"nie znaleziono encji odbiorców","details":"Szczegóły","h_update":"dostępna aktualizacja:","h_restart":"uruchom ponownie Home Assistant, aby dokończyć aktualizację","h_uptodate":"aktualne","h_transport_err":"transportów z błędami","h_channels_off":"kanałów wył.","h_all_good":"Wszystko w porządku","h_health":"Stan","h_failures":"błędów","h_failures_1":"błąd","h_transport_err_1":"transport z błędami","h_channels_off_1":"kanał wył.","channels_1":"kanał","band_early_morning":"Wczesny ranek","band_morning":"Rano","band_afternoon":"Popołudnie","band_evening":"Wieczór","band_night":"Noc","band_late_night":"Późna noc","h_look_1":"1 rzecz do sprawdzenia","h_look_n":"Rzeczy do sprawdzenia: {n}","h_rest_ok":"reszta działa","h_ch_on":"{on} z {tot} kanałów wł.","h_open":"Otwórz","ln_delivered":"dostarczone","ln_failed":"nieudane","ln_why":"Dlaczego","tgt_loading":"ładowanie selektora…","bands_empty_t":"Brak pór dnia","bands_empty":"Dodaj jedną porę na każdą część dnia: input_datetime dla jej początku i input_number dla głośności głosu.","active_now":"aktywny teraz","disabled":"wyłączony","other":"Inne","manual":"ręczny","apply_now":"zastosuj teraz","applied":"Zastosowany","apply_off":"dotknij, aby przestać stosować","enabled_lbl":"włączony","reset_overrides":"Resetuj nadpisania","reset_done":"nadpisania zresetowane","transport_off":"transport wył.","last_notified":"ostatnio powiadomiony","never_notified":"nigdy nie powiadomiony","media":"media","no_scenarios":"nie znaleziono encji scenariuszy","sim_pick":"🎬 Scenariusze — dotknij, aby zasymulować","sim_fire":"📤 Kanały","sim_hint":"Prawdziwe dane silnika (usługi enquire). Filtrowanie dostarczeń według priorytetu odbywa się w silniku i nie jest tu symulowane. Wyłączenie wygrywa z włączeniem, jak przy scalaniu w trakcie działania.","sim_none":"żadne dostarczenie by nie ruszyło","scenario_tag":"scenariusz","sim_go":"Zostałoby wysłane","sim_stop":"Nie zostałoby wysłane","sim_r_default":"startuje samo","sim_r_on":"włączony przez","sim_r_off":"wyłączony przez","sim_r_named":"tylko gdy wskazany w wywołaniu","sim_r_scen":"tylko ze scenariuszem, który go włącza","sim_r_fallback":"zapasowy, gdy inne zawiodą","sim_r_switched":"wyłączony","title":"Tytuł","message":"Wiadomość","priority":"Priorytet","channels_lbl":"Kanały — brak wyboru = zwykłe kierowanie","camera_lbl":"Zrzut z kamery","preview":"Podgląd","no_title":"(bez tytułu)","no_message":"(bez wiadomości)","default_prio":"domyślny (średni)","comp_hint":"Wybrane kanały są wysyłane z delivery_selection: fixed (tylko one ruszają). Krytyczny naprawdę jest krytyczny — łącznie z syrenami.","critical_confirm":"Wysłać KRYTYCZNE powiadomienie? Łącznie z syrenami i maksymalną głośnością.","write_first":"Najpierw napisz wiadomość","sent_toast":"Wysłano","write_or_pick":"Napisz wiadomość albo wybierz kamerę lub kanał","need_2111":"Powiadomienie bez tekstu wymaga SuperNotify 2.11.1","send_err":"Nie wysłano","dry_btn":"Wypróbuj bez wysyłania","dry_title":"Gdybyś wysłał je teraz","dry_err":"Próba nie powiodła się","dry_would":"wysłałby","dry_skip":"pominięty","dry_nobody":"brak odbiorcy, tylko cele bezpośrednie","dry_targets":"cele","dry_suppressed":"Powiadomienie zostałoby wstrzymane","dry_fallback":"Żaden kanał by nie ruszył: zapasowy","dry_none":"Nie wybrano kanału","dry_scen":"Aktywne scenariusze","dry_raw":"Surowa odpowiedź","dry_prio":"Priorytet","dry_would_n":"kanałów by wysłało","dry_nothing":"Nic nie zostałoby wysłane","dry_dupe":"Duplikat niedawnego powiadomienia: zostałoby odrzucone","dry_no_dupe":"Wykrywanie duplikatów nie jest symulowane, więc prawdziwe Wyślij zaraz potem nie zostanie zablokowane.","dry_restart":"Obecnie działający SuperNotify nie potrafi symulować: próba wymaga 2.12, a po aktualizacji trzeba ponownie uruchomić Home Assistant.","dry_home":"W domu","dry_empty":"SuperNotify nie odpowiedział: czy to wersja 2.12 lub nowsza?","dry_reasons":{"NO_TARGET":"brak użytecznego celu","DUPE":"duplikat","PRIORITY":"nie dla tego priorytetu","SNOOZED":"drzemka","DELIVERY_CONDITION":"warunek dostarczenia niespełniony","OCCUPANCY":"reguła obecności","TRANSPORT_DISABLED":"transport wył.","DELIVERY_DISABLED":"wyłączony","NO_SCENARIO":"wymagany scenariusz nieaktywny","NO_ACTION":"brak akcji","INVALID_ACTION_DATA":"nieprawidłowe dane","UNKNOWN":"nieznany powód","ERROR":"błąd"},"prio_minimum":"Minimalny","prio_low":"Niski","prio_medium":"Średni","prio_high":"Wysoki","prio_critical":"Krytyczny","target_lbl":"Cel — osoby, urządzenia, obszary, piętra, etykiety","custom_target_lbl":"Własne cele (e-mail, ID Telegram, …) — oddzielone przecinkami","adv_title":"Opcje zaawansowane","adv_spoken":"Wiadomość mówiona (Alexa, TTS)","adv_spoken_ph":"co mówią głośniki, jeśli inaczej niż tekst","adv_apply":"Zastosuj te scenariusze","adv_require":"Wyślij tylko, gdy te scenariusze są aktywne","adv_constrain":"Uwzględnij tylko te scenariusze","adv_snapshot":"Obraz z adresu URL","adv_debug":"Debug: zapisz pełny ślad wyboru (pokazywany przez kartę Dlaczego)","custom_target_ph":"np. user@example.com, 123456789","native_target_tag":"🎯 natywny obszar/piętro/etykieta","target_warn":"⚠️ Obszary, piętra i etykiety są rozwiązywane tylko przez notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts i chime. Z każdym innym kanałem — albo przy domyślnym kierowaniu, gdy powyżej nie wybrano kanału — powiadomienie może po cichu zostać bez celu. Wybierz zgodny kanał albo dodaj osobę/urządzenie bezpośrednio.","aut_search":"Szukaj automatyzacji…","aut_all":"Wszystkie","aut_none":"Brak wyników","aut_err":"Nie znaleziono manifestu — wygeneruj go przez tools/genera_vista_automazioni.py","aut_updated":"lista zaktualizowana","aut_count":"automatyzacji","aut_count_1":"automatyzacja","never":"nigdy","ago_now":"teraz","ago_min":"min temu","ago_h":"godz. temu","ago_d":"dni temu","aut_disabled_only":"Tylko wyłączone","grp_active":"aktywne","repeat":"Powtórz","skipped_n":"pominięte","left":"zostało","missed_n":"nieodebrane","snz_all":"wszystko","snz_nc":"niekrytyczne","snz_prio":"priorytet","snz_transport":"transport","snz_for":"na","snz_choose":"wybierz co i na jak długo","snz_title":"Wstrzymaj powiadomienia","snz_what":"Co","snz_nc_l":"Niekrytyczne","snz_all_l":"Wszystko","snz_ch":"Kanał","snz_pr":"Priorytet","snz_who":"Dla kogo","snz_everyone":"Wszyscy","snz_me":"Tylko ja","snz_len":"Jak długo","snz_forever":"Aż wznowię","snz_go":"Wstrzymaj","snz_close":"Zamknij","rs_hand":"ręcznie","rs_voice":"głosem","rs_assist":"przez asystenta","snz_voice_info":"Twoje pauzy idą przez komendy głosowe SuperNotify: dotyczą tylko ciebie.","snz_voice_off":"Komendy głosowe SuperNotify są wyłączone: włącz je w opcjach integracji.","snz_resume_mine":"Wznów moje","go_open":"Pokaż","dl_probe":"Wypróbuj ten kanał","probe_msg":"Test kanału z pulpitu","sc_why":"Dlaczego","sc_yes":"Obowiązuje teraz","sc_no":"Teraz nie obowiązuje","sc_manual_why":"Scenariusz ręczny: stosowany ręcznie","sc_no_cond":"Brak warunków","sc_off_sw":"Wyłączony","sc_not_eval":"nie sprawdzono","sc_now":"teraz","sc_diff_btn_on":"Co się zmieni, jeśli obowiązuje","sc_diff_btn_off":"Co się zmieni bez niego","sc_diff_on":"Gdyby obowiązywał, dla średniego powiadomienia teraz:","sc_diff_off":"Bez niego, dla średniego powiadomienia teraz:","sc_diff_add":"wysłałby też","sc_diff_rem":"już by nie wysłał","sc_diff_none":"bez różnicy","c_state":"{e} to {s}","c_template":"warunek szablonu","c_time":"czas","c_after":"po","c_before":"przed","c_numeric":"{e}","c_above":"powyżej","c_below":"poniżej","c_and":"wszystkie z tych","c_or":"co najmniej jeden z tych","c_not":"żaden z tych","c_or_join":" lub ","sim_hint_dry":"Własna odpowiedź SuperNotify (próba, nic nie jest wysyłane): powiadomienie teraz, z priorytetem i tylko scenariuszami wybranymi powyżej.","sim_msg":"Test symulatora","sim_prio":"Priorytet","sa_snooze":"{what} wstrzymane na {len}.","sa_silence":"{what} wyciszone do odwołania.","sa_resume":"{what} znów włączone.","sa_resume_one":"Koniec pauzy: {x}.","sa_resume_all":"Powiadomienia znów włączone.","sa_w_nc":"Niekrytyczne powiadomienia","sa_w_all":"Wszystkie powiadomienia","sa_w_ch":"Kanał {x}","sa_w_pr":"Powiadomienia o priorytecie {x}","sa_w_mine":"Twoje powiadomienia","sa_for":"dla {x}","sa_min":"{n} minut","sa_hour":"jedną godzinę","sa_hours":"{n} godz.","occ_title":"Kto jest w domu","occ_home_l":"W domu","occ_ALL_HOME":"Wszyscy w domu","occ_ALL_AWAY":"Wszyscy poza domem","occ_LONE_HOME":"Tylko jedna osoba w domu","occ_MULTI_HOME":"Kilka osób w domu","occ_UNDEFINED_OCCUPANTS":"Nikt nie jest śledzony","h_repairs":"naprawy SuperNotify","h_repairs_1":"naprawa SuperNotify","det_more":"Wszystkie atrybuty","det_yes":"tak","det_no":"nie","det_action":"Akcja","det_target":"Stałe cele","det_target_req":"Wymaga celu","det_target_use":"Cele używają","det_inclusion":"Używany, gdy","det_prio":"Priorytety","det_occ":"Kto musi być w domu","det_transport":"Transport","det_data":"Dane","det_debug":"Debug","det_err_last":"Ostatni błąd","det_err_in":"W","det_err_n":"Błędy od uruchomienia","det_select":"Wybór","adv_html":"Tekst do e-maila (HTML)","adv_clip":"Klip wideo z adresu URL","adv_actions":"Przyciski w powiadomieniu","adv_act_id":"id akcji","adv_act_title":"tekst przycisku","adv_act_add":"+ przycisk","adv_groups":"Grupy przycisków (przecinek)","adv_dc":"Ustawienia kanałów dla tego powiadomienia","adv_dc_ph":"klucz: wartość, jedno na linię","adv_dc_add":"+ kanał","snz_active":"Teraz wstrzymane","snz_resume":"Wznów","snz_resume_all":"Wznów wszystko","snz_until_resumed":"do wznowienia","snz_done":"Wstrzymano","snz_resumed":"Wznowiono","no_notif":"brak powiadomień","st_title":"Użycie","st_days":"dni","st_days_short":"d","st_hist_note":"godziny, kanały i priorytety z ostatnich {n} dni historii","st_total":"Powiadomienia","st_avg":"dziennie","st_today":"Dzisiaj","st_vs_avg":"vs. średnia","st_peak_hour":"Godzina szczytu","st_top_channel":"Główny kanał","st_errors":"Błędy kanałów","st_of_sends":"wysyłek kanałów","st_daily":"Dziennie","st_hourly":"Według godziny","st_weekday":"Według dnia tygodnia","st_channels":"Kanały — najczęściej używane","st_priority":"Priorytet","st_period":"Pora dnia","st_insights":"Wnioski","st_no_data":"Brak historii — dane pojawią się po pierwszych powiadomieniach.","st_unknown":"nieznane","st_loading":"ładowanie…","st_versions":"Wersje","st_installed":"zainstalowana","st_latest":"najnowsza","st_uptodate":"aktualna","st_update":"dostępna aktualizacja","st_restart":"wymagany restart","st_cards":"karty","st_logged":"zapisane","st_reading":"czytanie archiwum: dzień {n} z {of}…","st_from_archive":"z archiwum SuperNotify","st_archive_err":"archiwum odczytane częściowo","st_wd":["Pn","Wt","Śr","Cz","Pt","So","Nd"],"st_i_share":"{p}% wszystkich wysyłek kanałów idzie przez {c}.","st_i_peak":"Najbardziej ruchliwa godzina to {h}:00 ({n} powiadomień w {d} dni).","st_i_night":"{p}% powiadomień przychodzi między 23:00 a 07:00 — rozważ scenariusz „Nie przeszkadzać”, jeśli to niepożądane.","st_i_night_ok":"Tylko {p}% powiadomień przychodzi w nocy (23–07): godziny ciszy działają.","st_i_weekend":"W weekendy jest {p}% {dir} powiadomień niż w dni robocze.","st_i_errors":"{n} błędów kanałów w {d} dni, głównie na {c}.","st_i_noerr":"Brak błędów kanałów w ostatnich {d} dniach.","st_i_prio":"{p}% powiadomień ma priorytet {prio}.","st_i_trend":"Ostatnie 7 dni: {n}/dzień, {dir} o {p}% względem 7 poprzednich.","st_more":"więcej","st_less":"mniej","st_up":"wzrost","st_down":"spadek"},"SN_STATS_STRINGS":{"st_title":"Użycie","st_days":"dni","st_days_short":"d","st_hist_note":"godziny, kanały i priorytety z ostatnich {n} dni historii","st_total":"Powiadomienia","st_avg":"dziennie","st_today":"Dzisiaj","st_vs_avg":"vs. średnia","st_peak_hour":"Godzina szczytu","st_top_channel":"Główny kanał","st_errors":"Błędy kanałów","st_of_sends":"wysyłek kanałów","st_daily":"Dziennie","st_hourly":"Według godziny","st_weekday":"Według dnia tygodnia","st_channels":"Kanały — najczęściej używane","st_priority":"Priorytet","st_period":"Pora dnia","st_insights":"Wnioski","st_no_data":"Brak historii — dane pojawią się po pierwszych powiadomieniach.","st_unknown":"nieznane","st_loading":"ładowanie…","st_versions":"Wersje","st_installed":"zainstalowana","st_latest":"najnowsza","st_uptodate":"aktualna","st_update":"dostępna aktualizacja","st_restart":"wymagany restart","st_cards":"karty","st_logged":"zapisane","st_reading":"czytanie archiwum: dzień {n} z {of}…","st_from_archive":"z archiwum SuperNotify","st_archive_err":"archiwum odczytane częściowo","st_wd":["Pn","Wt","Śr","Cz","Pt","So","Nd"],"st_i_share":"{p}% wszystkich wysyłek kanałów idzie przez {c}.","st_i_peak":"Najbardziej ruchliwa godzina to {h}:00 ({n} powiadomień w {d} dni).","st_i_night":"{p}% powiadomień przychodzi między 23:00 a 07:00 — rozważ scenariusz „Nie przeszkadzać”, jeśli to niepożądane.","st_i_night_ok":"Tylko {p}% powiadomień przychodzi w nocy (23–07): godziny ciszy działają.","st_i_weekend":"W weekendy jest {p}% {dir} powiadomień niż w dni robocze.","st_i_errors":"{n} błędów kanałów w {d} dni, głównie na {c}.","st_i_noerr":"Brak błędów kanałów w ostatnich {d} dniach.","st_i_prio":"{p}% powiadomień ma priorytet {prio}.","st_i_trend":"Ostatnie 7 dni: {n}/dzień, {dir} o {p}% względem 7 poprzednich.","st_more":"więcej","st_less":"mniej","st_up":"wzrost","st_down":"spadek"},"SN_ARCH_STRINGS":{"title":"Historia powiadomień","search":"Szukaj w tytule lub wiadomości…","f_all":"Wszystkie","f_problems":"Tylko problemy","f_today":"Dzisiaj","f_whisper":"Szeptane","wh":"szeptem","said":"Alexa powiedziała","said_by":"{ch} powiedział","none":"żadne powiadomienie nie pasuje","no_sensor":"nie znaleziono sensora","no_sensor_hint":"Zaktualizuj SuperNotify do 2.10 lub nowszej, która ma akcję supernotify.enquire_archive, albo dodaj sensor command_line indeksujący archiwum (zob. README).","loading":"czytanie archiwum…","recent":"ostatnie powiadomienia","read_at":"odczytano o","of":"z","in_archive":"w archiwum","since":"najstarsze","updated":"indeks zaktualizowany","today":"Dzisiaj","yesterday":"Wczoraj","delivered":"dostarczone","failed":"nieudane","skipped":"pominięte","missed":"nieodebrane","prio":{"critical":"Krytyczny","high":"Wysoki","low":"Niski","minimum":"Minimalny","medium":"Średni"},"reasons":{"doppione":"duplikat","nessun target":"brak celu","errore":"błąd","condizione":"warunek","scenario":"scenariusz","presenza":"obecność","priorita":"priorytet","spento":"wył.","pausa":"drzemka","transport spento":"transport wył.","nessuna azione":"brak akcji","dati non validi":"nieprawidłowe dane","sconosciuto":"nieznany"},"scenarios":"Obowiązujące scenariusze","truncated":"wiadomość skrócona w indeksie","dur":"trwało","id":"id","why":"Dlaczego? - pełne szczegóły"},"SN_WHY_STRINGS":{"title":"Dlaczego?","pick":"Wybierz powiadomienie, aby zobaczyć, dlaczego trafiło tam, gdzie trafiło.","loading":"ładowanie…","none":"brak powiadomienia","no_sensor":"nie znaleziono sensora:","no_service":"Brak usługi","no_service_hint":"Zaktualizuj SuperNotify do 2.10 lub nowszej (supernotify.enquire_archive) albo dodaj shell_command sn_archive_detail (zob. README) i uruchom ponownie Home Assistant.","gone":"tego powiadomienia nie ma już w archiwum","priority":"priorytet","outcome":"wynik","dupe":"duplikat","outcomes":{"success":"dostarczone","partial_delivery":"częściowo dostarczone","dupe":"duplikat","failed":"nieudane","error":"nieudane","fallback_delivery":"dostarczone przez kanał zapasowy","no_delivery":"niedostarczone"},"missed":"nieodebrane (żądane, nie wysłane)","step_call":"Wywołanie","step_scen":"Scenariusze","step_people":"Osoby","step_ch":"Kanały","call_auto":"nie wskazano kanału: zwykłe kierowanie","call_named":"wskazane w wywołaniu:","call_debug":"z debugiem","nobody":"nikogo nie ma w domu","ch_sent":"wysłane","ch_problems":"do sprawdzenia","ch_skipped":"pominięte","pb_failed":"nieudane","pb_missed":"żądane, ale nie wysłane","grp_skipped":"pominięte przez regułę: normalne","grp_not":"niezaangażowane","trace_title":"Pełny ślad wyboru","fix":{"NO_TARGET":"Żaden odbiorca nie ma adresu dla tego kanału: dodaj go odbiorcy, nadaj kanałowi stałe cele albo pomiń go w tym wywołaniu.","ERROR":"Integracja stojąca za tym kanałem odpowiedziała błędem: sprawdź jej wpis w logu.","NO_ACTION":"Kanał nie ma akcji do wywołania: ustaw `action:` w dostarczeniu.","INVALID_ACTION_DATA":"Dane przekazane do akcji zostały odrzucone: sprawdź `data:` wywołania lub dostarczenia."},"scenarios":"Obowiązujące scenariusze","no_scenarios":"żaden scenariusz nie obowiązuje","applied":"wymuszony przez wywołanie","required":"wymagany przez wywołanie","constrain":"ograniczony przez wywołanie do","presence":"Obecność","home":"w domu","away":"poza domem","channels":"Kanały","no_channels":"nie wybrano żadnego kanału","st_ok":"dostarczone","st_err":"nieudane","st_skip":"pominięte","st_supp":"wstrzymane","calls":"wywołań","calls_1":"wywołanie","target_required":"wymagany cel:","started_by":"wybrany przez","scen_would_off":"wyłączony przez (uchylone)","src_default":"zawsze wł. (domyślnie)","src_scen":"scenariusz","src_call":"samo wywołanie","src_recipient":"odbiorca","r_off_by":"wyłączony przez","call_targets":"cele w wywołaniu","cats":{"entity_id":"encje","mobile_app_id":"urządzenia","person_id":"osoby","email":"e-mail","phone":"telefon","device_id":"urządzenia"},"not_started":"Kanały, które nie ruszyły","r_call_off":"wykluczony przez wywołanie","r_scen_off":"wyłączony przez obowiązujący scenariusz","r_disabled":"wyłączony","r_transport_off":"jego transport jest wyłączony","r_only_scen":"startuje tylko, gdy włączy go scenariusz","r_only_fallback":"tylko zapasowy","r_only_explicit":"startuje tylko, gdy wskazany z nazwy","r_priority":"nie dla tego priorytetu","r_unknown":"nie do odtworzenia bez śladu","from_config":"Powody dla kanałów, które nie ruszyły, są odtwarzane z konfiguracji w jej OBECNYM stanie, nie takim, jaki był wtedy.","from_trace":"Powody pochodzą ze śladu wyboru zarchiwizowanego z powiadomieniem.","st_time":"trwało","st_slow":"najwolniejszy","st_rate":"kanałów się powiodło","ua_title":"Cele, których nie przyjął żaden kanał","ua_hint":"Były w wywołaniu, ale żaden wybrany kanał nie przyjmuje tego rodzaju celu.","un_title":"Nazwy, które nie istnieją","sent_by":"Wysłane przez","sent_auto":"automatyzacja","sent_script":"skrypt","sent_person":"","sent_unknown":"nadawca nieznany (brak automatyzacji lub osoby w kontekście)","trace":"Ślad wyboru","no_trace":"Pełny ślad wyboru jest zapisywany tylko, gdy wywołanie notify ma debug: true, i archiwizowany, gdy diagnostyka archiwum go uwzględnia.","reasons":{"NO_TARGET":"brak użytecznego celu","DUPE":"duplikat niedawnego powiadomienia","PRIORITY":"nie dla tego priorytetu","SNOOZE":"drzemka","SNOOZED":"drzemka","DELIVERY_CONDITION":"warunek dostarczenia niespełniony","OCCUPANCY":"reguła obecności","ERROR":"błąd","DELIVERY_DISABLED":"wyłączony","SCENARIO":"scenariusz","TRANSPORT_DISABLED":"jego transport jest wyłączony","NO_SCENARIO":"wymagany scenariusz nie obowiązuje","NO_ACTION":"brak akcji do wywołania","INVALID_ACTION_DATA":"nieprawidłowe dane akcji","UNKNOWN":"nieznany powód"}},"SN_TOOLS_STRINGS":{"maint":"Konserwacja","enq":"Zapytaj SuperNotify","refresh":"Opublikuj ponownie każdą encję","refresh_btn":"Odśwież","resume_btn":"Wznów","refreshed":"Encje opublikowane ponownie.","resume_all":"Wznów każdą pauzę","cleared_n":"pauz wznowionych","purge_arch":"Wyczyść archiwum","purge_media":"Wyczyść obrazy","older":"starsze niż","days":"dni","purge_btn":"Wyczyść","confirm":"Dotknij ponownie, aby potwierdzić","purged":"usunięte","remaining":"zostało","reset":"Cofnij zmiany wprowadzone ręcznie","reset_btn":"Resetuj","reset_none":"Nic do zresetowania: wszystko jest zgodne z konfiguracją.","reset_done":"Przywrócono konfigurację:","k_all":"wszystko","k_scenario":"scenariusze","k_delivery":"kanały","k_recipient":"osoby","k_transport":"transporty","q_config":"Konfiguracja","q_scen":"Scenariusze","q_active":"Aktywne scenariusze","q_by_scen":"Kanały według scenariusza","q_implicit":"Kanały domyślne","q_recipients":"Odbiorcy","q_occupancy":"Kto jest w domu","q_snoozes":"Pauzy","q_last":"Ostatnie powiadomienie","copy":"Kopiuj JSON","copied":"Skopiowano","close":"Zamknij","empty":"(puste)","err":"SuperNotify odpowiedział błędem:","err_config":"SuperNotify 2.12.0 nie potrafi zwrócić swojej konfiguracji, gdy kanał ma warunki szablonu (rhizomatics/supernotify#241).","settings":"Ustawienia integracji","running":"w toku…","more":"więcej"},"SN_FORM_LABELS":{"_common":"Wygląd i tekst","style":"Kolory","icons":"Ikony","show_version":"Pokaż wersję karty","intro":"Tekst wprowadzający na górze","title":"Tytuł","dnd_entity":"Przełącznik Nie przeszkadzać","quiet_entity":"Obliczony stan ciszy (opcjonalnie)","presence_entity":"Osoba na pasku stanu","archive_days":"Czyszczenie archiwum: starsze niż (dni)","media_days":"Czyszczenie obrazów: starsze niż (dni)","occupancy":"Kto jest w domu (z SuperNotify)","repairs":"Naprawy SuperNotify na liście stanu","snooze_announce":"Ogłaszaj pauzy na głos (kanał ogłoszeń)","snooze_via":"Pauzy idą przez","o_event":"zdarzenie przycisków push (admin)","o_voice":"komendy głosowe","snooze_minutes":"Długość drzemki (minuty)","snooze_panel":"Kafelek drzemki otwiera panel pauzy","announce_delivery":"Kanał do ogłoszeń","last_notification":"Pokaż ostatnie powiadomienie","last_channels":"Jeden chip na kanał w ostatnim powiadomieniu","repeat_entity":"Przycisk powtórzenia ostatniego (opcjonalnie)","tile_layout":"Kafelki","tile_columns":"Kolumny kafelków (puste = automatycznie)","update_entity":"Encja aktualizacji SuperNotify","cards_update_entity":"Encja aktualizacji kart","sent_today_entity":"Licznik dzienny (utility meter, opcjonalnie)","count_entity":"Licznik SuperNotify (statystyki długoterminowe)","health":"Stan na górze","stats":"Liczby","poll_seconds":"Odświeżaj co (sekundy)","group":"Grupuj według sposobu startu kanału","hide_defaults":"Ukryj automatyczne kanały DEFAULT_","limit":"Powiadomienia na liście","expand":"Rozwiń zwinięte części","max_height":"Maksymalna wysokość (CSS, np. 70vh)","source":"Źródło archiwum","entity":"Sensor archiwum (tylko most)","trigger_entity":"Odśwież, gdy to się zmieni","dry_run":"Pokaż „Wypróbuj bez wysyłania”","dry_run_dupe_check":"Symuluj też wykrywanie duplikatów","days":"Domyślnie pokazywane dni","manifest_url":"URL manifestu automatyzacji","o_supernotify":"SuperNotify","o_theme":"Motyw Home Assistant","o_mdi":"Ikony Home Assistant","o_emoji":"Emoji","o_row":"Ikona po lewej","o_stacked":"Wysokie, ikona na górze","o_three":"Wysłane, błędy, kanały","o_full":"Wszystkie pięć","o_auto":"Automatycznie","o_sensor":"Most sensora (przed SuperNotify 2.10)","o_archive":"Archiwum SuperNotify (2.12.1+)","o_history":"Historia pomocników"},"SN_NATIVE_STR":{"all_good":"Wszystko w porządku","paused":"Wstrzymane","until":"do","resume":"Wznów","test":"Wyślij test","sure":"Dotknij ponownie, aby wysłać","sent":"Wysłane","last":"Ostatnie","none":"Brak powiadomień","ago":"temu","min":"min","h":"godz.","err":"transportów z błędami","off":"kanałów wył."},"SN_STRATEGY_TITLES":{"home":"Główna","send":"Wyślij","setup":"Ustawienia","stats":"Statystyki","tools":"Narzędzia","title":"SuperNotify"}},"pt":{"SN_STRINGS":{"presence":"Presença","time_band":"Faixa horária","quiet":"Silêncio","act_scen":"Cenários ativos","on":"ligado","off":"desligado","active":"ativo","dnd":"Não incomodar","tap_silence":"toque para silenciar","snooze":"Pausa","min":"min","pause_nc":"pausar não críticas","snoozed":"Em pausa","until":"até","tap_clear":"toque para limpar","announce":"Anunciar","intercom":"intercomunicador","announce_ph":"Anunciar em todos os altifalantes…","send":"Enviar","announced":"Anunciado","cleared":"Pausas removidas","snoozed_for":"Notificações não críticas em pausa durante","sent":"Enviadas","sent_today":"Enviadas hoje","since_startup":"desde o arranque","yesterday":"ontem","failures":"Falhas","fail_today":"envios por canal falhados hoje","deliveries":"Entregas","enabled_total":"ativas/total","last_notif":"Última notificação","transports":"Transportes","delivered":"entregue","failed":"falhou","channels":"canais","none":"nenhum","no_transports":"nenhuma entidade de transporte encontrada","tr_used":"usado por","tr_unused":"nenhum canal o usa","start":"início","volume":"volume","now":"agora","crosses":"passa a meia-noite","no_voice":"sem voz","mute_hint":"Uma faixa a <b>0%</b> não envia <b>nenhum anúncio por voz</b> (Alexa e TTS desligados, push e painel continuam a ser entregues). Os alertas críticos e de prioridade alta falam sempre.","enabled":"ativado","implicit":"sempre ligado","explicit":"a pedido","by_scenario":"só por cenário","fallback":"reserva","fallback_err":"reserva em caso de erro","inc_sum":"destes canais","inc_always":"arrancam sozinhos","inc_req":"só quando pedidos","inc_scen":"só com um cenário","grp_auto":"Arrancam sozinhos","grp_named":"Só quando indicados na chamada","grp_scen":"Só com um cenário","grp_fallback":"Reserva, quando os outros falham","ch_title":"Canais","ch_count":"{on} de {tot} ligados","off_manual":"desligado","paused_by":"em pausa agora por","on_by":"ligado agora através de","fixed_targets":"destinos fixos","no_deliveries":"nenhuma entidade de entrega encontrada","home":"em casa","away":"fora","devices":"dispositivos","devices_1":"dispositivo","rc_test":"Enviar um teste","rc_test_confirm":"Toque de novo para enviar","rc_test_sent":"Teste enviado","rc_test_title":"Teste SuperNotify","rc_test_msg":"Mensagem de teste do painel,","overrides":"substituições de entrega","overrides_1":"substituição de entrega","no_contact":"sem contactos","no_recipients":"nenhuma entidade de destinatário encontrada","details":"Detalhes","h_update":"atualização disponível:","h_restart":"reinicie o Home Assistant para concluir a atualização","h_uptodate":"atualizado","h_transport_err":"transportes com erros","h_channels_off":"canais desligados","h_all_good":"Tudo bem","h_health":"Estado","h_failures":"falhas","h_failures_1":"falha","h_transport_err_1":"transporte com erros","h_channels_off_1":"canal desligado","channels_1":"canal","band_early_morning":"Madrugada","band_morning":"Manhã","band_afternoon":"Tarde","band_evening":"Fim de tarde","band_night":"Noite","band_late_night":"Noite avançada","h_look_1":"1 coisa a verificar","h_look_n":"{n} coisas a verificar","h_rest_ok":"todo o resto funciona","h_ch_on":"{on} de {tot} canais ligados","h_open":"Abrir","ln_delivered":"entregue","ln_failed":"falhou","ln_why":"Porquê","tgt_loading":"a carregar o seletor…","bands_empty_t":"Ainda sem faixas horárias","bands_empty":"Adicione uma faixa por cada parte do dia: um input_datetime para o início e um input_number para o volume da voz.","active_now":"ativo agora","disabled":"desativado","other":"Outros","manual":"manual","apply_now":"aplicar agora","applied":"Aplicado","apply_off":"toque para deixar de aplicar","enabled_lbl":"ativado","reset_overrides":"Repor substituições","reset_done":"substituições repostas","transport_off":"transporte desligado","last_notified":"última notificação","never_notified":"nunca notificado","media":"multimédia","no_scenarios":"nenhuma entidade de cenário encontrada","sim_pick":"🎬 Cenários — toque para simular","sim_fire":"📤 Canais","sim_hint":"Dados reais do motor (serviços enquire). A filtragem de entregas por prioridade acontece no motor e não é simulada aqui. Desativado prevalece sobre ativado, como na combinação em execução.","sim_none":"nenhuma entrega seria acionada","scenario_tag":"cenário","sim_go":"Seria enviado","sim_stop":"Não seria enviado","sim_r_default":"arranca sozinho","sim_r_on":"ligado por","sim_r_off":"desligado por","sim_r_named":"só quando indicado na chamada","sim_r_scen":"só com um cenário que o ligue","sim_r_fallback":"reserva, quando os outros falham","sim_r_switched":"desligado","title":"Título","message":"Mensagem","priority":"Prioridade","channels_lbl":"Canais — nenhum escolhido = encaminhamento normal","camera_lbl":"Captura da câmara","preview":"Pré-visualização","no_title":"(sem título)","no_message":"(sem mensagem)","default_prio":"predefinida (média)","comp_hint":"Os canais escolhidos são enviados com delivery_selection: fixed (só esses são acionados). Crítica é mesmo crítica — sirenes incluídas.","critical_confirm":"Enviar uma notificação CRÍTICA? Sirenes e volume máximo incluídos.","write_first":"Escreva primeiro uma mensagem","sent_toast":"Enviado","write_or_pick":"Escreva uma mensagem, ou escolha uma câmara ou um canal","need_2111":"Uma notificação sem texto requer o SuperNotify 2.11.1","send_err":"Não enviado","dry_btn":"Experimentar sem enviar","dry_title":"Se o enviasse agora","dry_err":"A simulação falhou","dry_would":"enviaria","dry_skip":"ignorado","dry_nobody":"nenhum destinatário, só destinos diretos","dry_targets":"destinos","dry_suppressed":"A notificação seria suprimida","dry_fallback":"Nenhum canal seria acionado: reserva para","dry_none":"Nenhum canal selecionado","dry_scen":"Cenários ativos","dry_raw":"Resposta em bruto","dry_prio":"Prioridade","dry_would_n":"canais enviariam","dry_nothing":"Nada seria enviado","dry_dupe":"Duplicado de uma notificação recente: seria descartada","dry_no_dupe":"Verificação de duplicados não simulada, por isso o Enviar real logo a seguir não é bloqueado.","dry_restart":"O SuperNotify em execução não consegue simular: a simulação requer a 2.12 e o Home Assistant tem de ser reiniciado após a atualização.","dry_home":"Casa","dry_empty":"O SuperNotify não deu resposta: é a 2.12 ou posterior?","dry_reasons":{"NO_TARGET":"sem destino utilizável","DUPE":"duplicado","PRIORITY":"não para esta prioridade","SNOOZED":"em pausa","DELIVERY_CONDITION":"condição da entrega falsa","OCCUPANCY":"regra de presença","TRANSPORT_DISABLED":"transporte desligado","DELIVERY_DISABLED":"desligado","NO_SCENARIO":"cenário exigido não está em vigor","NO_ACTION":"sem ação","INVALID_ACTION_DATA":"dados inválidos","UNKNOWN":"motivo desconhecido","ERROR":"erro"},"prio_minimum":"Mínima","prio_low":"Baixa","prio_medium":"Média","prio_high":"Alta","prio_critical":"Crítica","target_lbl":"Destino — pessoas, dispositivos, áreas, pisos, etiquetas","custom_target_lbl":"Destinos personalizados (e-mail, IDs do Telegram, …) — separados por vírgulas","adv_title":"Opções avançadas","adv_spoken":"Mensagem falada (Alexa, TTS)","adv_spoken_ph":"o que os altifalantes dizem, se for diferente do texto","adv_apply":"Aplicar estes cenários","adv_require":"Enviar só se estes cenários estiverem ativos","adv_constrain":"Considerar só estes cenários","adv_snapshot":"Imagem a partir de um URL","adv_debug":"Depuração: registar o rastreio completo da seleção (mostrado pelo cartão Porquê)","custom_target_ph":"ex. user@example.com, 123456789","native_target_tag":"🎯 área/piso/etiqueta nativos","target_warn":"⚠️ Áreas, pisos e etiquetas só são resolvidos por notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts e chime. Com qualquer outro canal — ou com o encaminhamento predefinido quando nenhum canal é escolhido acima — a notificação pode ficar silenciosamente sem destino. Escolha um canal compatível, ou adicione diretamente uma pessoa/dispositivo.","aut_search":"Pesquisar automações…","aut_all":"Todas","aut_none":"Sem resultados","aut_err":"Manifesto não encontrado — gere-o com tools/genera_vista_automazioni.py","aut_updated":"lista atualizada","aut_count":"automações","aut_count_1":"automação","never":"nunca","ago_now":"agora","ago_min":"min atrás","ago_h":"h atrás","ago_d":"d atrás","aut_disabled_only":"Só desativadas","grp_active":"ativos","repeat":"Repetir","skipped_n":"ignorados","left":"restantes","missed_n":"perdidos","snz_all":"tudo","snz_nc":"não críticas","snz_prio":"prioridade","snz_transport":"transporte","snz_for":"durante","snz_choose":"escolha o quê e por quanto tempo","snz_title":"Pausar notificações","snz_what":"O quê","snz_nc_l":"Não críticas","snz_all_l":"Tudo","snz_ch":"Um canal","snz_pr":"Uma prioridade","snz_who":"Para quem","snz_everyone":"Todos","snz_me":"Só eu","snz_len":"Quanto tempo","snz_forever":"Até eu retomar","snz_go":"Pausar","snz_close":"Fechar","rs_hand":"à mão","rs_voice":"por voz","rs_assist":"pelo assistente","snz_voice_info":"As suas pausas passam pelos comandos de voz do SuperNotify: são só suas.","snz_voice_off":"Os comandos de voz do SuperNotify estão desligados: ative-os nas opções da integração.","snz_resume_mine":"Retomar as minhas","go_open":"Mostrar","dl_probe":"Experimentar este canal","probe_msg":"Teste de canal a partir do painel","sc_why":"Porquê","sc_yes":"Aplica-se agora","sc_no":"Não se aplica agora","sc_manual_why":"Cenário manual: aplicado à mão","sc_no_cond":"Sem condições","sc_off_sw":"Desligado","sc_not_eval":"não verificado","sc_now":"agora","sc_diff_btn_on":"O que muda se se aplicar","sc_diff_btn_off":"O que muda sem ele","sc_diff_on":"Se se aplicasse, para uma notificação média agora:","sc_diff_off":"Sem ele, para uma notificação média agora:","sc_diff_add":"também enviaria","sc_diff_rem":"deixaria de enviar","sc_diff_none":"sem diferença","c_state":"{e} está {s}","c_template":"condição de modelo","c_time":"hora","c_after":"depois de","c_before":"antes de","c_numeric":"{e}","c_above":"acima de","c_below":"abaixo de","c_and":"todas estas","c_or":"pelo menos uma destas","c_not":"nenhuma destas","c_or_join":" ou ","sim_hint_dry":"A resposta do próprio SuperNotify (simulação, nada é enviado): uma notificação agora, com a prioridade e só os cenários escolhidos acima.","sim_msg":"Teste do simulador","sim_prio":"Prioridade","sa_snooze":"{what} em pausa durante {len}.","sa_silence":"{what} silenciadas até nova ordem.","sa_resume":"{what} reativadas.","sa_resume_one":"Pausa terminada: {x}.","sa_resume_all":"Notificações reativadas.","sa_w_nc":"Notificações não críticas","sa_w_all":"Todas as notificações","sa_w_ch":"Canal {x}","sa_w_pr":"Notificações de prioridade {x}","sa_w_mine":"As suas notificações","sa_for":"para {x}","sa_min":"{n} minutos","sa_hour":"uma hora","sa_hours":"{n} horas","occ_title":"Quem está em casa","occ_home_l":"Em casa","occ_ALL_HOME":"Todos em casa","occ_ALL_AWAY":"Todos fora","occ_LONE_HOME":"Só um em casa","occ_MULTI_HOME":"Alguns em casa","occ_UNDEFINED_OCCUPANTS":"Ninguém monitorizado","h_repairs":"reparações do SuperNotify","h_repairs_1":"reparação do SuperNotify","det_more":"Todos os atributos","det_yes":"sim","det_no":"não","det_action":"Ação","det_target":"Destinos fixos","det_target_req":"Requer um destino","det_target_use":"Os destinos usam","det_inclusion":"Usado quando","det_prio":"Prioridades","det_occ":"Quem tem de estar em casa","det_transport":"Transporte","det_data":"Dados","det_debug":"Depuração","det_err_last":"Último erro","det_err_in":"Em","det_err_n":"Erros desde o arranque","det_select":"Seleção","adv_html":"Texto para e-mail (HTML)","adv_clip":"Clipe de vídeo a partir de um URL","adv_actions":"Botões na notificação","adv_act_id":"id da ação","adv_act_title":"texto do botão","adv_act_add":"+ botão","adv_groups":"Grupos de botões (vírgula)","adv_dc":"Definições do canal para esta notificação","adv_dc_ph":"chave: valor, um por linha","adv_dc_add":"+ canal","snz_active":"Em pausa agora","snz_resume":"Retomar","snz_resume_all":"Retomar tudo","snz_until_resumed":"até retomar","snz_done":"Em pausa","snz_resumed":"Retomado","no_notif":"ainda sem notificações","st_title":"Utilização","st_days":"dias","st_days_short":"d","st_hist_note":"horas, canais e prioridades nos últimos {n} dias de histórico","st_total":"Notificações","st_avg":"por dia","st_today":"Hoje","st_vs_avg":"vs. média","st_peak_hour":"Hora de pico","st_top_channel":"Canal mais usado","st_errors":"Erros de canal","st_of_sends":"dos envios por canal","st_daily":"Por dia","st_hourly":"Por hora do dia","st_weekday":"Por dia da semana","st_channels":"Canais — mais usados","st_priority":"Prioridade","st_period":"Período do dia","st_insights":"Observações","st_no_data":"Ainda sem histórico — os dados aparecem após as primeiras notificações.","st_unknown":"desconhecido","st_loading":"a carregar…","st_versions":"Versões","st_installed":"instalada","st_latest":"mais recente","st_uptodate":"atualizado","st_update":"atualização disponível","st_restart":"reinício necessário","st_cards":"cartões","st_logged":"registadas","st_reading":"a ler o arquivo: dia {n} de {of}…","st_from_archive":"do arquivo do SuperNotify","st_archive_err":"arquivo lido em parte","st_wd":["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],"st_i_share":"{p}% de todos os envios por canal passam por {c}.","st_i_peak":"A hora mais movimentada é às {h}:00 ({n} notificações em {d} dias).","st_i_night":"{p}% das notificações chegam entre as 23:00 e as 07:00 — considere um cenário Não incomodar se não as quiser.","st_i_night_ok":"Apenas {p}% das notificações chegam à noite (23–07): as horas de silêncio estão a funcionar.","st_i_weekend":"Os dias de fim de semana têm {p}% {dir} notificações do que os dias úteis.","st_i_errors":"{n} erros de canal em {d} dias, sobretudo em {c}.","st_i_noerr":"Nenhum erro de canal nos últimos {d} dias.","st_i_prio":"{p}% das notificações têm prioridade {prio}.","st_i_trend":"Últimos 7 dias: {n}/dia, {dir} {p}% face aos 7 anteriores.","st_more":"mais","st_less":"menos","st_up":"subida de","st_down":"descida de"},"SN_STATS_STRINGS":{"st_title":"Utilização","st_days":"dias","st_days_short":"d","st_hist_note":"horas, canais e prioridades nos últimos {n} dias de histórico","st_total":"Notificações","st_avg":"por dia","st_today":"Hoje","st_vs_avg":"vs. média","st_peak_hour":"Hora de pico","st_top_channel":"Canal mais usado","st_errors":"Erros de canal","st_of_sends":"dos envios por canal","st_daily":"Por dia","st_hourly":"Por hora do dia","st_weekday":"Por dia da semana","st_channels":"Canais — mais usados","st_priority":"Prioridade","st_period":"Período do dia","st_insights":"Observações","st_no_data":"Ainda sem histórico — os dados aparecem após as primeiras notificações.","st_unknown":"desconhecido","st_loading":"a carregar…","st_versions":"Versões","st_installed":"instalada","st_latest":"mais recente","st_uptodate":"atualizado","st_update":"atualização disponível","st_restart":"reinício necessário","st_cards":"cartões","st_logged":"registadas","st_reading":"a ler o arquivo: dia {n} de {of}…","st_from_archive":"do arquivo do SuperNotify","st_archive_err":"arquivo lido em parte","st_wd":["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],"st_i_share":"{p}% de todos os envios por canal passam por {c}.","st_i_peak":"A hora mais movimentada é às {h}:00 ({n} notificações em {d} dias).","st_i_night":"{p}% das notificações chegam entre as 23:00 e as 07:00 — considere um cenário Não incomodar se não as quiser.","st_i_night_ok":"Apenas {p}% das notificações chegam à noite (23–07): as horas de silêncio estão a funcionar.","st_i_weekend":"Os dias de fim de semana têm {p}% {dir} notificações do que os dias úteis.","st_i_errors":"{n} erros de canal em {d} dias, sobretudo em {c}.","st_i_noerr":"Nenhum erro de canal nos últimos {d} dias.","st_i_prio":"{p}% das notificações têm prioridade {prio}.","st_i_trend":"Últimos 7 dias: {n}/dia, {dir} {p}% face aos 7 anteriores.","st_more":"mais","st_less":"menos","st_up":"subida de","st_down":"descida de"},"SN_ARCH_STRINGS":{"title":"Histórico de notificações","search":"Pesquisar título ou mensagem…","f_all":"Todas","f_problems":"Só problemas","f_today":"Hoje","f_whisper":"Sussurradas","wh":"sussurrada","said":"A Alexa disse","said_by":"{ch} disse","none":"nenhuma notificação corresponde","no_sensor":"sensor não encontrado","no_sensor_hint":"Atualize o SuperNotify para a 2.10 ou posterior, que tem a ação supernotify.enquire_archive, ou adicione o sensor command_line que indexa o arquivo (ver README).","loading":"a ler o arquivo…","recent":"últimas notificações","read_at":"lido às","of":"de","in_archive":"no arquivo","since":"mais antiga","updated":"índice atualizado","today":"Hoje","yesterday":"Ontem","delivered":"entregue","failed":"falhou","skipped":"ignorado","missed":"perdido","prio":{"critical":"Crítica","high":"Alta","low":"Baixa","minimum":"Mínima","medium":"Média"},"reasons":{"doppione":"duplicado","nessun target":"sem destino","errore":"erro","condizione":"condição","scenario":"cenário","presenza":"presença","priorita":"prioridade","spento":"desligado","pausa":"em pausa","transport spento":"transporte desligado","nessuna azione":"sem ação","dati non validi":"dados inválidos","sconosciuto":"desconhecido"},"scenarios":"Cenários em vigor","truncated":"mensagem truncada no índice","dur":"demorou","id":"id","why":"Porquê? - detalhe completo"},"SN_WHY_STRINGS":{"title":"Porquê?","pick":"Escolha uma notificação para ver porque foi para onde foi.","loading":"a carregar…","none":"nenhuma notificação","no_sensor":"sensor não encontrado:","no_service":"Serviço em falta","no_service_hint":"Atualize o SuperNotify para a 2.10 ou posterior (supernotify.enquire_archive), ou adicione o shell_command sn_archive_detail (ver README) e reinicie o Home Assistant.","gone":"esta notificação já não está no arquivo","priority":"prioridade","outcome":"resultado","dupe":"duplicado","outcomes":{"success":"entregue","partial_delivery":"entregue em parte","dupe":"duplicado","failed":"falhou","error":"falhou","fallback_delivery":"entregue pelo canal de reserva","no_delivery":"não entregue"},"missed":"perdido (pedido, não enviado)","step_call":"Chamada","step_scen":"Cenários","step_people":"Pessoas","step_ch":"Canais","call_auto":"nenhum canal indicado: encaminhamento normal","call_named":"indicados na chamada:","call_debug":"com depuração","nobody":"ninguém em casa","ch_sent":"enviados","ch_problems":"a verificar","ch_skipped":"ignorados","pb_failed":"falhou","pb_missed":"pedido mas não enviado","grp_skipped":"ignorados por uma regra: normal","grp_not":"não envolvidos","trace_title":"Rastreio completo da seleção","fix":{"NO_TARGET":"Nenhum destinatário tem um endereço para este canal: adicione um a um destinatário, dê ao canal destinos fixos ou deixe-o fora desta chamada.","ERROR":"A integração por trás deste canal respondeu com um erro: verifique a respetiva entrada no registo.","NO_ACTION":"O canal não tem nenhuma ação a chamar: defina `action:` na entrega.","INVALID_ACTION_DATA":"Os dados passados à ação foram rejeitados: verifique o `data:` da chamada ou da entrega."},"scenarios":"Cenários em vigor","no_scenarios":"nenhum cenário em vigor","applied":"forçado pela chamada","required":"exigido pela chamada","constrain":"limitado pela chamada a","presence":"Presença","home":"em casa","away":"fora","channels":"Canais","no_channels":"nenhum canal foi selecionado","st_ok":"entregue","st_err":"falhou","st_skip":"ignorado","st_supp":"suprimido","calls":"chamadas","calls_1":"chamada","target_required":"destino exigido:","started_by":"selecionado por","scen_would_off":"desligado por (anulado)","src_default":"sempre ligado (predefinição)","src_scen":"cenário","src_call":"a própria chamada","src_recipient":"destinatário","r_off_by":"desligado por","call_targets":"destinos na chamada","cats":{"entity_id":"entidades","mobile_app_id":"dispositivos","person_id":"pessoas","email":"e-mail","phone":"telefone","device_id":"dispositivos"},"not_started":"Canais que não arrancaram","r_call_off":"excluído pela chamada","r_scen_off":"desligado por um cenário em vigor","r_disabled":"desligado","r_transport_off":"o seu transporte está desligado","r_only_scen":"só arranca quando um cenário o liga","r_only_fallback":"apenas reserva","r_only_explicit":"só arranca quando pedido pelo nome","r_priority":"não para esta prioridade","r_unknown":"não reconstituível sem o rastreio","from_config":"Os motivos dos canais que não arrancaram são reconstituídos a partir da configuração ATUAL, não da que existia na altura.","from_trace":"Os motivos vêm do rastreio da seleção arquivado com a notificação.","st_time":"demorou","st_slow":"mais lento","st_rate":"dos canais tiveram êxito","ua_title":"Destinos que nenhum canal aceitou","ua_hint":"Estavam na chamada, mas nenhum canal selecionado aceita este tipo de destino.","un_title":"Nomes que não existem","sent_by":"Enviado por","sent_auto":"automação","sent_script":"script","sent_person":"","sent_unknown":"remetente desconhecido (nenhuma automação ou pessoa no seu contexto)","trace":"Rastreio da seleção","no_trace":"O rastreio completo da seleção só é registado quando a chamada notify tem debug: true, e arquivado quando os diagnósticos do arquivo o incluem.","reasons":{"NO_TARGET":"sem destino utilizável","DUPE":"duplicado de uma notificação recente","PRIORITY":"não para esta prioridade","SNOOZE":"em pausa","SNOOZED":"em pausa","DELIVERY_CONDITION":"condição da entrega falsa","OCCUPANCY":"regra de presença","ERROR":"erro","DELIVERY_DISABLED":"desligado","SCENARIO":"cenário","TRANSPORT_DISABLED":"o seu transporte está desligado","NO_SCENARIO":"um cenário exigido não está em vigor","NO_ACTION":"nenhuma ação a chamar","INVALID_ACTION_DATA":"dados da ação inválidos","UNKNOWN":"motivo desconhecido"}},"SN_TOOLS_STRINGS":{"maint":"Manutenção","enq":"Perguntar ao SuperNotify","refresh":"Publicar de novo todas as entidades","refresh_btn":"Atualizar","resume_btn":"Retomar","refreshed":"Entidades publicadas de novo.","resume_all":"Retomar todas as pausas","cleared_n":"pausas retomadas","purge_arch":"Limpar o arquivo","purge_media":"Limpar as imagens","older":"com mais de","days":"dias","purge_btn":"Limpar","confirm":"Toque de novo para confirmar","purged":"eliminados","remaining":"restantes","reset":"Desfazer as alterações feitas à mão","reset_btn":"Repor","reset_none":"Nada a repor: está tudo como configurado.","reset_done":"De volta à configuração:","k_all":"tudo","k_scenario":"cenários","k_delivery":"canais","k_recipient":"pessoas","k_transport":"transportes","q_config":"Configuração","q_scen":"Cenários","q_active":"Cenários ativos","q_by_scen":"Canais por cenário","q_implicit":"Canais predefinidos","q_recipients":"Destinatários","q_occupancy":"Quem está em casa","q_snoozes":"Pausas","q_last":"Última notificação","copy":"Copiar JSON","copied":"Copiado","close":"Fechar","empty":"(vazio)","err":"O SuperNotify respondeu com um erro:","err_config":"O SuperNotify 2.12.0 não consegue devolver a sua configuração quando um canal tem condições de modelo (rhizomatics/supernotify#241).","settings":"Definições da integração","running":"a processar…","more":"mais"},"SN_FORM_LABELS":{"_common":"Aspeto e texto","style":"Cores","icons":"Ícones","show_version":"Mostrar a versão do cartão","intro":"Texto de introdução no topo","title":"Título","dnd_entity":"Interruptor Não incomodar","quiet_entity":"Estado de silêncio calculado (opcional)","presence_entity":"Pessoa para a barra de estado","archive_days":"Limpeza do arquivo: com mais de (dias)","media_days":"Limpeza das imagens: com mais de (dias)","occupancy":"Quem está em casa (do SuperNotify)","repairs":"Reparações do SuperNotify na lista de estado","snooze_announce":"Dizer as pausas em voz alta (canal de anúncios)","snooze_via":"As pausas passam por","o_event":"o evento dos botões push (admin)","o_voice":"os comandos de voz","snooze_minutes":"Duração da pausa (minutos)","snooze_panel":"O mosaico Pausa abre o painel de pausa","announce_delivery":"Canal para anúncios","last_notification":"Mostrar a última notificação","last_channels":"Um chip por canal na última notificação","repeat_entity":"Botão repetir a última (opcional)","tile_layout":"Mosaicos","tile_columns":"Colunas de mosaicos (vazio = automático)","update_entity":"Entidade de atualização do SuperNotify","cards_update_entity":"Entidade de atualização dos cartões","sent_today_entity":"Contador diário (utility meter, opcional)","count_entity":"Contador do SuperNotify (estatísticas a longo prazo)","health":"Estado no topo","stats":"Números","poll_seconds":"Atualizar a cada (segundos)","group":"Agrupar pela forma como um canal arranca","hide_defaults":"Ocultar canais automáticos DEFAULT_","limit":"Notificações na lista","expand":"Abrir as partes recolhidas","max_height":"Altura máxima (CSS, ex. 70vh)","source":"Origem do arquivo","entity":"Sensor do arquivo (só ponte)","trigger_entity":"Atualizar quando isto mudar","dry_run":"Mostrar \"Experimentar sem enviar\"","dry_run_dupe_check":"Simular também a verificação de duplicados","days":"Dias mostrados por predefinição","manifest_url":"URL do manifesto das automações","o_supernotify":"SuperNotify","o_theme":"Tema do Home Assistant","o_mdi":"Ícones do Home Assistant","o_emoji":"Emoji","o_row":"Ícone à esquerda","o_stacked":"Alto, ícone em cima","o_three":"Enviadas, falhas, canais","o_full":"Todos os cinco","o_auto":"Automático","o_sensor":"Ponte por sensor (antes do SuperNotify 2.10)","o_archive":"Arquivo do SuperNotify (2.12.1+)","o_history":"Histórico dos auxiliares"},"SN_NATIVE_STR":{"all_good":"Tudo bem","paused":"Em pausa","until":"até","resume":"Retomar","test":"Enviar um teste","sure":"Toque de novo para enviar","sent":"Enviado","last":"Última","none":"Ainda sem notificações","ago":"atrás","min":"min","h":"h","err":"transportes com erros","off":"canais desligados"},"SN_STRATEGY_TITLES":{"home":"Início","send":"Enviar","setup":"Configuração","stats":"Estatísticas","tools":"Ferramentas","title":"SuperNotify"}},"ja":{"SN_STRINGS":{"presence":"在宅状況","time_band":"時間帯","quiet":"静音","act_scen":"有効なシナリオ","on":"オン","off":"オフ","active":"有効","dnd":"おやすみモード","tap_silence":"タップで消音","snooze":"一時停止","min":"分","pause_nc":"重要でない通知を停止","snoozed":"一時停止中","until":"まで","tap_clear":"タップで解除","announce":"アナウンス","intercom":"インターホン","announce_ph":"すべてのスピーカーでアナウンス…","send":"送信","announced":"アナウンスしました","cleared":"一時停止を解除しました","snoozed_for":"重要でない通知を一時停止しました:","sent":"送信済み","sent_today":"今日の送信","since_startup":"起動以降","yesterday":"昨日","failures":"失敗","fail_today":"今日失敗したチャンネル送信","deliveries":"配信","enabled_total":"有効/合計","last_notif":"最後の通知","transports":"トランスポート","delivered":"配信済み","failed":"失敗","channels":"チャンネル","none":"なし","no_transports":"トランスポートのエンティティが見つかりません","tr_used":"使用中:","tr_unused":"使用しているチャンネルなし","start":"開始","volume":"音量","now":"現在","crosses":"日付をまたぐ","no_voice":"音声なし","mute_hint":"<b>0%</b> の時間帯は<b>音声アナウンスを一切行いません</b>（Alexa と TTS はオフ、プッシュとダッシュボードには届きます）。緊急・高優先度の通知は常に読み上げます。","enabled":"有効","implicit":"常にオン","explicit":"指定時のみ","by_scenario":"シナリオのみ","fallback":"予備","fallback_err":"エラー時の予備","inc_sum":"このチャンネルのうち","inc_always":"自動で開始","inc_req":"指定されたときのみ","inc_scen":"シナリオがあるときのみ","grp_auto":"自動で開始","grp_named":"呼び出しで指定されたときのみ","grp_scen":"シナリオがあるときのみ","grp_fallback":"予備（他が失敗したとき）","ch_title":"チャンネル","ch_count":"{tot} 件中 {on} 件オン","off_manual":"オフにされています","paused_by":"現在停止中:","on_by":"現在オン:","fixed_targets":"固定ターゲット","no_deliveries":"配信のエンティティが見つかりません","home":"在宅","away":"外出","devices":"台のデバイス","devices_1":"台のデバイス","rc_test":"テスト送信","rc_test_confirm":"もう一度タップで送信","rc_test_sent":"テストを送信しました","rc_test_title":"SuperNotify テスト","rc_test_msg":"ダッシュボードからのテストメッセージ、","overrides":"件の配信オーバーライド","overrides_1":"件の配信オーバーライド","no_contact":"連絡先なし","no_recipients":"受信者のエンティティが見つかりません","details":"詳細","h_update":"アップデートあり:","h_restart":"アップデートを完了するには Home Assistant を再起動してください","h_uptodate":"最新です","h_transport_err":"件のトランスポートでエラー","h_channels_off":"件のチャンネルがオフ","h_all_good":"問題なし","h_health":"状態","h_failures":"件の失敗","h_failures_1":"件の失敗","h_transport_err_1":"件のトランスポートでエラー","h_channels_off_1":"件のチャンネルがオフ","channels_1":"チャンネル","band_early_morning":"早朝","band_morning":"朝","band_afternoon":"午後","band_evening":"夕方","band_night":"夜","band_late_night":"深夜","h_look_1":"確認が必要な項目が1件","h_look_n":"確認が必要な項目が {n} 件","h_rest_ok":"その他は正常です","h_ch_on":"{tot} チャンネル中 {on} 件オン","h_open":"開く","ln_delivered":"配信済み","ln_failed":"失敗","ln_why":"理由","tgt_loading":"選択画面を読み込み中…","bands_empty_t":"時間帯がまだありません","bands_empty":"1日の区切りごとに時間帯を1つ追加します。開始時刻用の input_datetime と音声音量用の input_number を用意してください。","active_now":"現在有効","disabled":"無効","other":"その他","manual":"手動","apply_now":"今すぐ適用","applied":"適用中","apply_off":"タップで適用を解除","enabled_lbl":"有効","reset_overrides":"オーバーライドをリセット","reset_done":"オーバーライドをリセットしました","transport_off":"トランスポートがオフ","last_notified":"最終通知","never_notified":"通知履歴なし","media":"メディア","no_scenarios":"シナリオのエンティティが見つかりません","sim_pick":"🎬 シナリオ — タップでシミュレート","sim_fire":"📤 チャンネル","sim_hint":"エンジンの実データ（照会サービス）です。優先度による配信の絞り込みはエンジン側で行われ、ここではシミュレートされません。実行時の統合と同様に、無効が有効より優先されます。","sim_none":"送信される配信はありません","scenario_tag":"シナリオ","sim_go":"送信される","sim_stop":"送信されない","sim_r_default":"自動で開始","sim_r_on":"オンにしたもの:","sim_r_off":"オフにしたもの:","sim_r_named":"呼び出しで指定されたときのみ","sim_r_scen":"オンにするシナリオがあるときのみ","sim_r_fallback":"予備（他が失敗したとき）","sim_r_switched":"オフにされています","title":"タイトル","message":"メッセージ","priority":"優先度","channels_lbl":"チャンネル — 未選択なら通常のルーティング","camera_lbl":"カメラのスナップショット","preview":"プレビュー","no_title":"（タイトルなし）","no_message":"（メッセージなし）","default_prio":"デフォルト（中）","comp_hint":"選択したチャンネルは delivery_selection: fixed で送信されます（それらのみ送信）。「緊急」は本当に緊急扱いです — サイレンも鳴ります。","critical_confirm":"緊急通知を送信しますか？サイレンと最大音量を含みます。","write_first":"先にメッセージを入力してください","sent_toast":"送信しました","write_or_pick":"メッセージを入力するか、カメラかチャンネルを選んでください","need_2111":"本文のない通知には SuperNotify 2.11.1 が必要です","send_err":"送信されませんでした","dry_btn":"送信せずに試す","dry_title":"今送信した場合","dry_err":"ドライランに失敗しました","dry_would":"送信予定","dry_skip":"スキップ","dry_nobody":"受信者なし、直接ターゲットのみ","dry_targets":"ターゲット","dry_suppressed":"この通知は抑制されます","dry_fallback":"送信されるチャンネルがありません: フォールバック先","dry_none":"チャンネルが選択されていません","dry_scen":"有効なシナリオ","dry_raw":"生の応答","dry_prio":"優先度","dry_would_n":"チャンネルで送信予定","dry_nothing":"何も送信されません","dry_dupe":"最近の通知と重複しています: 破棄されます","dry_no_dupe":"重複チェックはシミュレートしていないため、直後の実際の送信はブロックされません。","dry_restart":"現在動作中の SuperNotify ではシミュレートできません: ドライランには 2.12 が必要で、アップデート後に Home Assistant を再起動する必要があります。","dry_home":"在宅","dry_empty":"SuperNotify から応答がありません: バージョンは 2.12 以降ですか？","dry_reasons":{"NO_TARGET":"使えるターゲットなし","DUPE":"重複","PRIORITY":"この優先度は対象外","SNOOZED":"一時停止中","DELIVERY_CONDITION":"配信条件が偽","OCCUPANCY":"在宅ルール","TRANSPORT_DISABLED":"トランスポートがオフ","DELIVERY_DISABLED":"オフにされています","NO_SCENARIO":"必須シナリオが有効でない","NO_ACTION":"アクションなし","INVALID_ACTION_DATA":"無効なデータ","UNKNOWN":"不明な理由","ERROR":"エラー"},"prio_minimum":"最低","prio_low":"低","prio_medium":"中","prio_high":"高","prio_critical":"緊急","target_lbl":"ターゲット — 人、デバイス、エリア、フロア、ラベル","custom_target_lbl":"カスタムターゲット（メール、Telegram ID など）— カンマ区切り","adv_title":"詳細オプション","adv_spoken":"読み上げメッセージ（Alexa、TTS）","adv_spoken_ph":"本文と異なる場合にスピーカーで読み上げる内容","adv_apply":"これらのシナリオを適用","adv_require":"これらのシナリオが有効な場合のみ送信","adv_constrain":"これらのシナリオのみを考慮","adv_snapshot":"URL からの画像","adv_debug":"デバッグ: 選択トレースをすべて記録（理由カードに表示）","custom_target_ph":"例: user@example.com, 123456789","native_target_tag":"🎯 ネイティブのエリア/フロア/ラベル","target_warn":"⚠️ エリア、フロア、ラベルを解決できるのは notify_entity、alexa_devices、html5、ntfy、kodi、media_player、tts、chime だけです。他のチャンネル — または上でチャンネルを選ばない場合のデフォルトのルーティング — では、通知がターゲットなしで黙って失われることがあります。対応するチャンネルを選ぶか、人やデバイスを直接追加してください。","aut_search":"オートメーションを検索…","aut_all":"すべて","aut_none":"一致なし","aut_err":"マニフェストが見つかりません — tools/genera_vista_automazioni.py で生成してください","aut_updated":"リスト更新","aut_count":"件のオートメーション","aut_count_1":"件のオートメーション","never":"なし","ago_now":"たった今","ago_min":"分前","ago_h":"時間前","ago_d":"日前","aut_disabled_only":"無効のみ","grp_active":"有効","repeat":"繰り返し","skipped_n":"スキップ","left":"残り","missed_n":"未送信","snz_all":"すべて","snz_nc":"重要でない通知","snz_prio":"優先度","snz_transport":"トランスポート","snz_for":"対象","snz_choose":"対象と時間を選択","snz_title":"通知を一時停止","snz_what":"対象","snz_nc_l":"重要でない通知","snz_all_l":"すべて","snz_ch":"チャンネル","snz_pr":"優先度","snz_who":"誰の分","snz_everyone":"全員","snz_me":"自分のみ","snz_len":"期間","snz_forever":"再開するまで","snz_go":"一時停止","snz_close":"閉じる","rs_hand":"手動","rs_voice":"音声","rs_assist":"アシスタント","snz_voice_info":"一時停止は SuperNotify の音声コマンド経由で行われ、あなたの分だけに適用されます。","snz_voice_off":"SuperNotify の音声コマンドがオフです: 統合のオプションでオンにしてください。","snz_resume_mine":"自分の分を再開","go_open":"表示","dl_probe":"このチャンネルを試す","probe_msg":"ダッシュボードからのチャンネルテスト","sc_why":"理由","sc_yes":"現在適用中","sc_no":"現在は適用されていません","sc_manual_why":"手動シナリオ: 手動で適用","sc_no_cond":"条件なし","sc_off_sw":"オフにされています","sc_not_eval":"未評価","sc_now":"現在","sc_diff_btn_on":"適用されたら何が変わるか","sc_diff_btn_off":"なければ何が変わるか","sc_diff_on":"適用された場合、今の「中」優先度の通知では:","sc_diff_off":"なかった場合、今の「中」優先度の通知では:","sc_diff_add":"追加で送信","sc_diff_rem":"送信されなくなる","sc_diff_none":"違いなし","c_state":"{e} が {s}","c_template":"テンプレート条件","c_time":"時刻","c_after":"以降","c_before":"以前","c_numeric":"{e}","c_above":"より上","c_below":"より下","c_and":"以下のすべて","c_or":"以下のいずれか","c_not":"以下のいずれでもない","c_or_join":" または ","sim_hint_dry":"SuperNotify 自身の回答です（ドライラン、何も送信されません）: 上で選んだ優先度とシナリオのみで今通知した場合。","sim_msg":"シミュレーターのテスト","sim_prio":"優先度","sa_snooze":"{what}を {len} 一時停止しました。","sa_silence":"{what}を追って通知があるまで消音しました。","sa_resume":"{what}を再開しました。","sa_resume_one":"一時停止終了: {x}。","sa_resume_all":"通知を再開しました。","sa_w_nc":"重要でない通知","sa_w_all":"すべての通知","sa_w_ch":"チャンネル {x}","sa_w_pr":"優先度「{x}」の通知","sa_w_mine":"あなたの通知","sa_for":"{x} の分","sa_min":"{n} 分間","sa_hour":"1時間","sa_hours":"{n} 時間","occ_title":"在宅中の人","occ_home_l":"在宅","occ_ALL_HOME":"全員在宅","occ_ALL_AWAY":"全員外出","occ_LONE_HOME":"1人だけ在宅","occ_MULTI_HOME":"数人が在宅","occ_UNDEFINED_OCCUPANTS":"追跡対象なし","h_repairs":"件の SuperNotify 修復","h_repairs_1":"件の SuperNotify 修復","det_more":"すべての属性","det_yes":"はい","det_no":"いいえ","det_action":"アクション","det_target":"固定ターゲット","det_target_req":"ターゲットが必要","det_target_use":"ターゲットの用途","det_inclusion":"使用条件","det_prio":"優先度","det_occ":"在宅が必要な人","det_transport":"トランスポート","det_data":"データ","det_debug":"デバッグ","det_err_last":"最後のエラー","det_err_in":"発生箇所","det_err_n":"起動以降のエラー","det_select":"選択","adv_html":"メール用テキスト（HTML）","adv_clip":"URL からの動画クリップ","adv_actions":"通知のボタン","adv_act_id":"アクション ID","adv_act_title":"ボタンのテキスト","adv_act_add":"+ ボタン","adv_groups":"ボタングループ（カンマ区切り）","adv_dc":"この通知のチャンネル設定","adv_dc_ph":"key: value、1行に1つ","adv_dc_add":"+ チャンネル","snz_active":"現在一時停止中","snz_resume":"再開","snz_resume_all":"すべて再開","snz_until_resumed":"再開するまで","snz_done":"一時停止しました","snz_resumed":"再開しました","no_notif":"通知はまだありません","st_title":"利用状況","st_days":"日","st_days_short":"日","st_hist_note":"過去 {n} 日間の履歴に基づく時間帯・チャンネル・優先度","st_total":"通知","st_avg":"1日あたり","st_today":"今日","st_vs_avg":"平均比","st_peak_hour":"ピーク時間","st_top_channel":"最多チャンネル","st_errors":"チャンネルエラー","st_of_sends":"（チャンネル送信中）","st_daily":"日別","st_hourly":"時間帯別","st_weekday":"曜日別","st_channels":"チャンネル — 利用の多い順","st_priority":"優先度","st_period":"時間帯","st_insights":"気づき","st_no_data":"履歴はまだありません — 最初の通知の後にデータが表示されます。","st_unknown":"不明","st_loading":"読み込み中…","st_versions":"バージョン","st_installed":"インストール済み","st_latest":"最新","st_uptodate":"最新です","st_update":"アップデートあり","st_restart":"再起動が必要","st_cards":"カード","st_logged":"記録済み","st_reading":"アーカイブを読み込み中: {of} 日中 {n} 日目…","st_from_archive":"SuperNotify のアーカイブから","st_archive_err":"アーカイブを一部のみ読み込み","st_wd":["月","火","水","木","金","土","日"],"st_i_share":"チャンネル送信全体の {p}% が {c} 経由です。","st_i_peak":"最も多いのは {h}:00 台です（{d} 日間で {n} 件の通知）。","st_i_night":"通知の {p}% が 23:00〜07:00 に届いています — 不要なら「おやすみ」シナリオを検討してください。","st_i_night_ok":"夜間（23〜07時）に届く通知は {p}% だけです。静かな時間帯が機能しています。","st_i_weekend":"週末は平日より通知が {p}% {dir}です。","st_i_errors":"{d} 日間でチャンネルエラーが {n} 件、主に {c} です。","st_i_noerr":"過去 {d} 日間、チャンネルエラーはありません。","st_i_prio":"通知の {p}% が優先度「{prio}」です。","st_i_trend":"直近7日間: 1日 {n} 件、前の7日間より {p}% {dir}。","st_more":"多い","st_less":"少ない","st_up":"増加","st_down":"減少"},"SN_STATS_STRINGS":{"st_title":"利用状況","st_days":"日","st_days_short":"日","st_hist_note":"過去 {n} 日間の履歴に基づく時間帯・チャンネル・優先度","st_total":"通知","st_avg":"1日あたり","st_today":"今日","st_vs_avg":"平均比","st_peak_hour":"ピーク時間","st_top_channel":"最多チャンネル","st_errors":"チャンネルエラー","st_of_sends":"（チャンネル送信中）","st_daily":"日別","st_hourly":"時間帯別","st_weekday":"曜日別","st_channels":"チャンネル — 利用の多い順","st_priority":"優先度","st_period":"時間帯","st_insights":"気づき","st_no_data":"履歴はまだありません — 最初の通知の後にデータが表示されます。","st_unknown":"不明","st_loading":"読み込み中…","st_versions":"バージョン","st_installed":"インストール済み","st_latest":"最新","st_uptodate":"最新です","st_update":"アップデートあり","st_restart":"再起動が必要","st_cards":"カード","st_logged":"記録済み","st_reading":"アーカイブを読み込み中: {of} 日中 {n} 日目…","st_from_archive":"SuperNotify のアーカイブから","st_archive_err":"アーカイブを一部のみ読み込み","st_wd":["月","火","水","木","金","土","日"],"st_i_share":"チャンネル送信全体の {p}% が {c} 経由です。","st_i_peak":"最も多いのは {h}:00 台です（{d} 日間で {n} 件の通知）。","st_i_night":"通知の {p}% が 23:00〜07:00 に届いています — 不要なら「おやすみ」シナリオを検討してください。","st_i_night_ok":"夜間（23〜07時）に届く通知は {p}% だけです。静かな時間帯が機能しています。","st_i_weekend":"週末は平日より通知が {p}% {dir}です。","st_i_errors":"{d} 日間でチャンネルエラーが {n} 件、主に {c} です。","st_i_noerr":"過去 {d} 日間、チャンネルエラーはありません。","st_i_prio":"通知の {p}% が優先度「{prio}」です。","st_i_trend":"直近7日間: 1日 {n} 件、前の7日間より {p}% {dir}。","st_more":"多い","st_less":"少ない","st_up":"増加","st_down":"減少"},"SN_ARCH_STRINGS":{"title":"通知履歴","search":"タイトルやメッセージを検索…","f_all":"すべて","f_problems":"問題のみ","f_today":"今日","f_whisper":"ささやき","wh":"ささやき","said":"Alexa の発話","said_by":"{ch} の発話","none":"一致する通知はありません","no_sensor":"センサーが見つかりません","no_sensor_hint":"supernotify.enquire_archive アクションを備えた SuperNotify 2.10 以降にアップデートするか、アーカイブをインデックス化する command_line センサーを追加してください（README 参照）。","loading":"アーカイブを読み込み中…","recent":"最新の通知","read_at":"読み込み時刻","of":"/","in_archive":"件（アーカイブ内）","since":"最古","updated":"インデックス更新","today":"今日","yesterday":"昨日","delivered":"配信済み","failed":"失敗","skipped":"スキップ","missed":"未送信","prio":{"critical":"緊急","high":"高","low":"低","minimum":"最低","medium":"中"},"reasons":{"doppione":"重複","nessun target":"ターゲットなし","errore":"エラー","condizione":"条件","scenario":"シナリオ","presenza":"在宅状況","priorita":"優先度","spento":"オフ","pausa":"一時停止中","transport spento":"トランスポートがオフ","nessuna azione":"アクションなし","dati non validi":"無効なデータ","sconosciuto":"不明"},"scenarios":"有効なシナリオ","truncated":"インデックス内ではメッセージが省略されています","dur":"所要時間","id":"ID","why":"理由 - 詳細をすべて表示"},"SN_WHY_STRINGS":{"title":"理由","pick":"通知を選ぶと、なぜその宛先に届いたのかを確認できます。","loading":"読み込み中…","none":"通知なし","no_sensor":"センサーが見つかりません:","no_service":"サービスがありません","no_service_hint":"SuperNotify を 2.10 以降にアップデートする（supernotify.enquire_archive）か、shell_command sn_archive_detail を追加して（README 参照）Home Assistant を再起動してください。","gone":"この通知はもうアーカイブにありません","priority":"優先度","outcome":"結果","dupe":"重複","outcomes":{"success":"配信済み","partial_delivery":"一部配信","dupe":"重複","failed":"失敗","error":"失敗","fallback_delivery":"フォールバックチャンネルで配信","no_delivery":"未配信"},"missed":"未送信（指定されたが送信されず）","step_call":"呼び出し","step_scen":"シナリオ","step_people":"人","step_ch":"チャンネル","call_auto":"チャンネル指定なし: 通常のルーティング","call_named":"呼び出しで指定:","call_debug":"デバッグあり","nobody":"誰も在宅していません","ch_sent":"送信済み","ch_problems":"要確認","ch_skipped":"スキップ","pb_failed":"失敗","pb_missed":"指定されたが送信されず","grp_skipped":"ルールによりスキップ: 正常","grp_not":"対象外","trace_title":"選択トレース全体","fix":{"NO_TARGET":"このチャンネル用のアドレスを持つ受信者がいません: 受信者にアドレスを追加するか、チャンネルに固定ターゲットを設定するか、この呼び出しから外してください。","ERROR":"このチャンネルの元になっている統合がエラーを返しました: その統合のログを確認してください。","NO_ACTION":"このチャンネルには呼び出すアクションがありません: 配信に `action:` を設定してください。","INVALID_ACTION_DATA":"アクションに渡したデータが拒否されました: 呼び出しまたは配信の `data:` を確認してください。"},"scenarios":"有効なシナリオ","no_scenarios":"有効なシナリオなし","applied":"呼び出しで強制","required":"呼び出しで必須","constrain":"呼び出しで制限:","presence":"在宅状況","home":"在宅","away":"外出","channels":"チャンネル","no_channels":"選択されたチャンネルはありません","st_ok":"配信済み","st_err":"失敗","st_skip":"スキップ","st_supp":"抑制","calls":"回の呼び出し","calls_1":"回の呼び出し","target_required":"ターゲットが必要:","started_by":"選択元","scen_would_off":"オフにしようとしたもの（無効化）","src_default":"常にオン（デフォルト）","src_scen":"シナリオ","src_call":"呼び出し自体","src_recipient":"受信者","r_off_by":"オフにしたもの:","call_targets":"呼び出し内のターゲット","cats":{"entity_id":"エンティティ","mobile_app_id":"デバイス","person_id":"人","email":"メール","phone":"電話","device_id":"デバイス"},"not_started":"開始しなかったチャンネル","r_call_off":"呼び出しで除外","r_scen_off":"有効なシナリオによりオフ","r_disabled":"オフにされています","r_transport_off":"トランスポートがオフ","r_only_scen":"シナリオでオンにされたときのみ開始","r_only_fallback":"フォールバック専用","r_only_explicit":"名前で指定されたときのみ開始","r_priority":"この優先度は対象外","r_unknown":"トレースなしでは再構成できません","from_config":"開始しなかったチャンネルの理由は、当時ではなく現在の設定から再構成しています。","from_trace":"理由は通知と一緒にアーカイブされた選択トレースに基づいています。","st_time":"所要時間","st_slow":"最も遅い","st_rate":"のチャンネルが成功","ua_title":"どのチャンネルも受け付けなかったターゲット","ua_hint":"呼び出しには含まれていましたが、選択されたチャンネルのどれもこの種類のターゲットを受け付けません。","un_title":"存在しない名前","sent_by":"送信元","sent_auto":"オートメーション","sent_script":"スクリプト","sent_person":"","sent_unknown":"送信元不明（コンテキストにオートメーションや人がありません）","trace":"選択トレース","no_trace":"選択トレース全体は notify 呼び出しに debug: true がある場合のみ記録され、アーカイブの診断に含まれる場合にアーカイブされます。","reasons":{"NO_TARGET":"使えるターゲットなし","DUPE":"最近の通知と重複","PRIORITY":"この優先度は対象外","SNOOZE":"一時停止中","SNOOZED":"一時停止中","DELIVERY_CONDITION":"配信条件が偽","OCCUPANCY":"在宅ルール","ERROR":"エラー","DELIVERY_DISABLED":"オフにされています","SCENARIO":"シナリオ","TRANSPORT_DISABLED":"トランスポートがオフ","NO_SCENARIO":"必須シナリオが有効でない","NO_ACTION":"呼び出すアクションなし","INVALID_ACTION_DATA":"無効なアクションデータ","UNKNOWN":"不明な理由"}},"SN_TOOLS_STRINGS":{"maint":"メンテナンス","enq":"SuperNotify に照会","refresh":"すべてのエンティティを再公開","refresh_btn":"更新","resume_btn":"再開","refreshed":"エンティティを再公開しました。","resume_all":"すべての一時停止を再開","cleared_n":"件の一時停止を再開しました","purge_arch":"アーカイブを整理","purge_media":"画像を整理","older":"次より古いもの:","days":"日","purge_btn":"整理","confirm":"もう一度タップで確定","purged":"削除","remaining":"残り","reset":"手動で行った変更を元に戻す","reset_btn":"リセット","reset_none":"リセットするものはありません: すべて設定どおりです。","reset_done":"設定に戻しました:","k_all":"すべて","k_scenario":"シナリオ","k_delivery":"チャンネル","k_recipient":"人","k_transport":"トランスポート","q_config":"設定","q_scen":"シナリオ","q_active":"有効なシナリオ","q_by_scen":"シナリオ別チャンネル","q_implicit":"デフォルトのチャンネル","q_recipients":"受信者","q_occupancy":"在宅中の人","q_snoozes":"一時停止","q_last":"最後の通知","copy":"JSON をコピー","copied":"コピーしました","close":"閉じる","empty":"（空）","err":"SuperNotify がエラーを返しました:","err_config":"SuperNotify 2.12.0 は、テンプレート条件を持つチャンネルがあると設定を返せません（rhizomatics/supernotify#241）。","settings":"統合の設定","running":"処理中…","more":"もっと見る"},"SN_FORM_LABELS":{"_common":"外観とテキスト","style":"配色","icons":"アイコン","show_version":"カードのバージョンを表示","intro":"上部の説明文","title":"タイトル","dnd_entity":"おやすみモードのスイッチ","quiet_entity":"計算された静音状態（オプション）","presence_entity":"ステータスバーに表示する人","archive_days":"アーカイブ整理: 次の日数より古いもの","media_days":"画像整理: 次の日数より古いもの","occupancy":"在宅中の人（SuperNotify から）","repairs":"状態リストに SuperNotify の修復を表示","snooze_announce":"一時停止を読み上げる（アナウンスチャンネル）","snooze_via":"一時停止の経路","o_event":"プッシュボタンのイベント（管理者）","o_voice":"音声コマンド","snooze_minutes":"一時停止の長さ（分）","snooze_panel":"一時停止タイルで一時停止パネルを開く","announce_delivery":"アナウンス用のチャンネル","last_notification":"最後の通知を表示","last_channels":"最後の通知のチャンネルごとにチップを表示","repeat_entity":"最後を繰り返すボタン（オプション）","tile_layout":"タイル","tile_columns":"タイルの列数（空欄 = 自動）","update_entity":"SuperNotify のアップデートエンティティ","cards_update_entity":"カードのアップデートエンティティ","sent_today_entity":"日次カウンター（utility meter、オプション）","count_entity":"SuperNotify カウンター（長期統計）","health":"上部に状態を表示","stats":"数値","poll_seconds":"更新間隔（秒）","group":"チャンネルの開始方法でグループ化","hide_defaults":"自動の DEFAULT_ チャンネルを非表示","limit":"リストの通知数","expand":"折りたたまれた部分を開く","max_height":"最大の高さ（CSS、例: 70vh）","source":"アーカイブのソース","entity":"アーカイブセンサー（ブリッジのみ）","trigger_entity":"これが変化したら更新","dry_run":"「送信せずに試す」を表示","dry_run_dupe_check":"重複チェックもシミュレート","days":"デフォルトの表示日数","manifest_url":"オートメーションのマニフェスト URL","o_supernotify":"SuperNotify","o_theme":"Home Assistant のテーマ","o_mdi":"Home Assistant のアイコン","o_emoji":"絵文字","o_row":"アイコンを左に","o_stacked":"縦長、アイコンを上に","o_three":"送信、失敗、チャンネル","o_full":"5つすべて","o_auto":"自動","o_sensor":"センサーブリッジ（SuperNotify 2.10 より前）","o_archive":"SuperNotify のアーカイブ（2.12.1 以降）","o_history":"ヘルパーの履歴"},"SN_NATIVE_STR":{"all_good":"問題なし","paused":"一時停止中","until":"まで","resume":"再開","test":"テスト送信","sure":"もう一度タップで送信","sent":"送信しました","last":"最後","none":"通知はまだありません","ago":"前","min":"分","h":"時間","err":"件のトランスポートでエラー","off":"件のチャンネルがオフ"},"SN_STRATEGY_TITLES":{"home":"ホーム","send":"送信","setup":"設定","stats":"統計","tools":"ツール","title":"SuperNotify"}},"zh":{"SN_STRINGS":{"presence":"在家情况","time_band":"时段","quiet":"安静","act_scen":"活动场景","on":"开","off":"关","active":"活动","dnd":"勿扰","tap_silence":"点按静音","snooze":"暂停","min":"分钟","pause_nc":"暂停非紧急通知","snoozed":"已暂停","until":"直到","tap_clear":"点按清除","announce":"播报","intercom":"对讲","announce_ph":"在所有音箱上播报…","send":"发送","announced":"已播报","cleared":"暂停已清除","snoozed_for":"已暂停非紧急通知，时长","sent":"已发送","sent_today":"今日已发送","since_startup":"自启动以来","yesterday":"昨天","failures":"失败","fail_today":"今天渠道发送失败次数","deliveries":"推送","enabled_total":"已启用/总数","last_notif":"最后一条通知","transports":"传输方式","delivered":"已送达","failed":"失败","channels":"个渠道","none":"无","no_transports":"未找到传输方式实体","tr_used":"使用者","tr_unused":"没有渠道使用它","start":"开始","volume":"音量","now":"现在","crosses":"跨越午夜","no_voice":"无语音","mute_hint":"音量为 <b>0%</b> 的时段完全<b>不发送语音播报</b>（Alexa 和 TTS 关闭，推送通知和仪表板照常送达）。紧急和高优先级提醒始终会播报。","enabled":"已启用","implicit":"始终开启","explicit":"按需","by_scenario":"仅限场景","fallback":"备用","fallback_err":"出错时备用","inc_sum":"这些渠道中","inc_always":"自动启动","inc_req":"仅在请求时","inc_scen":"仅在有场景时","grp_auto":"自动启动","grp_named":"仅在调用中指定时","grp_scen":"仅在有场景时","grp_fallback":"备用，其他渠道失败时","ch_title":"渠道","ch_count":"{tot} 个中 {on} 个开启","off_manual":"已关闭","paused_by":"当前被暂停，原因","on_by":"当前开启，通过","fixed_targets":"固定目标","no_deliveries":"未找到推送实体","home":"在家","away":"外出","devices":"个设备","devices_1":"个设备","rc_test":"发送测试","rc_test_confirm":"再次点按以发送","rc_test_sent":"测试已发送","rc_test_title":"SuperNotify 测试","rc_test_msg":"来自仪表板的测试消息，","overrides":"个推送覆盖","overrides_1":"个推送覆盖","no_contact":"无联系方式","no_recipients":"未找到接收人实体","details":"详情","h_update":"有可用更新：","h_restart":"重启 Home Assistant 以完成更新","h_uptodate":"已是最新","h_transport_err":"个传输方式出错","h_channels_off":"个渠道已关闭","h_all_good":"一切正常","h_health":"健康状况","h_failures":"次失败","h_failures_1":"次失败","h_transport_err_1":"个传输方式出错","h_channels_off_1":"个渠道已关闭","channels_1":"个渠道","band_early_morning":"清晨","band_morning":"上午","band_afternoon":"下午","band_evening":"傍晚","band_night":"夜间","band_late_night":"深夜","h_look_1":"有 1 项需要查看","h_look_n":"有 {n} 项需要查看","h_rest_ok":"其余一切正常","h_ch_on":"{tot} 个渠道中 {on} 个开启","h_open":"打开","ln_delivered":"已送达","ln_failed":"失败","ln_why":"原因","tgt_loading":"正在加载选择器…","bands_empty_t":"还没有时段","bands_empty":"为一天中的每个时段添加一项：用一个 input_datetime 设置开始时间，用一个 input_number 设置语音音量。","active_now":"当前活动","disabled":"已禁用","other":"其他","manual":"手动","apply_now":"立即应用","applied":"已应用","apply_off":"点按停止应用","enabled_lbl":"已启用","reset_overrides":"重置覆盖","reset_done":"覆盖已重置","transport_off":"传输方式已关闭","last_notified":"上次通知","never_notified":"从未通知","media":"媒体","no_scenarios":"未找到场景实体","sim_pick":"🎬 场景 — 点按以模拟","sim_fire":"📤 渠道","sim_hint":"真实引擎数据（查询服务）。基于优先级的推送筛选在引擎端进行，此处不模拟。与运行时合并一样，禁用优先于启用。","sim_none":"不会触发任何推送","scenario_tag":"场景","sim_go":"会发出","sim_stop":"不会发出","sim_r_default":"自动启动","sim_r_on":"开启者","sim_r_off":"关闭者","sim_r_named":"仅在调用中指定时","sim_r_scen":"仅在有场景开启它时","sim_r_fallback":"备用，其他渠道失败时","sim_r_switched":"已关闭","title":"标题","message":"消息","priority":"优先级","channels_lbl":"渠道 — 不选 = 正常路由","camera_lbl":"摄像头快照","preview":"预览","no_title":"（无标题）","no_message":"（无消息）","default_prio":"默认（中）","comp_hint":"选中的渠道以 delivery_selection: fixed 发送（只有它们会触发）。紧急就是真的紧急 — 包括警报器。","critical_confirm":"发送一条紧急通知？包括警报器和最大音量。","write_first":"请先写一条消息","sent_toast":"已发送","write_or_pick":"写一条消息，或选择一个摄像头或渠道","need_2111":"不带文字的通知需要 SuperNotify 2.11.1","send_err":"未发送","dry_btn":"试一下，不发送","dry_title":"如果现在发送","dry_err":"演练失败","dry_would":"会发送","dry_skip":"已跳过","dry_nobody":"无接收人，仅直接目标","dry_targets":"目标","dry_suppressed":"该通知会被抑制","dry_fallback":"没有渠道会触发：改用备用","dry_none":"未选择渠道","dry_scen":"活动场景","dry_raw":"原始响应","dry_prio":"优先级","dry_would_n":"个渠道会发送","dry_nothing":"不会发送任何内容","dry_dupe":"与最近的通知重复：将被丢弃","dry_no_dupe":"未模拟重复检查，因此紧接着的真正发送不会被拦截。","dry_restart":"当前运行的 SuperNotify 无法模拟：演练需要 2.12，且更新后必须重启 Home Assistant。","dry_home":"在家","dry_empty":"SuperNotify 没有返回结果：是否为 2.12 或更高版本？","dry_reasons":{"NO_TARGET":"无可用目标","DUPE":"重复","PRIORITY":"不适用于此优先级","SNOOZED":"已暂停","DELIVERY_CONDITION":"推送条件为假","OCCUPANCY":"在家规则","TRANSPORT_DISABLED":"传输方式已关闭","DELIVERY_DISABLED":"已关闭","NO_SCENARIO":"所需场景未生效","NO_ACTION":"无操作","INVALID_ACTION_DATA":"数据无效","UNKNOWN":"未知原因","ERROR":"错误"},"prio_minimum":"最低","prio_low":"低","prio_medium":"中","prio_high":"高","prio_critical":"紧急","target_lbl":"目标 — 人员、设备、区域、楼层、标签","custom_target_lbl":"自定义目标（电子邮件、Telegram ID 等）— 以逗号分隔","adv_title":"高级选项","adv_spoken":"语音消息（Alexa、TTS）","adv_spoken_ph":"音箱播报的内容（如与文字不同）","adv_apply":"应用这些场景","adv_require":"仅当这些场景活动时发送","adv_constrain":"仅考虑这些场景","adv_snapshot":"来自 URL 的图片","adv_debug":"调试：记录完整的选择追踪（在“原因”卡片中显示）","custom_target_ph":"例如 user@example.com, 123456789","native_target_tag":"🎯 原生区域/楼层/标签","target_warn":"⚠️ 区域、楼层和标签仅由 notify_entity、alexa_devices、html5、ntfy、kodi、media_player、tts 和 chime 解析。使用其他任何渠道 — 或上方未选择渠道时的默认路由 — 通知可能会在无提示的情况下没有目标。请选择兼容的渠道，或直接添加人员/设备。","aut_search":"搜索自动化…","aut_all":"全部","aut_none":"无匹配项","aut_err":"未找到清单 — 请用 tools/genera_vista_automazioni.py 生成","aut_updated":"列表已更新","aut_count":"个自动化","aut_count_1":"个自动化","never":"从不","ago_now":"刚刚","ago_min":"分钟前","ago_h":"小时前","ago_d":"天前","aut_disabled_only":"仅已禁用","grp_active":"活动","repeat":"重复","skipped_n":"已跳过","left":"剩余","missed_n":"未发出","snz_all":"全部","snz_nc":"非紧急","snz_prio":"优先级","snz_transport":"传输方式","snz_for":"时长","snz_choose":"选择内容和时长","snz_title":"暂停通知","snz_what":"内容","snz_nc_l":"非紧急","snz_all_l":"全部","snz_ch":"一个渠道","snz_pr":"一个优先级","snz_who":"对象","snz_everyone":"所有人","snz_me":"仅我","snz_len":"时长","snz_forever":"直到我恢复","snz_go":"暂停","snz_close":"关闭","rs_hand":"手动","rs_voice":"通过语音","rs_assist":"通过助手","snz_voice_info":"你的暂停通过 SuperNotify 的语音命令执行：只对你生效。","snz_voice_off":"SuperNotify 的语音命令已关闭：请在集成选项中开启。","snz_resume_mine":"恢复我的","go_open":"显示","dl_probe":"试用此渠道","probe_msg":"来自仪表板的渠道测试","sc_why":"原因","sc_yes":"当前适用","sc_no":"当前不适用","sc_manual_why":"手动场景：手动应用","sc_no_cond":"无条件","sc_off_sw":"已关闭","sc_not_eval":"未检查","sc_now":"现在","sc_diff_btn_on":"如果适用会有什么变化","sc_diff_btn_off":"没有它会有什么变化","sc_diff_on":"如果它适用，对于现在的一条中优先级通知：","sc_diff_off":"没有它，对于现在的一条中优先级通知：","sc_diff_add":"还会发送","sc_diff_rem":"将不再发送","sc_diff_none":"没有区别","c_state":"{e} 为 {s}","c_template":"模板条件","c_time":"时间","c_after":"晚于","c_before":"早于","c_numeric":"{e}","c_above":"高于","c_below":"低于","c_and":"以下全部","c_or":"以下至少一项","c_not":"以下均不","c_or_join":" 或 ","sim_hint_dry":"SuperNotify 自己的回答（演练，不会发送任何内容）：现在的一条通知，使用上方选择的优先级，且仅包含上方选择的场景。","sim_msg":"模拟器测试","sim_prio":"优先级","sa_snooze":"{what}已暂停 {len}。","sa_silence":"{what}已静音，直到另行通知。","sa_resume":"{what}已恢复。","sa_resume_one":"暂停结束：{x}。","sa_resume_all":"通知已恢复。","sa_w_nc":"非紧急通知","sa_w_all":"所有通知","sa_w_ch":"渠道 {x}","sa_w_pr":"{x}优先级通知","sa_w_mine":"你的通知","sa_for":"给 {x}","sa_min":"{n} 分钟","sa_hour":"一小时","sa_hours":"{n} 小时","occ_title":"谁在家","occ_home_l":"在家","occ_ALL_HOME":"所有人在家","occ_ALL_AWAY":"所有人外出","occ_LONE_HOME":"只有一人在家","occ_MULTI_HOME":"部分人在家","occ_UNDEFINED_OCCUPANTS":"无人被跟踪","h_repairs":"个 SuperNotify 修复","h_repairs_1":"个 SuperNotify 修复","det_more":"所有属性","det_yes":"是","det_no":"否","det_action":"操作","det_target":"固定目标","det_target_req":"需要目标","det_target_use":"目标使用","det_inclusion":"使用时机","det_prio":"优先级","det_occ":"谁必须在家","det_transport":"传输方式","det_data":"数据","det_debug":"调试","det_err_last":"最后错误","det_err_in":"位置","det_err_n":"启动以来的错误","det_select":"选择","adv_html":"电子邮件文本（HTML）","adv_clip":"来自 URL 的视频片段","adv_actions":"通知上的按钮","adv_act_id":"操作 ID","adv_act_title":"按钮文字","adv_act_add":"+ 按钮","adv_groups":"按钮组（逗号分隔）","adv_dc":"此通知的渠道设置","adv_dc_ph":"键: 值，每行一个","adv_dc_add":"+ 渠道","snz_active":"当前已暂停","snz_resume":"恢复","snz_resume_all":"全部恢复","snz_until_resumed":"直到恢复","snz_done":"已暂停","snz_resumed":"已恢复","no_notif":"还没有通知","st_title":"使用情况","st_days":"天","st_days_short":"天","st_hist_note":"最近 {n} 天历史中的时段、渠道和优先级","st_total":"通知","st_avg":"每天","st_today":"今天","st_vs_avg":"与平均相比","st_peak_hour":"高峰时段","st_top_channel":"最常用渠道","st_errors":"渠道错误","st_of_sends":"的渠道发送","st_daily":"每天","st_hourly":"按一天中的时段","st_weekday":"按星期","st_channels":"渠道 — 最常用","st_priority":"优先级","st_period":"时段","st_insights":"洞察","st_no_data":"暂无历史 — 发送第一批通知后会显示数据。","st_unknown":"未知","st_loading":"正在加载…","st_versions":"版本","st_installed":"已安装","st_latest":"最新","st_uptodate":"已是最新","st_update":"有可用更新","st_restart":"需要重启","st_cards":"卡片","st_logged":"已记录","st_reading":"正在读取存档：第 {n} 天，共 {of} 天…","st_from_archive":"来自 SuperNotify 存档","st_archive_err":"存档仅部分读取","st_wd":["周一","周二","周三","周四","周五","周六","周日"],"st_i_share":"所有渠道发送中有 {p}% 通过 {c}。","st_i_peak":"最忙的时段是 {h}:00（{d} 天内 {n} 条通知）。","st_i_night":"{p}% 的通知在 23:00 到 07:00 之间到达 — 如果不希望这样，可以考虑设置一个勿扰场景。","st_i_night_ok":"只有 {p}% 的通知在夜间（23–07）到达：安静时段运作良好。","st_i_weekend":"周末的通知比工作日{dir} {p}%。","st_i_errors":"{d} 天内有 {n} 次渠道错误，主要发生在 {c}。","st_i_noerr":"最近 {d} 天没有渠道错误。","st_i_prio":"{p}% 的通知为{prio}优先级。","st_i_trend":"最近 7 天：{n}/天，比之前 7 天{dir} {p}%。","st_more":"多","st_less":"少","st_up":"增加","st_down":"减少"},"SN_STATS_STRINGS":{"st_title":"使用情况","st_days":"天","st_days_short":"天","st_hist_note":"最近 {n} 天历史中的时段、渠道和优先级","st_total":"通知","st_avg":"每天","st_today":"今天","st_vs_avg":"与平均相比","st_peak_hour":"高峰时段","st_top_channel":"最常用渠道","st_errors":"渠道错误","st_of_sends":"的渠道发送","st_daily":"每天","st_hourly":"按一天中的时段","st_weekday":"按星期","st_channels":"渠道 — 最常用","st_priority":"优先级","st_period":"时段","st_insights":"洞察","st_no_data":"暂无历史 — 发送第一批通知后会显示数据。","st_unknown":"未知","st_loading":"正在加载…","st_versions":"版本","st_installed":"已安装","st_latest":"最新","st_uptodate":"已是最新","st_update":"有可用更新","st_restart":"需要重启","st_cards":"卡片","st_logged":"已记录","st_reading":"正在读取存档：第 {n} 天，共 {of} 天…","st_from_archive":"来自 SuperNotify 存档","st_archive_err":"存档仅部分读取","st_wd":["周一","周二","周三","周四","周五","周六","周日"],"st_i_share":"所有渠道发送中有 {p}% 通过 {c}。","st_i_peak":"最忙的时段是 {h}:00（{d} 天内 {n} 条通知）。","st_i_night":"{p}% 的通知在 23:00 到 07:00 之间到达 — 如果不希望这样，可以考虑设置一个勿扰场景。","st_i_night_ok":"只有 {p}% 的通知在夜间（23–07）到达：安静时段运作良好。","st_i_weekend":"周末的通知比工作日{dir} {p}%。","st_i_errors":"{d} 天内有 {n} 次渠道错误，主要发生在 {c}。","st_i_noerr":"最近 {d} 天没有渠道错误。","st_i_prio":"{p}% 的通知为{prio}优先级。","st_i_trend":"最近 7 天：{n}/天，比之前 7 天{dir} {p}%。","st_more":"多","st_less":"少","st_up":"增加","st_down":"减少"},"SN_ARCH_STRINGS":{"title":"通知历史","search":"搜索标题或消息…","f_all":"全部","f_problems":"仅问题","f_today":"今天","f_whisper":"低语播报","wh":"低语","said":"Alexa 说","said_by":"{ch} 说","none":"没有匹配的通知","no_sensor":"未找到传感器","no_sensor_hint":"将 SuperNotify 更新到 2.10 或更高版本（包含 supernotify.enquire_archive 操作），或添加用于索引存档的 command_line 传感器（见 README）。","loading":"正在读取存档…","recent":"最新通知","read_at":"读取于","of":"/","in_archive":"在存档中","since":"最早","updated":"索引已更新","today":"今天","yesterday":"昨天","delivered":"已送达","failed":"失败","skipped":"已跳过","missed":"未发出","prio":{"critical":"紧急","high":"高","low":"低","minimum":"最低","medium":"中"},"reasons":{"doppione":"重复","nessun target":"无目标","errore":"错误","condizione":"条件","scenario":"场景","presenza":"在家情况","priorita":"优先级","spento":"已关闭","pausa":"已暂停","transport spento":"传输方式已关闭","nessuna azione":"无操作","dati non validi":"数据无效","sconosciuto":"未知"},"scenarios":"生效的场景","truncated":"消息在索引中被截断","dur":"耗时","id":"ID","why":"原因？- 完整详情"},"SN_WHY_STRINGS":{"title":"原因？","pick":"选择一条通知，查看它为何这样发送。","loading":"正在加载…","none":"无通知","no_sensor":"未找到传感器：","no_service":"缺少服务","no_service_hint":"将 SuperNotify 更新到 2.10 或更高版本（supernotify.enquire_archive），或添加 shell_command sn_archive_detail（见 README）并重启 Home Assistant。","gone":"这条通知已不在存档中","priority":"优先级","outcome":"结果","dupe":"重复","outcomes":{"success":"已送达","partial_delivery":"部分送达","dupe":"重复","failed":"失败","error":"失败","fallback_delivery":"由备用渠道送达","no_delivery":"未送达"},"missed":"未发出（已请求，未发送）","step_call":"调用","step_scen":"场景","step_people":"人员","step_ch":"渠道","call_auto":"未指定渠道：正常路由","call_named":"调用中指定：","call_debug":"带调试","nobody":"无人在家","ch_sent":"已发送","ch_problems":"需查看","ch_skipped":"已跳过","pb_failed":"失败","pb_missed":"已请求但未发送","grp_skipped":"被规则跳过：正常","grp_not":"未涉及","trace_title":"完整选择追踪","fix":{"NO_TARGET":"没有接收人拥有此渠道的地址：为某个接收人添加地址，为渠道设置固定目标，或在此调用中不使用它。","ERROR":"此渠道背后的集成返回了错误：请查看它自己的日志条目。","NO_ACTION":"该渠道没有可调用的操作：请在推送上设置 `action:`。","INVALID_ACTION_DATA":"传给操作的数据被拒绝：请检查调用或推送的 `data:`。"},"scenarios":"生效的场景","no_scenarios":"没有生效的场景","applied":"由调用强制","required":"调用要求","constrain":"调用限制为","presence":"在家情况","home":"在家","away":"外出","channels":"渠道","no_channels":"未选择任何渠道","st_ok":"已送达","st_err":"失败","st_skip":"已跳过","st_supp":"已抑制","calls":"次调用","calls_1":"次调用","target_required":"需要目标：","started_by":"选择者","scen_would_off":"被关闭（已被否决）","src_default":"始终开启（默认）","src_scen":"场景","src_call":"调用本身","src_recipient":"接收人","r_off_by":"关闭者","call_targets":"调用中的目标","cats":{"entity_id":"实体","mobile_app_id":"设备","person_id":"人员","email":"电子邮件","phone":"电话","device_id":"设备"},"not_started":"未启动的渠道","r_call_off":"被调用排除","r_scen_off":"被生效的场景关闭","r_disabled":"已关闭","r_transport_off":"其传输方式已关闭","r_only_scen":"仅在场景开启它时启动","r_only_fallback":"仅作备用","r_only_explicit":"仅在按名称请求时启动","r_priority":"不适用于此优先级","r_unknown":"没有追踪无法还原","from_config":"未启动渠道的原因是根据当前的配置还原的，而不是当时的配置。","from_trace":"原因来自随通知存档的选择追踪。","st_time":"耗时","st_slow":"最慢","st_rate":"的渠道成功","ua_title":"没有渠道接收的目标","ua_hint":"它们在调用中，但没有选中的渠道接受这类目标。","un_title":"不存在的名称","sent_by":"发送者","sent_auto":"自动化","sent_script":"脚本","sent_person":"","sent_unknown":"发送者未知（其上下文中没有自动化或人员）","trace":"选择追踪","no_trace":"只有当通知调用带有 debug: true 时才会记录完整的选择追踪，并在存档诊断包含它时存档。","reasons":{"NO_TARGET":"无可用目标","DUPE":"与最近的通知重复","PRIORITY":"不适用于此优先级","SNOOZE":"已暂停","SNOOZED":"已暂停","DELIVERY_CONDITION":"推送条件为假","OCCUPANCY":"在家规则","ERROR":"错误","DELIVERY_DISABLED":"已关闭","SCENARIO":"场景","TRANSPORT_DISABLED":"其传输方式已关闭","NO_SCENARIO":"所需场景未生效","NO_ACTION":"无可调用的操作","INVALID_ACTION_DATA":"操作数据无效","UNKNOWN":"未知原因"}},"SN_TOOLS_STRINGS":{"maint":"维护","enq":"询问 SuperNotify","refresh":"重新发布所有实体","refresh_btn":"刷新","resume_btn":"恢复","refreshed":"实体已重新发布。","resume_all":"恢复所有暂停","cleared_n":"个暂停已恢复","purge_arch":"清理存档","purge_media":"清理图片","older":"早于","days":"天","purge_btn":"清理","confirm":"再次点按以确认","purged":"已删除","remaining":"剩余","reset":"撤销手动所做的更改","reset_btn":"重置","reset_none":"无需重置：一切与配置一致。","reset_done":"已恢复为配置：","k_all":"全部","k_scenario":"场景","k_delivery":"渠道","k_recipient":"人员","k_transport":"传输方式","q_config":"配置","q_scen":"场景","q_active":"活动场景","q_by_scen":"按场景的渠道","q_implicit":"默认渠道","q_recipients":"接收人","q_occupancy":"谁在家","q_snoozes":"暂停","q_last":"最后一条通知","copy":"复制 JSON","copied":"已复制","close":"关闭","empty":"（空）","err":"SuperNotify 返回了错误：","err_config":"当某个渠道带有模板条件时，SuperNotify 2.12.0 无法返回其配置（rhizomatics/supernotify#241）。","settings":"集成设置","running":"处理中…","more":"更多"},"SN_FORM_LABELS":{"_common":"外观和文字","style":"颜色","icons":"图标","show_version":"显示卡片版本","intro":"顶部的介绍文字","title":"标题","dnd_entity":"勿扰开关","quiet_entity":"计算得出的安静状态（可选）","presence_entity":"状态栏中的人员","archive_days":"存档清理：早于（天）","media_days":"图片清理：早于（天）","occupancy":"谁在家（来自 SuperNotify）","repairs":"在健康列表中显示 SuperNotify 修复","snooze_announce":"大声播报暂停（播报渠道）","snooze_via":"暂停的执行方式","o_event":"推送按钮事件（管理员）","o_voice":"语音命令","snooze_minutes":"暂停时长（分钟）","snooze_panel":"暂停磁贴打开暂停面板","announce_delivery":"播报渠道","last_notification":"显示最后一条通知","last_channels":"最后一条通知中每个渠道一个标签","repeat_entity":"重复上一条按钮（可选）","tile_layout":"磁贴","tile_columns":"磁贴列数（留空 = 自动）","update_entity":"SuperNotify 更新实体","cards_update_entity":"卡片更新实体","sent_today_entity":"每日计数器（utility meter，可选）","count_entity":"SuperNotify 计数器（长期统计）","health":"顶部显示健康状况","stats":"数字","poll_seconds":"刷新间隔（秒）","group":"按渠道启动方式分组","hide_defaults":"隐藏自动的 DEFAULT_ 渠道","limit":"列表中的通知数","expand":"展开折叠部分","max_height":"最大高度（CSS，例如 70vh）","source":"存档来源","entity":"存档传感器（仅桥接）","trigger_entity":"此项变化时刷新","dry_run":"显示“试一下，不发送”","dry_run_dupe_check":"同时模拟重复检查","days":"默认显示天数","manifest_url":"自动化清单 URL","o_supernotify":"SuperNotify","o_theme":"Home Assistant 主题","o_mdi":"Home Assistant 图标","o_emoji":"Emoji","o_row":"图标在左侧","o_stacked":"高型，图标在上方","o_three":"已发送、失败、渠道","o_full":"全部五项","o_auto":"自动","o_sensor":"传感器桥接（SuperNotify 2.10 之前）","o_archive":"SuperNotify 存档（2.12.1+）","o_history":"辅助元素的历史"},"SN_NATIVE_STR":{"all_good":"一切正常","paused":"已暂停","until":"直到","resume":"恢复","test":"发送测试","sure":"再次点按以发送","sent":"已发送","last":"最后","none":"还没有通知","ago":"前","min":"分钟","h":"小时","err":"个传输方式出错","off":"个渠道已关闭"},"SN_STRATEGY_TITLES":{"home":"主页","send":"发送","setup":"设置","stats":"统计","tools":"工具","title":"SuperNotify"}},"hi":{"SN_STRINGS":{"presence":"उपस्थिति","time_band":"समय खंड","quiet":"शांत","act_scen":"सक्रिय परिदृश्य","on":"चालू","off":"बंद","active":"सक्रिय","dnd":"परेशान न करें","tap_silence":"शांत करने के लिए टैप करें","snooze":"स्नूज़","min":"मिनट","pause_nc":"गैर-गंभीर रोकें","snoozed":"स्नूज़ किया गया","until":"तक","tap_clear":"हटाने के लिए टैप करें","announce":"घोषणा","intercom":"इंटरकॉम","announce_ph":"सभी स्पीकर पर घोषणा करें…","send":"भेजें","announced":"घोषित","cleared":"स्नूज़ हटाए गए","snoozed_for":"गैर-गंभीर सूचनाएँ स्नूज़ की गईं:","sent":"भेजी गईं","sent_today":"आज भेजी गईं","since_startup":"शुरू होने से","yesterday":"कल","failures":"विफलताएँ","fail_today":"आज विफल चैनल भेजना","deliveries":"डिलीवरी","enabled_total":"सक्षम/कुल","last_notif":"अंतिम सूचना","transports":"परिवहन","delivered":"पहुँचाई गई","failed":"विफल","channels":"चैनल","none":"कोई नहीं","no_transports":"कोई परिवहन entity नहीं मिली","tr_used":"इसके द्वारा उपयोग","tr_unused":"कोई चैनल इसका उपयोग नहीं करता","start":"शुरुआत","volume":"वॉल्यूम","now":"अभी","crosses":"आधी रात पार करता है","no_voice":"आवाज़ नहीं","mute_hint":"<b>0%</b> वाला खंड बिल्कुल <b>कोई आवाज़ घोषणा नहीं</b> भेजता (Alexa और TTS बंद, पुश और डैशबोर्ड फिर भी पहुँचते हैं)। गंभीर और उच्च प्राथमिकता वाली चेतावनियाँ हमेशा बोलती हैं।","enabled":"सक्षम","implicit":"हमेशा चालू","explicit":"माँगने पर","by_scenario":"केवल परिदृश्य से","fallback":"बैकअप","fallback_err":"त्रुटि पर बैकअप","inc_sum":"इन चैनलों में से","inc_always":"अपने आप शुरू होते हैं","inc_req":"केवल माँगने पर","inc_scen":"केवल किसी परिदृश्य के साथ","grp_auto":"अपने आप शुरू होते हैं","grp_named":"केवल जब कॉल में नाम हो","grp_scen":"केवल किसी परिदृश्य के साथ","grp_fallback":"बैकअप, जब बाकी विफल हों","ch_title":"चैनल","ch_count":"{tot} में से {on} चालू","off_manual":"बंद किया गया","paused_by":"अभी रोका गया:","on_by":"अभी चालू, इसके ज़रिए:","fixed_targets":"निश्चित लक्ष्य","no_deliveries":"कोई डिलीवरी entity नहीं मिली","home":"घर पर","away":"बाहर","devices":"डिवाइस","devices_1":"डिवाइस","rc_test":"परीक्षण भेजें","rc_test_confirm":"भेजने के लिए फिर टैप करें","rc_test_sent":"परीक्षण भेजा गया","rc_test_title":"SuperNotify परीक्षण","rc_test_msg":"डैशबोर्ड से परीक्षण संदेश,","overrides":"डिलीवरी ओवरराइड","overrides_1":"डिलीवरी ओवरराइड","no_contact":"कोई संपर्क बिंदु नहीं","no_recipients":"कोई प्राप्तकर्ता entity नहीं मिली","details":"विवरण","h_update":"अपडेट उपलब्ध:","h_restart":"अपडेट पूरा करने के लिए Home Assistant रीस्टार्ट करें","h_uptodate":"अद्यतित","h_transport_err":"त्रुटियों वाले परिवहन","h_channels_off":"चैनल बंद","h_all_good":"सब ठीक है","h_health":"स्वास्थ्य","h_failures":"विफलताएँ","h_failures_1":"विफलता","h_transport_err_1":"त्रुटि वाला परिवहन","h_channels_off_1":"चैनल बंद","channels_1":"चैनल","band_early_morning":"सुबह-सवेरे","band_morning":"सुबह","band_afternoon":"दोपहर","band_evening":"शाम","band_night":"रात","band_late_night":"देर रात","h_look_1":"1 चीज़ देखनी है","h_look_n":"{n} चीज़ें देखनी हैं","h_rest_ok":"बाकी सब काम कर रहा है","h_ch_on":"{tot} में से {on} चैनल चालू","h_open":"खोलें","ln_delivered":"पहुँचाई गई","ln_failed":"विफल","ln_why":"क्यों","tgt_loading":"चयनकर्ता लोड हो रहा है…","bands_empty_t":"अभी कोई समय खंड नहीं","bands_empty":"दिन के हर हिस्से के लिए एक खंड जोड़ें: उसकी शुरुआत के लिए एक input_datetime और आवाज़ के वॉल्यूम के लिए एक input_number।","active_now":"अभी सक्रिय","disabled":"अक्षम","other":"अन्य","manual":"मैनुअल","apply_now":"अभी लागू करें","applied":"लागू","apply_off":"लागू करना रोकने के लिए टैप करें","enabled_lbl":"सक्षम","reset_overrides":"ओवरराइड रीसेट करें","reset_done":"ओवरराइड रीसेट हुए","transport_off":"परिवहन बंद","last_notified":"अंतिम सूचना","never_notified":"कभी सूचना नहीं","media":"मीडिया","no_scenarios":"कोई परिदृश्य entity नहीं मिली","sim_pick":"🎬 परिदृश्य — सिम्युलेट करने के लिए टैप करें","sim_fire":"📤 चैनल","sim_hint":"इंजन का वास्तविक डेटा (enquire सेवाएँ)। प्राथमिकता के आधार पर डिलीवरी फ़िल्टरिंग इंजन में होती है और यहाँ सिम्युलेट नहीं की जाती। रनटाइम मर्ज की तरह, अक्षम सक्षम पर भारी पड़ता है।","sim_none":"कोई डिलीवरी नहीं चलेगी","scenario_tag":"परिदृश्य","sim_go":"भेजी जाएगी","sim_stop":"नहीं भेजी जाएगी","sim_r_default":"अपने आप शुरू होती है","sim_r_on":"चालू की गई:","sim_r_off":"बंद की गई:","sim_r_named":"केवल जब कॉल में नाम हो","sim_r_scen":"केवल ऐसे परिदृश्य के साथ जो इसे चालू करे","sim_r_fallback":"बैकअप, जब बाकी विफल हों","sim_r_switched":"बंद किया गया","title":"शीर्षक","message":"संदेश","priority":"प्राथमिकता","channels_lbl":"चैनल — कोई न चुना = सामान्य रूटिंग","camera_lbl":"कैमरा स्नैपशॉट","preview":"पूर्वावलोकन","no_title":"(कोई शीर्षक नहीं)","no_message":"(कोई संदेश नहीं)","default_prio":"डिफ़ॉल्ट (मध्यम)","comp_hint":"चुने गए चैनल delivery_selection: fixed के साथ भेजे जाते हैं (केवल वही चलते हैं)। गंभीर सचमुच गंभीर है — सायरन सहित।","critical_confirm":"गंभीर सूचना भेजें? सायरन और अधिकतम वॉल्यूम सहित।","write_first":"पहले एक संदेश लिखें","sent_toast":"भेजी गई","write_or_pick":"एक संदेश लिखें, या कोई कैमरा या चैनल चुनें","need_2111":"बिना टेक्स्ट की सूचना के लिए SuperNotify 2.11.1 चाहिए","send_err":"नहीं भेजी गई","dry_btn":"बिना भेजे आज़माएँ","dry_title":"अगर आप इसे अभी भेजते","dry_err":"ड्राई रन विफल","dry_would":"भेजेगा","dry_skip":"छोड़ा गया","dry_nobody":"कोई प्राप्तकर्ता नहीं, केवल सीधे लक्ष्य","dry_targets":"लक्ष्य","dry_suppressed":"सूचना दबा दी जाएगी","dry_fallback":"कोई चैनल नहीं चलेगा: फ़ॉलबैक","dry_none":"कोई चैनल नहीं चुना गया","dry_scen":"सक्रिय परिदृश्य","dry_raw":"कच्चा उत्तर","dry_prio":"प्राथमिकता","dry_would_n":"चैनल भेजेंगे","dry_nothing":"कुछ नहीं भेजा जाएगा","dry_dupe":"हाल की सूचना का डुप्लिकेट: इसे छोड़ दिया जाएगा","dry_no_dupe":"डुप्लिकेट जाँच सिम्युलेट नहीं हुई, इसलिए ठीक बाद का असली भेजना अवरुद्ध नहीं होगा।","dry_restart":"अभी चल रहा SuperNotify सिम्युलेट नहीं कर सकता: ड्राई रन के लिए 2.12 चाहिए, और अपडेट के बाद Home Assistant रीस्टार्ट करना ज़रूरी है।","dry_home":"घर पर","dry_empty":"SuperNotify ने कोई उत्तर नहीं दिया: क्या यह 2.12 या नया है?","dry_reasons":{"NO_TARGET":"कोई उपयोगी लक्ष्य नहीं","DUPE":"डुप्लिकेट","PRIORITY":"इस प्राथमिकता के लिए नहीं","SNOOZED":"स्नूज़ किया गया","DELIVERY_CONDITION":"डिलीवरी शर्त असत्य","OCCUPANCY":"उपस्थिति नियम","TRANSPORT_DISABLED":"परिवहन बंद","DELIVERY_DISABLED":"बंद किया गया","NO_SCENARIO":"आवश्यक परिदृश्य लागू नहीं","NO_ACTION":"कोई क्रिया नहीं","INVALID_ACTION_DATA":"अमान्य डेटा","UNKNOWN":"अज्ञात कारण","ERROR":"त्रुटि"},"prio_minimum":"न्यूनतम","prio_low":"कम","prio_medium":"मध्यम","prio_high":"उच्च","prio_critical":"गंभीर","target_lbl":"लक्ष्य — लोग, डिवाइस, क्षेत्र, मंज़िलें, लेबल","custom_target_lbl":"कस्टम लक्ष्य (ईमेल, Telegram ID, …) — कॉमा से अलग","adv_title":"उन्नत विकल्प","adv_spoken":"बोला जाने वाला संदेश (Alexa, TTS)","adv_spoken_ph":"स्पीकर क्या बोलें, अगर टेक्स्ट से अलग हो","adv_apply":"ये परिदृश्य लागू करें","adv_require":"केवल तभी भेजें जब ये परिदृश्य सक्रिय हों","adv_constrain":"केवल इन परिदृश्यों पर विचार करें","adv_snapshot":"URL से चित्र","adv_debug":"डीबग: पूरा चयन ट्रेस दर्ज करें (\"क्यों\" कार्ड में दिखता है)","custom_target_ph":"जैसे user@example.com, 123456789","native_target_tag":"🎯 नेटिव क्षेत्र/मंज़िल/लेबल","target_warn":"⚠️ क्षेत्र, मंज़िलें और लेबल केवल notify_entity, alexa_devices, html5, ntfy, kodi, media_player, tts और chime द्वारा हल किए जाते हैं। किसी अन्य चैनल के साथ — या ऊपर कोई चैनल न चुनने पर डिफ़ॉल्ट रूटिंग के साथ — सूचना चुपचाप बिना लक्ष्य के रह सकती है। कोई संगत चैनल चुनें, या सीधे कोई व्यक्ति/डिवाइस जोड़ें।","aut_search":"स्वचालन खोजें…","aut_all":"सभी","aut_none":"कोई मेल नहीं","aut_err":"मैनिफ़ेस्ट नहीं मिला — इसे tools/genera_vista_automazioni.py से बनाएँ","aut_updated":"सूची अपडेट हुई","aut_count":"स्वचालन","aut_count_1":"स्वचालन","never":"कभी नहीं","ago_now":"अभी","ago_min":"मिनट पहले","ago_h":"घंटे पहले","ago_d":"दिन पहले","aut_disabled_only":"केवल अक्षम","grp_active":"सक्रिय","repeat":"दोहराएँ","skipped_n":"छोड़ी गईं","left":"शेष","missed_n":"छूटी","snz_all":"सब कुछ","snz_nc":"गैर-गंभीर","snz_prio":"प्राथमिकता","snz_transport":"परिवहन","snz_for":"के लिए","snz_choose":"क्या और कितनी देर चुनें","snz_title":"सूचनाएँ रोकें","snz_what":"क्या","snz_nc_l":"गैर-गंभीर","snz_all_l":"सब कुछ","snz_ch":"एक चैनल","snz_pr":"एक प्राथमिकता","snz_who":"किसके लिए","snz_everyone":"सभी","snz_me":"केवल मैं","snz_len":"कितनी देर","snz_forever":"जब तक मैं फिर शुरू न करूँ","snz_go":"रोकें","snz_close":"बंद करें","rs_hand":"हाथ से","rs_voice":"आवाज़ से","rs_assist":"सहायक द्वारा","snz_voice_info":"आपके विराम SuperNotify के वॉइस कमांड से जाते हैं: वे केवल आपके हैं।","snz_voice_off":"SuperNotify के वॉइस कमांड बंद हैं: उन्हें इंटीग्रेशन विकल्पों में चालू करें।","snz_resume_mine":"मेरे फिर शुरू करें","go_open":"दिखाएँ","dl_probe":"यह चैनल आज़माएँ","probe_msg":"डैशबोर्ड से चैनल परीक्षण","sc_why":"क्यों","sc_yes":"अभी लागू","sc_no":"अभी लागू नहीं","sc_manual_why":"मैनुअल परिदृश्य: हाथ से लागू किया गया","sc_no_cond":"कोई शर्त नहीं","sc_off_sw":"बंद किया गया","sc_not_eval":"जाँचा नहीं गया","sc_now":"अभी","sc_diff_btn_on":"लागू होने पर क्या बदलेगा","sc_diff_btn_off":"इसके बिना क्या बदलेगा","sc_diff_on":"अगर यह लागू होता, अभी एक मध्यम सूचना के लिए:","sc_diff_off":"इसके बिना, अभी एक मध्यम सूचना के लिए:","sc_diff_add":"यह भी भेजेगा","sc_diff_rem":"अब नहीं भेजेगा","sc_diff_none":"कोई अंतर नहीं","c_state":"{e} {s} है","c_template":"टेम्पलेट शर्त","c_time":"समय","c_after":"के बाद","c_before":"से पहले","c_numeric":"{e}","c_above":"से ऊपर","c_below":"से नीचे","c_and":"ये सभी","c_or":"इनमें से कम से कम एक","c_not":"इनमें से कोई नहीं","c_or_join":" या ","sim_hint_dry":"SuperNotify का अपना उत्तर (ड्राई रन, कुछ नहीं भेजा जाता): अभी एक सूचना, ऊपर चुनी गई प्राथमिकता और केवल चुने गए परिदृश्यों के साथ।","sim_msg":"सिम्युलेटर परीक्षण","sim_prio":"प्राथमिकता","sa_snooze":"{what} {len} के लिए रोकी गईं।","sa_silence":"{what} अगली सूचना तक शांत।","sa_resume":"{what} फिर से चालू।","sa_resume_one":"विराम समाप्त: {x}।","sa_resume_all":"सूचनाएँ फिर से चालू।","sa_w_nc":"गैर-गंभीर सूचनाएँ","sa_w_all":"सभी सूचनाएँ","sa_w_ch":"चैनल {x}","sa_w_pr":"{x} प्राथमिकता की सूचनाएँ","sa_w_mine":"आपकी सूचनाएँ","sa_for":"{x} के लिए","sa_min":"{n} मिनट","sa_hour":"एक घंटा","sa_hours":"{n} घंटे","occ_title":"कौन घर पर है","occ_home_l":"घर पर","occ_ALL_HOME":"सभी घर पर","occ_ALL_AWAY":"सभी बाहर","occ_LONE_HOME":"केवल एक घर पर","occ_MULTI_HOME":"कुछ घर पर","occ_UNDEFINED_OCCUPANTS":"कोई ट्रैक नहीं","h_repairs":"SuperNotify मरम्मत","h_repairs_1":"SuperNotify मरम्मत","det_more":"सभी विशेषताएँ","det_yes":"हाँ","det_no":"नहीं","det_action":"क्रिया","det_target":"निश्चित लक्ष्य","det_target_req":"लक्ष्य चाहिए","det_target_use":"लक्ष्य उपयोग","det_inclusion":"कब उपयोग","det_prio":"प्राथमिकताएँ","det_occ":"किसे घर पर होना चाहिए","det_transport":"परिवहन","det_data":"डेटा","det_debug":"डीबग","det_err_last":"अंतिम त्रुटि","det_err_in":"में","det_err_n":"शुरू से त्रुटियाँ","det_select":"चयन","adv_html":"ईमेल के लिए टेक्स्ट (HTML)","adv_clip":"URL से वीडियो क्लिप","adv_actions":"सूचना पर बटन","adv_act_id":"क्रिया id","adv_act_title":"बटन टेक्स्ट","adv_act_add":"+ बटन","adv_groups":"बटन समूह (कॉमा)","adv_dc":"इस सूचना के लिए चैनल सेटिंग्स","adv_dc_ph":"key: value, हर पंक्ति में एक","adv_dc_add":"+ चैनल","snz_active":"अभी रुका हुआ","snz_resume":"फिर शुरू करें","snz_resume_all":"सब फिर शुरू करें","snz_until_resumed":"फिर शुरू होने तक","snz_done":"रोका गया","snz_resumed":"फिर शुरू हुआ","no_notif":"अभी कोई सूचना नहीं","st_title":"उपयोग","st_days":"दिन","st_days_short":"दि","st_hist_note":"इतिहास के पिछले {n} दिनों के घंटे, चैनल और प्राथमिकताएँ","st_total":"सूचनाएँ","st_avg":"प्रति दिन","st_today":"आज","st_vs_avg":"औसत की तुलना में","st_peak_hour":"सबसे व्यस्त घंटा","st_top_channel":"शीर्ष चैनल","st_errors":"चैनल त्रुटियाँ","st_of_sends":"चैनल भेजे गए में से","st_daily":"प्रति दिन","st_hourly":"दिन के घंटे के अनुसार","st_weekday":"सप्ताह के दिन के अनुसार","st_channels":"चैनल — सबसे अधिक उपयोग","st_priority":"प्राथमिकता","st_period":"दिन का समय","st_insights":"जानकारियाँ","st_no_data":"अभी कोई इतिहास नहीं — पहली सूचनाओं के बाद डेटा दिखेगा।","st_unknown":"अज्ञात","st_loading":"लोड हो रहा है…","st_versions":"संस्करण","st_installed":"इंस्टॉल","st_latest":"नवीनतम","st_uptodate":"अद्यतित","st_update":"अपडेट उपलब्ध","st_restart":"रीस्टार्ट आवश्यक","st_cards":"कार्ड","st_logged":"दर्ज","st_reading":"संग्रह पढ़ा जा रहा है: दिन {n} / {of}…","st_from_archive":"SuperNotify के संग्रह से","st_archive_err":"संग्रह आंशिक रूप से पढ़ा गया","st_wd":["सोम","मंगल","बुध","गुरु","शुक्र","शनि","रवि"],"st_i_share":"सभी चैनल भेजे गए में से {p}% {c} से जाते हैं।","st_i_peak":"सबसे व्यस्त घंटा {h}:00 है ({d} दिनों में {n} सूचनाएँ)।","st_i_night":"{p}% सूचनाएँ 23:00 और 07:00 के बीच आती हैं — अगर यह नहीं चाहिए तो DND परिदृश्य पर विचार करें।","st_i_night_ok":"केवल {p}% सूचनाएँ रात में (23–07) आती हैं: शांत घंटे काम कर रहे हैं।","st_i_weekend":"सप्ताहांत के दिनों में कार्यदिवसों की तुलना में {p}% {dir} सूचनाएँ आती हैं।","st_i_errors":"{d} दिनों में {n} चैनल त्रुटियाँ, ज़्यादातर {c} पर।","st_i_noerr":"पिछले {d} दिनों में कोई चैनल त्रुटि नहीं।","st_i_prio":"{p}% सूचनाएँ {prio} प्राथमिकता की हैं।","st_i_trend":"पिछले 7 दिन: {n}/दिन, पहले के 7 दिनों की तुलना में {p}% {dir}।","st_more":"अधिक","st_less":"कम","st_up":"ऊपर","st_down":"नीचे"},"SN_STATS_STRINGS":{"st_title":"उपयोग","st_days":"दिन","st_days_short":"दि","st_hist_note":"इतिहास के पिछले {n} दिनों के घंटे, चैनल और प्राथमिकताएँ","st_total":"सूचनाएँ","st_avg":"प्रति दिन","st_today":"आज","st_vs_avg":"औसत की तुलना में","st_peak_hour":"सबसे व्यस्त घंटा","st_top_channel":"शीर्ष चैनल","st_errors":"चैनल त्रुटियाँ","st_of_sends":"चैनल भेजे गए में से","st_daily":"प्रति दिन","st_hourly":"दिन के घंटे के अनुसार","st_weekday":"सप्ताह के दिन के अनुसार","st_channels":"चैनल — सबसे अधिक उपयोग","st_priority":"प्राथमिकता","st_period":"दिन का समय","st_insights":"जानकारियाँ","st_no_data":"अभी कोई इतिहास नहीं — पहली सूचनाओं के बाद डेटा दिखेगा।","st_unknown":"अज्ञात","st_loading":"लोड हो रहा है…","st_versions":"संस्करण","st_installed":"इंस्टॉल","st_latest":"नवीनतम","st_uptodate":"अद्यतित","st_update":"अपडेट उपलब्ध","st_restart":"रीस्टार्ट आवश्यक","st_cards":"कार्ड","st_logged":"दर्ज","st_reading":"संग्रह पढ़ा जा रहा है: दिन {n} / {of}…","st_from_archive":"SuperNotify के संग्रह से","st_archive_err":"संग्रह आंशिक रूप से पढ़ा गया","st_wd":["सोम","मंगल","बुध","गुरु","शुक्र","शनि","रवि"],"st_i_share":"सभी चैनल भेजे गए में से {p}% {c} से जाते हैं।","st_i_peak":"सबसे व्यस्त घंटा {h}:00 है ({d} दिनों में {n} सूचनाएँ)।","st_i_night":"{p}% सूचनाएँ 23:00 और 07:00 के बीच आती हैं — अगर यह नहीं चाहिए तो DND परिदृश्य पर विचार करें।","st_i_night_ok":"केवल {p}% सूचनाएँ रात में (23–07) आती हैं: शांत घंटे काम कर रहे हैं।","st_i_weekend":"सप्ताहांत के दिनों में कार्यदिवसों की तुलना में {p}% {dir} सूचनाएँ आती हैं।","st_i_errors":"{d} दिनों में {n} चैनल त्रुटियाँ, ज़्यादातर {c} पर।","st_i_noerr":"पिछले {d} दिनों में कोई चैनल त्रुटि नहीं।","st_i_prio":"{p}% सूचनाएँ {prio} प्राथमिकता की हैं।","st_i_trend":"पिछले 7 दिन: {n}/दिन, पहले के 7 दिनों की तुलना में {p}% {dir}।","st_more":"अधिक","st_less":"कम","st_up":"ऊपर","st_down":"नीचे"},"SN_ARCH_STRINGS":{"title":"सूचना इतिहास","search":"शीर्षक या संदेश खोजें…","f_all":"सभी","f_problems":"केवल समस्याएँ","f_today":"आज","f_whisper":"फुसफुसाई गईं","wh":"फुसफुसाई गई","said":"Alexa ने कहा","said_by":"{ch} ने कहा","none":"कोई सूचना मेल नहीं खाती","no_sensor":"सेंसर नहीं मिला","no_sensor_hint":"SuperNotify को 2.10 या नए संस्करण में अपडेट करें, जिसमें supernotify.enquire_archive क्रिया है, या संग्रह को इंडेक्स करने वाला command_line सेंसर जोड़ें (README देखें)।","loading":"संग्रह पढ़ा जा रहा है…","recent":"नवीनतम सूचनाएँ","read_at":"पढ़ा गया","of":"में से","in_archive":"संग्रह में","since":"सबसे पुरानी","updated":"इंडेक्स अपडेट हुआ","today":"आज","yesterday":"कल","delivered":"पहुँचाई गई","failed":"विफल","skipped":"छोड़ी गई","missed":"छूटी","prio":{"critical":"गंभीर","high":"उच्च","low":"कम","minimum":"न्यूनतम","medium":"मध्यम"},"reasons":{"doppione":"डुप्लिकेट","nessun target":"कोई लक्ष्य नहीं","errore":"त्रुटि","condizione":"शर्त","scenario":"परिदृश्य","presenza":"उपस्थिति","priorita":"प्राथमिकता","spento":"बंद","pausa":"स्नूज़ किया गया","transport spento":"परिवहन बंद","nessuna azione":"कोई क्रिया नहीं","dati non validi":"अमान्य डेटा","sconosciuto":"अज्ञात"},"scenarios":"लागू परिदृश्य","truncated":"इंडेक्स में संदेश छोटा किया गया","dur":"लगा समय","id":"id","why":"क्यों? - पूरा विवरण"},"SN_WHY_STRINGS":{"title":"क्यों?","pick":"कोई सूचना चुनें यह देखने के लिए कि वह जहाँ गई वहाँ क्यों गई।","loading":"लोड हो रहा है…","none":"कोई सूचना नहीं","no_sensor":"सेंसर नहीं मिला:","no_service":"सेवा नहीं मिली","no_service_hint":"SuperNotify को 2.10 या नए संस्करण में अपडेट करें (supernotify.enquire_archive), या shell_command sn_archive_detail जोड़ें (README देखें) और Home Assistant रीस्टार्ट करें।","gone":"यह सूचना अब संग्रह में नहीं है","priority":"प्राथमिकता","outcome":"परिणाम","dupe":"डुप्लिकेट","outcomes":{"success":"पहुँचाई गई","partial_delivery":"आंशिक रूप से पहुँचाई गई","dupe":"डुप्लिकेट","failed":"विफल","error":"विफल","fallback_delivery":"फ़ॉलबैक चैनल से पहुँचाई गई","no_delivery":"नहीं पहुँचाई गई"},"missed":"छूटी (माँगी गई, भेजी नहीं गई)","step_call":"कॉल","step_scen":"परिदृश्य","step_people":"लोग","step_ch":"चैनल","call_auto":"कोई चैनल नामित नहीं: सामान्य रूटिंग","call_named":"कॉल में नामित:","call_debug":"डीबग के साथ","nobody":"घर पर कोई नहीं","ch_sent":"भेजे गए","ch_problems":"देखने योग्य","ch_skipped":"छोड़े गए","pb_failed":"विफल","pb_missed":"माँगा गया पर भेजा नहीं गया","grp_skipped":"किसी नियम से छोड़े गए: सामान्य","grp_not":"शामिल नहीं","trace_title":"पूरा चयन ट्रेस","fix":{"NO_TARGET":"किसी प्राप्तकर्ता के पास इस चैनल का पता नहीं है: किसी प्राप्तकर्ता में एक जोड़ें, चैनल को निश्चित लक्ष्य दें, या इसे इस कॉल से हटा दें।","ERROR":"इस चैनल के पीछे के इंटीग्रेशन ने त्रुटि लौटाई: उसकी अपनी लॉग प्रविष्टि देखें।","NO_ACTION":"चैनल के पास कॉल करने के लिए कोई क्रिया नहीं है: डिलीवरी पर `action:` सेट करें।","INVALID_ACTION_DATA":"क्रिया को दिया गया डेटा अस्वीकार कर दिया गया: कॉल या डिलीवरी का `data:` जाँचें।"},"scenarios":"लागू परिदृश्य","no_scenarios":"कोई परिदृश्य लागू नहीं","applied":"कॉल द्वारा बाध्य","required":"कॉल द्वारा आवश्यक","constrain":"कॉल द्वारा सीमित:","presence":"उपस्थिति","home":"घर पर","away":"बाहर","channels":"चैनल","no_channels":"कोई चैनल नहीं चुना गया","st_ok":"पहुँचाई गई","st_err":"विफल","st_skip":"छोड़ी गई","st_supp":"दबाई गई","calls":"कॉल","calls_1":"कॉल","target_required":"लक्ष्य आवश्यक:","started_by":"इसके द्वारा चुना गया:","scen_would_off":"बंद करता (रद्द किया गया):","src_default":"हमेशा चालू (डिफ़ॉल्ट)","src_scen":"परिदृश्य","src_call":"कॉल स्वयं","src_recipient":"प्राप्तकर्ता","r_off_by":"बंद किया गया:","call_targets":"कॉल में लक्ष्य","cats":{"entity_id":"entities","mobile_app_id":"डिवाइस","person_id":"लोग","email":"ईमेल","phone":"फ़ोन","device_id":"डिवाइस"},"not_started":"चैनल जो शुरू नहीं हुए","r_call_off":"कॉल द्वारा बाहर रखा गया","r_scen_off":"लागू परिदृश्य द्वारा बंद किया गया","r_disabled":"बंद किया गया","r_transport_off":"इसका परिवहन बंद है","r_only_scen":"केवल तब शुरू होता है जब कोई परिदृश्य इसे चालू करे","r_only_fallback":"केवल फ़ॉलबैक","r_only_explicit":"केवल नाम से माँगने पर शुरू होता है","r_priority":"इस प्राथमिकता के लिए नहीं","r_unknown":"ट्रेस के बिना पुनर्निर्मित नहीं किया जा सकता","from_config":"शुरू न हुए चैनलों के कारण कॉन्फ़िगरेशन से पुनर्निर्मित किए जाते हैं जैसा वह अभी है, न कि जैसा तब था।","from_trace":"कारण सूचना के साथ संग्रहीत चयन ट्रेस से आते हैं।","st_time":"लगा समय","st_slow":"सबसे धीमा","st_rate":"चैनल सफल हुए","ua_title":"लक्ष्य जिन्हें किसी चैनल ने नहीं लिया","ua_hint":"वे कॉल में थे, पर कोई चुना गया चैनल इस प्रकार का लक्ष्य स्वीकार नहीं करता।","un_title":"नाम जो मौजूद नहीं हैं","sent_by":"भेजने वाला","sent_auto":"स्वचालन","sent_script":"स्क्रिप्ट","sent_person":"","sent_unknown":"भेजने वाला अज्ञात (इसके संदर्भ में कोई स्वचालन या व्यक्ति नहीं)","trace":"चयन ट्रेस","no_trace":"पूरा चयन ट्रेस केवल तभी दर्ज होता है जब notify कॉल में debug: true हो, और तभी संग्रहीत होता है जब संग्रह डायग्नोस्टिक्स में यह शामिल हो।","reasons":{"NO_TARGET":"कोई उपयोगी लक्ष्य नहीं","DUPE":"हाल की सूचना का डुप्लिकेट","PRIORITY":"इस प्राथमिकता के लिए नहीं","SNOOZE":"स्नूज़ किया गया","SNOOZED":"स्नूज़ किया गया","DELIVERY_CONDITION":"डिलीवरी शर्त असत्य","OCCUPANCY":"उपस्थिति नियम","ERROR":"त्रुटि","DELIVERY_DISABLED":"बंद किया गया","SCENARIO":"परिदृश्य","TRANSPORT_DISABLED":"इसका परिवहन बंद है","NO_SCENARIO":"एक आवश्यक परिदृश्य लागू नहीं है","NO_ACTION":"कॉल करने के लिए कोई क्रिया नहीं","INVALID_ACTION_DATA":"अमान्य क्रिया डेटा","UNKNOWN":"अज्ञात कारण"}},"SN_TOOLS_STRINGS":{"maint":"रखरखाव","enq":"SuperNotify से पूछें","refresh":"हर entity फिर से प्रकाशित करें","refresh_btn":"रीफ़्रेश","resume_btn":"फिर शुरू करें","refreshed":"Entities फिर से प्रकाशित हुईं।","resume_all":"हर विराम फिर शुरू करें","cleared_n":"विराम फिर शुरू हुए","purge_arch":"संग्रह साफ़ करें","purge_media":"चित्र साफ़ करें","older":"इससे पुराने","days":"दिन","purge_btn":"साफ़ करें","confirm":"पुष्टि के लिए फिर टैप करें","purged":"हटाए गए","remaining":"शेष","reset":"हाथ से किए गए बदलाव पूर्ववत करें","reset_btn":"रीसेट","reset_none":"रीसेट करने को कुछ नहीं: सब कुछ कॉन्फ़िगरेशन के अनुसार है।","reset_done":"कॉन्फ़िगरेशन पर वापस:","k_all":"सब कुछ","k_scenario":"परिदृश्य","k_delivery":"चैनल","k_recipient":"लोग","k_transport":"परिवहन","q_config":"कॉन्फ़िगरेशन","q_scen":"परिदृश्य","q_active":"सक्रिय परिदृश्य","q_by_scen":"परिदृश्य के अनुसार चैनल","q_implicit":"डिफ़ॉल्ट चैनल","q_recipients":"प्राप्तकर्ता","q_occupancy":"कौन घर पर है","q_snoozes":"विराम","q_last":"अंतिम सूचना","copy":"JSON कॉपी करें","copied":"कॉपी हुआ","close":"बंद करें","empty":"(खाली)","err":"SuperNotify ने त्रुटि के साथ उत्तर दिया:","err_config":"SuperNotify 2.12.0 अपना कॉन्फ़िगरेशन नहीं लौटा सकता जब किसी चैनल में टेम्पलेट शर्तें हों (rhizomatics/supernotify#241)।","settings":"इंटीग्रेशन सेटिंग्स","running":"काम चल रहा है…","more":"और"},"SN_FORM_LABELS":{"_common":"रूप और टेक्स्ट","style":"रंग","icons":"आइकन","show_version":"कार्ड संस्करण दिखाएँ","intro":"ऊपर परिचय टेक्स्ट","title":"शीर्षक","dnd_entity":"परेशान-न-करें स्विच","quiet_entity":"गणना की गई शांत स्थिति (वैकल्पिक)","presence_entity":"स्थिति पट्टी के लिए व्यक्ति","archive_days":"संग्रह सफ़ाई: इससे पुराने (दिन)","media_days":"चित्र सफ़ाई: इससे पुराने (दिन)","occupancy":"कौन घर पर है (SuperNotify से)","repairs":"स्वास्थ्य सूची में SuperNotify मरम्मत","snooze_announce":"विराम ज़ोर से बोलें (घोषणा चैनल)","snooze_via":"विराम इसके ज़रिए जाते हैं","o_event":"पुश बटन इवेंट (व्यवस्थापक)","o_voice":"वॉइस कमांड","snooze_minutes":"स्नूज़ अवधि (मिनट)","snooze_panel":"स्नूज़ टाइल विराम पैनल खोलती है","announce_delivery":"घोषणाओं के लिए चैनल","last_notification":"अंतिम सूचना दिखाएँ","last_channels":"अंतिम सूचना में हर चैनल के लिए एक चिप","repeat_entity":"अंतिम-दोहराएँ बटन (वैकल्पिक)","tile_layout":"टाइलें","tile_columns":"टाइल कॉलम (खाली = स्वचालित)","update_entity":"SuperNotify अपडेट entity","cards_update_entity":"कार्ड अपडेट entity","sent_today_entity":"दैनिक काउंटर (utility meter, वैकल्पिक)","count_entity":"SuperNotify काउंटर (दीर्घकालिक आँकड़े)","health":"ऊपर स्वास्थ्य","stats":"संख्याएँ","poll_seconds":"हर इतने में रीफ़्रेश (सेकंड)","group":"चैनल कैसे शुरू होता है उसके अनुसार समूह","hide_defaults":"स्वचालित DEFAULT_ चैनल छिपाएँ","limit":"सूची में सूचनाएँ","expand":"मुड़े हुए हिस्से खोलें","max_height":"अधिकतम ऊँचाई (CSS, जैसे 70vh)","source":"संग्रह स्रोत","entity":"संग्रह सेंसर (केवल ब्रिज)","trigger_entity":"इसके बदलने पर रीफ़्रेश करें","dry_run":"\"बिना भेजे आज़माएँ\" दिखाएँ","dry_run_dupe_check":"डुप्लिकेट जाँच भी सिम्युलेट करें","days":"डिफ़ॉल्ट रूप से दिखाए गए दिन","manifest_url":"स्वचालन मैनिफ़ेस्ट URL","o_supernotify":"SuperNotify","o_theme":"Home Assistant थीम","o_mdi":"Home Assistant आइकन","o_emoji":"इमोजी","o_row":"बाईं ओर आइकन","o_stacked":"ऊँची, ऊपर आइकन","o_three":"भेजी गईं, विफलताएँ, चैनल","o_full":"सभी पाँच","o_auto":"स्वचालित","o_sensor":"सेंसर ब्रिज (SuperNotify 2.10 से पहले)","o_archive":"SuperNotify संग्रह (2.12.1+)","o_history":"सहायकों का इतिहास"},"SN_NATIVE_STR":{"all_good":"सब ठीक है","paused":"रुका हुआ","until":"तक","resume":"फिर शुरू करें","test":"परीक्षण भेजें","sure":"भेजने के लिए फिर टैप करें","sent":"भेजी गईं","last":"अंतिम","none":"अभी कोई सूचना नहीं","ago":"पहले","min":"मिनट","h":"घं","err":"त्रुटियों वाले परिवहन","off":"चैनल बंद"},"SN_STRATEGY_TITLES":{"home":"होम","send":"भेजें","setup":"सेटअप","stats":"आँकड़े","tools":"टूल","title":"SuperNotify"}}};
(() => {
  const dicts = { SN_STRINGS, SN_STATS_STRINGS, SN_ARCH_STRINGS, SN_WHY_STRINGS, SN_TOOLS_STRINGS, SN_FORM_LABELS,
    SN_NATIVE_STR, SN_STRATEGY_TITLES };
  for (const [lang, byDict] of Object.entries(SN_I18N_EXTRA)) {
    for (const [name, d] of Object.entries(dicts)) {
      if (d && d.en && byDict[name] && !d[lang]) d[lang] = { ...d.en, ...byDict[name] };
    }
  }
})();
