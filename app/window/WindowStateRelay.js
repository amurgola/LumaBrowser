class WindowStateRelay {
  static EVENTS = ['maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen'];

  static attach(win) {
    const send = () => WindowStateRelay.send(win);
    for (const event of WindowStateRelay.EVENTS) win.on(event, send);
    win.webContents.on('did-finish-load', send);
  }

  static send(win) {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('window:state', { maximized: win.isMaximized() || win.isFullScreen() });
  }
}

module.exports = WindowStateRelay;
