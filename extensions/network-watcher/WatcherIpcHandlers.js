const IpcEnvelope = require('../../core/shared/ipc/IpcEnvelope');
const WatcherTestRun = require('./WatcherTestRun');

class WatcherIpcHandlers {
  static NOT_FOUND = 'Watcher not found';
  static NO_CAPTURE = 'No captured responses yet for this watcher';

  static register(ipc, service) {
    const testRun = new WatcherTestRun(service);
    ipc.handle('getAll', async () => service.getAllWatchers().map((w) => w.toJSON()));
    ipc.handle('add', IpcEnvelope.enveloped((_event, config) => ({ watcher: service.addWatcher(config).toJSON() })));
    ipc.handle('update', IpcEnvelope.enveloped((_event, id, updates) => WatcherIpcHandlers._found(service.updateWatcher(id, updates))));
    ipc.handle('remove', async (_event, id) => ({ success: service.removeWatcher(id) }));
    ipc.handle('toggle', IpcEnvelope.enveloped((_event, id, enabled) => WatcherIpcHandlers._found(service.setWatcherEnabled(id, enabled))));
    ipc.handle('getStats', async () => service.getStats());
    ipc.handle('test', IpcEnvelope.enveloped((_event, config) => testRun.execute(config, 'ipc')));
    ipc.handle('getLastResponse', async (_event, id) => WatcherIpcHandlers._lastResponse(service.getWatcher(id)));
  }

  static _found(watcher) {
    if (!watcher) return { success: false, error: WatcherIpcHandlers.NOT_FOUND };
    return { watcher: watcher.toJSON() };
  }

  static _lastResponse(watcher) {
    if (!watcher) return { success: false, error: WatcherIpcHandlers.NOT_FOUND };
    if (!watcher.lastCapturedResponse) return { success: false, error: WatcherIpcHandlers.NO_CAPTURE };
    return { success: true, watcherId: watcher.id, lastCapturedResponse: watcher.lastCapturedResponse };
  }
}

module.exports = WatcherIpcHandlers;
