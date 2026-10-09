const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');

class AdblockerIpcHandlers {
  static CHANNELS = {
    getEnabled: 'core.adblocker.getEnabled',
    setEnabled: 'core.adblocker.setEnabled',
  };

  constructor(adblockerService) {
    this._adblocker = adblockerService;
  }

  register() {
    ipcMain.handle(AdblockerIpcHandlers.CHANNELS.getEnabled, IpcEnvelope.raw(() => this._adblocker.isEnabled()));
    ipcMain.handle(AdblockerIpcHandlers.CHANNELS.setEnabled, IpcEnvelope.enveloped((_event, enabled) => this._setEnabled(enabled)));
  }

  async _setEnabled(enabled) {
    await this._adblocker.setEnabled(enabled);
    return { enabled: this._adblocker.isEnabled() };
  }
}

module.exports = AdblockerIpcHandlers;
