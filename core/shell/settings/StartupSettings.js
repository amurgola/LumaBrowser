class StartupSettings {
  static START_HIDDEN_KEY = 'core.app.startHidden';
  static HIDDEN_ARG = '--hidden';

  constructor({ db, app }) {
    this._db = db;
    this._app = app;
  }

  getRunOnStartup() {
    return this._app.getLoginItemSettings().openAtLogin;
  }

  setRunOnStartup(enabled) {
    this._applyLoginItem(enabled, this._startHidden());
    return { success: true };
  }

  getConfig() {
    return { openAtLogin: !!this.getRunOnStartup(), startHidden: !!this._startHidden() };
  }

  setStartHidden(hidden) {
    this._db.set(StartupSettings.START_HIDDEN_KEY, !!hidden);
    if (this.getRunOnStartup()) this._applyLoginItem(true, !!hidden);
    return { success: true };
  }

  _startHidden() {
    return this._db.get(StartupSettings.START_HIDDEN_KEY, true);
  }

  _applyLoginItem(enabled, hidden) {
    this._app.setLoginItemSettings({
      openAtLogin: !!enabled,
      openAsHidden: !!hidden,
      args: hidden ? [StartupSettings.HIDDEN_ARG] : [],
    });
  }
}

module.exports = StartupSettings;
