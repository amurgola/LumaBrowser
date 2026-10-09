class WindowControlIpc {
  static CHANNELS = ['window:minimize', 'window:toggle-maximize', 'window:close', 'window:is-maximized'];

  constructor(getWindow) {
    this._getWindow = getWindow;
  }

  register(ipcMain) {
    ipcMain.handle('window:minimize', () => this.minimize());
    ipcMain.handle('window:toggle-maximize', () => this.toggleMaximize());
    ipcMain.handle('window:close', () => this.close());
    ipcMain.handle('window:is-maximized', () => this.isMaximized());
  }

  minimize() {
    const win = this._getWindow();
    if (win) win.minimize();
  }

  toggleMaximize() {
    const win = this._getWindow();
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }

  close() {
    const win = this._getWindow();
    if (win) win.close();
  }

  isMaximized() {
    const win = this._getWindow();
    return win ? win.isMaximized() : false;
  }
}

module.exports = WindowControlIpc;
