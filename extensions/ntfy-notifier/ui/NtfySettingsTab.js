export default class NtfySettingsTab {
  static EXTENSION_ID = 'ntfy-notifier';

  static STATUS_CLEAR_MS = 2500;

  static STORED_PLACEHOLDER = 'Stored (type to replace)';

  static SETTINGS_HTML = `
    <div class="luma-field">
      <label class="luma-field-label" for="ext-ntfy-server">Server</label>
      <input type="url" class="luma-field-input" id="ext-ntfy-server" placeholder="https://ntfy.sh" autocomplete="off">
      <div class="luma-field-help">ntfy.sh or your own server. Every notification is a POST to this server.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-ntfy-topic">Default topic</label>
      <input type="text" class="luma-field-input" id="ext-ntfy-topic" placeholder="my-luma-alerts" autocomplete="off">
      <div class="luma-field-help">The topic your devices subscribe to. Letters, digits, dashes and underscores. Treat it like a password on ntfy.sh: anyone who knows it can read and post.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-ntfy-username">Username</label>
      <input type="text" class="luma-field-input" id="ext-ntfy-username" placeholder="Optional" autocomplete="off">
      <div class="luma-field-help">Only for servers that require login (HTTP Basic).</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label" for="ext-ntfy-password">Password</label>
      <input type="password" class="luma-field-input" id="ext-ntfy-password" placeholder="Optional" autocomplete="new-password">
      <div class="luma-field-help" id="ext-ntfy-password-help">Stored on this machine and used by the send_notification_ntfy tool. The AI never sees it.</div>
    </div>
    <div class="luma-form-actions">
      <button type="button" class="luma-btn" id="ext-ntfy-test">Send test</button>
      <span class="luma-muted" id="ext-ntfy-status" role="status" aria-live="polite"></span>
    </div>
    <div class="luma-callout">
      In a chat, enable the send_notification_ntfy tool under Programmatic tools, then ask the AI to notify you. Each send asks for your approval first.
    </div>
  `;

  constructor() {
    this._ipc = null;
    this._container = null;
    this._statusTimer = null;
    this._els = {};
  }

  async activate(context) {
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (!this._container) return;
    this._findElements();
    this._bindEvents();
    await this._load();
  }

  deactivate() {}

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', NtfySettingsTab.EXTENSION_ID, NtfySettingsTab.SETTINGS_HTML, {
      label: 'Ntfy Notifications',
      tabId: NtfySettingsTab.EXTENSION_ID,
      onActivate: () => this._load(),
    });
  }

  _findElements() {
    const q = (id) => this._container.querySelector(`#${id}`);
    this._els = {
      server: q('ext-ntfy-server'),
      topic: q('ext-ntfy-topic'),
      username: q('ext-ntfy-username'),
      password: q('ext-ntfy-password'),
      testBtn: q('ext-ntfy-test'),
      status: q('ext-ntfy-status'),
    };
  }

  _bindEvents() {
    const { server, topic, username, password, testBtn } = this._els;
    for (const el of [server, topic, username, password]) el.addEventListener('change', () => this._save());
    testBtn.addEventListener('click', () => this._sendTest());
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${NtfySettingsTab.EXTENSION_ID}.${channel}`, ...args);
  }

  async _load() {
    try {
      const r = await this._invoke('getSettings');
      if (!r || r.success === false) return;
      this._fill(r);
    } catch (e) {
      console.error('ntfy-notifier: failed to load settings:', e);
    }
  }

  _fill(r) {
    const { server, topic, username, password } = this._els;
    server.value = r.server || '';
    topic.value = r.topic || '';
    username.value = r.username || '';
    password.value = '';
    password.placeholder = r.hasPassword ? NtfySettingsTab.STORED_PLACEHOLDER : 'Optional';
  }

  async _save() {
    const patch = this._patch();
    try {
      const r = await this._invoke('saveSettings', patch);
      if (r && r.success) this._onSaved(patch);
      else this._flash((r && r.error) || 'Could not save', true);
    } catch (e) {
      this._flash(e.message || 'Could not save', true);
    }
  }

  _patch() {
    const { server, topic, username, password } = this._els;
    const patch = { server: server.value, topic: topic.value, username: username.value };
    if (password.value) patch.password = password.value;
    return patch;
  }

  _onSaved(patch) {
    if (patch.password) {
      this._els.password.value = '';
      this._els.password.placeholder = NtfySettingsTab.STORED_PLACEHOLDER;
    }
    this._flash('Saved');
  }

  async _sendTest() {
    const { testBtn } = this._els;
    testBtn.disabled = true;
    this._flash('Sending...');
    try {
      const r = await this._invoke('sendTest');
      if (r && r.success) this._flash('Sent. Check your device.');
      else this._flash((r && r.error) || 'Send failed', true);
    } catch (e) {
      this._flash(e.message || 'Send failed', true);
    } finally {
      testBtn.disabled = false;
    }
  }

  _flash(text, isError) {
    const { status } = this._els;
    if (!status) return;
    status.textContent = text;
    status.className = isError ? 'luma-form-err' : 'luma-muted';
    if (this._statusTimer) clearTimeout(this._statusTimer);
    if (!isError) this._statusTimer = setTimeout(() => { status.textContent = ''; }, NtfySettingsTab.STATUS_CLEAR_MS);
  }
}
