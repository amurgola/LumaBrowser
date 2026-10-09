import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import ActivityLogMarkup from './ActivityLogMarkup.js';
import CallerListView from './CallerListView.js';
import EntryListView from './EntryListView.js';
import EntryDetailView from './EntryDetailView.js';

export default class ActivityLogTab {
  static CHANNEL = 'ext.activity-log';

  static SAVE_DELAY_MS = 500;

  static SEARCH_DELAY_MS = 200;

  static STATUS_RESET_MS = 3500;

  static IDLE_STATUS = 'Changes save automatically.';

  static ENTRY_LIMIT = 200;

  static DEFAULT_SETTINGS = { enabled: false, enabledCallers: {}, retentionDays: 7, retentionMaxRows: 10000 };

  static CLEAR_PROMPT = 'Clear all activity log entries? This cannot be undone.';

  constructor() {
    this._ipc = null;
    this._container = null;
    this._els = {};
    this._settings = null;
    this._callers = [];
    this._entries = [];
    this._selectedId = null;
    this._loadingSettings = false;
    this._saveTimer = null;
    this._searchTimer = null;
    this._statusTimer = null;
  }

  async activate(context) {
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (!this._container) {
      console.error('activity-log: failed to register settings tab');
      return;
    }
    this._findElements();
    this._buildViews();
    this._bindEvents();
  }

  deactivate() {
    clearTimeout(this._statusTimer);
    clearTimeout(this._saveTimer);
    this._container = null;
    this._entries = [];
    this._callers = [];
  }

  async onShow() {
    await this.loadSettings();
    await this.loadCallers();
    await this.loadEntries();
  }

  async loadSettings() {
    this._settings = await this._fetchSettings();
    this._fillSettings();
  }

  async loadCallers() {
    try {
      this._callers = await this._invoke('getCallers');
    } catch (err) {
      console.error('activity-log: getCallers failed:', err);
      this._callers = [];
    }
    this._callerView.render(this._callers, this._settings);
    this._callerView.renderFilter(this._callers);
  }

  async saveSettings() {
    if (this._loadingSettings) return;
    clearTimeout(this._saveTimer);
    const result = await this._invoke('setSettings', this._settingsPatch());
    if (result.success) {
      this._settings = result.settings;
      this._flashStatus('Saved.');
      this._callerView.render(this._callers, this._settings);
    } else {
      this._flashStatus('Save failed: ' + (result.error || 'unknown'));
    }
  }

  async loadEntries() {
    const response = await this._invoke('getEntries', this._entryFilter());
    if (!response.success) {
      this._entryView.renderError(response.error);
      return;
    }
    this._entries = response.entries || [];
    this._entryView.render(this._entries, this._selectedId, !!(this._settings && this._settings.enabled));
  }

  async selectEntry(id) {
    this._selectedId = id;
    this._entryView.markSelected(id);
    this._detailView.showLoading();
    const response = await this._invoke('getEntry', id);
    if (!response.success || !response.entry) {
      this._detailView.showError();
      return;
    }
    this._detailView.render(response.entry);
  }

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', 'activity-log', ActivityLogMarkup.SETTINGS_HTML, {
      label: 'Activity Log',
      tabId: 'activity-log',
      onActivate: () => this.onShow(),
    });
  }

  _findElements() {
    const q = (sel) => this._container.querySelector(sel);
    this._els = {
      masterToggle: q('#al-master-toggle'),
      retentionDays: q('#al-retention-days'),
      retentionRows: q('#al-retention-rows'),
      refreshCallersBtn: q('#al-refresh-callers-btn'),
      clearBtn: q('#al-clear-btn'),
      saveStatus: q('#al-save-status'),
      callerList: q('#al-caller-list'),
      callerCount: q('#al-caller-count'),
      filterCaller: q('#al-filter-caller'),
      filterResult: q('#al-filter-result'),
      filterSearch: q('#al-filter-search'),
      refreshEntriesBtn: q('#al-refresh-entries-btn'),
      entryList: q('#al-entry-list'),
      entryDetail: q('#al-entry-detail'),
    };
  }

  _buildViews() {
    const els = this._els;
    this._callerView = new CallerListView(
      { list: els.callerList, count: els.callerCount, filter: els.filterCaller },
      (caller, enabled, input) => this._setCaller(caller, enabled, input),
    );
    this._entryView = new EntryListView(els.entryList, (id) => this.selectEntry(id));
    this._detailView = new EntryDetailView(els.entryDetail);
  }

  _bindEvents() {
    this._bindSettingsFields();
    this._bindButtons();
    this._bindFilters();
  }

  _bindSettingsFields() {
    const { masterToggle, retentionDays, retentionRows } = this._els;
    const saveSoon = () => {
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this.saveSettings(), ActivityLogTab.SAVE_DELAY_MS);
    };
    masterToggle.addEventListener('change', () => this.saveSettings());
    for (const field of [retentionDays, retentionRows]) {
      field.addEventListener('input', saveSoon);
      field.addEventListener('change', () => this.saveSettings());
    }
  }

  _bindButtons() {
    const { refreshCallersBtn, clearBtn, refreshEntriesBtn } = this._els;
    refreshCallersBtn.addEventListener('click', async () => {
      await this.loadCallers();
      await this.loadEntries();
    });
    clearBtn.addEventListener('click', () => this._clearAll());
    refreshEntriesBtn.addEventListener('click', () => this.loadEntries());
  }

  _bindFilters() {
    const { filterCaller, filterResult, filterSearch } = this._els;
    filterCaller.addEventListener('change', () => this.loadEntries());
    filterResult.addEventListener('change', () => this.loadEntries());
    filterSearch.addEventListener('input', () => {
      if (this._searchTimer) clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => this.loadEntries(), ActivityLogTab.SEARCH_DELAY_MS);
    });
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`${ActivityLogTab.CHANNEL}.${channel}`, ...args);
  }

  async _fetchSettings() {
    try {
      return await this._invoke('getSettings');
    } catch (err) {
      console.error('activity-log: getSettings failed:', err);
      return { ...ActivityLogTab.DEFAULT_SETTINGS, enabledCallers: {} };
    }
  }

  _fillSettings() {
    const { masterToggle, retentionDays, retentionRows } = this._els;
    this._loadingSettings = true;
    masterToggle.checked = !!this._settings.enabled;
    retentionDays.value = this._settings.retentionDays ?? 7;
    retentionRows.value = this._settings.retentionMaxRows ?? 10000;
    this._loadingSettings = false;
  }

  _settingsPatch() {
    const { masterToggle, retentionDays, retentionRows } = this._els;
    return {
      enabled: masterToggle.checked,
      retentionDays: Number(retentionDays.value) || 0,
      retentionMaxRows: Number(retentionRows.value) || 0,
    };
  }

  async _setCaller(caller, value, input) {
    const result = await this._invoke('setSettings', { enabledCallers: { [caller]: value } });
    if (result.success) {
      this._settings = result.settings;
      this._flashStatus(`Caller "${caller}" ${value ? 'enabled' : 'disabled'}.`);
    } else {
      this._flashStatus('Update failed: ' + (result.error || 'unknown'));
      input.checked = !value;
    }
  }

  async _clearAll() {
    if (!(await Dialogs.confirm(ActivityLogTab.CLEAR_PROMPT))) return;
    const result = await this._invoke('clear');
    if (result.success) {
      this._flashStatus('Cleared.');
      await this.loadEntries();
    } else {
      this._flashStatus('Clear failed: ' + (result.error || 'unknown'));
    }
  }

  _entryFilter() {
    const { filterCaller, filterResult, filterSearch } = this._els;
    return {
      caller: filterCaller.value || undefined,
      result: filterResult.value || undefined,
      search: filterSearch.value.trim() || undefined,
      limit: ActivityLogTab.ENTRY_LIMIT,
    };
  }

  _flashStatus(msg) {
    this._els.saveStatus.textContent = msg;
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => { this._els.saveStatus.textContent = ActivityLogTab.IDLE_STATUS; }, ActivityLogTab.STATUS_RESET_MS);
  }
}
