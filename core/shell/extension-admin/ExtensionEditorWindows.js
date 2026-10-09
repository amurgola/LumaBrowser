const path = require('path');
const { BrowserWindow } = require('electron');

class ExtensionEditorWindows {
  static SIZE = { width: 1000, height: 700 };
  static PRELOAD_PATH = path.join(__dirname, '..', 'extension-editor-preload.js');
  static HTML_PATH = path.join(__dirname, '..', 'extension-editor.html');

  constructor({ resolver }) {
    this._resolver = resolver;
    this._sessions = new Map();
  }

  static options(extensionId) {
    return {
      ...ExtensionEditorWindows.SIZE,
      title: `Edit Extension: ${extensionId}`,
      webPreferences: {
        preload: ExtensionEditorWindows.PRELOAD_PATH,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        nodeIntegrationInSubFrames: false,
        webviewTag: false,
      },
    };
  }

  open(extensionId) {
    const dir = this._resolver.resolve(extensionId);
    if (!dir) return { success: false, error: `Extension "${extensionId}" not found` };
    const win = new BrowserWindow(ExtensionEditorWindows.options(extensionId));
    this._track(win, { extensionId, dir });
    ExtensionEditorWindows._guardNavigation(win.webContents);
    win.loadFile(ExtensionEditorWindows.HTML_PATH, { query: { dir, id: extensionId } });
    return { success: true };
  }

  sessionOf(event) {
    const sender = event && event.sender;
    const session = sender ? this._sessions.get(sender.id) : null;
    if (!session || !ExtensionEditorWindows._fromMainFrame(event)) throw new Error('Not an extension editor window');
    return session;
  }

  _track(win, session) {
    const id = win.webContents.id;
    this._sessions.set(id, session);
    win.on('closed', () => this._sessions.delete(id));
  }

  static _guardNavigation(wc) {
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
    wc.on('will-navigate', (e) => e.preventDefault());
  }

  static _fromMainFrame(event) {
    const frame = event.senderFrame;
    const main = event.sender.mainFrame;
    if (!frame || !main) return false;
    return frame === main || (frame.routingId === main.routingId && frame.processId === main.processId);
  }
}

module.exports = ExtensionEditorWindows;
