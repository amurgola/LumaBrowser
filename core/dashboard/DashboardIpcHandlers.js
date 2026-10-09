const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const DashboardActions = require('./DashboardActions');

class DashboardIpcHandlers {
  constructor(deps = {}) {
    this._actions = new DashboardActions(deps);
  }

  register() {
    const a = this._actions;
    this._handle('core.dashboard.open', () => a.open());
    this._handle('core.dashboard.pin', (_e, rootId) => a.pin(rootId));
    this._handle('core.dashboard.widgets.listLive', () => a.listLiveWidgets(), { widgets: [], extensionWidgets: [], hidden: [] });
    this._handle('core.dashboard.ext.call', (_e, extensionId, method, args) => a.callExtension(extensionId, method, args), { result: null });
    this._handle('core.dashboard.widgets.setHidden', (_e, rootId, hidden) => a.setWidgetHidden(rootId, hidden));
    this._handle('core.dashboard.layout.get', () => a.getLayout(), { layout: [] });
    this._handle('core.dashboard.layout.set', (_e, items) => a.setLayout(items));
    if (a.hasTasks()) this._registerTasks(a);
    this._handle('core.dashboard.openChat', (_e, conversationId) => a.openChat(conversationId));
  }

  _registerTasks(a) {
    this._handle('core.dashboard.tasks.list', (_e, rootId) => a.listTasks(rootId), { tasks: [] });
    this._handle('core.dashboard.tasks.create', (_e, args) => a.createTask(args));
    this._handle('core.dashboard.tasks.update', (_e, id, patch) => a.updateTask(id, patch));
    this._handle('core.dashboard.tasks.setEnabled', (_e, id, enabled) => a.setTaskEnabled(id, enabled));
    this._handle('core.dashboard.tasks.delete', (_e, id) => a.deleteTask(id));
    this._handle('core.dashboard.tasks.runNow', (_e, id) => a.runTaskNow(id));
    this._handle('core.dashboard.tasks.runs', (_e, taskId, opts) => a.listTaskRuns(taskId, opts), { runs: [] });
    this._handle('core.dashboard.tasks.runTranscript', (_e, runId) => a.runTranscript(runId));
  }

  _handle(channel, fn, failureFields = {}) {
    const handler = IpcEnvelope.enveloped(fn);
    ipcMain.handle(channel, async (...args) => ({ ...failureFields, ...(await handler(...args)) }));
  }
}

module.exports = DashboardIpcHandlers;
