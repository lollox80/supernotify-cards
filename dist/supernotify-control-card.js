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

const VERSION = "0.19.0";

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
    enabled: "enabled", implicit: "implicit", explicit: "explicit",
    by_scenario: "by scenario", fallback: "fallback", fallback_err: "fallback on error",
    fixed_targets: "fixed targets", no_deliveries: "no delivery entities found",
    home: "home", away: "away", devices: "devices", overrides: "delivery overrides",
    no_contact: "no contact points", no_recipients: "no recipient entities found",
    details: "Details",
    active_now: "active now", disabled: "disabled", other: "Other",
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
    write_first: "Write a message first", sent_toast: "Sent 🚀",
    prio_minimum: "Minimum", prio_low: "Low", prio_medium: "Medium",
    prio_high: "High", prio_critical: "Critical ⚠️",
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
    enabled: "attiva", implicit: "implicita", explicit: "esplicita",
    by_scenario: "da scenario", fallback: "fallback", fallback_err: "fallback su errore",
    fixed_targets: "target fissi", no_deliveries: "nessuna entità delivery trovata",
    home: "in casa", away: "fuori", devices: "dispositivi", overrides: "override delivery",
    no_contact: "nessun recapito", no_recipients: "nessuna entità destinatario trovata",
    details: "Dettagli",
    active_now: "attivo ora", disabled: "disattivato", other: "Altro",
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
    write_first: "Scrivi prima un messaggio", sent_toast: "Inviata 🚀",
    prio_minimum: "Minima", prio_low: "Bassa", prio_medium: "Media",
    prio_high: "Alta", prio_critical: "Critica ⚠️",
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
  },
};

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
 * Shared CSS for the small pill on/off switch used by the toggle-able
 * delivery/transport/recipient rows (same look as automations-card's
 * enable/disable switch).
 */
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
      ...config,
    };
    this._rendered = false;
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
  }

  getCardSize() {
    return 4 + (this._config.groups || []).length;
  }

  connectedCallback() {
    this._pollTimer = setInterval(() => this._refreshSnoozes(), 60000);
    this._refreshSnoozes();
  }

  disconnectedCallback() {
    clearInterval(this._pollTimer);
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
        return { name, min: +h * 60 + +m, volume: b.volume };
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
    return known.filter((e) => this._st(e) === "on");
  }

  async _snooze() {
    // SuperNotify snoozing is event-driven (same mechanism as the push
    // notification buttons): fire a mobile_app_notification_action event
    // with a SUPERNOTIFY_<CMD>_<RECIPIENT>_<TARGET>_<minutes> action name.
    // NONCRITICAL keeps critical notifications flowing during the snooze.
    // When a snooze is already active, tapping the tile clears it instead.
    const T = snT(this._config, this._hass);
    if ((this._snoozes || []).length) {
      await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "clear_snoozes",
        service_data: {}, return_response: true,
      });
      this._toast(T.cleared);
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
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", warn: "var(--warning-color)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
        dot: "var(--disabled-text-color)",
      };
    }
    // "supernotify": the prototype's own identity (light/dark)
    return this._dark
      ? { brand: "#03a9f4", brandD: "#0288d1", ok: "#7fe0a5", warn: "#f0a020",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c",
          ink: "#e6ecf3", muted: "#8fa1b4", dot: "#3a4653" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", warn: "#f0a020",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb",
          ink: "#1f3b57", muted: "#64798f", dot: "#c3cdd8" };
  }

  // ── render ─────────────────────────────────────────────────────────────
  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 14px; position: relative; background: ${p.panel}; color: ${p.ink}; }
        .statusbar { display: flex; flex-wrap: wrap; gap: 8px 22px; padding: 13px 18px;
                     margin-bottom: 14px; border: 1px solid ${p.line}; border-radius: 14px;
                     background: ${p.panel}; box-shadow: 0 1px 3px rgba(16,42,67,.06); }
        .sseg { display: flex; flex-direction: column; gap: 2px; }
        .sl { font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
              font-weight: 800; color: ${p.muted}; white-space: nowrap; }
        .sv { font-size: 14px; font-weight: 750; white-space: nowrap; }
        .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                 gap: 12px; }
        .ctile { border: 1.5px solid ${p.line}; border-radius: 16px;
                 background: ${p.panel}; padding: 16px 10px;
                 text-align: center; cursor: pointer; user-select: none;
                 min-height: 100px; display: flex; flex-direction: column;
                 align-items: center; justify-content: center; gap: 5px;
                 transition: transform .1s, border-color .15s;
                 box-shadow: 0 1px 3px rgba(16,42,67,.06); }
        .ctile:hover { border-color: ${p.brand}; transform: translateY(-1px); }
        .ctile:active { transform: scale(.97); }
        .ctile .ti { --mdc-icon-size: 30px; font-size: 30px; line-height: 1.1; }
        .ctile b { font-size: 13.5px; }
        .ctile .ts { font-size: 11.5px; color: ${p.muted}; }
        .ctile.on { background: ${p.brand}; border-color: ${p.brandD}; color: #fff; }
        .ctile.on .ts { color: rgba(255,255,255,.88); }
        .ctile.warn { background: ${p.warn}; border-color: #d98d10; color: #fff; }
        .ctile.warn .ts { color: rgba(255,255,255,.92); }
        .announce { display: flex; gap: 8px; align-items: center; margin-top: 12px; }
        .announce input { flex: 1; border: 1.5px solid ${p.line}; border-radius: 10px;
                          padding: 10px 12px; font-size: 13.5px; background: ${p.panel};
                          color: ${p.ink}; }
        .announce input:focus { outline: none; border-color: ${p.brand};
                                box-shadow: 0 0 0 3px rgba(3,169,244,.14); }
        .announce button {
          border: 0; border-radius: 10px; background: ${p.brand}; color: #fff;
          font-weight: 700; padding: 10px 16px; cursor: pointer; font-size: 13px; }
        .mgroup { font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
                  font-weight: 800; color: ${p.muted}; margin: 14px 0 8px; }
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
        <div class="tiles" id="tiles"></div>
        ${(this._config.tiles || []).includes("announce") ? `<div class="announce" id="announceRow">
          <ha-icon icon="mdi:bullhorn"></ha-icon>
          <input id="announceInput" placeholder="${snT(this._config, this._hass).announce_ph}">
          <button id="announceBtn">${snT(this._config, this._hass).send}</button>
        </div>` : ""}
        <div id="groups"></div>
        <div class="ver">supernotify-control-card v${VERSION}</div>
        <div class="toast" id="toast"></div>
      </ha-card>`;
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
    this._renderTiles();
    this._renderGroups();
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
    bar.innerHTML = segs.join("");
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
      const act = this._snoozes || [];
      if (act.length) {
        const until = act[0] && act[0].snooze_until ? act[0].snooze_until.slice(0, 5) : "";
        return { cls: "warn", icon: "😴", name: T.snoozed,
          sub: (until ? T.until + " " + until + " · " : "") + T.tap_clear,
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
    el.innerHTML = defs
      .map((d, i) =>
        `<div class="ctile ${d.cls}" data-i="${i}" role="button" tabindex="0">
           ${this._icon(d.icon)}<b>${d.name}</b><div class="ts">${d.sub}</div>
         </div>`)
      .join("");
    el.querySelectorAll(".ctile").forEach((node) => {
      const d = defs[+node.dataset.i];
      node.onclick = () => d.act();
      node.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") d.act(); };
    });
  }

  _renderGroups() {
    const el = this.shadowRoot.getElementById("groups");
    el.innerHTML = (this._config.groups || [])
      .map((g) => {
        const pills = (g.entities || [])
          .map((ent) => {
            const id = typeof ent === "string" ? ent : ent.entity;
            const name = typeof ent === "string" ? this._friendly(id) : ent.name || this._friendly(id);
            const on = this._on(id);
            return `<span class="mpill ${on ? "on" : ""}" data-e="${id}" role="switch" aria-checked="${on}">
                      <span class="pd"></span>${name}</span>`;
          })
          .join("");
        return `<div class="mgroup">${g.name || ""}</div><div>${pills}</div>`;
      })
      .join("");
    el.querySelectorAll(".mpill").forEach((node) => {
      node.onclick = () => this._toggle(node.dataset.e);
    });
  }
}

customElements.define("supernotify-control-card", SupernotifyControlCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "supernotify-control-card",
  name: "SuperNotify Control Card",
  description: "Touch-first control center for SuperNotify: status, quick actions, grouped mode toggles.",
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
    this._config = { poll_seconds: 60, style: "supernotify", ...config };
    this._rendered = false;
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
  }

  getCardSize() {
    return 5;
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
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", warn: "var(--warning-color)",
        crit: "var(--error-color, #e23c3c)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#0288d1", ok: "#7fe0a5", warn: "#f0a020", crit: "#ff9a9a",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", warn: "#f0a020", crit: "#e23c3c",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
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
    return known.filter((e) => this._st(e) === "on");
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
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
        .stat { border: 1.5px solid ${p.line}; border-radius: 14px; padding: 12px 14px;
                background: ${p.panel}; box-shadow: 0 1px 3px rgba(16,42,67,.06); }
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
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div class="stats" id="stats"></div>
        <div class="sec">${snT(this._config, this._hass).last_notif}</div>
        <div class="lastmsg" id="last">—</div>
        <div class="sec">${snT(this._config, this._hass).act_scen}</div>
        <div id="scen">—</div>
        <div class="ver">supernotify-overview-card v${VERSION}</div>
      </ha-card>`;
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
    const snz = this._snoozes || [];
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
    this.shadowRoot.getElementById("stats").innerHTML =
      sentStat +
      stat("⚠️ " + T.failures, failures != null ? esc(failures) : "—", "", +failures > 0 ? p.crit : p.ok) +
      stat("🎬 " + T.act_scen, act ? act.length : "—", "") +
      stat("📤 " + T.deliveries, dels.length ? `${delsOn}/${dels.length}` : "—", T.enabled_total) +
      stat("😴 " + T.snoozed, snz.length, snz.length && snz[0].snooze_until ? T.until + " " + esc(String(snz[0].snooze_until).slice(0, 5)) : "", snz.length ? p.warn : undefined);

    const lastEl = this.shadowRoot.getElementById("last");
    if (this._last) {
      const n = this._last;
      const when = n.created ? esc(String(n.created).replace("T", " ").slice(0, 16)) : "";
      const msg = esc((n.message || "").slice(0, 90));
      const ok = (n.failed || 0) === 0;
      const prioCol = { critical: "#e23c3c", high: "#f0a020", medium: p.brandD }[n.priority];
      const prio = n.priority
        ? `<span class="badge" style="background:${p.soft};color:${prioCol || p.muted}">${esc(n.priority)}</span>`
        : "";
      const ch = +n.delivered > 0 ? `<span class="badge b-off">${n.delivered} ${T.channels}</span>` : "";
      lastEl.innerHTML = `<div class="t">${when}</div><div>${msg}</div>
        <div style="margin-top:5px">${prio}<span class="badge ${ok ? "b-ok" : "b-crit"}">${ok ? "✔ " + T.delivered : "✖ " + n.failed + " " + T.failed}</span>${ch}</div>`;
    } else {
      lastEl.textContent = "—";
    }

    this.shadowRoot.getElementById("scen").innerHTML = act && act.length
      ? act.map((s) => `<span class="chip">🎬 ${esc(s)}</span>`).join("")
      : `<span class="badge b-off">${T.none}</span>`;
  }
}

customElements.define("supernotify-overview-card", SupernotifyOverviewCard);

window.customCards.push({
  type: "supernotify-overview-card",
  name: "SuperNotify Overview Card",
  description: "Dashboard overview for SuperNotify: sent/failure counters, active scenarios, last notification.",
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
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
  }

  getCardSize() {
    return 1 + Object.keys(this._config.bands).length;
  }

  _palette() {
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", line: "var(--divider-color)",
        panel: "var(--card-background-color)", soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        okSoft: "rgba(46,158,91,.10)", ink: "var(--primary-text-color)",
        muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#0288d1", ok: "#7fe0a5", line: "#2b3441",
          panel: "#1a222c", soft: "#16212c", okSoft: "rgba(46,158,91,.15)",
          ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", line: "#e3e9f0",
          panel: "#fff", soft: "#eef4fb", okSoft: "#e9f7ee",
          ink: "#1f3b57", muted: "#64798f" };
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
    this.shadowRoot.innerHTML = `
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
        .fld { display: flex; flex-direction: column; gap: 2px; }
        .fld .k { font-size: 10px; letter-spacing: .05em; text-transform: uppercase;
                  font-weight: 800; color: ${p.muted}; }
        input[type=time] { border: 1.5px solid ${p.line}; border-radius: 8px;
                 padding: 6px 8px; font-size: 13px; background: ${p.panel}; color: ${p.ink}; }
        input[type=time]:focus { outline: none; border-color: ${p.brand}; }
        .volwrap { min-width: 150px; }
        input[type=range] { width: 100%; accent-color: ${p.brand}; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows"></div>
        <div class="ver">supernotify-bands-card v${VERSION}</div>
      </ha-card>`;
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
    rows.innerHTML = bands.map((b, i) => {
      const next = bands[(i + 1) % bands.length];
      const isAct = b.key === active;
      return `<div class="row ${isAct ? "act" : ""}">
        <div class="who"><b>${b.icon} ${b.name}</b>${isAct ? ` <span class="badge">${T.now}</span>` : ""}
          <div class="rng">${b.hhmm || "—"} → ${next.hhmm || "—"}${i === bands.length - 1 ? " · " + T.crosses : ""}</div>
        </div>
        <div class="fld"><span class="k">${T.start}</span>
          <input type="time" value="${b.hhmm}" data-e="${b.start}"></div>
        <div class="fld volwrap"><span class="k">${T.volume} <span data-l="${b.key}">${b.vol != null ? b.vol : "—"}</span>%</span>
          <input type="range" min="0" max="100" value="${b.vol != null ? b.vol : 0}" data-e="${b.volume || ""}" data-k="${b.key}"></div>
      </div>`;
    }).join("");
    rows.querySelectorAll("input[type=time]").forEach((inp) => {
      inp.onchange = () => this._setStart(inp.dataset.e, inp.value);
    });
    rows.querySelectorAll("input[type=range]").forEach((inp) => {
      if (!inp.dataset.e) { inp.disabled = true; return; }
      inp.oninput = () => {
        this._dragging = true;
        const l = rows.querySelector(`[data-l="${inp.dataset.k}"]`);
        if (l) l.textContent = inp.value;
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
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
  }

  getCardSize() {
    return 8;
  }

  _palette() {
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", line: "var(--divider-color)",
        panel: "var(--card-background-color)", soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", line: "#2b3441",
          panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", line: "#e3e9f0",
          panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
  }

  _deliveries() {
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_delivery_(.+)$/);
      if (!m) continue;
      const name = m[1];
      if (this._config.hide_defaults && /^default_/i.test(name)) continue;
      const s = this._hass.states[id];
      out.push({ id, name, on: s.state === "on", a: s.attributes || {} });
    }
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
    this.shadowRoot.innerHTML = `
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
        .tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
        .tag { border: 1px solid ${p.line}; background: ${p.soft}; color: ${p.brandD};
               border-radius: 7px; padding: 2px 8px; font-size: 11px; font-weight: 650;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
        .badge { border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 750;
                 flex-shrink: 0; }
        .b-on { background: rgba(46,158,91,.14); color: ${p.ok}; }
        .b-off { background: ${p.soft}; color: ${p.muted}; }
        ${SN_SWITCH_CSS}
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows"></div>
        <div class="ver">supernotify-deliveries-card v${VERSION}</div>
      </ha-card>`;
    this._update();
  }

  _update() {
    if (!this.shadowRoot) return;
    const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const dels = this._deliveries();
    const rows = this.shadowRoot.getElementById("rows");
    if (!dels.length) {
      rows.innerHTML = `<span class="badge b-off">${T.no_deliveries}</span>`;
      return;
    }
    rows.innerHTML = dels.map((d, i) => {
      const tr = d.a.transport || "";
      const em = SN_TRANSPORT_ICONS[tr] || "📤";
      const tags = [];
      let sel = d.a.selection;
      if (Array.isArray(sel)) sel = sel.join(", ");
      tags.push(`🔀 ${snSelectionLabel(sel, T) || sel || T.implicit}`);
      if (d.a.action) tags.push(`⚙️ ${d.a.action}`);
      const tgt = d.a.target;
      const nTgt = Array.isArray(tgt) ? tgt.length : tgt && typeof tgt === "object" ? Object.keys(tgt).length : tgt ? 1 : 0;
      if (nTgt) tags.push(`🎯 ${nTgt} ${T.fixed_targets}`);
      if (d.a.target_usage && d.a.target_usage !== "no_action") tags.push(`↔️ ${d.a.target_usage}`);
      if (SN_NATIVE_TARGET_TRANSPORTS.includes(tr)) tags.push(T.native_target_tag);
      const alias = d.a.friendly_name && d.a.friendly_name !== d.name ? d.a.friendly_name : "";
      return `<div class="row" data-i="${i}">
        <span class="em">${em}</span>
        <div class="mid"><b>${esc(d.name)}</b> <span class="tr">${esc(tr)}${alias ? " · " + esc(alias) : ""}</span>
          <div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
        <label class="sw" data-id="${esc(d.id)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${d.on ? "checked" : ""} aria-label="${esc(d.name)}">
          <span class="sl"></span>
        </label>
      </div>`;
    }).join("");
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
        snSetBinaryState(this._hass, label.dataset.id, input.checked);
      });
    });
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
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
  }

  getCardSize() {
    return 6;
  }

  _palette() {
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", crit: "var(--error-color, #e23c3c)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", crit: "#ff9a9a",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", crit: "#c62828",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
  }

  _transports() {
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_transport_(.+)$/);
      if (!m) continue;
      const s = this._hass.states[id];
      out.push({ id, name: m[1], on: s.state === "on", a: s.attributes || {} });
    }
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
    this.shadowRoot.innerHTML = `
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows"></div>
        <div class="ver">supernotify-transports-card v${VERSION}</div>
      </ha-card>`;
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
      rows.innerHTML = `<span class="badge b-off">${T.no_transports}</span>`;
      return;
    }
    rows.innerHTML = trs.map((t, i) => {
      const em = SN_TRANSPORT_ICONS[t.name] || "🔌";
      const tags = [];
      const errCount = +t.a.error_count || 0;
      if (errCount > 0) tags.push(`<span class="tag err">⚠️ ${errCount} · ${esc(t.a.last_error_message || "")}</span>`);
      const alias = t.a.friendly_name && t.a.friendly_name !== t.name ? t.a.friendly_name : "";
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
    }).join("");
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
        snSetBinaryState(this._hass, label.dataset.id, input.checked);
      });
    });
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
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
  }

  getCardSize() {
    return 4;
  }

  _palette() {
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", line: "var(--divider-color)",
        panel: "var(--card-background-color)", soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", line: "#2b3441",
          panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", line: "#e3e9f0",
          panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
  }

  _recipients() {
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_recipient_(.+)$/);
      if (!m) continue;
      const s = this._hass.states[id];
      out.push({ id, name: m[1], on: s.state === "on", a: s.attributes || {} });
    }
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
    this.shadowRoot.innerHTML = `
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
        .gear { font-size: 17px; opacity: .5; flex-shrink: 0; cursor: pointer;
                transition: opacity .15s; padding: 2px; }
        .gear:hover { opacity: 1; }
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows"></div>
        <div class="ver">supernotify-recipients-card v${VERSION}</div>
      </ha-card>`;
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
      rows.innerHTML = `<span class="badge b-off">${T.no_recipients}</span>`;
      return;
    }
    rows.innerHTML = recs.map((r, i) => {
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
      const alias = r.a.friendly_name && r.a.friendly_name !== r.name ? r.a.friendly_name : "";
      return `<div class="row" data-i="${i}">
        <span class="em">👤</span>
        <div class="mid"><b>${esc(alias || r.name)}</b>
          <span class="sub">${esc(personId || "")}${pState !== undefined ? (home ? " · 🏠 " + T.home : " · 🚗 " + T.away) : ""}</span>
          <div class="tags">${tags.map((t) => t.startsWith("<span") ? t : `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
        <span class="gear" title="${esc(T.details)}" aria-label="${esc(T.details)}">⚙️</span>
        <label class="sw" data-id="${esc(r.id)}" style="--sn-sw-line:${p.line};--sn-sw-on:${p.brand}">
          <input type="checkbox" ${r.on ? "checked" : ""} aria-label="${esc(alias || r.name)}">
          <span class="sl"></span>
        </label>
      </div>`;
    }).join("");
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
        snSetBinaryState(this._hass, label.dataset.id, input.checked);
      });
    });
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
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._update();
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
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", crit: "var(--error-color, #e23c3c)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        okSoft: "rgba(46,158,91,.10)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", crit: "#ff9a9a",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c", okSoft: "rgba(46,158,91,.15)",
          ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", crit: "#c62828",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", okSoft: "#e9f7ee",
          ink: "#1f3b57", muted: "#64798f" };
  }

  _scenarios() {
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_scenario_(.+)$/);
      if (!m) continue;
      const s = this._hass.states[id];
      out.push({ id, name: m[1], a: s.attributes || {}, state: s.state });
    }
    return out;
  }

  // SuperNotify >= 2.4.0 (Live Scenarios): binary_sensor.supernotify_scenario_*
  // now reports a real on/off state, recomputed reactively — no need to wait
  // for the next enquire_active_scenarios poll. Returns null (not an empty
  // array) when every scenario is still "unknown"/"unavailable", so the
  // caller can fall back to the polled list on older SuperNotify versions.
  _reactiveActive(all) {
    const known = all.filter((s) => !["unknown", "unavailable"].includes(s.state));
    if (!known.length) return null;
    return known.filter((s) => s.state === "on").map((s) => s.name);
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
    this.shadowRoot.innerHTML = `
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
        .ver { text-align: right; font-size: 10px; color: ${p.muted}; opacity: .7; margin-top: 8px; }
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}<div id="rows"></div>
        <div class="ver">supernotify-scenarios-card v${VERSION}</div>
      </ha-card>`;
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
    const alias = s.a.friendly_name && s.a.friendly_name !== s.name ? s.a.friendly_name : "";
    return `<div class="row ${isAct ? "act" : ""}" data-i="${i}">
      <span class="em">${em}</span>
      <div class="mid"><b>${esc(alias || s.name)}</b>
        ${alias ? `<span style="font-size:11px;color:inherit;opacity:.6"> · ${esc(s.name)}</span>` : ""}
        <div class="tags">${tags.join("")}</div>
      </div>
      ${isAct ? `<span class="badge b-act">${T.active_now}</span>` : ""}
      ${s.a.enabled === false ? `<span class="badge b-dis">${T.disabled}</span>` : ""}
    </div>`;
  }

  _update() {
    if (!this.shadowRoot) return;
    const all = this._scenarios();
    const reactive = this._reactiveActive(all);
    const active = reactive !== null ? reactive : (this._active || []);
    const rows = this.shadowRoot.getElementById("rows");
    if (!all.length) {
      rows.innerHTML = `<span class="tag">${snT(this._config, this._hass).no_scenarios}</span>`;
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
    rows.innerHTML = html;
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = () => this._moreInfo(all[+node.dataset.i].id);
    });
  }
}

customElements.define("supernotify-scenarios-card", SupernotifyScenariosCard);

window.customCards.push({
  type: "supernotify-scenarios-card",
  name: "SuperNotify Scenarios Card",
  description: "Scenarios dashboard: active-now badge, per-delivery override tags, optional category groups.",
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
    if (!this._rendered || wasDark !== this._dark) this._render();
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
    if (this._config.style === "theme") {
      return { brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", crit: "var(--error-color, #e23c3c)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)" };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", crit: "#ff9a9a",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", crit: "#c62828",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
  }

  _render() {
    if (!this._hass) return;
    this._rendered = true;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const p = this._palette();
    this.shadowRoot.innerHTML = `
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
        .chip.sel { background: ${p.brand}; border-color: ${p.brand}; color: #fff; }
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
        <div class="ver">supernotify-simulator-card v${VERSION}</div>
      </ha-card>`;
    this._refresh();
  }

  _simulate() {
    if (!this.shadowRoot) return;
    const esc = (x) => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const chips = this.shadowRoot.getElementById("chips");
    const names = Object.keys(this._byScen || {}).sort();
    chips.innerHTML = names.map((n) =>
      `<span class="chip ${this._sel.has(n) ? "sel" : ""}" data-n="${esc(n)}">${SN_SCENARIO_ICONS[n] || "🎬"} ${esc(n)}</span>`
    ).join("") || "—";
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
      fired.map((d) =>
        `<span class="out">${esc(d)}${byScenAdd.has(d) && !(this._implicit || []).includes(d) ? ' <span class="tag">scenario</span>' : ""}</span>`
      ).join("") +
      suppressed.map((d) => `<span class="out sup">${esc(d)} <span class="tag">${snT(this._config, this._hass).off}</span></span>`).join("") ||
      `<span class='hint'>${snT(this._config, this._hass).sim_none}</span>`;
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
    if (!this._rendered || wasDark !== this._dark) this._render();
    else if (this._targetSelEl) this._targetSelEl.hass = hass;
  }

  getCardSize() {
    return 8;
  }

  _palette() {
    if (this._config.style === "theme") {
      return { brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", warn: "var(--warning-color)",
        crit: "var(--error-color, #e23c3c)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)" };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", warn: "#f0a020", crit: "#ff9a9a",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", warn: "#f0a020", crit: "#e23c3c",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
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
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .grid2 { display: grid; grid-template-columns: 1fr 220px; gap: 16px; }
        @media (max-width: 560px) { .grid2 { grid-template-columns: 1fr; } }
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
        .chip.sel { background: ${p.brand}; border-color: ${p.brand}; color: #fff; }
        .send { border: 0; border-radius: 10px; background: ${p.brand}; color: #fff;
                font-weight: 750; padding: 11px 20px; cursor: pointer; font-size: 13.5px;
                margin-top: 14px; }
        .send:active { transform: scale(.97); }
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
            <input type="text" id="t" placeholder="🧪 Test">
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
            <div id="chips">${this._deliveries().map((d) => `<span class="chip" data-d="${esc(d.name)}">${esc(d.name)}</span>`).join("")}</div>
            <label>${T.target_lbl}</label>
            <div id="targetSel"></div>
            <input type="text" id="customTarget" placeholder="${T.custom_target_ph}" style="margin-top:6px">
            <div class="hint" style="margin-top:3px">${T.custom_target_lbl}</div>
            <div class="hint" id="targetWarn" style="display:none;margin-top:6px;color:${p.warn}"></div>
            <label>${T.camera_lbl}</label>
            <select id="cam"><option value="">${T.none}</option>${this._cameraNames().map((c) => `<option value="${esc(c)}">📷 ${esc(c)}</option>`).join("")}</select>
            <button class="send" id="send">🚀 ${T.send}</button>
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
        <div class="toast" id="toast"></div>
        <div style="text-align:right;font-size:10px;color:${p.muted};opacity:.7;margin-top:8px">supernotify-composer-card v${VERSION}</div>
      </ha-card>`;
    const sr = this.shadowRoot;
    const upd = () => {
      sr.getElementById("pvT").textContent = sr.getElementById("t").value || T.no_title;
      sr.getElementById("pvM").textContent = sr.getElementById("m").value || T.no_message;
      const pr = sr.getElementById("p").value;
      sr.getElementById("pvStrip").style.background =
        { critical: p.crit, high: p.warn, low: p.muted, minimum: p.muted }[pr] || p.brand;
      const cam = sr.getElementById("cam").value;
      const pvC = sr.getElementById("pvC");
      pvC.style.display = cam ? "" : "none";
      pvC.textContent = cam ? "📷 " + cam : "";
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
    this._mountTargetSelector();
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

  _send() {
    const sr = this.shadowRoot;
    const T = snT(this._config, this._hass);
    const message = (sr.getElementById("m").value || "").trim();
    if (!message) { this._toast(T.write_first); return; }
    const title = (sr.getElementById("t").value || "").trim();
    const priority = sr.getElementById("p").value;
    if (priority === "critical" && !confirm(T.critical_confirm))
      return;
    // Dedicated `supernotify.notify` action (SuperNotify >= 2.3.0): typed,
    // selector-driven fields instead of notify.supernotify's generic data:.
    // Context is preserved end-to-end and the target field accepts the
    // native HA target selector (people/devices/areas/floors/labels).
    const payload = { message };
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
    if (cam) payload.camera_entity_id = cam;
    this._hass.callService("supernotify", "notify", payload);
    this._toast(T.sent_toast);
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
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._manifest && !this._loading && !this._err) this._load();
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._updateRows();
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
    if (this._config.style === "theme") {
      return {
        brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", line: "var(--divider-color)",
        panel: "var(--card-background-color)", soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        okSoft: "rgba(46,158,91,.10)", ink: "var(--primary-text-color)",
        muted: "var(--secondary-text-color)",
      };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#0288d1", ok: "#7fe0a5", line: "#2b3441",
          panel: "#1a222c", soft: "#16212c", okSoft: "rgba(46,158,91,.15)",
          ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", line: "#e3e9f0",
          panel: "#fff", soft: "#eef4fb", okSoft: "#e9f7ee",
          ink: "#1f3b57", muted: "#64798f" };
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
    this.shadowRoot.innerHTML = `
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
      </style>
      <ha-card>
        ${snIntro(this._config, this._dark)}
        <div id="body"></div>
        <div class="ver" id="foot">supernotify-automations-card v${VERSION}</div>
      </ha-card>`;
    this._renderBody();
  }

  _renderBody() {
    const el = this.shadowRoot.getElementById("body");
    const T = snT(this._config, this._hass);
    if (this._err) {
      el.innerHTML = `<div class="err">⚠️ ${this._esc(T.aut_err)}<br>
        <span style="opacity:.7">${this._esc(this._config.manifest_url)} — ${this._esc(this._err)}</span></div>`;
      return;
    }
    if (!this._manifest) {
      el.innerHTML = `<div class="empty">…</div>`;
      return;
    }
    const items = this._items();
    const cats = this._cats(items);
    el.innerHTML = `
      <div class="top">
        <input type="search" id="q" placeholder="${this._esc(T.aut_search)}"
          value="${this._esc(this._q)}" aria-label="${this._esc(T.aut_search)}">
        <span class="tot">${items.length} ${T.aut_count} · v${VERSION}</span>
      </div>
      <div class="chips" id="chips"></div>
      <div id="list"></div>`;
    const q = el.querySelector("#q");
    q.addEventListener("input", () => { this._q = q.value; this._renderList(); });
    this._renderChips();
    this._renderList();
    const gen = this._manifest.generated;
    if (gen) {
      const f = this.shadowRoot.getElementById("foot");
      f.innerText = `${T.aut_updated} ${this._rel(gen)} · supernotify-automations-card v${VERSION}`;
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
    el.innerHTML = chip(T.aut_all, null, items.length) +
      cats.map((c) => chip(c, c, items.filter((a) => a.c === c).length)).join("") +
      `<span class="chip warn ${this._onlyDisabled ? "sel" : ""}" id="offOnly">🔕 ${this._esc(T.aut_disabled_only)} · ${offCount}</span>`;
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
      el.innerHTML = `<div class="empty">${this._esc(T.aut_none)}</div>`;
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
    el.innerHTML = html;
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
    st_title: "Usage", st_days: "days", st_total: "Notifications", st_avg: "per day",
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
    st_title: "Utilizzo", st_days: "giorni", st_total: "Notifiche", st_avg: "al giorno",
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
      ...(config || {}),
    };
    this._rendered = false;
    this._data = null;
  }

  set hass(hass) {
    const first = !this._hass;
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
    else this._updateVersions();
    if (first) this._load();
  }

  connectedCallback() {
    const m = (this._config && this._config.refresh_minutes) || 10;
    this._timer = setInterval(() => this._load(), m * 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  getCardSize() {
    return 12;
  }

  _palette() {
    if (this._config.style === "theme") {
      return { brand: "var(--primary-color)", brandD: "var(--primary-color)",
        ok: "var(--success-color, #2e9e5b)", warn: "var(--warning-color)", crit: "var(--error-color, #e23c3c)",
        line: "var(--divider-color)", panel: "var(--card-background-color)",
        soft: "rgba(var(--rgb-primary-color, 3,169,244), .08)",
        ink: "var(--primary-text-color)", muted: "var(--secondary-text-color)" };
    }
    return this._dark
      ? { brand: "#03a9f4", brandD: "#8fd0ff", ok: "#7fe0a5", warn: "#f0a020", crit: "#ff9a9a",
          line: "#2b3441", panel: "#1a222c", soft: "#16212c", ink: "#e6ecf3", muted: "#8fa1b4" }
      : { brand: "#03a9f4", brandD: "#0288d1", ok: "#2e9e5b", warn: "#f0a020", crit: "#e23c3c",
          line: "#e3e9f0", panel: "#fff", soft: "#eef4fb", ink: "#1f3b57", muted: "#64798f" };
  }

  // ── data ──────────────────────────────────────────────────────────────

  async _load() {
    if (!this._hass || this._loading) return;
    this._loading = true;
    const c = this._config;
    const days = Math.max(2, +c.days || 14);
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
      days, spineCount: spine.length, perHour, perWd, perDay, prioCount, periodCount, channels, sends, errors,
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
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 14px; background: ${p.panel}; color: ${p.ink}; }
        .hdr { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .hdr h3 { margin: 0; font-size: 15px; font-weight: 800; }
        .hdr .win { font-size: 11.5px; color: ${p.muted}; }
        .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(125px, 1fr)); gap: 10px; margin-top: 12px; }
        .kpi { border: 1.5px solid ${p.line}; border-radius: 14px; padding: 10px 12px; background: ${p.panel}; }
        .kpi .k { font-size: 10px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; white-space: nowrap; }
        .kpi .v { font-size: 21px; font-weight: 800; margin-top: 2px; }
        .kpi .s { font-size: 11px; color: ${p.muted}; margin-top: 1px; }
        .sec { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; font-weight: 800; color: ${p.muted}; margin: 16px 0 6px; display:flex; justify-content: space-between; }
        .sec .n { font-weight: 650; text-transform: none; letter-spacing: 0; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }
        svg { width: 100%; height: auto; display: block; overflow: visible; }
        .bars text { font-size: 9px; fill: ${p.muted}; }
        .bars .val { font-size: 9.5px; fill: ${p.ink}; font-weight: 700; }
        .hrow { display: flex; align-items: center; gap: 8px; font-size: 12.5px; padding: 4px 0; }
        .hrow .nm { width: 38%; min-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
        <div class="hdr"><h3>📊 ${T.st_title}</h3><span class="win" id="win">${T.st_loading}</span></div>
        <div id="body"><div class="empty">${T.st_loading}</div></div>
        <div class="ver" id="ver"></div>
        <div class="foot">supernotify-stats-card v${VERSION}</div>
      </ha-card>`;
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
    const d = this._data;
    const T = snT(this._config, this._hass);
    const p = this._palette();
    const esc = (s) => this._esc(s);
    sr.getElementById("win").textContent = `${d.days} ${T.st_days}`;
    const body = sr.getElementById("body");
    if (!d.total && !d.spineCount) {
      body.innerHTML = `<div class="empty">${T.st_no_data}${this._error ? ` <small>(${esc(this._error)})</small>` : ""}</div>`;
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
    const daily = this._barsSvg(d.perDay.map((x) => ({ l: `${x.d.getDate()}/${x.d.getMonth() + 1}`, v: x.n, hi: x.today })), p, { avg: d.avg });
    // hourly
    const hourly = this._barsSvg(d.perHour.map((v, h) => ({ l: h % 3 === 0 ? String(h) : "", v, hi: h === d.peakHour })), p, { thin: true });
    // weekday
    const wd = this._barsSvg(d.perWd.map((v, i) => ({ l: T.st_wd[i], v })), p, {});
    // channels
    const maxCh = d.channels.length ? d.channels[0].ok + d.channels[0].ko : 1;
    const chRows = d.channels.slice(0, this._config.top_channels).map((ch) => {
      const tot = ch.ok + ch.ko;
      return `<div class="hrow"><span class="nm" title="${esc(ch.name)}">${this._iconFor(ch.name)} ${esc(ch.name)}</span>
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

    body.innerHTML = `
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
      <ul class="ins">${this._insights(d).map((s) => `<li>${s}</li>`).join("")}</ul>`;
  }

  // Channel names are DELIVERY names; look the transport up on the delivery
  // entity so the icon matches the deliveries card.
  _iconFor(deliveryName) {
    const st = this._hass && this._hass.states[`binary_sensor.supernotify_delivery_${deliveryName}`];
    const tr = (st && st.attributes && st.attributes.transport) || deliveryName;
    return SN_TRANSPORT_ICONS[tr] || "📤";
  }

  _barsSvg(items, p, opt) {
    const n = items.length || 1;
    const W = 600, H = 110, padB = 18, padT = 14;
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
      box(this._config.update_entity, "SuperNotify", null, "🔔") +
      box(this._config.cards_update_entity, "SuperNotify Cards", VERSION, "🃏");
  }
}

customElements.define("supernotify-stats-card", SupernotifyStatsCard);

window.customCards.push({
  type: "supernotify-stats-card",
  name: "SuperNotify Stats Card",
  description: "Usage analytics from existing entities: per-day/hour/weekday, channels most used with errors, priority and period mix, insights, installed vs latest version.",
});

console.info(`%c SUPERNOTIFY-CARDS %c v${VERSION} `, "background:#03a9f4;color:#fff;font-weight:700", "");
