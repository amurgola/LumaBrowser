const { ipcMain } = require('electron');

class DesktopIpcHandlers {
  static CHANNELS = {
    getState: 'core.desktop.getState',
    setEnabled: 'core.desktop.setEnabled',
  };

  constructor(desktopService) {
    this._desktop = desktopService;
  }

  register() {
    ipcMain.handle(DesktopIpcHandlers.CHANNELS.getState, () => this._state());
    ipcMain.handle(DesktopIpcHandlers.CHANNELS.setEnabled, (_event, on) => this._setEnabled(on));
  }

  _state() {
    return { success: true, supported: this._desktop.supported, enabled: this._desktop.isEnabled() };
  }

  _setEnabled(on) {
    this._desktop.setEnabled(!!on);
    return { success: true, enabled: this._desktop.isEnabled() };
  }
}

module.exports = DesktopIpcHandlers;
