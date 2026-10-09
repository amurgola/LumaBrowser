import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import OverflowMenu from '../../ui-kit/ui/OverflowMenu.js';
import SavedBadge from '../../ui-kit/ui/SavedBadge.js';
import NetworkWatcherMarkup from './NetworkWatcherMarkup.js';
import WatcherForm from './WatcherForm.js';
import WatcherListView from './WatcherListView.js';

export default class NetworkWatcherTab {
  static EXTENSION_ID = 'network-watcher';

  constructor() {
    this._active = false;
    this._ipc = null;
    this._container = null;
    this._els = {};
    this._watchers = [];
    this._form = null;
    this._listView = null;
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._ipc = context.ipcBridge;
    this._container = this._registerTab(context.slotManager);
    if (!this._container) {
      console.error('network-watcher: failed to register settings tab');
      return;
    }
    this._findElements();
    this._buildViews();
    this._bindEvents();
  }

  deactivate() {
    if (this._form) this._form.dispose();
    OverflowMenu.close();
    this._container = null;
    this._watchers = [];
    this._active = false;
  }

  async loadWatchers() {
    if (!this._active) return;
    try {
      this._watchers = await this._invoke('getAll');
      this._listView.render(this._watchers);
      await this._updateStats();
    } catch (error) {
      console.error('network-watcher: failed to load watchers:', error);
    }
  }

  async handleAdd() {
    const data = this._form.read();
    if (!data.urlPattern) return this._form.setError('Enter a URL pattern to watch.');
    if (!data.sendTo) return this._form.setError('Enter the webhook URL to send captures to.');
    this._form.setError('');
    try {
      const result = await this._invoke('add', data);
      if (result.success) await this._onAdded();
      else this._form.setError(`Could not add the watcher: ${result.error}`);
    } catch (error) {
      console.error('network-watcher: failed to add:', error);
      this._form.setError('Could not add the watcher.');
    }
    return undefined;
  }

  async handleTest() {
    const data = this._form.read();
    if (!data.urlPattern) return this._form.setError('Enter a URL pattern to test.');
    if (!data.sendTo) return this._form.setError('Enter the webhook URL to test.');
    this._form.setError('');
    this._setTesting(true);
    try {
      await this._sendTest(data);
    } finally {
      this._setTesting(false);
    }
    return undefined;
  }

  async handleToggle(watcherId, enabled) {
    try {
      const result = await this._invoke('toggle', watcherId, enabled);
      if (result.success) await this.loadWatchers();
    } catch (error) {
      console.error('network-watcher: toggle failed:', error);
    }
  }

  async handleDelete(watcherId) {
    if (!(await this._confirmDelete(watcherId))) return;
    try {
      const result = await this._invoke('remove', watcherId);
      if (result.success) await this.loadWatchers();
    } catch (error) {
      console.error('network-watcher: delete failed:', error);
    }
  }

  _registerTab(slotManager) {
    return slotManager.register('settings-tab', NetworkWatcherTab.EXTENSION_ID, NetworkWatcherMarkup.SETTINGS_HTML, {
      label: 'Network Watcher',
      tabId: 'watchers',
      onActivate: () => this.loadWatchers(),
    });
  }

  _findElements() {
    const q = (id) => this._container.querySelector(`#${id}`);
    this._els = {
      totalWatchers: q('ext-nw-totalWatchers'),
      enabledWatchers: q('ext-nw-enabledWatchers'),
      totalTriggers: q('ext-nw-totalTriggers'),
      urlPattern: q('ext-nw-urlPattern'),
      sendTo: q('ext-nw-sendTo'),
      note: q('ext-nw-note'),
      method: q('ext-nw-method'),
      captureHeaders: q('ext-nw-captureHeaders'),
      captureBody: q('ext-nw-captureBody'),
      addBtn: q('ext-nw-addBtn'),
      testBtn: q('ext-nw-testBtn'),
      testResult: q('ext-nw-testResult'),
      formErr: q('ext-nw-formErr'),
      watcherList: q('ext-nw-watcherList'),
    };
  }

  _buildViews() {
    this._form = new WatcherForm(this._els);
    this._listView = new WatcherListView(this._els.watcherList, {
      onToggle: (id, enabled) => this.handleToggle(id, enabled),
      onDelete: (id) => this.handleDelete(id),
    });
  }

  _bindEvents() {
    this._els.addBtn.addEventListener('click', () => this.handleAdd());
    this._els.testBtn.addEventListener('click', () => this.handleTest());
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${NetworkWatcherTab.EXTENSION_ID}.${channel}`, ...args);
  }

  async _updateStats() {
    try {
      const stats = await this._invoke('getStats');
      this._els.totalWatchers.textContent = stats.total;
      this._els.enabledWatchers.textContent = stats.enabled;
      this._els.totalTriggers.textContent = stats.totalTriggers;
    } catch (error) {
      console.error('network-watcher: failed to update stats:', error);
    }
  }

  async _onAdded() {
    this._form.clear();
    await this.loadWatchers();
    SavedBadge.flash(this._els.addBtn, 'Added');
  }

  _setTesting(busy) {
    this._els.testBtn.disabled = busy;
    this._els.testBtn.textContent = busy ? 'Sending' : 'Send a test';
  }

  async _sendTest(data) {
    try {
      const result = await this._invoke('test', data);
      if (result.success) this._form.setTestResult('Test payload delivered. Check your webhook endpoint.', true);
      else this._form.setTestResult(`Test failed: ${result.error}`, false);
    } catch (error) {
      console.error('network-watcher: test failed:', error);
      this._form.setTestResult('Test failed.', false);
    }
  }

  _confirmDelete(watcherId) {
    const w = this._watchers.find((x) => x.id === watcherId);
    return Dialogs.confirm(`Delete the watcher for "${w ? w.urlPattern : watcherId}"?`, { okLabel: 'Delete', danger: true });
  }
}
