const IpcEnvelope = require('../../core/shared/ipc/IpcEnvelope');

class TimedTaskIpcHandlers {
  static register(ipc, service) {
    ipc.handle('getAllTasks', async () => service.getAllTasks());
    ipc.handle('getTask', async (_event, id) => service.getTask(id));
    ipc.handle('createTask', IpcEnvelope.enveloped((_event, data) => ({ task: service.createTask(data) })));
    ipc.handle('updateTask', IpcEnvelope.enveloped((_event, id, updates) => TimedTaskIpcHandlers._found(service.updateTask(id, updates))));
    ipc.handle('deleteTask', IpcEnvelope.enveloped((_event, id) => ({ success: service.deleteTask(id).changes > 0 })));
    ipc.handle('getTaskRuns', async (_event, taskId, limit = 20, offset = 0) => service.getTaskRuns(taskId, limit, offset));
    ipc.handle('getRunById', async (_event, runId) => service.getRun(runId));
    ipc.handle('getRunLog', async (_event, runId) => service.getRunLog(runId));
    ipc.handle('triggerNow', IpcEnvelope.enveloped(async (_event, id) => TimedTaskIpcHandlers._ran(await service.triggerNow(id, { silent: false }))));
  }

  static _found(task) {
    if (!task) return { success: false, error: 'Task not found' };
    return { task };
  }

  static _ran(result) {
    return { success: result.status !== 'error', ...result };
  }
}

module.exports = TimedTaskIpcHandlers;
