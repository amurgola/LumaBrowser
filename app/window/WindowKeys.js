class WindowKeys {
  static ZOOM_KEYS = ['=', '+', '-', '0'];

  static attach(win) {
    win.webContents.on('before-input-event', (event, input) => WindowKeys.handle(win, event, input));
  }

  static handle(win, event, input) {
    if (!input || input.type !== 'keyDown') return null;
    if (input.key === 'F12') {
      WindowKeys._toggleDevTools(win.webContents);
      return 'devtools';
    }
    if (input.control && !input.alt && WindowKeys.ZOOM_KEYS.includes(input.key)) {
      event.preventDefault();
      return 'blocked-zoom';
    }
    return null;
  }

  static _toggleDevTools(webContents) {
    if (webContents.isDevToolsOpened()) webContents.closeDevTools();
    else webContents.openDevTools();
  }
}

module.exports = WindowKeys;
