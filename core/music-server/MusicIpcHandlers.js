const { ipcMain, webContents } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const SenderStream = require('../shared/ipc/SenderStream');
const MusicRouter = require('./MusicRouter');
const Wsl = require('./runtimes/Wsl');

class MusicIpcHandlers {
  static register(service, { notify } = {}) {
    const router = new MusicRouter({ musicServerService: service, notify });
    MusicIpcHandlers._registerRuntimes(service);
    MusicIpcHandlers._registerModels(service);
    MusicIpcHandlers._registerSettings(service);
    MusicIpcHandlers._registerGenerate(service, router);
    return { router };
  }

  static _registerRuntimes(service) {
    ipcMain.handle('core.musicServer.getView', IpcEnvelope.enveloped(async (_event, { force = false } = {}) => ({
      platformSupported: service.isPlatformSupported(),
      enabled: service.isEnabled(),
      defaults: service.getDefaults(),
      runtimes: await service.ensureRuntimesView({ force }),
      models: await service.getModelsView(),
      status: service.getStatus(),
    })));

    ipcMain.handle('core.musicServer.getWslStatus', IpcEnvelope.enveloped(async () => (
      process.platform === 'win32' ? { applicable: true, wsl: await Wsl.detect() } : { applicable: false })));

    ipcMain.handle('core.musicServer.installRuntime', MusicIpcHandlers._withNullFields(['code', 'detail'], (event, id) => {
      const emit = MusicIpcHandlers._installStream(service, event, id);
      emit('start', {});
      return MusicIpcHandlers._reportingErrors(emit, async () => ({ result: await service.installRuntime(id, { onEvent: emit }) }));
    }));

    ipcMain.handle('core.musicServer.cancelInstall', () => {
      service.cancelInstall();
      return { success: true };
    });

    ipcMain.handle('core.musicServer.uninstallRuntime', IpcEnvelope.enveloped((_event, id) => service.uninstallRuntime(id)));

    ipcMain.handle('core.musicServer.checkRuntimeUpdates', IpcEnvelope.enveloped(async (_event, { force = false } = {}) => (
      { runtimes: await service.checkRuntimeUpdates({ force }) })));
  }

  static _registerModels(service) {
    ipcMain.handle('core.musicServer.getModelsView', IpcEnvelope.enveloped(() => service.getModelsView()));

    ipcMain.handle('core.musicServer.downloadModel', IpcEnvelope.enveloped((event, modelId) => {
      const emit = SenderStream.create(event, 'core.musicServer.modelEvent', { modelId });
      return MusicIpcHandlers._reportingErrors(emit, async () => {
        const result = await service.downloadModel(modelId, { onEvent: emit });
        if (result && result.canceled) emit('canceled', {});
        return { success: !!(result && result.success), ...(result || {}) };
      });
    }));

    ipcMain.handle('core.musicServer.cancelDownload', () => service.cancelDownload());

    ipcMain.handle('core.musicServer.deleteModel', IpcEnvelope.enveloped((_event, modelId) => service.deleteModel(modelId)));
  }

  static _registerSettings(service) {
    ipcMain.handle('core.musicServer.getDefaults', () => service.getDefaults());
    ipcMain.handle('core.musicServer.setDefaults', IpcEnvelope.enveloped((_event, patch) => ({ defaults: service.setDefaults(patch) })));
    ipcMain.handle('core.musicServer.setEnabled', IpcEnvelope.enveloped((_event, value) => {
      service.setEnabled(value);
      return { enabled: service.isEnabled() };
    }));
    ipcMain.handle('core.musicServer.getStatus', () => MusicIpcHandlers._statusOrIdle(service));
    ipcMain.handle('core.musicServer.stopServer', IpcEnvelope.enveloped(() => service.stopServer()));
  }

  static _registerGenerate(service, router) {
    MusicIpcHandlers._forwardServerEvents(service);
    ipcMain.handle('core.musicGen.getServerStatus', () => MusicIpcHandlers._statusOrIdle(service));
    ipcMain.handle('core.musicGen.stopServer', IpcEnvelope.enveloped(() => service.stopServer()));
    ipcMain.handle('core.musicGen.generate', IpcEnvelope.enveloped((event, args = {}) => {
      const send = SenderStream.create(event, 'core.musicGen.musicEvent', { requestId: args.requestId });
      return MusicIpcHandlers._reportingErrors(send, () => router.generate({ ...args, send }));
    }));
    ipcMain.handle('core.musicGen.generateAbort', () => router.abort());
  }

  static _installStream(service, event, id) {
    const emit = SenderStream.create(event, 'core.musicServer.runtimeEvent', { id });
    return (type, payload) => {
      if (type === 'finalize') service.invalidateRuntimesCache();
      emit(type, payload);
    };
  }

  static async _reportingErrors(emit, fn) {
    try {
      return await fn();
    } catch (err) {
      emit('error', { message: err.message, code: err.code || null, detail: err.detail || null });
      throw err;
    }
  }

  static _forwardServerEvents(service) {
    try {
      service.server.on('state-change', (e) => MusicIpcHandlers._broadcast('state-change', e));
      service.server.on('log', (e) => MusicIpcHandlers._broadcast('log', e));
    } catch (_) {}
  }

  static _broadcast(type, payload) {
    for (const wc of webContents.getAllWebContents()) {
      try {
        if (!wc.isDestroyed()) wc.send('core.musicGen.serverEvent', { type, payload });
      } catch (_) {}
    }
  }

  static _statusOrIdle(service) {
    try {
      return service.getStatus();
    } catch (err) {
      return { state: 'idle', error: err.message };
    }
  }

  static _withNullFields(fields, fn) {
    const handler = IpcEnvelope.enveloped(fn);
    return async (...args) => {
      const reply = await handler(...args);
      if (reply.success) return reply;
      for (const field of fields) if (reply[field] === undefined) reply[field] = null;
      return reply;
    };
  }
}

module.exports = MusicIpcHandlers;
