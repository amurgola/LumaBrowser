class ActivityLogIpcHandlers {
  static register(ipc, service) {
    ipc.handle('getSettings', async () => service.getSettings());
    ipc.handle('setSettings', async (_event, patch) => ActivityLogIpcHandlers._guard(
      () => ({ settings: service.setSettings(patch || {}) }), {}));
    ipc.handle('getCallers', async () => service.getKnownCallers());
    ipc.handle('getEntries', async (_event, filter) => ActivityLogIpcHandlers._guard(
      () => ({ entries: service.getEntries(filter || {}), total: service.count() }), { entries: [], total: 0 }));
    ipc.handle('getEntry', async (_event, id) => ActivityLogIpcHandlers._guard(
      () => ({ entry: service.getEntry(id) }), { entry: null }));
    ipc.handle('getByCorrelation', async (_event, correlation) => ActivityLogIpcHandlers._guard(
      () => ({ entries: service.getByCorrelation(correlation) }), { entries: [] }));
    ipc.handle('clear', async () => ActivityLogIpcHandlers._guard(() => {
      service.clear();
      return {};
    }, {}));
    ipc.handle('count', async () => service.count());
  }

  static _guard(read, fallback) {
    try {
      return { success: true, ...read() };
    } catch (err) {
      return { success: false, error: err.message, ...fallback };
    }
  }
}

module.exports = ActivityLogIpcHandlers;
