class AppTray {
  static TOOLTIP = 'LumaBrowser';
  static SUSPENDED_TOOLTIP = 'LumaBrowser: window unavailable. Open to retry.';

  constructor({ Tray, Menu, nativeImage, iconPath, isSuspended, onShow, onQuit }) {
    this._Tray = Tray;
    this._Menu = Menu;
    this._nativeImage = nativeImage;
    this._iconPath = iconPath;
    this._isSuspended = isSuspended;
    this._onShow = onShow;
    this._onQuit = onQuit;
    this._tray = null;
  }

  create() {
    this._tray = new this._Tray(this._nativeImage.createFromPath(this._iconPath));
    this.refresh();
    this._tray.on('click', this._onShow);
    this._tray.on('double-click', this._onShow);
    return this._tray;
  }

  refresh() {
    if (!this._isLive()) return false;
    const suspended = Boolean(this._isSuspended());
    this._tray.setToolTip(suspended ? AppTray.SUSPENDED_TOOLTIP : AppTray.TOOLTIP);
    this._tray.setContextMenu(this._Menu.buildFromTemplate(AppTray.template(suspended, this._onShow, this._onQuit)));
    return true;
  }

  static template(suspended, onShow, onQuit) {
    const items = [];
    if (suspended) items.push({ label: 'Window unavailable. Open to retry', click: onShow }, { type: 'separator' });
    items.push({ label: 'Show LumaBrowser', click: onShow }, { type: 'separator' }, { label: 'Quit', click: onQuit });
    return items;
  }

  _isLive() {
    if (!this._tray) return false;
    try {
      return !(typeof this._tray.isDestroyed === 'function' && this._tray.isDestroyed());
    } catch (_) {
      return false;
    }
  }
}

module.exports = AppTray;
