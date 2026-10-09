import Debounce from '../../ui-kit/ui/Debounce.js';
import SavedBadge from '../../ui-kit/ui/SavedBadge.js';

export default class CdpSettingsTab {
  static EXTENSION_ID = 'cdp-driver';

  static DEFAULT_HOST = '127.0.0.1';

  static DEFAULT_PORT = 9222;

  static TYPING_SAVE_MS = 500;

  static CHECKBOX_IDS = ['ext-cdp-autostart', 'ext-cdp-fb-enabled', 'ext-cdp-fb-find', 'ext-cdp-fb-click'];

  static SETTINGS_HTML = `
    <div class="luma-field">
      <div class="ext-status-row">
        <span class="luma-dot" id="ext-cdp-status"></span>
        <span id="ext-cdp-statusText">CDP server: checking...</span>
        <span class="ext-layout-spacer"></span>
        <button class="luma-btn luma-btn--sm primary" id="ext-cdp-startBtn" disabled>Start</button>
        <button class="luma-btn luma-btn--sm" id="ext-cdp-stopBtn" disabled>Stop</button>
      </div>
      <div class="luma-field-help ext-hidden" id="ext-cdp-endpoint"></div>
    </div>

    <div class="luma-field">
      <div class="luma-field-help">
        Any CDP client can connect once the server is running:
        <ul style="margin: 6px 0 0 20px;">
          <li><strong>Puppeteer:</strong> <code>puppeteer.connect({ browserURL: 'http://host:port' })</code></li>
          <li><strong>Playwright:</strong> <code>chromium.connectOverCDP('http://host:port')</code></li>
          <li><strong>chrome-remote-interface:</strong> <code>CDP({ host, port })</code></li>
          <li><strong>Playwright MCP:</strong> <code>--cdp-endpoint http://host:port</code></li>
        </ul>
      </div>
    </div>

    <div class="luma-field">
      <label class="luma-field-label">Host</label>
      <input type="text" class="luma-field-input" id="ext-cdp-host" placeholder="127.0.0.1">
      <div class="luma-field-help">Bind address. Use 127.0.0.1 for local only, or 0.0.0.0 to expose on the network. Restart the server to apply.</div>
    </div>

    <div class="luma-field">
      <label class="luma-field-label">Port</label>
      <input type="number" class="luma-field-input" id="ext-cdp-port" placeholder="9222" min="1" max="65535">
      <div class="luma-field-help">Default 9222 (Chrome DevTools convention).</div>
    </div>

    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-cdp-autostart">
        Start automatically when LumaBrowser launches
      </label>
    </div>

    <hr class="ext-divider">

    <h3 class="luma-section-label">LLM fallback defaults</h3>
    <div class="luma-field-help">
      When a CDP client opts in (via <code>Lumabyte.configureFallback</code>
      or <code>lumabyte:description</code> params), failed selectors can be
      re-resolved by an LLM. These are the defaults applied when the client
      enables fallback without specifying details.
    </div>

    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-cdp-fb-enabled">
        Enable fallback by default
      </label>
    </div>
    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-cdp-fb-find">
        Retry DOM.querySelector via LLM when the original selector matches nothing
      </label>
    </div>
    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-cdp-fb-click">
        Retry Input.dispatchMouseEvent via LLM when the click is intercepted
      </label>
    </div>
    <div class="luma-field-help">Changes save automatically.</div>
  `;

  constructor() {
    this._active = false;
    this._ipc = null;
    this._container = null;
    this._loading = false;
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (!this._container) return;
    this._bindServerButtons();
    this._bindAutosave();
    this._refresh();
  }

  deactivate() {
    this._container = null;
    this._active = false;
  }

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', CdpSettingsTab.EXTENSION_ID, CdpSettingsTab.SETTINGS_HTML, {
      label: 'CDP Driver',
      tabId: CdpSettingsTab.EXTENSION_ID,
      onActivate: () => this._refresh(),
    });
  }

  _q(id) {
    return this._container.querySelector('#' + id);
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${CdpSettingsTab.EXTENSION_ID}.${channel}`, ...args);
  }

  _bindServerButtons() {
    this._bindServerButton(this._q('ext-cdp-startBtn'), 'start', 'Starting', 'Start');
    this._bindServerButton(this._q('ext-cdp-stopBtn'), 'stop', 'Stopping', 'Stop');
  }

  _bindServerButton(button, channel, busyLabel, label) {
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = busyLabel;
      try { await this._invoke(channel); } finally { button.textContent = label; }
      this._refresh();
    });
  }

  _bindAutosave() {
    const saveNow = () => this._save();
    const saveSoon = Debounce.wrap(saveNow, CdpSettingsTab.TYPING_SAVE_MS);
    for (const id of ['ext-cdp-host', 'ext-cdp-port']) {
      this._q(id).addEventListener('input', saveSoon);
      this._q(id).addEventListener('change', saveNow);
    }
    for (const id of CdpSettingsTab.CHECKBOX_IDS) this._q(id).addEventListener('change', saveNow);
  }

  async _save() {
    if (this._loading || !this._container) return;
    await this._invoke('settings.set', this._patch());
    SavedBadge.flash(this._q('ext-cdp-statusText'));
  }

  _patch() {
    return {
      host: this._q('ext-cdp-host').value || CdpSettingsTab.DEFAULT_HOST,
      port: Number(this._q('ext-cdp-port').value) || CdpSettingsTab.DEFAULT_PORT,
      enabled: this._q('ext-cdp-autostart').checked,
      fallback: {
        defaultEnabled: this._q('ext-cdp-fb-enabled').checked,
        onFindFail: this._q('ext-cdp-fb-find').checked,
        onClickIntercepted: this._q('ext-cdp-fb-click').checked,
      },
    };
  }

  async _refresh() {
    if (!this._container) return;
    let status;
    try {
      status = await this._invoke('status');
    } catch (e) {
      this._q('ext-cdp-statusText').textContent = 'CDP server: unavailable';
      return;
    }
    this._showStatus(status);
    this._fillSettings(status.settings || {});
  }

  _showStatus(status) {
    const running = !!status.running;
    const endpoint = this._q('ext-cdp-endpoint');
    this._q('ext-cdp-status').classList.toggle('ok', running);
    this._q('ext-cdp-statusText').textContent = 'CDP server: ' + (running ? 'running' : 'stopped');
    endpoint.classList.toggle('ext-hidden', !running);
    if (running) {
      endpoint.textContent = `http://${status.host}:${status.port}, ${status.sessions.length} session(s), ${status.targets.length} target(s)`;
    }
    this._q('ext-cdp-startBtn').disabled = running;
    this._q('ext-cdp-stopBtn').disabled = !running;
  }

  _fillSettings(settings) {
    this._loading = true;
    const fallback = settings.fallback || {};
    this._q('ext-cdp-host').value = settings.host || CdpSettingsTab.DEFAULT_HOST;
    this._q('ext-cdp-port').value = settings.port || CdpSettingsTab.DEFAULT_PORT;
    this._q('ext-cdp-autostart').checked = !!settings.enabled;
    this._q('ext-cdp-fb-enabled').checked = !!fallback.defaultEnabled;
    this._q('ext-cdp-fb-find').checked = fallback.onFindFail !== false;
    this._q('ext-cdp-fb-click').checked = fallback.onClickIntercepted !== false;
    this._loading = false;
  }
}
