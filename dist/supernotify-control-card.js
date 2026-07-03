/**
 * SuperNotify Control Card — v0.1.0
 * Touch-first control center for SuperNotify (https://github.com/rhizomatics/supernotify)
 *
 * Status bar + big action tiles + grouped mode toggles.
 * Vanilla Custom Element, no build step, no dependencies.
 *
 * Example config: see README.md
 */

const VERSION = "0.3.0";

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
    if ((this._snoozes || []).length) {
      await this._hass.callWS({
        type: "call_service", domain: "supernotify", service: "clear_snoozes",
        service_data: {}, return_response: true,
      });
      this._toast("Snoozes cleared");
    } else {
      const minutes = this._config.snooze_minutes || 30;
      const action =
        this._config.snooze_action || `SUPERNOTIFY_SNOOZE_EVERYONE_NONCRITICAL_${minutes}`;
      this._hass.callApi("POST", "events/mobile_app_notification_action", { action });
      this._toast(`Snoozed non-critical notifications for ${minutes} min`);
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
    this._toast("Announced");
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
        <div class="statusbar" id="statusbar"></div>
        <div class="tiles" id="tiles"></div>
        <div class="announce" id="announceRow">
          <ha-icon icon="mdi:bullhorn"></ha-icon>
          <input id="announceInput" placeholder="Announce on all speakers…">
          <button id="announceBtn">Send</button>
        </div>
        <div id="groups"></div>
        <div class="ver">supernotify-control-card v${VERSION}</div>
        <div class="toast" id="toast"></div>
      </ha-card>`;
    this.shadowRoot.getElementById("announceBtn").addEventListener("click", () => this._announce());
    this.shadowRoot.getElementById("announceInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._announce();
    });
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
    const segs = [];
    const seg = (l, v, color) =>
      `<div class="sseg"><span class="sl">${l}</span><span class="sv"${color ? ` style="color:${color}"` : ""}>${v}</span></div>`;
    if (c.presence_entity) {
      const st = this._st(c.presence_entity);
      segs.push(seg("Presence", this._friendly(c.presence_entity, "") + " · " + (st === "home" ? "home" : st || "—"),
        st === "home" ? p.ok : undefined));
    }
    const band = this._activeBand();
    if (band) {
      const vol = band.volume ? Math.round(+this._st(band.volume) || 0) + "%" : "";
      segs.push(seg("Time band", band.name.replace(/_/g, " ") + (vol ? " · vol " + vol : ""), p.brandD));
    }
    if (c.dnd_entity) {
      const on = this._on(c.dnd_entity);
      segs.push(seg("Quiet", on ? "on" : "off", on ? p.warn : p.ok));
    }
    const act = this._activeScenarios();
    if (act !== null) segs.push(seg("Active scenarios", String(act.length)));
    this.shadowRoot.getElementById("statusbar").innerHTML = segs.join("");
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
    if (t === "dnd" && c.dnd_entity) {
      const on = this._on(c.dnd_entity);
      return { cls: on ? "warn" : "", icon: on ? "🔕" : "🔔",
        name: "Do not disturb", sub: on ? "active" : "tap to silence",
        act: () => this._toggle(c.dnd_entity) };
    }
    if (t === "snooze") {
      const act = this._snoozes || [];
      if (act.length) {
        const until = act[0] && act[0].snooze_until ? act[0].snooze_until.slice(0, 5) : "";
        return { cls: "warn", icon: "😴", name: "Snoozed",
          sub: (until ? "until " + until + " · " : "") + "tap to clear",
          act: () => this._snooze() };
      }
      return { cls: "", icon: "😴", name: `Snooze ${c.snooze_minutes || 30} min`,
        sub: "pause non-critical", act: () => this._snooze() };
    }
    if (t === "announce")
      return { cls: "", icon: "📢", name: "Announce", sub: "intercom",
        act: () => this.shadowRoot.getElementById("announceInput").focus() };
    if (t && t.toggle) {
      const on = this._on(t.toggle);
      return { cls: on ? "on" : "", icon: t.icon || "⚙️",
        name: t.name || this._friendly(t.toggle), sub: on ? "on" : "off",
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
      const [act, last] = await Promise.all([
        this._ws("enquire_active_scenarios"),
        this._ws("enquire_last_notification"),
      ]);
      this._active = act.scenarios || [];
      this._last = last && Object.keys(last).length ? last : null;
    } catch (e) {
      this._active = this._active || null;
      this._last = this._last || null;
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
        <div class="stats" id="stats"></div>
        <div class="sec">Last notification</div>
        <div class="lastmsg" id="last">—</div>
        <div class="sec">Active scenarios</div>
        <div id="scen">—</div>
        <div class="sec">Transports</div>
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
    this.shadowRoot.getElementById("stats").innerHTML =
      stat("📨 Sent", sent != null ? esc(sent) : "—", "since startup") +
      stat("⚠️ Failures", failures != null ? esc(failures) : "—", "", +failures > 0 ? p.crit : p.ok) +
      stat("🎬 Active scenarios", act ? act.length : "—", "") +
      stat("📤 Deliveries", dels.length ? `${delsOn}/${dels.length}` : "—", "enabled/total");

    const lastEl = this.shadowRoot.getElementById("last");
    if (this._last) {
      const n = this._last;
      const when = n.created ? esc(String(n.created).replace("T", " ").slice(0, 16)) : "";
      const msg = esc((n.message || "").slice(0, 90));
      const ok = (n.failed || 0) === 0;
      lastEl.innerHTML = `<div class="t">${when}</div><div>${msg}</div>
        <div style="margin-top:5px"><span class="badge ${ok ? "b-ok" : "b-crit"}">${ok ? "✔ delivered" : "✖ " + n.failed + " failed"}</span>
        ${n.delivered != null ? `<span class="badge b-off">${n.delivered} channels</span>` : ""}</div>`;
    } else {
      lastEl.textContent = "—";
    }

    this.shadowRoot.getElementById("scen").innerHTML = act && act.length
      ? act.map((s) => `<span class="chip">🎬 ${esc(s)}</span>`).join("")
      : `<span class="badge b-off">none</span>`;

    const trs = this._scan("transport");
    this.shadowRoot.getElementById("transports").innerHTML = trs.length
      ? trs.map((t) =>
          `<div class="row"><div>${esc(t.name)}</div><span class="badge ${t.state === "on" ? "b-ok" : "b-off"}">${t.state === "on" ? "ok" : "off"}</span></div>`
        ).join("")
      : `<span class="badge b-off">no transport entities found</span>`;
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
        <div id="rows"></div>
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
    const rows = this.shadowRoot.getElementById("rows");
    rows.innerHTML = bands.map((b, i) => {
      const next = bands[(i + 1) % bands.length];
      const isAct = b.key === active;
      return `<div class="row ${isAct ? "act" : ""}">
        <div class="who"><b>${b.icon} ${b.name}</b>${isAct ? ' <span class="badge">now</span>' : ""}
          <div class="rng">${b.hhmm || "—"} → ${next.hhmm || "—"}${i === bands.length - 1 ? " · crosses midnight" : ""}</div>
        </div>
        <div class="fld"><span class="k">start</span>
          <input type="time" value="${b.hhmm}" data-e="${b.start}"></div>
        <div class="fld volwrap"><span class="k">volume <span data-l="${b.key}">${b.vol != null ? b.vol : "—"}</span>%</span>
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

console.info(`%c SUPERNOTIFY-CARDS %c v${VERSION} `, "background:#03a9f4;color:#fff;font-weight:700", "");
