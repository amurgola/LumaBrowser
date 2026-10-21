const { BrowserWindow, ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const PathPicker = require('../shared/ipc/PathPicker');
const ChromeStoreCatalog = require('./store/ChromeStoreCatalog');
const ChromeStoreInstaller = require('./store/ChromeStoreInstaller');
const ChromeWebStoreClient = require('./store/ChromeWebStoreClient');
const ChromeExtensionPageWindows = require('./ChromeExtensionPageWindows');

class ChromeExtensionIpcHandlers {
  static PICK_FOLDER_OPTIONS = {
    title: 'Select unpacked Chrome extension folder',
    properties: ['openDirectory'],
  };

  constructor(chromeExtensionService, { storeInstaller = null, pageWindows = null, openUrlInTab = null } = {}) {
    this._service = chromeExtensionService;
    this._storeInstaller = storeInstaller || new ChromeStoreInstaller({ service: chromeExtensionService });
    this._pageWindows = pageWindows || new ChromeExtensionPageWindows({ service: chromeExtensionService, openUrlInTab });
  }

  register() {
    ipcMain.handle('core.chromeExtensions.list', IpcEnvelope.raw(() => this._service.list()));
    ipcMain.handle('core.chromeExtensions.pickFolder', IpcEnvelope.raw((event) => this._pickFolder(event)));
    ipcMain.handle('core.chromeExtensions.installUnpacked', IpcEnvelope.enveloped(async (_event, srcPath) => ({
      extension: await this._service.installFromDirectory(srcPath),
    })));
    ipcMain.handle('core.chromeExtensions.remove', IpcEnvelope.enveloped(async (_event, id) => {
      this._closePages(id);
      return { success: await this._service.remove(id) };
    }));
    ipcMain.handle('core.chromeExtensions.toggle', IpcEnvelope.enveloped(async (_event, id, enabled) => {
      if (!enabled) this._closePages(id);
      return { success: await this._service.setEnabled(id, enabled) };
    }));
    ipcMain.handle('core.chromeExtensions.catalog', IpcEnvelope.raw(() => this._catalog()));
    ipcMain.handle('core.chromeExtensions.installFromStore', IpcEnvelope.enveloped(async (_event, idOrUrl) => ({
      extension: await this._storeInstaller.install(idOrUrl),
    })));
    ipcMain.handle('core.chromeExtensions.checkUpdate', IpcEnvelope.enveloped(async (_event, id) => ({
      update: await this._storeInstaller.checkForUpdate(id),
    })));
    ipcMain.handle('core.chromeExtensions.openPage', IpcEnvelope.enveloped(async (event, id, kind, at) => (
      this._pageWindows.open(id, kind, ChromeExtensionIpcHandlers._anchorFrom(event, at))
    )));
  }

  _catalog() {
    const installed = new Map(this._service.list().map((ext) => [ext.id, ext]));
    return ChromeStoreCatalog.list().map((entry) => {
      const ext = installed.get(entry.id);
      return {
        ...entry,
        storeUrl: ChromeWebStoreClient.detailUrl(entry.id),
        installed: !!ext,
        installedVersion: ext ? ext.version : null,
        enabled: ext ? ext.enabled : false,
      };
    });
  }

  _closePages(id) {
    if (typeof this._pageWindows.closeFor === 'function') this._pageWindows.closeFor(id);
  }

  static _anchorFrom(event, at) {
    if (!at || !Number.isFinite(at.x) || !Number.isFinite(at.y)) return null;
    const parent = event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null;
    return parent ? { parent, x: at.x, y: at.y } : null;
  }

  async _pickFolder(event) {
    const pick = await PathPicker.pick(event, ChromeExtensionIpcHandlers.PICK_FOLDER_OPTIONS, { useFocusedWindow: true });
    return pick.canceled ? { canceled: true } : { canceled: false, path: pick.paths[0] };
  }
}

module.exports = ChromeExtensionIpcHandlers;
