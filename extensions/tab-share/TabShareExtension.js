const TabShareService = require('./TabShareService');
const TabShareWebRouter = require('./TabShareWebRouter');

class TabShareExtension {
  constructor({ electron = null, getHost = null } = {}) {
    this._electron = electron;
    this._getHost = getHost || (() => global.__lumaSharingHostService || null);
    this._service = null;
    this._ipc = null;
  }

  async activate(context) {
    this._ipc = context.ipc;
    this._service = this._createService(context);
    this._service.on('changed', (payload) => this._broadcast(payload));
    this._startService();
    this._registerIpc(context.ipc, this._service);
    return this._api(this._service);
  }

  async deactivate() {
    if (this._service) { this._service.destroy(); this._service = null; }
    this._ipc = null;
  }

  service() {
    return this._service;
  }

  _createService(context) {
    const log = TabShareExtension._logger(context.logger);
    return new TabShareService({
      db: context.db,
      browser: context.browser,
      extensionDir: context.extensionDir || __dirname,
      getHost: this._getHost,
      log,
    });
  }

  _startService() {
    const web = new TabShareWebRouter(this._service);
    this._service.start({ router: web.buildRouter(), upgrade: web.buildUpgrade() });
  }

  _registerIpc(ipc, service) {
    ipc.handle('status', async () => service.getStatus());
    ipc.handle('getForTab', async (_e, tabId) => service.getForTab(Number(tabId)));
    ipc.handle('share', async (_e, tabId, mode) => service.share(Number(tabId), { mode }));
    ipc.handle('setMode', async (_e, shareId, mode) => service.setMode(String(shareId), mode));
    ipc.handle('stop', async (_e, shareId) => service.stop(String(shareId)));
    ipc.handle('stopAll', async () => service.stopAll());
    ipc.handle('getSettings', async () => service.getSettings());
    ipc.handle('updateSettings', async (_e, patch) => service.updateSettings(patch && typeof patch === 'object' ? patch : {}));
  }

  _api(service) {
    return {
      getStatus: () => service.getStatus(),
      share: (tabId, mode) => service.share(tabId, { mode }),
      stop: (shareId) => service.stop(shareId),
    };
  }

  _broadcast(payload) {
    if (!this._ipc) return;
    for (const win of this._windows()) {
      try { if (!win.isDestroyed()) this._ipc.send(win, 'changed', payload); } catch (_) {}
    }
  }

  _windows() {
    try {
      const { BrowserWindow } = this._electron || require('electron');
      return BrowserWindow.getAllWindows();
    } catch (_) {
      return [];
    }
  }

  static _logger(logger) {
    return (msg) => {
      try { if (logger && logger.info) logger.info(msg); } catch (_) {}
      console.log(`[tab-share] ${msg}`);
    };
  }
}

module.exports = TabShareExtension;
