import Debounce from '../../ui-kit/ui/Debounce.js';
import SavedBadge from '../../ui-kit/ui/SavedBadge.js';
import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import NotificationLogMarkup from './NotificationLogMarkup.js';

export default class NotificationSettingsTab {
  static EXTENSION_ID = 'notification-interceptor';

  static TYPING_SAVE_MS = 500;

  static TEST_RESULT_MS = 6000;

  static MAX_ENTRIES = 50;

  static SETTINGS_HTML = `
    <div class="luma-field">
      <label class="luma-field-label">Webhook URL</label>
      <div class="ext-layout-inline ext-layout-inline--gap-sm">
        <input type="text" class="luma-field-input" id="ext-ni-webhookUrl" placeholder="https://example.com/webhook" style="flex:1;">
      </div>
      <div class="luma-field-help">Every captured notification is sent here as a JSON POST. Saves as you type.</div>
    </div>
    <div class="luma-field">
      <div class="ext-status-row">
        <span class="luma-dot" id="ext-ni-status"></span>
        <span id="ext-ni-statusText">Webhook: not configured</span>
      </div>
    </div>
    <div class="luma-form-actions ext-form-buttons--start ext-mt-12">
      <button class="luma-btn" id="ext-ni-testBtn">Send a test</button>
      <span class="luma-field-help" id="ext-ni-testResult" style="margin-top:0;"></span>
    </div>

    <hr class="ext-divider">

    <div class="ext-layout-inline ext-layout-inline--space-between">
      <h4 class="luma-section-label" style="margin:0;">Recent notifications <span class="luma-badge muted" id="ext-ni-count">0</span></h4>
      <button class="luma-btn luma-btn--sm" id="ext-ni-clearBtn">Clear</button>
    </div>
    <div class="luma-list ext-mt-8" id="ext-ni-log"></div>

    <details class="ext-details">
      <summary>Example webhook payload</summary>
      <pre>{
  "timestamp": "2026-03-24T12:00:00.000Z",
  "source": "example.com",
  "title": "New Message",
  "body": "You have a new notification",
  "icon": "https://example.com/icon.png",
  "tag": "msg-123",
  "url": "https://example.com/inbox",
  "tabId": 0,
  "tabTitle": "Example Site"
}</pre>
    </details>
  `;

  constructor() {
    this._ipc = null;
    this._container = null;
    this._els = {};
    this._webhookUrl = '';
    this._count = 0;
    this._entries = [];
    this._testTimer = null;
  }

  get count() {
    return this._count;
  }

  async activate(context) {
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (this._container) {
      this._findElements();
      this._bindEvents();
    }
    await this.load();
  }

  deactivate() {
    if (this._testTimer) {
      clearTimeout(this._testTimer);
      this._testTimer = null;
    }
    this._container = null;
    this._els = {};
    this._entries = [];
  }

  async load() {
    await this._loadSettings();
    await this._loadLog();
  }

  addIngested(ingestResult) {
    this._count = ingestResult.count || (this._count + 1);
    if (ingestResult.entry) this._entries.unshift(ingestResult.entry);
    this._entries = this._entries.slice(0, NotificationSettingsTab.MAX_ENTRIES);
    this._renderLog();
  }

  invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${NotificationSettingsTab.EXTENSION_ID}.${channel}`, ...args);
  }

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', NotificationSettingsTab.EXTENSION_ID, NotificationSettingsTab.SETTINGS_HTML, {
      label: 'Notifications',
      tabId: 'notifications',
      onActivate: () => this.load(),
    });
  }

  _findElements() {
    const q = (id) => this._container.querySelector(`#${id}`);
    this._els = {
      webhookUrl: q('ext-ni-webhookUrl'),
      testBtn: q('ext-ni-testBtn'),
      testResult: q('ext-ni-testResult'),
      statusDot: q('ext-ni-status'),
      statusText: q('ext-ni-statusText'),
      count: q('ext-ni-count'),
      log: q('ext-ni-log'),
      clearBtn: q('ext-ni-clearBtn'),
    };
  }

  _bindEvents() {
    const { webhookUrl, testBtn, clearBtn } = this._els;
    webhookUrl.addEventListener('input', Debounce.wrap(() => this._saveWebhookUrl(), NotificationSettingsTab.TYPING_SAVE_MS));
    webhookUrl.addEventListener('change', () => this._saveWebhookUrl());
    testBtn.addEventListener('click', () => this._testWebhook());
    clearBtn.addEventListener('click', () => this._clearLog());
  }

  async _loadSettings() {
    try {
      this._webhookUrl = await this.invoke('getWebhookUrl');
      this._fillWebhookUrl();
      this._updateStatus();
    } catch (e) {
      console.error('notification-interceptor: failed to load settings:', e);
    }
  }

  _fillWebhookUrl() {
    const input = this._els.webhookUrl;
    if (input && document.activeElement !== input) input.value = this._webhookUrl || '';
  }

  async _loadLog() {
    if (!this._els.log) return;
    try {
      const { entries, count } = await this.invoke('getLog');
      this._entries = entries || [];
      this._count = count || 0;
      this._renderLog();
    } catch (e) {
      console.error('notification-interceptor: failed to load log:', e);
    }
  }

  async _clearLog() {
    const ok = await Dialogs.confirm('Clear the notification log?');
    if (!ok) return;
    await this.invoke('clearLog');
    await this._loadLog();
  }

  async _saveWebhookUrl() {
    const input = this._els.webhookUrl;
    if (!input) return;
    const url = input.value.trim();
    if (url === this._webhookUrl) return;
    await this.invoke('saveWebhookUrl', url);
    this._webhookUrl = url;
    this._updateStatus();
    SavedBadge.flash(input);
    if (typeof window.updateWebhookStatus === 'function') window.updateWebhookStatus(url);
  }

  async _testWebhook() {
    const { webhookUrl, testBtn } = this._els;
    const url = webhookUrl.value.trim();
    if (!url) {
      this._setTestResult('Enter a webhook URL first.', false);
      return;
    }
    testBtn.disabled = true;
    testBtn.textContent = 'Sending';
    try {
      const result = await this.invoke('testWebhook', url);
      if (result.success) this._setTestResult('Test payload delivered.', true);
      else this._setTestResult(`Test failed: ${result.error}`, false);
    } catch (error) {
      this._setTestResult('Test failed.', false);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Send a test';
    }
  }

  _setTestResult(msg, ok) {
    const { testResult } = this._els;
    if (!testResult) return;
    testResult.textContent = msg || '';
    testResult.style.color = ok === undefined ? '' : (ok ? 'var(--good)' : 'var(--bad)');
    if (this._testTimer) clearTimeout(this._testTimer);
    if (msg) this._testTimer = setTimeout(() => { testResult.textContent = ''; }, NotificationSettingsTab.TEST_RESULT_MS);
  }

  _updateStatus() {
    const { statusDot, statusText } = this._els;
    if (!statusDot) return;
    statusDot.classList.toggle('ok', !!this._webhookUrl);
    statusText.textContent = this._webhookUrl
      ? `Forwarding to ${NotificationSettingsTab._hostOf(this._webhookUrl)}`
      : 'Webhook: not configured. Notifications are logged but not forwarded.';
  }

  static _hostOf(url) {
    try {
      return new URL(url).hostname;
    } catch (_) {
      return 'configured';
    }
  }

  _renderLog() {
    const { log, count } = this._els;
    if (!log) return;
    if (count) count.textContent = String(this._count);
    log.innerHTML = NotificationLogMarkup.list(this._entries);
  }
}
