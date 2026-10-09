const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const SenderStream = require('../shared/ipc/SenderStream');

class LabIpcHandlers {
  static EVENT_CHANNEL = 'core.rpLab.event';
  static NOT_REGISTERED = { success: false, error: 'Roleplay mode is not registered (is the roleplay extension enabled?).' };

  constructor(getLabService) {
    this._getLabService = typeof getLabService === 'function' ? getLabService : () => null;
  }

  register() {
    this._handle('core.rpLab.getScenario', (svc) => LabIpcHandlers._scenario(svc));
    this._handleStreaming('core.rpLab.run', (svc, args) => svc.run(args));
    this._handleStreaming('core.rpLab.regenerateFrom', (svc, args) => svc.regenerateFrom(args));
    this._handleStreaming('core.rpLab.regenerateStep', (svc, args) => svc.regenerateStep(args));
  }

  static _scenario(svc) {
    return {
      success: true,
      scenario: svc.getScenario(),
      imageProfiles: typeof svc.getImageProfiles === 'function' ? svc.getImageProfiles() : {},
    };
  }

  _handleStreaming(channel, action) {
    this._handle(channel, (svc, event, args) => {
      svc.broadcast = SenderStream.create(event, LabIpcHandlers.EVENT_CHANNEL);
      return action(svc, args || {});
    });
  }

  _handle(channel, fn) {
    ipcMain.handle(channel, IpcEnvelope.enveloped((event, args) => {
      const svc = this._getLabService();
      if (!svc) return { ...LabIpcHandlers.NOT_REGISTERED };
      return fn(svc, event, args);
    }));
  }
}

module.exports = LabIpcHandlers;
