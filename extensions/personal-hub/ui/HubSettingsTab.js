import SyncStatusSection from './settings/SyncStatusSection.js';
import ConnectionsSection from './settings/ConnectionsSection.js';
import CalendarSourcesSection from './settings/CalendarSourcesSection.js';
import TaskSourcesSection from './settings/TaskSourcesSection.js';
import BoardColumnsSection from './settings/BoardColumnsSection.js';
import AutomationSection from './settings/AutomationSection.js';

export default class HubSettingsTab {
  static EXTENSION_ID = 'personal-hub';
  static CHANGED_CHANNEL = 'ext.personal-hub.changed';
  static NOTICE_MS = 6000;
  static RELOAD_EVENTS = new Set(['sync.status', 'calendar.changed', 'calendar.synced', 'board.changed', 'task.changed', 'connection.changed']);

  constructor() {
    this._ipc = null;
    this._container = null;
    this._detach = null;
    this._noticeTimer = null;
    this._sections = this._buildSections();
  }

  async activate(context) {
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (this._container) {
      for (const section of this._all()) section.bind(this._container);
      this._subscribe();
    }
    await this.reloadAll();
  }

  deactivate() {
    clearTimeout(this._noticeTimer);
    if (this._detach) {
      try { this._detach(); } catch (_) {}
      this._detach = null;
    }
    for (const section of this._all()) section.unbind();
    this._container = null;
  }

  invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${HubSettingsTab.EXTENSION_ID}.${channel}`, ...args);
  }

  async reloadAll() {
    if (!this._container) return;
    await Promise.all(this._all().map((section) => section.load().catch((err) => this.notify((err && err.message) || String(err), false))));
    this._sections.tasks.setColumns(this._sections.columns.columns());
  }

  notify(message, ok) {
    const el = this._container ? this._container.querySelector('#ext-hub-notice') : null;
    if (!el) return;
    el.textContent = message || '';
    el.style.color = ok ? 'var(--good)' : 'var(--bad)';
    clearTimeout(this._noticeTimer);
    if (message) this._noticeTimer = setTimeout(() => { el.textContent = ''; }, HubSettingsTab.NOTICE_MS);
  }

  html() {
    const s = this._sections;
    return `
    <div class="ext-status-row"><span class="luma-field-help" id="ext-hub-notice" style="margin-top:0;min-height:17px;"></span></div>
    ${s.sync.html()}
    <hr class="ext-divider">
    ${s.connections.html()}
    <hr class="ext-divider">
    ${s.calendars.html()}
    <hr class="ext-divider">
    ${s.tasks.html()}
    <hr class="ext-divider">
    ${s.columns.html()}
    <hr class="ext-divider">
    ${s.automation.html()}`;
  }

  _buildSections() {
    const sections = {};
    sections.sync = new SyncStatusSection(this);
    sections.connections = new ConnectionsSection(this);
    sections.calendars = new CalendarSourcesSection(this);
    sections.tasks = new TaskSourcesSection(this);
    sections.columns = new BoardColumnsSection(this, { onSaved: (columns) => sections.tasks.setColumns(columns) });
    sections.automation = new AutomationSection(this, { onInfo: (info) => sections.calendars.setCallbackUrl(info && info.oauthCallbackUrl) });
    return sections;
  }

  _all() {
    const s = this._sections;
    return [s.sync, s.connections, s.calendars, s.tasks, s.columns, s.automation];
  }

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', HubSettingsTab.EXTENSION_ID, this.html(), {
      label: 'Hub',
      tabId: 'personal-hub',
      placement: 'tab',
      onActivate: () => this.reloadAll(),
    });
  }

  _subscribe() {
    if (!this._ipc || typeof this._ipc.on !== 'function') return;
    this._detach = this._ipc.on(HubSettingsTab.CHANGED_CHANNEL, (event) => {
      if (event && HubSettingsTab.RELOAD_EVENTS.has(event.type)) this.reloadAll();
    });
  }
}
