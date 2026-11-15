const { ipcMain } = require('electron');

class PromptApiIpcHandlers {
  static CHANNELS = {
    getStatus: 'core.promptApi.getStatus',
    setEnabled: 'core.promptApi.setEnabled',
  };

  constructor(service) {
    this._service = service;
  }

  register() {
    ipcMain.handle(PromptApiIpcHandlers.CHANNELS.getStatus, () => this._service.status());
    ipcMain.handle(PromptApiIpcHandlers.CHANNELS.setEnabled, (_event, enabled) => ({ success: true, status: this._service.setEnabled(!!enabled) }));
  }
}

module.exports = PromptApiIpcHandlers;
