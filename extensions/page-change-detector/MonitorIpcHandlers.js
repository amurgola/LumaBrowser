const IpcEnvelope = require('../../core/shared/ipc/IpcEnvelope');

class MonitorIpcHandlers {
  static register(ipc, service) {
    ipc.handle('getAll', async () => service.getAllMonitors());
    ipc.handle('getOne', async (_event, id) => service.getMonitor(id));
    ipc.handle('getHistory', async (_event, monitorId, limit = 20) => service.getHistory(monitorId, limit));
    ipc.handle('getHistoryPaged', async (_event, monitorId, options) => service.getHistoryPaged(monitorId, options || {}));
    ipc.handle('create', IpcEnvelope.enveloped((_event, data) => ({ monitor: service.createMonitor(data) })));
    ipc.handle('update', IpcEnvelope.enveloped((_event, id, updates) => MonitorIpcHandlers._found(service.updateMonitor(id, updates))));
    ipc.handle('delete', IpcEnvelope.enveloped((_event, id) => ({ success: service.deleteMonitor(id) })));
    ipc.handle('checkNow', IpcEnvelope.enveloped(async (_event, id) => MonitorIpcHandlers._checked(await service.checkMonitorNow(id))));
    ipc.handle('pickElements', IpcEnvelope.enveloped(async (_event, id) => ({ success: true, ...(await service.pickElementsForMonitor(id)) })));
    ipc.handle('clearSelectors', IpcEnvelope.enveloped((_event, id) => MonitorIpcHandlers._found(service.updateMonitor(id, { selectors: null }))));
  }

  static _found(monitor) {
    if (!monitor) return { success: false, error: 'Monitor not found' };
    return { monitor };
  }

  static _checked(result) {
    return { success: !result.error, ...result };
  }
}

module.exports = MonitorIpcHandlers;
