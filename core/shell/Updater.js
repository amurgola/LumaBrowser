const { dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

class Updater {
  static STATUS_CHANNEL = 'core.app.update-status';
  static AVAILABLE_CHANNEL = 'core.app.update-available';
  static INSTALL_CHANNEL = 'core.app.installUpdate';
  static RESTART_BUTTON = 0;

  static _ipcRegistered = false;

  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this._configureAutoUpdater();
    this._registerListeners();
    this._registerIpc();
  }

  checkForUpdates() {
    try {
      autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Failed to initiate update check:', error);
    }
  }

  _configureAutoUpdater() {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
  }

  _registerIpc() {
    if (Updater._ipcRegistered) return;
    Updater._ipcRegistered = true;
    ipcMain.handle(Updater.INSTALL_CHANNEL, () => this._installNow());
  }

  _installNow() {
    try {
      autoUpdater.quitAndInstall();
      return { ok: true };
    } catch (err) {
      log.error('quitAndInstall failed:', err);
      return { ok: false, reason: err.message };
    }
  }

  _registerListeners() {
    autoUpdater.on('checking-for-update', () => this._onChecking());
    autoUpdater.on('update-available', (info) => this._onAvailable(info));
    autoUpdater.on('update-not-available', (info) => this._onNotAvailable(info));
    autoUpdater.on('error', (err) => this._onError(err));
    autoUpdater.on('download-progress', (progress) => this._onProgress(progress));
    autoUpdater.on('update-downloaded', (info) => this._onDownloaded(info));
  }

  _onChecking() {
    log.info('Checking for updates from https://lumabyte.com/install/ ...');
    this._emitStatus('checking');
  }

  _onAvailable(info) {
    log.info('Update available:', info.version);
    this._send(Updater.AVAILABLE_CHANNEL, info);
    this._emitStatus('available', info && info.version);
  }

  _onNotAvailable(info) {
    log.info('Application is up to date.');
    this._emitStatus('up-to-date', info && info.version);
  }

  _onError(err) {
    log.error('Error in auto-updater:', err);
    this._emitStatus('error', err && err.message);
  }

  _onProgress(progress) {
    this._emitStatus('downloading', {
      percent: Updater._clampPercent(progress && progress.percent),
      transferred: progress && progress.transferred,
      total: progress && progress.total,
    });
  }

  _onDownloaded(info) {
    log.info('Update downloaded:', info.version);
    this._emitStatus('downloaded', info && info.version);
    dialog.showMessageBox(Updater._restartDialog(info.version)).then((result) => {
      if (result.response === Updater.RESTART_BUTTON) autoUpdater.quitAndInstall();
    });
  }

  static _restartDialog(version) {
    return {
      type: 'info',
      buttons: ['Restart and Install', 'Later'],
      title: 'Application Update',
      message: `Version ${version} is ready.`,
      detail: 'A new version of LumaBrowser has been downloaded. Restart the application to apply the updates.',
    };
  }

  static _clampPercent(percent) {
    return Math.max(0, Math.min(100, Math.round(percent || 0)));
  }

  _emitStatus(status, detail) {
    this._send(Updater.STATUS_CHANNEL, { status, detail: detail || null });
  }

  _send(channel, payload) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, payload);
    }
  }
}

module.exports = Updater;
