class WindowStateRelay {
  static EVENTS = ['maximize', 'unmaximize'];

  static attach(win) {
    const send = () => WindowStateRelay.send(win);
    for (const event of WindowStateRelay.EVENTS) win.on(event, send);
    win.on('enter-full-screen', () => WindowStateRelay.send(win, true));
    win.on('leave-full-screen', () => WindowStateRelay.send(win, false));
    win.webContents.on('did-finish-load', send);
  }

  static send(win, fullScreen = null) {
    if (!win || win.isDestroyed()) return;
    const full = fullScreen == null ? win.isFullScreen() : fullScreen;
    win.webContents.send('window:state', { maximized: win.isMaximized() || full, fullScreen: full });
  }
}

module.exports = WindowStateRelay;
