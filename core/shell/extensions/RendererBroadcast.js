class RendererBroadcast {
  static INSTALLED = 'core.shell.extensionInstalled';
  static DELETED = 'core.shell.extensionDeleted';

  static send(channel, payload) {
    try {
      const { BrowserWindow } = require('electron');
      for (const win of BrowserWindow.getAllWindows()) RendererBroadcast._sendTo(win, channel, payload);
    } catch (_) {}
  }

  static _sendTo(win, channel, payload) {
    if (!win || win.isDestroyed() || !win.webContents || win.webContents.isDestroyed()) return;
    try { win.webContents.send(channel, payload); } catch (_) {}
  }
}

module.exports = RendererBroadcast;
