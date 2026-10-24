export default class DesktopSettingsTab {
  static EXTENSION_ID = 'desktop-integration';
  static CHANGED_CHANNEL = 'ext.desktop-integration.changed';
  static STATUS_CLEAR_MS = 2500;
  static MASK = '•'.repeat(24);

  static SETTINGS_HTML = `
    <div class="luma-callout">
      Lets programs on this computer (taskbar and shell mods, AutoHotkey, PowerToys, scripts) talk to Luma over a local API at
      <span class="luma-code-inline" id="ext-dsk-base">/api/desktop</span>. Clients find the port and token in the handshake file below.
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-dsk-token">Desktop token</label>
      <input type="text" class="luma-field-input" id="ext-dsk-token" readonly autocomplete="off" spellcheck="false">
      <div class="luma-form-actions">
        <button type="button" class="luma-btn luma-btn--sm" id="ext-dsk-reveal">Show</button>
        <button type="button" class="luma-btn luma-btn--sm" id="ext-dsk-copy">Copy</button>
        <button type="button" class="luma-btn luma-btn--sm" id="ext-dsk-rotate">Rotate</button>
        <span class="luma-muted" id="ext-dsk-status" role="status" aria-live="polite"></span>
      </div>
      <div class="luma-field-help">Clients send it as <span class="luma-code-inline">X-Luma-Desktop-Token</span> (or <span class="luma-code-inline">Authorization: Bearer</span>). Rotating stops the old token at once; clients that read the handshake file pick up the new one by themselves.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-dsk-handshake">Handshake file</label>
      <input type="text" class="luma-field-input" id="ext-dsk-handshake" readonly spellcheck="false">
      <div class="luma-field-help" id="ext-dsk-handshake-help"></div>
    </div>
    <h3 class="luma-section-label">Features</h3>
    <div class="luma-list" id="ext-dsk-features"></div>
    <h3 class="luma-section-label">Connected clients</h3>
    <div class="luma-list" id="ext-dsk-clients"></div>
  `;

  constructor() {
    this._ipc = null;
    this._container = null;
    this._els = {};
    this._token = '';
    this._revealed = false;
    this._statusTimer = null;
    this._detach = null;
  }

  async activate(context) {
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (!this._container) return;
    this._findElements();
    this._bindEvents();
    this._listen();
    await this._load();
  }

  deactivate() {
    if (this._detach) { try { this._detach(); } catch (_) {} }
    this._detach = null;
  }

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', DesktopSettingsTab.EXTENSION_ID, DesktopSettingsTab.SETTINGS_HTML, {
      label: 'Desktop Integration',
      tabId: DesktopSettingsTab.EXTENSION_ID,
      onActivate: () => this._load(),
    });
  }

  _findElements() {
    const q = (id) => this._container.querySelector(`#${id}`);
    this._els = {
      base: q('ext-dsk-base'), token: q('ext-dsk-token'), reveal: q('ext-dsk-reveal'), copy: q('ext-dsk-copy'),
      rotate: q('ext-dsk-rotate'), status: q('ext-dsk-status'), handshake: q('ext-dsk-handshake'),
      handshakeHelp: q('ext-dsk-handshake-help'), features: q('ext-dsk-features'), clients: q('ext-dsk-clients'),
    };
  }

  _bindEvents() {
    const { reveal, copy, rotate, features } = this._els;
    reveal.addEventListener('click', () => { this._revealed = !this._revealed; this._paintToken(); });
    copy.addEventListener('click', () => this._copy());
    rotate.addEventListener('click', () => this._rotate());
    features.addEventListener('change', (e) => {
      const input = e.target;
      if (!input || !input.dataset) return;
      if (input.dataset.setting) this._saveSetting(input);
      else if (input.dataset.feature) this._toggle(input.dataset.feature, input.checked, input);
    });
  }

  _listen() {
    if (!this._ipc || typeof this._ipc.on !== 'function') return;
    const detach = this._ipc.on(DesktopSettingsTab.CHANGED_CHANNEL, () => this._load());
    this._detach = typeof detach === 'function' ? detach : null;
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${DesktopSettingsTab.EXTENSION_ID}.${channel}`, ...args);
  }

  async _load() {
    try {
      const r = await this._invoke('getInfo');
      if (r && r.success !== false) this._fill(r);
    } catch (e) {
      console.error('desktop-integration: failed to load settings:', e);
    }
  }

  _fill(info) {
    this._token = info.token || '';
    this._paintToken();
    this._els.base.textContent = info.baseUrl || info.apiBase || '/api/desktop';
    this._els.handshake.value = info.handshakePath || '';
    this._els.handshakeHelp.textContent = info.handshakeWritten
      ? 'Written. Holds the port, token, app version and enabled features; rewritten on every change.'
      : 'Not written yet: the local API is off or has not started (Settings > API).';
    this._renderFeatures(info.features || [], info.failed || []);
    this._renderClients(info.clients || []);
  }

  _paintToken() {
    this._els.token.value = this._revealed ? this._token : (this._token ? DesktopSettingsTab.MASK : '');
    this._els.reveal.textContent = this._revealed ? 'Hide' : 'Show';
  }

  _renderFeatures(features, failed) {
    const rows = features.map((f) => DesktopSettingsTab._featureCard(f));
    for (const f of failed) rows.push(DesktopSettingsTab._failedCard(f));
    this._els.features.innerHTML = rows.length ? rows.join('') : '<div class="luma-empty luma-empty--plain">No feature modules are installed.</div>';
  }

  static _featureCard(f) {
    const esc = DesktopSettingsTab._esc;
    const badge = f.error ? `<span class="luma-badge bad" title="${esc(f.error)}">Failed to start</span>` : '';
    return `
      <div class="luma-card luma-card--center">
        <div class="luma-card-main">
          <div class="luma-card-top"><span class="luma-card-name">${esc(f.label)}</span><span class="luma-badge muted">${esc(f.id)}</span>${badge}</div>
          ${f.description ? `<div class="luma-card-desc">${esc(f.description)}</div>` : ''}
          ${DesktopSettingsTab._settingsBlock(f)}
        </div>
        <label class="luma-switch">
          <input type="checkbox" data-feature="${esc(f.id)}" ${f.enabled ? 'checked' : ''} aria-label="Enable ${esc(f.label)}">
          <span class="luma-switch-track"></span>
        </label>
      </div>`;
  }

  static _settingsBlock(f) {
    const fields = Array.isArray(f.settings) ? f.settings : [];
    if (!fields.length) return '';
    return `
      <details class="gs-disclosure">
        <summary>Settings</summary>
        ${fields.map((field) => DesktopSettingsTab._settingField(f.id, field)).join('')}
      </details>`;
  }

  static _settingField(featureId, field) {
    const esc = DesktopSettingsTab._esc;
    const id = `ext-dsk-set-${featureId}-${field.key}`.replace(/[^A-Za-z0-9_-]/g, '-');
    const attrs = `id="${id}" data-setting="${esc(field.key)}" data-setting-feature="${esc(featureId)}" data-setting-type="${esc(field.type)}"`;
    const help = field.help ? `<div class="luma-field-help">${esc(field.help)}</div>` : '';
    const value = field.value == null ? '' : field.value;
    if (field.type === 'bool') {
      return `<div class="luma-field"><label class="luma-field-label"><input type="checkbox" ${attrs} ${value ? 'checked' : ''}> ${esc(field.label)}</label>${help}</div>`;
    }
    const label = `<label class="luma-field-label" for="${id}">${esc(field.label)}</label>`;
    if (field.type === 'select') {
      const options = (field.options || []).map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
      return `<div class="luma-field">${label}<select class="luma-field-select" ${attrs}>${options}</select>${help}</div>`;
    }
    if (field.type === 'textarea') {
      return `<div class="luma-field">${label}<textarea class="luma-field-textarea" rows="3" ${attrs}>${esc(value)}</textarea>${help}</div>`;
    }
    const type = field.type === 'number' ? 'number' : 'text';
    const bounds = ['min', 'max', 'step'].filter((k) => field[k] !== undefined).map((k) => `${k}="${esc(field[k])}"`).join(' ');
    const placeholder = field.type === 'hotkey' ? 'placeholder="e.g. Ctrl+Alt+Shift+R (empty = off)"' : '';
    return `<div class="luma-field">${label}<input type="${type}" class="luma-field-input" ${attrs} ${bounds} ${placeholder} value="${esc(value)}" spellcheck="false">${help}</div>`;
  }

  async _saveSetting(input) {
    const { settingFeature, setting, settingType } = input.dataset;
    const value = settingType === 'bool' ? input.checked : input.value;
    try {
      const r = await this._invoke('setFeatureSetting', settingFeature, setting, value);
      if (r && r.success === false) throw new Error(r.error || 'Could not save the setting');
      this._flash('Saved');
    } catch (e) {
      this._flash(e.message || 'Could not save the setting', true);
    }
  }

  static _failedCard(f) {
    const esc = DesktopSettingsTab._esc;
    return `
      <div class="luma-card">
        <div class="luma-card-main">
          <div class="luma-card-top"><span class="luma-card-name">${esc(f.folder)}</span><span class="luma-badge bad">Not loaded</span></div>
          <div class="luma-card-desc">${esc(f.error)}</div>
        </div>
      </div>`;
  }

  _renderClients(clients) {
    const esc = DesktopSettingsTab._esc;
    if (!clients.length) {
      this._els.clients.innerHTML = '<div class="luma-empty luma-empty--plain">No desktop client has connected since Luma started.</div>';
      return;
    }
    this._els.clients.innerHTML = clients.map((c) => {
      const used = Object.entries(c.features || {}).map(([id, n]) => `${id} (${n})`).join(', ');
      return `
        <div class="luma-card">
          <div class="luma-card-main">
            <div class="luma-card-top"><span class="luma-card-name">${esc(c.name)}</span>${c.version ? `<span class="luma-badge muted">${esc(c.version)}</span>` : ''}</div>
            <div class="luma-card-desc">Last seen ${esc(DesktopSettingsTab._when(c.lastSeen))}, ${c.requests} request${c.requests === 1 ? '' : 's'}${used ? `, used ${esc(used)}` : ''}</div>
          </div>
        </div>`;
    }).join('');
  }

  async _toggle(id, enabled, input) {
    try {
      const r = await this._invoke('setFeatureEnabled', id, enabled);
      if (r && r.success === false) throw new Error(r.error || 'Could not change the feature');
      await this._load();
    } catch (e) {
      input.checked = !enabled;
      this._flash(e.message || 'Could not change the feature', true);
    }
  }

  async _copy() {
    try {
      await navigator.clipboard.writeText(this._token);
      this._flash('Copied');
    } catch (_) {
      this._flash('Could not copy', true);
    }
  }

  async _rotate() {
    const ok = typeof window.confirm === 'function' ? window.confirm('Rotate the desktop token? Clients that do not read the handshake file stop working until they get the new one.') : true;
    if (!ok) return;
    try {
      const r = await this._invoke('rotateToken');
      if (!r || r.success === false) throw new Error((r && r.error) || 'Could not rotate');
      this._token = r.token;
      this._paintToken();
      this._flash('Rotated');
    } catch (e) {
      this._flash(e.message || 'Could not rotate', true);
    }
  }

  _flash(text, isError) {
    const { status } = this._els;
    if (!status) return;
    status.textContent = text;
    status.className = isError ? 'luma-form-err' : 'luma-muted';
    if (this._statusTimer) clearTimeout(this._statusTimer);
    if (!isError) this._statusTimer = setTimeout(() => { status.textContent = ''; }, DesktopSettingsTab.STATUS_CLEAR_MS);
  }

  static _when(iso) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return 'never';
    const secs = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.round(secs / 60)} min ago`;
    return new Date(t).toLocaleString();
  }

  static _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
}
