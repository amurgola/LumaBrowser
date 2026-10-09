import Debounce from '../../ui-kit/ui/Debounce.js';
import SavedBadge from '../../ui-kit/ui/SavedBadge.js';

export default class SeleniumSettingsTab {
  static EXTENSION_ID = 'selenium-driver';

  static DEFAULT_HOST = '127.0.0.1';

  static DEFAULT_PORT = 9515;

  static TYPING_SAVE_MS = 500;

  static TEXT_IDS = ['ext-sd-host', 'ext-sd-port', 'ext-sd-prefix'];

  static CHECKBOX_IDS = ['ext-sd-autostart', 'ext-sd-fb-enabled', 'ext-sd-fb-find', 'ext-sd-fb-click'];

  static SETTINGS_HTML = `
    <div class="luma-field">
      <div class="ext-status-row">
        <span class="luma-dot" id="ext-sd-status"></span>
        <span id="ext-sd-statusText">WebDriver: checking...</span>
        <span class="ext-layout-spacer"></span>
        <button class="luma-btn luma-btn--sm primary" id="ext-sd-startBtn" disabled>Start</button>
        <button class="luma-btn luma-btn--sm" id="ext-sd-stopBtn" disabled>Stop</button>
      </div>
      <div class="luma-field-help ext-hidden" id="ext-sd-endpoint"></div>
    </div>

    <div class="luma-field">
      <label class="luma-field-label">Host</label>
      <input type="text" class="luma-field-input" id="ext-sd-host" placeholder="127.0.0.1">
      <div class="luma-field-help">Bind address. Use 127.0.0.1 for local only, or 0.0.0.0 to expose on the network. Restart the server to apply.</div>
    </div>

    <div class="luma-field">
      <label class="luma-field-label">Port</label>
      <input type="number" class="luma-field-input" id="ext-sd-port" placeholder="9515" min="1" max="65535">
      <div class="luma-field-help">Default 9515 (ChromeDriver convention).</div>
    </div>

    <div class="luma-field">
      <label class="luma-field-label">URL prefix (optional)</label>
      <input type="text" class="luma-field-input" id="ext-sd-prefix" placeholder="">
      <div class="luma-field-help">Leave blank for root. Set to /wd/hub for Selenium Grid clients.</div>
    </div>

    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-sd-autostart">
        Start automatically when LumaBrowser launches
      </label>
    </div>

    <hr class="ext-divider">

    <h3 class="luma-section-label">LLM fallback defaults</h3>
    <div class="luma-field-help">
      When a Selenium client opts in via the <code>lumabyte:llmFallback</code> capability,
      failed CSS/XPath selectors can be re-resolved by an LLM. These are the defaults
      applied when the capability is set to <code>true</code> without details.
    </div>

    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-sd-fb-enabled">
        Enable fallback by default (sessions without the capability still opt in)
      </label>
    </div>
    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-sd-fb-find">
        Retry Find Element via LLM when the original selector matches nothing
      </label>
    </div>
    <div class="luma-field">
      <label class="luma-check">
        <input type="checkbox" id="ext-sd-fb-click">
        Retry Click via LLM when the original click is intercepted
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
    return slotManager.register('settings-tab', SeleniumSettingsTab.EXTENSION_ID, SeleniumSettingsTab.SETTINGS_HTML, {
      label: 'Selenium Driver',
      tabId: SeleniumSettingsTab.EXTENSION_ID,
      onActivate: () => this._refresh(),
    });
  }

  _q(id) {
    return this._container.querySelector('#' + id);
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${SeleniumSettingsTab.EXTENSION_ID}.${channel}`, ...args);
  }

  _bindServerButtons() {
    this._bindServerButton(this._q('ext-sd-startBtn'), 'start', 'Starting', 'Start');
    this._bindServerButton(this._q('ext-sd-stopBtn'), 'stop', 'Stopping', 'Stop');
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
    const saveSoon = Debounce.wrap(saveNow, SeleniumSettingsTab.TYPING_SAVE_MS);
    for (const id of SeleniumSettingsTab.TEXT_IDS) {
      this._q(id).addEventListener('input', saveSoon);
      this._q(id).addEventListener('change', saveNow);
    }
    for (const id of SeleniumSettingsTab.CHECKBOX_IDS) this._q(id).addEventListener('change', saveNow);
  }

  async _save() {
    if (this._loading || !this._container) return;
    await this._invoke('settings.set', this._patch());
    SavedBadge.flash(this._q('ext-sd-statusText'));
  }

  _patch() {
    return {
      host: this._q('ext-sd-host').value || SeleniumSettingsTab.DEFAULT_HOST,
      port: Number(this._q('ext-sd-port').value) || SeleniumSettingsTab.DEFAULT_PORT,
      prefix: this._q('ext-sd-prefix').value || '',
      enabled: this._q('ext-sd-autostart').checked,
      fallback: {
        defaultEnabled: this._q('ext-sd-fb-enabled').checked,
        onFindFail: this._q('ext-sd-fb-find').checked,
        onClickIntercepted: this._q('ext-sd-fb-click').checked,
      },
    };
  }

  async _refresh() {
    if (!this._container) return;
    let status;
    try {
      status = await this._invoke('status');
    } catch (e) {
      this._q('ext-sd-statusText').textContent = 'WebDriver: unavailable';
      return;
    }
    this._showStatus(status);
    this._fillSettings(status.settings || {});
  }

  _showStatus(status) {
    const running = !!status.running;
    const endpoint = this._q('ext-sd-endpoint');
    this._q('ext-sd-status').classList.toggle('ok', running);
    this._q('ext-sd-statusText').textContent = 'WebDriver: ' + (running ? 'running' : 'stopped');
    endpoint.classList.toggle('ext-hidden', !running);
    if (running) {
      endpoint.textContent = `http://${status.host}:${status.port}${status.prefix || ''}, ${status.sessions.length} active session(s)`;
    }
    this._q('ext-sd-startBtn').disabled = running;
    this._q('ext-sd-stopBtn').disabled = !running;
  }

  _fillSettings(settings) {
    this._loading = true;
    const fallback = settings.fallback || {};
    this._q('ext-sd-host').value = settings.host || SeleniumSettingsTab.DEFAULT_HOST;
    this._q('ext-sd-port').value = settings.port || SeleniumSettingsTab.DEFAULT_PORT;
    this._q('ext-sd-prefix').value = settings.prefix || '';
    this._q('ext-sd-autostart').checked = !!settings.enabled;
    this._q('ext-sd-fb-enabled').checked = !!fallback.defaultEnabled;
    this._q('ext-sd-fb-find').checked = fallback.onFindFail !== false;
    this._q('ext-sd-fb-click').checked = fallback.onClickIntercepted !== false;
    this._loading = false;
  }
}
