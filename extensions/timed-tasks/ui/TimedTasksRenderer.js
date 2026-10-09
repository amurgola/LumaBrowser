import OverflowMenu from '../../ui-kit/ui/OverflowMenu.js';
import TaskForm from './TaskForm.js';
import TaskList from './TaskList.js';
import TaskRowText from './TaskRowText.js';
import TaskRunList from './TaskRunList.js';
import TimedTasksSettingsPage from './TimedTasksSettingsPage.js';

export default class TimedTasksRenderer {
  static EXTENSION_ID = 'timed-tasks';

  static TICK_MS = 30000;

  static RELOAD_COALESCE_MS = 150;

  constructor() {
    this._active = false;
    this._resetState();
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._ipc = context.ipcBridge;
    this._buildPanel(context.containers.panelContainer);
    this._settings = new TimedTasksSettingsPage(context.containers.settingsContainer, context.containers.panelContainer);
    this._registerSettingsCallback(context.slotManager);
    this._settings.loadModelLabel();
    await this._loadTasks();
    this._listenForChanges();
    this._tickTimer = setInterval(() => this._tick(), TimedTasksRenderer.TICK_MS);
  }

  deactivate() {
    if (this._tickTimer) clearInterval(this._tickTimer);
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
    for (const off of this._unsubs) { try { off(); } catch (_) {} }
    OverflowMenu.close();
    this._resetState();
    this._active = false;
  }

  _resetState() {
    this._ipc = null;
    this._tasks = [];
    this._tickTimer = null;
    this._reloadTimer = null;
    this._unsubs = [];
    this._summary = {};
    this._form = null;
    this._list = null;
    this._settings = null;
  }

  _invoke(channel, ...args) {
    return this._ipc.invoke(`ext.${TimedTasksRenderer.EXTENSION_ID}.${channel}`, ...args);
  }

  _buildPanel(root) {
    const invoke = (channel, ...args) => this._invoke(channel, ...args);
    const reload = () => this._loadTasks();
    this._summary = {
      countEl: root ? root.querySelector('#ext-tt-barCount') : null,
      nextEl: root ? root.querySelector('#ext-tt-barNext') : null,
    };
    this._form = root ? new TaskForm(root, invoke, reload) : null;
    this._list = new TaskList({
      listEl: root ? root.querySelector('#ext-tt-barTaskList') : null,
      invoke,
      runList: new TaskRunList(invoke),
      form: this._form,
      reload,
    });
  }

  _registerSettingsCallback(slotManager) {
    slotManager.setCallback('settings-tab', TimedTasksRenderer.EXTENSION_ID, 'onActivate', () => {
      this._loadTasks();
      if (this._settings) this._settings.loadModelLabel();
    });
  }

  _listenForChanges() {
    if (!this._ipc || typeof this._ipc.on !== 'function') return;
    this._unsubs.push(this._ipc.on(`ext.${TimedTasksRenderer.EXTENSION_ID}.changed`, (payload) => this._onChanged(payload)));
  }

  _onChanged(payload) {
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
    this._reloadTimer = setTimeout(async () => {
      this._reloadTimer = null;
      await this._loadTasks();
      const id = payload && payload.taskId;
      if (id && this._list && this._list.expandedId === id && payload.reason === 'run-finished') {
        await this._list.reopenRuns(id);
      }
    }, TimedTasksRenderer.RELOAD_COALESCE_MS);
  }

  async _loadTasks() {
    if (!this._active) return;
    try {
      this._tasks = await this._invoke('getAllTasks') || [];
      this._updateSummary();
      this._list.render(this._tasks);
      this._settings.renderSummary(this._tasks);
    } catch (err) {
      console.error('timed-tasks: failed to load tasks:', err);
    }
  }

  _tick() {
    this._updateSummary();
    if (this._list) this._list.tick();
  }

  _updateSummary() {
    const { countEl, nextEl } = this._summary;
    if (!countEl) return;
    TimedTasksRenderer._setText(countEl, TaskRowText.count(this._tasks));
    if (nextEl) TimedTasksRenderer._setText(nextEl, TaskRowText.next(this._tasks));
  }

  static _setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }
}
