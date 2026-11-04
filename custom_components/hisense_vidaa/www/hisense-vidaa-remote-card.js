/*
 * Hisense VIDAA Remote Card
 * A TV-remote style Lovelace card for the "Hisense VIDAA TV" integration.
 *
 * Minimal config:
 *   type: custom:hisense-vidaa-remote-card
 *   entity: media_player.hisense_vidaa_tv
 *
 * See README.md for all options.
 */

const CARD_VERSION = "1.2.0";

const I18N = {
  en: {
    on: "On",
    off: "Off",
    unavailable: "Unavailable",
    input: "INPUT",
    home: "HOME",
    back: "BACK",
    exit: "EXIT",
    menu: "MENU",
    info: "INFO",
    mute: "MUTE",
    sources: "Select source",
    numpad: "Number pad",
    entity: "Media player entity",
    name: "Name",
    numpad_mode: "Number pad",
    collapsed: "Collapsible (hidden at start)",
    expanded: "Collapsible (open at start)",
    hidden: "Never show",
    show_colors: "Show colour buttons",
    no_sources: "No sources available",
    popup: "Popup (like the INPUT button)",
    show_title: "Show title",
    show_status: "Show status line (e.g. On · TV)",
    close: "Close",
    inputs: "Inputs shown in the INPUT popup",
    inputs_hint: "Leave empty to show the full list from the TV.",
    add_input: "Add input",
    f_input: "TV input / app",
    shortcuts: "Quick-launch shortcuts",
    add_shortcut: "Add shortcut",
    reset_shortcuts: "Restore defaults",
    f_name: "Name",
    f_icon: "Icon",
    f_text: "Short text (if no icon)",
    f_action: "Action",
    act_app: "Launch app",
    act_source: "Select source",
    act_key: "Send key",
    val_app: "App",
    val_source: "Source",
    val_key: "Key",
  },
  it: {
    on: "Acceso",
    off: "Spento",
    unavailable: "Non disponibile",
    input: "INPUT",
    home: "HOME",
    back: "INDIETRO",
    exit: "ESCI",
    menu: "MENU",
    info: "INFO",
    mute: "MUTO",
    sources: "Seleziona sorgente",
    numpad: "Tastierino numerico",
    entity: "Entità media player",
    name: "Nome",
    numpad_mode: "Tastierino numerico",
    collapsed: "A scomparsa (chiuso all'avvio)",
    expanded: "A scomparsa (aperto all'avvio)",
    hidden: "Non mostrare mai",
    show_colors: "Mostra tasti colorati",
    no_sources: "Nessuna sorgente disponibile",
    popup: "Popup (come il tasto INPUT)",
    show_title: "Mostra titolo",
    show_status: "Mostra riga di stato (es. Acceso · TV)",
    close: "Chiudi",
    inputs: "Input mostrati nel popup INPUT",
    inputs_hint: "Lascia vuoto per mostrare tutta la lista della TV.",
    add_input: "Aggiungi input",
    f_input: "Ingresso / app della TV",
    shortcuts: "Tasti rapidi",
    add_shortcut: "Aggiungi tasto rapido",
    reset_shortcuts: "Ripristina predefiniti",
    f_name: "Nome",
    f_icon: "Icona",
    f_text: "Testo breve (se senza icona)",
    f_action: "Azione",
    act_app: "Avvia app",
    act_source: "Seleziona sorgente",
    act_key: "Invia tasto",
    val_app: "App",
    val_source: "Sorgente",
    val_key: "Tasto",
  },
};

const DEFAULT_SHORTCUTS = [
  { name: "Netflix", icon: "mdi:netflix", app: "netflix" },
  { name: "Prime Video", icon: "mdi:amazon", app: "amazon" },
  { name: "Disney+", text: "D+", app: "disney" },
  { name: "YouTube", icon: "mdi:youtube", app: "youtube" },
];

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const STYLE = `
  :host { display: block; }
  ha-card { padding: 16px 12px; background: var(--ha-card-background, var(--card-background-color)); }
  .remote {
    position: relative; margin: 0 auto; max-width: 300px;
    display: flex; flex-direction: column; gap: 14px;
    user-select: none; -webkit-user-select: none; touch-action: manipulation;
  }
  .header { text-align: center; line-height: 1.25; }
  .header .title { font-weight: 500; font-size: 15px; color: var(--primary-text-color); }
  .header .status { font-size: 12px; color: var(--secondary-text-color); display: inline-flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--disabled-text-color, #9e9e9e); }
  .on .dot { background: var(--success-color, #43a047); box-shadow: 0 0 6px var(--success-color, #43a047); }

  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: center; justify-items: center; }
  .row { display: flex; justify-content: space-evenly; align-items: center; gap: 8px; flex-wrap: wrap; }

  button {
    font: inherit; color: var(--primary-text-color); cursor: pointer; border: none; outline: none;
    background: var(--secondary-background-color, rgba(127,127,127,.15));
    border-radius: 999px; height: 44px; min-width: 44px; padding: 0 14px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 500; letter-spacing: .03em;
    transition: transform .08s, background .15s, box-shadow .15s, opacity .2s;
    -webkit-tap-highlight-color: transparent;
  }
  button:hover { background: color-mix(in srgb, var(--secondary-background-color, #888) 80%, var(--primary-text-color) 20%); }
  button:focus-visible { box-shadow: 0 0 0 2px var(--primary-color); }
  button.pressed, button:active { transform: scale(.93); background: color-mix(in srgb, var(--primary-color) 35%, var(--secondary-background-color, #888)); }
  button ha-icon { --mdc-icon-size: 22px; pointer-events: none; }
  button .txt { pointer-events: none; }

  .wide { width: 100%; max-width: 92px; }
  .dpad-btn { width: 56px; height: 44px; }
  .ok { width: 76px; height: 76px; border-radius: 50%; font-size: 15px; font-weight: 600;
        box-shadow: inset 0 0 0 2px var(--divider-color, rgba(127,127,127,.4)); }
  .dpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 8px; align-items: center; justify-items: center; }

  #power { width: 52px; height: 52px; color: var(--disabled-text-color, #9e9e9e); }
  #power ha-icon { --mdc-icon-size: 26px; }
  .on #power { color: var(--error-color, #f44336); background: color-mix(in srgb, var(--error-color, #f44336) 18%, var(--secondary-background-color, #888));
               box-shadow: 0 0 12px color-mix(in srgb, var(--error-color, #f44336) 55%, transparent); }

  .apps button { width: 44px; padding: 0; font-weight: 700; font-size: 13px; }
  .apps button ha-icon { --mdc-icon-size: 24px; }
  .apps button.wide-btn { width: auto; padding: 0 12px; }

  .mid { display: grid; grid-template-columns: 56px 1fr 56px; gap: 10px; align-items: stretch; justify-items: center; }
  .pill { display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 6px;
          width: 56px; padding: 6px 0; border-radius: 28px; background: var(--secondary-background-color, rgba(127,127,127,.15)); }
  .pill button { background: transparent; width: 44px; height: 52px; border-radius: 22px; }
  .pill button:hover { background: rgba(127,127,127,.2); }
  .pill .label { font-size: 12px; color: var(--secondary-text-color); display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 34px; justify-content: center; }
  .pill .label ha-icon { --mdc-icon-size: 20px; }
  .center { display: flex; flex-direction: column; justify-content: space-between; align-items: center; gap: 8px; }
  .center button { width: 74px; }
  #mute.active { color: var(--warning-color, #ffa600); }

  .colors { display: flex; justify-content: center; gap: 12px; }
  .colors button { width: 40px; height: 12px; min-width: 0; padding: 0; border-radius: 6px; }
  .c-red { background: #e53935; } .c-green { background: #43a047; } .c-yellow { background: #fdd835; } .c-blue { background: #1e88e5; }

  .numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; justify-items: center; }
  .numpad button { width: 64px; font-size: 16px; }
  .collapsible { overflow: hidden; display: grid; grid-template-rows: 0fr; transition: grid-template-rows .25s ease; }
  .collapsible > div { min-height: 0; display: flex; flex-direction: column; gap: 14px; }
  .collapsible.open { grid-template-rows: 1fr; }
  #numtoggle.active { color: var(--primary-color); }

  /* Source overlay */
  .overlay { position: absolute; inset: 0; z-index: 5; display: none; flex-direction: column; gap: 6px; padding: 10px;
             border-radius: 24px; overflow-y: auto;
             background: var(--ha-card-background, var(--card-background-color)); box-shadow: 0 0 0 1px var(--divider-color); }
  .overlay.open { display: flex; }
  .ovhead { display: flex; align-items: center; justify-content: space-between; }
  .ovhead h4 { margin: 4px 6px 6px; }
  .overlay .ovclose { justify-content: center; border-radius: 50%; min-width: 36px; width: 36px; height: 36px; padding: 0; background: transparent; }
  .overlay .numpad button { justify-content: center; border-radius: 999px; height: 46px; }
  .overlay .numpad.big { margin: auto 0; gap: 14px; }
  .overlay .numpad.big button { width: 72px; height: 56px; font-size: 20px; }
  .overlay h4 { margin: 4px 6px 6px; font-weight: 500; font-size: 14px; color: var(--secondary-text-color); }
  .overlay button { justify-content: flex-start; gap: 12px; height: 46px; border-radius: 14px; font-size: 14px; letter-spacing: 0; }
  .overlay button.current { color: var(--primary-color); box-shadow: inset 0 0 0 2px var(--primary-color); }
  .overlay .empty { text-align: center; color: var(--secondary-text-color); padding: 16px; font-size: 13px; }

  /* TV off / unavailable */
  .remote:not(.on) .ctrl { opacity: .45; }
  .remote.unavailable { pointer-events: none; opacity: .6; }
`;

class HisenseVidaaRemoteCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._numOpen = false;
    this._onUp = () => this._stopRepeat();
  }

  static getConfigElement() {
    return document.createElement("hisense-vidaa-remote-card-editor");
  }

  static getStubConfig(hass) {
    const ent = Object.keys(hass?.states || {}).find((e) => {
      if (!e.startsWith("media_player.")) return false;
      return /hisense|vidaa/i.test(e);
    });
    return { entity: ent || "media_player.hisense_vidaa_tv" };
  }

  setConfig(config) {
    if (!config || !config.entity) throw new Error("Configura 'entity' (media_player)");
    this._config = {
      numpad: "collapsed",
      show_colors: false,
      show_title: true,
      show_status: true,
      inputs: [],
      sources: DEFAULT_SHORTCUTS,
      ...config,
    };
    this._numOpen = this._config.numpad === "expanded";
    this._built = false;
    if (this.isConnected) this._build();
  }

  getCardSize() {
    return 12;
  }

  connectedCallback() {
    window.addEventListener("pointerup", this._onUp);
    window.addEventListener("pointercancel", this._onUp);
    if (this._config && !this._built) this._build();
  }

  disconnectedCallback() {
    window.removeEventListener("pointerup", this._onUp);
    window.removeEventListener("pointercancel", this._onUp);
    this._stopRepeat();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) return;
    this._update();
  }

  _t(key) {
    const lang = (this._hass?.language || "en").slice(0, 2);
    return (I18N[lang] || I18N.en)[key] ?? I18N.en[key] ?? key;
  }

  // ---------------------------------------------------------------- build
  _btn(act, content, extra = {}) {
    const attrs = Object.entries(extra.attrs || {})
      .map(([k, v]) => `${k}="${esc(v)}"`)
      .join(" ");
    const id = extra.id ? `id="${extra.id}"` : "";
    const cls = extra.cls ? `class="${extra.cls}"` : "";
    const title = extra.title ? `title="${esc(extra.title)}" aria-label="${esc(extra.title)}"` : "";
    const rep = extra.repeat ? "data-repeat" : "";
    return `<button ${id} ${cls} ${title} data-act="${act}" ${rep} ${attrs}>${content}</button>`;
  }
  _ico(i) {
    return `<ha-icon icon="${i}"></ha-icon>`;
  }
  _key(key, content, extra = {}) {
    return this._btn("key", content, { ...extra, attrs: { ...(extra.attrs || {}), "data-key": key } });
  }

  _shortcutBtn(s) {
    const content = s.icon ? this._ico(s.icon) : `<span class="txt">${esc(s.text || s.name || "?")}</span>`;
    const title = s.name || s.app || s.source || s.key;
    if (s.key) return this._key(s.key, content, { title, cls: s.text && !s.icon ? "wide-btn" : "" });
    if (s.app) return this._btn("app", content, { title, attrs: { "data-app": s.app } });
    if (s.source) return this._btn("source", content, { title, attrs: { "data-source": s.source } });
    return "";
  }

  _build() {
    const c = this._config;
    const shortcuts = (c.sources || []).map((s) => this._shortcutBtn(s)).join("");
    const numMode = c.numpad; // collapsed | expanded | hidden
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
      .map((n) => this._key(`num_${n}`, `<span class="txt">${n}</span>`))
      .join("");
    const numpad =
      numMode === "hidden" || numMode === "popup"
        ? ""
        : `<div class="collapsible ${this._numOpen ? "open" : ""}" id="numwrap"><div>
            <div class="numpad">
              ${digits}
              ${this._key("channel_dot", `<span class="txt">–</span>`, { title: "-" })}
              ${this._key("num_0", `<span class="txt">0</span>`)}
              <span></span>
            </div>
          </div></div>`;
    const showTitle = c.show_title !== false;
    const showStatus = c.show_status !== false;
    const header =
      showTitle || showStatus
        ? `<div class="header">
            ${showTitle ? '<div class="title" id="title"></div>' : ""}
            ${showStatus ? '<div class="status"><span class="dot"></span><span id="status"></span></div>' : ""}
          </div>`
        : "";
    const colors = c.show_colors
      ? `<div class="colors ctrl">
          ${["red", "green", "yellow", "blue"].map((k) => this._key(k, "", { cls: `c-${k}`, title: k })).join("")}
        </div>`
      : "";

    this.shadowRoot.innerHTML = `
      <style>${STYLE}</style>
      <ha-card>
        <div class="remote" id="remote">
          ${header}

          <div class="grid3">
            <span></span>
            ${this._btn("power", this._ico("mdi:power"), { id: "power", title: "Power" })}
            ${
              numMode === "hidden"
                ? "<span></span>"
                : this._btn("numtoggle", `<span class="txt">123</span>`, {
                    id: "numtoggle",
                    title: this._t("numpad"),
                    cls: "wide",
                  })
            }
          </div>

          <div class="dpad ctrl">
            ${this._key("home", `<span class="txt">SMART</span>`, { cls: "wide", title: "Smart / Home" })}
            ${this._key("up", this._ico("mdi:chevron-up"), { cls: "dpad-btn", repeat: true, title: "Up" })}
            ${this._btn("input", `<span class="txt">${this._t("input")}</span>`, { cls: "wide", title: this._t("sources") })}
            ${this._key("left", this._ico("mdi:chevron-left"), { cls: "dpad-btn", repeat: true, title: "Left" })}
            ${this._key("ok", `<span class="txt">OK</span>`, { cls: "ok", title: "OK" })}
            ${this._key("right", this._ico("mdi:chevron-right"), { cls: "dpad-btn", repeat: true, title: "Right" })}
            ${this._key("returns", `<span class="txt">${this._t("back")}</span>`, { cls: "wide", title: this._t("back") })}
            ${this._key("down", this._ico("mdi:chevron-down"), { cls: "dpad-btn", repeat: true, title: "Down" })}
            ${this._key("exit", `<span class="txt">${this._t("exit")}</span>`, { cls: "wide", title: this._t("exit") })}
          </div>

          ${shortcuts ? `<div class="row apps ctrl">${shortcuts}</div>` : ""}

          <div class="mid ctrl">
            <div class="pill">
              ${this._key("volume_up", this._ico("mdi:plus"), { repeat: true, title: "Volume +" })}
              <div class="label"><ha-icon id="volicon" icon="mdi:volume-high"></ha-icon><span id="vollabel"></span></div>
              ${this._key("volume_down", this._ico("mdi:minus"), { repeat: true, title: "Volume -" })}
            </div>
            <div class="center">
              ${this._key("menu", `<span class="txt">${this._t("menu")}</span>`, { title: this._t("menu") })}
              ${this._key("mute", `<span class="txt">${this._t("mute")}</span>`, { id: "mute", title: this._t("mute") })}
              ${this._key("info", `<span class="txt">${this._t("info")}</span>`, { title: this._t("info") })}
            </div>
            <div class="pill">
              ${this._key("channel_up", this._ico("mdi:chevron-up"), { repeat: true, title: "Channel +" })}
              <div class="label"><span style="font-size:14px;font-weight:600">P</span></div>
              ${this._key("channel_down", this._ico("mdi:chevron-down"), { repeat: true, title: "Channel -" })}
            </div>
          </div>

          <div class="grid3 ctrl">
            ${this._key("play", this._ico("mdi:play"), { title: "Play" })}
            ${this._key("pause", this._ico("mdi:pause"), { title: "Pause" })}
            ${this._key("stop", this._ico("mdi:stop"), { title: "Stop" })}
            ${this._key("rewind", this._ico("mdi:skip-previous"), { title: "Rewind" })}
            ${this._key("subtitle", this._ico("mdi:subtitles-outline"), { title: "Subtitle" })}
            ${this._key("fast_forward", this._ico("mdi:skip-next"), { title: "Fast forward" })}
          </div>

          ${colors}
          ${numpad}

          <div class="overlay" id="overlay"></div>
        </div>
      </ha-card>`;

    this._built = true;
    this._bindEvents();
    if (this._hass) this._update();
  }

  // --------------------------------------------------------------- events
  _bindEvents() {
    const root = this.shadowRoot.getElementById("remote");
    root.addEventListener("pointerdown", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b || !b.hasAttribute("data-repeat")) return;
      e.preventDefault();
      this._pointerHandled = true;
      b.classList.add("pressed");
      this._fire(b);
      this._stopRepeat();
      this._holdTimer = setTimeout(() => {
        this._repeatTimer = setInterval(() => this._fire(b, true), 130);
      }, 450);
      this._pressed = b;
    });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (b && this._pointerHandled && b.hasAttribute("data-repeat")) {
        this._pointerHandled = false;
        return; // already fired on pointerdown
      }
      const ov = e.target.closest("#overlay");
      if (!b) {
        if (!ov) this._closeOverlay();
        return;
      }
      this._fire(b);
    });
  }

  _stopRepeat() {
    clearTimeout(this._holdTimer);
    clearInterval(this._repeatTimer);
    this._holdTimer = this._repeatTimer = null;
    if (this._pressed) {
      this._pressed.classList.remove("pressed");
      this._pressed = null;
    }
  }

  _haptic(repeat) {
    if (repeat) return;
    this.dispatchEvent(new CustomEvent("haptic", { detail: "light", bubbles: true, composed: true }));
  }

  _fire(b, repeat = false) {
    const entity = this._config.entity;
    const hass = this._hass;
    if (!hass) return;
    this._haptic(repeat);
    const act = b.dataset.act;
    switch (act) {
      case "key":
        hass.callService("hisense_vidaa", "send_key", { entity_id: entity, key: b.dataset.key });
        break;
      case "power": {
        const on = hass.states[entity]?.state === "on";
        hass.callService("media_player", on ? "turn_off" : "turn_on", { entity_id: entity });
        break;
      }
      case "app":
        hass.callService("hisense_vidaa", "launch_app", { entity_id: entity, app: b.dataset.app });
        break;
      case "source":
        hass.callService("media_player", "select_source", { entity_id: entity, source: b.dataset.source });
        break;
      case "input":
        this._toggleOverlay("input");
        break;
      case "pick":
        hass.callService("media_player", "select_source", { entity_id: entity, source: b.dataset.source });
        this._closeOverlay();
        break;
      case "close":
        this._closeOverlay();
        break;
      case "numtoggle":
        if (this._config.numpad === "popup") {
          this._toggleOverlay("numpad");
          break;
        }
        this._numOpen = !this._numOpen;
        this.shadowRoot.getElementById("numwrap")?.classList.toggle("open", this._numOpen);
        this.shadowRoot.getElementById("numtoggle")?.classList.toggle("active", this._numOpen);
        break;
    }
  }

  // -------------------------------------------------------------- overlay
  _toggleOverlay(kind) {
    const ov = this.shadowRoot.getElementById("overlay");
    if (ov.classList.contains("open") && ov.dataset.kind === kind) return this._closeOverlay();
    ov.dataset.kind = kind;
    const close = `<button class="ovclose" data-act="close" title="${esc(this._t("close"))}">${this._ico("mdi:close")}</button>`;
    if (kind === "numpad") {
      const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        .map((n) => this._key(`num_${n}`, `<span class="txt">${n}</span>`))
        .join("");
      ov.innerHTML = `<div class="ovhead"><h4>${esc(this._t("numpad"))}</h4>${close}</div>
        <div class="numpad big">
          ${digits}
          ${this._key("channel_dot", `<span class="txt">–</span>`, { title: "-" })}
          ${this._key("num_0", `<span class="txt">0</span>`)}
          ${this._key("ok", `<span class="txt">OK</span>`, { title: "OK" })}
        </div>`;
    } else {
      const st = this._hass.states[this._config.entity];
      const full = st?.attributes?.source_list || [];
      const cur = st?.attributes?.source;
      const chosen = (this._config.inputs || []).filter((i) => i && i.source);
      const items = chosen.length
        ? chosen.map((i) => ({ source: i.source, name: i.name || i.source, icon: i.icon }))
        : full.map((s) => ({ source: s, name: s }));
      const guess = (s) =>
        /hdmi/i.test(s) ? "mdi:video-input-hdmi" : /^(tv|dtv|atv)/i.test(s) ? "mdi:television-classic" : /^(av|component)/i.test(s) ? "mdi:video-input-component" : "mdi:apps";
      ov.innerHTML =
        `<div class="ovhead"><h4>${esc(this._t("sources"))}</h4>${close}</div>` +
        (items.length
          ? items
              .map(
                (i) =>
                  `<button data-act="pick" data-source="${esc(i.source)}" class="${i.source === cur ? "current" : ""}">${this._ico(i.icon || guess(i.source))}<span class="txt">${esc(i.name)}</span></button>`
              )
              .join("")
          : `<div class="empty">${esc(this._t("no_sources"))}</div>`);
    }
    ov.classList.add("open");
  }

  _closeOverlay() {
    this.shadowRoot.getElementById("overlay")?.classList.remove("open");
  }

  // --------------------------------------------------------------- update
  _update() {
    const st = this._hass.states[this._config.entity];
    const remote = this.shadowRoot.getElementById("remote");
    const state = st?.state ?? "unavailable";
    const isOn = state === "on" || state === "playing" || state === "paused" || state === "idle";
    const unavailable = !st || state === "unavailable";
    remote.classList.toggle("on", isOn && !unavailable);
    remote.classList.toggle("unavailable", unavailable);

    const title = this._config.name ?? st?.attributes?.friendly_name ?? this._config.entity;
    const titleEl = this.shadowRoot.getElementById("title");
    if (titleEl) titleEl.textContent = title;
    const statusKey = unavailable ? "unavailable" : isOn ? "on" : "off";
    let status = this._t(statusKey);
    const src = st?.attributes?.source;
    if (isOn && !unavailable && src) status += ` · ${src}`;
    const statusEl = this.shadowRoot.getElementById("status");
    if (statusEl) statusEl.textContent = status;

    const muted = !!st?.attributes?.is_volume_muted;
    this.shadowRoot.getElementById("mute")?.classList.toggle("active", muted);
    const vol = st?.attributes?.volume_level;
    const icon = this.shadowRoot.getElementById("volicon");
    if (icon) icon.setAttribute("icon", muted ? "mdi:volume-off" : "mdi:volume-high");
    const vl = this.shadowRoot.getElementById("vollabel");
    if (vl) vl.textContent = typeof vol === "number" && !muted ? Math.round(vol * 100) : "";

    // Keep an open overlay's highlight in sync
    const ov = this.shadowRoot.getElementById("overlay");
    if (ov?.classList.contains("open")) {
      ov.querySelectorAll("button[data-source]").forEach((b) =>
        b.classList.toggle("current", b.dataset.source === src)
      );
    }
  }
}

// ------------------------------------------------------------------ editor
const KEY_OPTIONS = [
  "home", "menu", "back", "exit", "info", "subtitle", "up", "down", "left", "right", "ok",
  "volume_up", "volume_down", "mute", "channel_up", "channel_down", "play", "pause", "stop",
  "rewind", "fast_forward", "red", "green", "yellow", "blue",
  "num_0", "num_1", "num_2", "num_3", "num_4", "num_5", "num_6", "num_7", "num_8", "num_9",
];
const COMMON_APPS = ["netflix", "youtube", "amazon", "disney", "tubi"];

const EDITOR_STYLE = `
  .item { border: 1px solid var(--divider-color); border-radius: 12px; padding: 10px 12px; margin: 8px 0; }
  .item-head { display: flex; align-items: center; gap: 4px; margin-bottom: 4px; font-weight: 500; }
  .item-head .grow { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ib { background: none; border: none; cursor: pointer; color: var(--primary-text-color); width: 36px; height: 36px; border-radius: 50%; }
  .ib:hover { background: var(--secondary-background-color); }
  .ib[disabled] { opacity: .3; cursor: default; }
  .ib.del { color: var(--error-color); }
  h3 { margin: 18px 0 2px; font-size: 14px; font-weight: 500; color: var(--secondary-text-color); }
  .hint { font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; }
  .add, .reset { cursor: pointer; border: 1px solid var(--primary-color); color: var(--primary-color); background: none;
                 border-radius: 18px; padding: 8px 16px; font: inherit; margin: 6px 8px 0 0; }
`;

class HisenseVidaaRemoteCardEditor extends HTMLElement {
  setConfig(config) {
    if (this._config && JSON.stringify(config) === JSON.stringify(this._config)) return;
    this._config = config;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._render();
    else {
      if (this._mainForm) this._mainForm.hass = hass;
      (this._itemForms || []).forEach((f) => (f.hass = hass));
    }
  }

  _t(k) {
    const lang = (this._hass?.language || "en").slice(0, 2);
    return (I18N[lang] || I18N.en)[k] ?? I18N.en[k] ?? k;
  }

  _emit(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  _sourceList() {
    return this._hass?.states?.[this._config.entity]?.attributes?.source_list || [];
  }

  _valueOptions(action) {
    const list = this._sourceList();
    if (action === "key") return KEY_OPTIONS;
    if (action === "source") return list;
    const apps = list.filter((s) => !/hdmi|^(tv|dtv|atv|av|component)$/i.test(s));
    return [...new Set([...COMMON_APPS, ...apps])];
  }

  // ---- list definitions -------------------------------------------------
  _shortcutsDef() {
    const actionLabels = { app: this._t("act_app"), source: this._t("act_source"), key: this._t("act_key") };
    return {
      key: "sources",
      title: this._t("shortcuts"),
      items: () => (this._config.sources ?? DEFAULT_SHORTCUTS).map((s) => ({ ...s })),
      newItem: () => ({ name: "", icon: "mdi:apps", app: "" }),
      reset: () => DEFAULT_SHORTCUTS.map((s) => ({ ...s })),
      addLabel: this._t("add_shortcut"),
      titleOf: (s) => s.name || s.app || s.source || s.key,
      toForm: (s) => {
        const action = s.key ? "key" : s.source ? "source" : "app";
        return { name: s.name || "", icon: s.icon || "", text: s.text || "", action, value: s[action] || "" };
      },
      fromForm: (d) => {
        const out = {};
        if (d.name) out.name = d.name;
        if (d.icon) out.icon = d.icon;
        if (d.text) out.text = d.text;
        out[d.action || "app"] = d.value || "";
        return out;
      },
      schema: (d) => [
        { name: "name", selector: { text: {} } },
        {
          type: "grid",
          name: "",
          schema: [
            { name: "icon", selector: { icon: {} } },
            { name: "text", selector: { text: {} } },
          ],
        },
        {
          name: "action",
          selector: {
            select: { mode: "dropdown", options: ["app", "source", "key"].map((v) => ({ value: v, label: actionLabels[v] })) },
          },
        },
        { name: "value", selector: { select: { mode: "dropdown", custom_value: true, options: this._valueOptions(d.action) } } },
      ],
      label: (n, d) =>
        n === "value" ? this._t(`val_${d.action}`) : this._t({ name: "f_name", icon: "f_icon", text: "f_text", action: "f_action" }[n]),
      // changing the action clears the value (its options differ)
      normalize: (d, prev) => (d.action !== prev.action ? { ...d, value: "" } : d),
      rebuildSchemaOn: (d, prev) => d.action !== prev.action,
    };
  }

  _inputsDef() {
    return {
      key: "inputs",
      title: this._t("inputs"),
      hint: this._t("inputs_hint"),
      items: () => (this._config.inputs || []).map((s) => ({ ...s })),
      newItem: () => ({ source: "", name: "", icon: "" }),
      addLabel: this._t("add_input"),
      titleOf: (s) => s.name || s.source,
      toForm: (s) => ({ source: s.source || "", name: s.name || "", icon: s.icon || "" }),
      fromForm: (d) => {
        const out = { source: d.source || "" };
        if (d.name) out.name = d.name;
        if (d.icon) out.icon = d.icon;
        return out;
      },
      schema: () => [
        { name: "source", selector: { select: { mode: "dropdown", custom_value: true, options: this._sourceList() } } },
        {
          type: "grid",
          name: "",
          schema: [
            { name: "name", selector: { text: {} } },
            { name: "icon", selector: { icon: {} } },
          ],
        },
      ],
      label: (n) => this._t({ source: "f_input", name: "f_name", icon: "f_icon" }[n]),
    };
  }

  // ---- rendering ----------------------------------------------------------
  _render() {
    if (!this._hass || !this._config) return;
    this.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = EDITOR_STYLE;
    this.appendChild(style);

    const main = document.createElement("ha-form");
    this._mainForm = main;
    main.hass = this._hass;
    main.data = { numpad: "collapsed", show_colors: false, show_title: true, show_status: true, ...this._config };
    const labels = {
      entity: "entity",
      name: "name",
      numpad: "numpad_mode",
      show_colors: "show_colors",
      show_title: "show_title",
      show_status: "show_status",
    };
    main.computeLabel = (s) => this._t(labels[s.name] || s.name);
    main.schema = [
      { name: "entity", required: true, selector: { entity: { domain: "media_player", integration: "hisense_vidaa" } } },
      { name: "name", selector: { text: {} } },
      { name: "show_title", selector: { boolean: {} } },
      { name: "show_status", selector: { boolean: {} } },
      {
        name: "numpad",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "collapsed", label: this._t("collapsed") },
              { value: "expanded", label: this._t("expanded") },
              { value: "popup", label: this._t("popup") },
              { value: "hidden", label: this._t("hidden") },
            ],
          },
        },
      },
      { name: "show_colors", selector: { boolean: {} } },
    ];
    main.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this._emit({ ...this._config, ...ev.detail.value });
    });
    this.appendChild(main);

    this._itemForms = [];
    this._renderList(this._inputsDef());
    this._renderList(this._shortcutsDef());
  }

  _renderList(def) {
    const h = document.createElement("h3");
    h.textContent = def.title;
    this.appendChild(h);
    if (def.hint) {
      const hint = document.createElement("div");
      hint.className = "hint";
      hint.textContent = def.hint;
      this.appendChild(hint);
    }

    const commit = (list, rerender) => {
      this._emit({ ...this._config, [def.key]: list });
      if (rerender) this._render();
    };

    const items = def.items();
    items.forEach((item, i) => {
      const box = document.createElement("div");
      box.className = "item";
      const head = document.createElement("div");
      head.className = "item-head";
      const title = document.createElement("span");
      title.className = "grow";
      title.textContent = def.titleOf(item) || `#${i + 1}`;
      head.appendChild(title);
      const mkBtn = (icon, cls, disabled, fn) => {
        const b = document.createElement("button");
        b.className = `ib ${cls}`;
        b.disabled = disabled;
        b.innerHTML = `<ha-icon icon="${icon}"></ha-icon>`;
        b.addEventListener("click", fn);
        head.appendChild(b);
      };
      const move = (d) => () => {
        const l = def.items();
        [l[i], l[i + d]] = [l[i + d], l[i]];
        commit(l, true);
      };
      mkBtn("mdi:arrow-up", "", i === 0, move(-1));
      mkBtn("mdi:arrow-down", "", i === items.length - 1, move(1));
      mkBtn("mdi:delete-outline", "del", false, () => {
        const l = def.items();
        l.splice(i, 1);
        commit(l, true);
      });
      box.appendChild(head);

      const form = document.createElement("ha-form");
      form.hass = this._hass;
      form.data = def.toForm(item);
      form.computeLabel = (sch) => def.label(sch.name, form.data);
      form.schema = def.schema(form.data);
      form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const prev = form.data;
        const d = def.normalize ? def.normalize({ ...ev.detail.value }, prev) : { ...ev.detail.value };
        form.data = d;
        const l = def.items();
        l[i] = def.fromForm(d);
        if (def.rebuildSchemaOn && def.rebuildSchemaOn(d, prev)) form.schema = def.schema(d);
        commit(l, false);
        title.textContent = def.titleOf(l[i]) || `#${i + 1}`;
      });
      this._itemForms.push(form);
      box.appendChild(form);
      this.appendChild(box);
    });

    const add = document.createElement("button");
    add.className = "add";
    add.textContent = `+ ${def.addLabel}`;
    add.addEventListener("click", () => {
      const l = def.items();
      l.push(def.newItem());
      commit(l, true);
    });
    this.appendChild(add);

    if (def.reset) {
      const reset = document.createElement("button");
      reset.className = "reset";
      reset.textContent = this._t("reset_shortcuts");
      reset.addEventListener("click", () => commit(def.reset(), true));
      this.appendChild(reset);
    }
  }
}

customElements.define("hisense-vidaa-remote-card", HisenseVidaaRemoteCard);
customElements.define("hisense-vidaa-remote-card-editor", HisenseVidaaRemoteCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hisense-vidaa-remote-card",
  name: "Hisense VIDAA Remote",
  description: "TV remote control card for the Hisense VIDAA TV integration",
  preview: true,
});

console.info(
  `%c HISENSE-VIDAA-REMOTE-CARD %c v${CARD_VERSION} `,
  "color:white;background:#d32f2f;font-weight:700",
  "color:#d32f2f;background:white;font-weight:700"
);
