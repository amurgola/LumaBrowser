const { ipcMain } = require('electron');

class TelemetryIpcHandlers {
  static CHANNELS = {
    getStatus: 'core.telemetry.getStatus',
    setOptOut: 'core.telemetry.setOptOut',
  };

  constructor(consent, onChange = null) {
    this._consent = consent;
    this._onChange = onChange;
  }

  register() {
    ipcMain.handle(TelemetryIpcHandlers.CHANNELS.getStatus, () => this._consent.status());
    ipcMain.handle(TelemetryIpcHandlers.CHANNELS.setOptOut, (event, optOut) => this._setOptOut(optOut));
  }

  _setOptOut(optOut) {
    this._consent.setOptOut(optOut);
    if (this._onChange) this._onChange(this._consent);
    return { success: true, status: this._consent.status() };
  }
}

module.exports = TelemetryIpcHandlers;
