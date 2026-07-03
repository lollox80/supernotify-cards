/**
 * SuperNotify Control Card — v0.1.0
 * Touch-first control center for SuperNotify (https://github.com/rhizomatics/supernotify)
 *
 * Status bar + big action tiles + grouped mode toggles.
 * Vanilla Custom Element, no build step, no dependencies.
 *
 * Example config: see README.md
 */

const VERSION = "0.1.2";

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

  _snooze() {
    const minutes = this._config.snooze_minutes || 30;
    this._hass.callService("supernotify", "snooze", { minutes });
    this._toast(`Snoozed all channels for ${minutes} min`);
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
    if (t === "snooze")
      return { cls: "", icon: "😴", name: `Snooze ${c.snooze_minutes || 30} min`,
        sub: "pause all channels", act: () => this._snooze() };
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

console.info(`%c SUPERNOTIFY-CONTROL-CARD %c v${VERSION} `, "background:#03a9f4;color:#fff;font-weight:700", "");
