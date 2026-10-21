class WindowControlIpc {
  static CHANNELS = ['window:minimize', 'window:toggle-maximize', 'window:close', 'window:is-maximized'];

  constructor(getWindow, { windowForSender = null } = {}) {
    this._getWindow = getWindow;
    this._windowForSender = windowForSender;
  }

  register(ipcMain) {
    ipcMain.handle('window:minimize', (e) => this.minimize(WindowControlIpc._sender(e)));
    ipcMain.handle('window:toggle-maximize', (e) => this.toggleMaximize(WindowControlIpc._sender(e)));
    ipcMain.handle('window:close', (e) => this.close(WindowControlIpc._sender(e)));
    ipcMain.handle('window:is-maximized', (e) => this.isMaximized(WindowControlIpc._sender(e)));
  }

  minimize(sender) {
    const win = this._window(sender);
    if (win) win.minimize();
  }

  toggleMaximize(sender) {
    const win = this._window(sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }

  close(sender) {
    const win = this._window(sender);
    if (win) win.close();
  }

  isMaximized(sender) {
    const win = this._window(sender);
    return win ? win.isMaximized() : false;
  }

  static _sender(event) {
    return event && event.sender ? event.sender : null;
  }

  _window(sender) {
    let own = null;
    if (sender && this._windowForSender) {
      try { own = this._windowForSender(sender); } catch (_) { own = null; }
    }
    return own || this._getWindow();
  }
}

module.exports = WindowControlIpc;
