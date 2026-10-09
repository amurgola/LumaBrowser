const { Menu, BrowserWindow } = require('electron');
const ImageSrcRecovery = require('./context-menu/ImageSrcRecovery');
const MenuTab = require('./context-menu/MenuTab');
const ContextMenuTemplate = require('./context-menu/ContextMenuTemplate');

class ContextMenu {
  static BOUND_FLAG = '_lumaContextMenuBound';

  constructor({ getTabViewManager = () => null, db = null } = {}) {
    this._getTabViewManager = getTabViewManager;
    this._db = db;
  }

  install(app) {
    app.on('web-contents-created', (_event, webContents) => this.attach(webContents));
  }

  attach(webContents) {
    if (!webContents || webContents[ContextMenu.BOUND_FLAG]) return;
    webContents[ContextMenu.BOUND_FLAG] = true;
    webContents.on('context-menu', (_event, params) => this._show(webContents, params));
  }

  async _show(webContents, params) {
    try {
      await this._recoverImageSrc(webContents, params);
      const items = this._buildItems(webContents, params);
      if (items.length) Menu.buildFromTemplate(items).popup({ window: ContextMenu._windowOf(webContents) });
    } catch (err) {
      console.warn('[ContextMenu] popup failed:', err && err.message);
    }
  }

  async _recoverImageSrc(webContents, params) {
    if (ImageSrcRecovery.isNeeded(params)) params.recoveredSrcURL = await ImageSrcRecovery.recover(webContents, params);
  }

  _buildItems(webContents, params) {
    const tab = MenuTab.resolve(this._getTabViewManager, webContents);
    return new ContextMenuTemplate({ webContents, params, tab, db: this._db }).build();
  }

  static _windowOf(webContents) {
    try {
      return BrowserWindow.fromWebContents(webContents) || undefined;
    } catch {
      return undefined;
    }
  }
}

module.exports = ContextMenu;
