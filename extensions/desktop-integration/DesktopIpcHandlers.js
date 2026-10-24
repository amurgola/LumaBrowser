const IpcEnvelope = require('../../core/shared/ipc/IpcEnvelope');

class DesktopIpcHandlers {
  static register(ipc, api) {
    if (!ipc) return;
    const on = (channel, fn) => ipc.handle(channel, IpcEnvelope.enveloped(fn));
    on('getInfo', () => api.info());
    on('rotateToken', () => ({ token: api.rotateToken() }));
    on('setFeatureEnabled', (_e, id, enabled) => ({ feature: api.setFeatureEnabled(id, enabled) }));
    on('setFeatureSetting', (_e, id, key, value) => ({ feature: api.setFeatureSetting(id, key, value) }));
    on('listClients', () => ({ clients: api.listClients() }));
    on('clearClients', () => ({ cleared: api.clearClients() }));
    on('speechState', (_e, update) => ({ accepted: api.speech.report(update) }));
  }
}

module.exports = DesktopIpcHandlers;
