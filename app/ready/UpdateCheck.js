class UpdateCheck {
  static CHANNEL = 'core.app.checkForUpdates';

  constructor({ getWindow, db, env, isDev, createUpdater = UpdateCheck._createUpdater }) {
    this._getWindow = getWindow;
    this._db = db;
    this._env = env;
    this._isDev = isDev;
    this._createUpdater = createUpdater;
    this._updater = null;
  }

  ensure() {
    if (this._env.LUMA_DOCKER) return null;
    const win = this._getWindow();
    if (!this._updater && win) this._updater = this._createUpdater(win);
    return this._updater;
  }

  autoCheck() {
    if (this._isDev || !this._db.get('core.app.autoCheckUpdates', true)) return false;
    const updater = this.ensure();
    if (updater) updater.checkForUpdates();
    return Boolean(updater);
  }

  manualCheck() {
    if (this._env.LUMA_DOCKER) return { ok: false, reason: 'docker' };
    const updater = this.ensure();
    if (!updater) return { ok: false, reason: 'not-ready' };
    try {
      updater.checkForUpdates();
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err.message };
    }
  }

  register(ipcMain) {
    ipcMain.handle(UpdateCheck.CHANNEL, async () => this.manualCheck());
  }

  static _createUpdater(win) {
    const Updater = require('../../core/shell/Updater');
    return new Updater(win);
  }
}

module.exports = UpdateCheck;
