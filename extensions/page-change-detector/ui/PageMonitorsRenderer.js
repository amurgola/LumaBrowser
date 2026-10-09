import OverflowMenu from '../../ui-kit/ui/OverflowMenu.js';
import MonitorForm from './MonitorForm.js';
import MonitorHistoryPage from './MonitorHistoryPage.js';
import MonitorListView from './MonitorListView.js';
import MonitorRowActions from './MonitorRowActions.js';

export default class PageMonitorsRenderer {
  static EXTENSION_ID = 'page-change-detector';

  static TICK_MS = 30000;

  static RELOAD_DEBOUNCE_MS = 150;

  constructor() {
    this._active = false;
    this._ipc = null;
    this._panel = null;
    this._monitors = [];
    this._form = null;
    this._list = null;
    this._actions = null;
    this._historyPage = null;
    this._historyView = MonitorHistoryPage.freshView();
    this._tickTimer = null;
    this._reloadTimer = null;
    this._unsubs = [];
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._ipc = context.ipcBridge;
    this._panel = context.containers.panelContainer;
    context.slotManager.setCallback('settings-tab', PageMonitorsRenderer.EXTENSION_ID, 'onActivate', () => this._refreshSettings());
    this._buildPanel(this._panel);
    this._buildSettings(context.containers.settingsContainer);
    await this.loadMonitors();
    this._listen();
  }

  deactivate() {
    this._stopTimers();
    for (const off of this._unsubs) { try { off(); } catch (_) {} }
    this._unsubs = [];
    OverflowMenu.close();
    if (this._historyPage) this._historyView = this._historyPage.view;
    this._monitors = [];
    this._form = null;
    this._list = null;
    this._actions = null;
    this._historyPage = null;
    this._panel = null;
    this._active = false;
  }

  async loadMonitors() {
    if (!this._active) return;
    try {
      this._monitors = await this._invoke('getAll') || [];
      if (this._list) this._list.render(this._monitors);
      if (this._historyPage) this._historyPage.syncMonitors();
    } catch (err) {
      console.error('page-change-detector: load failed:', err);
    }
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${PageMonitorsRenderer.EXTENSION_ID}.${channel}`, ...args);
  }

  _buildPanel(root) {
    if (!root) return;
    const reload = () => this.loadMonitors();
    const invoke = (...args) => this._invoke(...args);
    this._form = new MonitorForm(root, invoke, reload);
    this._actions = new MonitorRowActions(invoke, reload, {
      onEdit: (m) => this._form.open(m),
      onFullHistory: (id) => this._openHistoryInSettings(id),
      onDeleted: (id) => { this._form.closeIfEditing(id); this._list.collapse(id); },
    });
    this._list = new MonitorListView(root, invoke, {
      onCheck: (id, btn) => this._actions.check(id, btn),
      onMore: (btn, m) => this._actions.openMenu(btn, m),
      onOpenUrl: (url) => PageMonitorsRenderer._openUrl(url),
    });
  }

  _buildSettings(root) {
    if (!root) return;
    this._historyPage = new MonitorHistoryPage(root, {
      view: this._historyView,
      invoke: (...args) => this._invoke(...args),
      getMonitors: () => this._monitors,
      onOpenPanel: () => this._openPanel(),
    });
  }

  _listen() {
    if (this._ipc && typeof this._ipc.on === 'function') {
      this._unsubs.push(this._ipc.on(`ext.${PageMonitorsRenderer.EXTENSION_ID}.changed`, (payload) => this._onChanged(payload)));
    }
    this._tickTimer = setInterval(() => { if (this._list) this._list.tick(); }, PageMonitorsRenderer.TICK_MS);
  }

  _stopTimers() {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._reloadTimer) { clearTimeout(this._reloadTimer); this._reloadTimer = null; }
  }

  _onChanged(payload) {
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
    this._reloadTimer = setTimeout(async () => {
      this._reloadTimer = null;
      await this.loadMonitors();
      this._refreshShownHistory(payload);
    }, PageMonitorsRenderer.RELOAD_DEBOUNCE_MS);
  }

  _refreshShownHistory(payload) {
    const id = payload && payload.monitorId;
    if (!id || payload.reason !== 'check-finished') return;
    if (this._list && this._list.expandedId === id) this._list.loadInlineHistory(id);
    if (this._historyPage && this._historyPage.view.monitorId === id) this._historyPage.loadPage();
  }

  _refreshSettings() {
    if (this._historyPage) this._historyPage.refresh();
  }

  _openHistoryInSettings(monitorId) {
    const slot = window.uiSlotManager;
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('active');
    if (slot && typeof slot.switchSettingsTab === 'function') slot.switchSettingsTab('extensions');
    if (slot && typeof slot._showExtensionConfig === 'function') slot._showExtensionConfig(PageMonitorsRenderer.EXTENSION_ID);
    if (this._historyPage) this._historyPage.show(monitorId);
    else this._historyView = MonitorHistoryPage.freshView(monitorId);
  }

  _openPanel() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
    const toolbarBtn = document.querySelector(`.toolbar-btn[data-extension-id="${PageMonitorsRenderer.EXTENSION_ID}"]`);
    const alreadyOpen = this._panel && !this._panel.classList.contains('ext-hidden');
    if (toolbarBtn && !alreadyOpen) toolbarBtn.click();
  }

  static _openUrl(url) {
    if (window.tabAPI && typeof window.tabAPI.create === 'function') window.tabAPI.create(url);
    else if (window.electronAPI && typeof window.electronAPI.openExternal === 'function') window.electronAPI.openExternal(url);
  }
}
