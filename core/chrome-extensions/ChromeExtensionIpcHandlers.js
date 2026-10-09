const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const PathPicker = require('../shared/ipc/PathPicker');

class ChromeExtensionIpcHandlers {
  static PICK_FOLDER_OPTIONS = {
    title: 'Select unpacked Chrome extension folder',
    properties: ['openDirectory'],
  };

  constructor(chromeExtensionService) {
    this._service = chromeExtensionService;
  }

  register() {
    ipcMain.handle('core.chromeExtensions.list', IpcEnvelope.raw(() => this._service.list()));
    ipcMain.handle('core.chromeExtensions.pickFolder', IpcEnvelope.raw((event) => this._pickFolder(event)));
    ipcMain.handle('core.chromeExtensions.installUnpacked', IpcEnvelope.enveloped(async (_event, srcPath) => ({
      extension: await this._service.installFromDirectory(srcPath),
    })));
    ipcMain.handle('core.chromeExtensions.remove', IpcEnvelope.enveloped(async (_event, id) => ({
      success: await this._service.remove(id),
    })));
    ipcMain.handle('core.chromeExtensions.toggle', IpcEnvelope.enveloped(async (_event, id, enabled) => ({
      success: await this._service.setEnabled(id, enabled),
    })));
  }

  async _pickFolder(event) {
    const pick = await PathPicker.pick(event, ChromeExtensionIpcHandlers.PICK_FOLDER_OPTIONS, { useFocusedWindow: true });
    return pick.canceled ? { canceled: true } : { canceled: false, path: pick.paths[0] };
  }
}

module.exports = ChromeExtensionIpcHandlers;
