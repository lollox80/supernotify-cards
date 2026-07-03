/**
 * SuperNotify Control Card — v0.1.0
 * Touch-first control center for SuperNotify (https://github.com/rhizomatics/supernotify)
 *
 * Status bar + big action tiles + grouped mode toggles.
 * Vanilla Custom Element, no build step, no dependencies.
 *
 * Example config: see README.md
 */

const VERSION = "0.9.0";

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
    active_now: "active now", disabled: "disabled", other: "Other",
    media: "media", no_scenarios: "no scenario entities found",
    sim_pick: "🎬 Scenarios — tap to simulate", sim_fire: "📤 Deliveries that would fire",
    sim_hint: "Real engine data (enquire services). Priority-based delivery filtering happens engine-side and is not simulated here. Disabled wins over enabled, like the runtime merge.",
    sim_none: "no deliveries would fire", scenario_tag: "scenario",
    title: "Title", message: "Message", priority: "Priority",
    channels_lbl: "Channels — none picked = normal routing",
    recipients_lbl: "Recipients — none picked = channel defaults",
    camera_lbl: "Camera snapshot", preview: "Preview",
    no_title: "(no title)", no_message: "(no message)",
    default_prio: "default (medium)",
    comp_hint: "Picked channels are sent with delivery_selection: fixed (only those fire). Critical really is critical — sirens included.",
    critical_confirm: "Send a CRITICAL notification? Sirens and max volume included.",
    write_first: "Write a message first", sent_toast: "Sent 🚀",
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
    active_now: "attivo ora", disabled: "disattivato", other: "Altro",
    media: "media", no_scenarios: "nessuna entità scenario trovata",
    sim_pick: "🎬 Scenari — tocca per simulare", sim_fire: "📤 Canali che partirebbero",
    sim_hint: "Dati reali del motore (servizi enquire). Il filtro per priorità delle delivery avviene lato motore e non è simulato qui. Lo spegnimento vince sull'accensione, come nel merge reale.",
    sim_none: "nessun canale partirebbe", scenario_tag: "scenario",
    title: "Titolo", message: "Messaggio", priority: "Priorità",
    channels_lbl: "Canali — nessuno scelto = instradamento normale",
    recipients_lbl: "Destinatari — nessuno scelto = default dei canali",
    camera_lbl: "Foto camera", preview: "Anteprima",
    no_title: "(senza titolo)", no_message: "(nessun messaggio)",
    default_prio: "default (media)",
    comp_hint: "I canali scelti partono con delivery_selection: fixed (solo quelli). Il critical è critical davvero — sirene incluse.",
    critical_confirm: "Inviare una notifica CRITICA? Sirene e volume massimo inclusi.",
    write_first: "Scrivi prima un messaggio", sent_toast: "Inviata 🚀",
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
 * Stats (sent, failures, active scenarios, deliveries), last notification
 * and transport status. Data from entities exposed by SuperNotify plus
 * enquire_* services called over WebSocket.
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
        <div class="sec">${snT(this._config, this._hass).transports}</div>
        <div id="transports"></div>
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
    const act = this._active;
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

    const trs = this._scan("transport");
    this.shadowRoot.getElementById("transports").innerHTML = trs.length
      ? trs.map((t) =>
          `<div class="row"><div>${esc(t.name)}</div><span class="badge ${t.state === "on" ? "b-ok" : "b-off"}">${t.state === "on" ? "ok" : "off"}</span></div>`
        ).join("")
      : `<span class="badge b-off">${T.no_transports}</span>`;
  }
}

customElements.define("supernotify-overview-card", SupernotifyOverviewCard);

window.customCards.push({
  type: "supernotify-overview-card",
  name: "SuperNotify Overview Card",
  description: "Dashboard overview for SuperNotify: sent/failure counters, active scenarios, last notification, transport status.",
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
      const alias = d.a.friendly_name && d.a.friendly_name !== d.name ? d.a.friendly_name : "";
      return `<div class="row" data-i="${i}">
        <span class="em">${em}</span>
        <div class="mid"><b>${esc(d.name)}</b> <span class="tr">${esc(tr)}${alias ? " · " + esc(alias) : ""}</span>
          <div class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
        <span class="badge ${d.on ? "b-on" : "b-off"}">${d.on ? T.enabled : T.off}</span>
      </div>`;
    }).join("");
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = () => this._moreInfo(dels[+node.dataset.i].id);
    });
  }
}

customElements.define("supernotify-deliveries-card", SupernotifyDeliveriesCard);

window.customCards.push({
  type: "supernotify-deliveries-card",
  name: "SuperNotify Deliveries Card",
  description: "Delivery dashboard: auto-discovered rows with transport icon, selection/action/target tags and enabled badge.",
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
        <span class="badge ${r.on ? "b-on" : "b-off"}">${r.on ? T.enabled : T.off}</span>
      </div>`;
    }).join("");
    rows.querySelectorAll(".row").forEach((node) => {
      node.onclick = () => this._moreInfo(recs[+node.dataset.i].id);
    });
  }
}

customElements.define("supernotify-recipients-card", SupernotifyRecipientsCard);

window.customCards.push({
  type: "supernotify-recipients-card",
  name: "SuperNotify Recipients Card",
  description: "Recipients dashboard: home state, contact tags (email, phone, devices) and enabled badge.",
});

/* ════════════════════════════════════════════════════════════════════════
 * supernotify-scenarios-card — scenarios dashboard
 * Auto-discovers the scenario entities SuperNotify exposes. "Active now"
 * badge comes from the enquire_active_scenarios response service (polled),
 * per-delivery override tags (enabled/disabled) from entity attributes.
 * Optional groups reproduce the prototype categories.
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
      out.push({ id, name: m[1], a: s.attributes || {} });
    }
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
    const active = this._active || [];
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
    this._pickedRec = new Set();
  }

  set hass(hass) {
    const wasDark = this._dark;
    this._hass = hass;
    this._dark = !!(hass.themes && hass.themes.darkMode);
    if (!this._rendered || wasDark !== this._dark) this._render();
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

  _deliveryNames() {
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_delivery_(.+)$/);
      if (m && !/^default_/i.test(m[1])) out.push(m[1]);
    }
    return out.sort();
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
              <option value="minimum">minimum</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical ⚠️</option>
            </select>
            <label>${T.channels_lbl}</label>
            <div id="chips">${this._deliveryNames().map((d) => `<span class="chip" data-d="${esc(d)}">${esc(d)}</span>`).join("")}</div>
            <label>${T.recipients_lbl}</label>
            <div id="recChips">${this._recipientNames().map((r) => `<span class="chip" data-r="${esc(r.person)}">👤 ${esc(r.name)}</span>`).join("")}</div>
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
    sr.querySelectorAll("#chips .chip").forEach((node) => {
      node.onclick = () => {
        const d = node.dataset.d;
        if (this._picked.has(d)) this._picked.delete(d); else this._picked.add(d);
        node.classList.toggle("sel", this._picked.has(d));
      };
    });
    sr.querySelectorAll("#recChips .chip").forEach((node) => {
      node.onclick = () => {
        const r = node.dataset.r;
        if (this._pickedRec.has(r)) this._pickedRec.delete(r); else this._pickedRec.add(r);
        node.classList.toggle("sel", this._pickedRec.has(r));
      };
    });
    sr.getElementById("send").onclick = () => this._send();
  }

  _recipientNames() {
    // From the recipient entities SuperNotify exposes: person entity + label.
    const out = [];
    if (!this._hass) return out;
    for (const id of Object.keys(this._hass.states)) {
      const m = id.match(/^[a-z_]+\.supernotify_recipient_(.+)$/);
      if (!m) continue;
      const a = this._hass.states[id].attributes || {};
      if (a.entity_id) out.push({ person: a.entity_id, name: a.friendly_name || m[1] });
    }
    return out.sort((x, y) => x.name.localeCompare(y.name));
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
    const data = {};
    if (priority) data.priority = priority;
    if (this._picked.size) {
      data.delivery_selection = "fixed";
      data.delivery = {};
      for (const d of this._picked) data.delivery[d] = {};
    }
    const cam = sr.getElementById("cam").value;
    if (cam) data.media = { camera_entity_id: cam };
    const payload = { message };
    if (title) payload.title = title;
    if (this._pickedRec.size) payload.target = [...this._pickedRec];
    if (Object.keys(data).length) payload.data = data;
    this._hass.callService("notify", "supernotify", payload);
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

console.info(`%c SUPERNOTIFY-CARDS %c v${VERSION} `, "background:#03a9f4;color:#fff;font-weight:700", "");
