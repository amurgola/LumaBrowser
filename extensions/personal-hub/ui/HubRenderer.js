import HubSettingsTab from './HubSettingsTab.js';

export default class HubRenderer {
  static CHANGED_CHANNEL = 'ext.personal-hub.changed';
  static ERROR_EVENT = 'board.error';
  static SIGN_OUT_EVENT = 'connection.alert';

  constructor({ win = null } = {}) {
    this._active = false;
    this._tab = new HubSettingsTab();
    this._win = win;
    this._detach = null;
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    this._listen(context && context.ipcBridge);
    await this._tab.activate(context);
  }

  deactivate() {
    if (this._detach) {
      try { this._detach(); } catch (_) {}
      this._detach = null;
    }
    this._tab.deactivate();
    this._active = false;
  }

  _listen(ipc) {
    if (!ipc || typeof ipc.on !== 'function') return;
    const detach = ipc.on(HubRenderer.CHANGED_CHANNEL, (event) => {
      if (event && event.type === HubRenderer.ERROR_EVENT) this._notify(event.payload || {});
      if (event && event.type === HubRenderer.SIGN_OUT_EVENT) this._log(`Hub: ${(event.payload && event.payload.title) || 'a tab signed out'}`);
    });
    this._detach = typeof detach === 'function' ? detach : null;
  }

  _notify({ sourceLabel, title, message }) {
    if (!message) return;
    const where = [sourceLabel, title].filter(Boolean).join(': ');
    this._log(where ? `${where}: ${message}` : String(message));
  }

  _log(text) {
    const win = this._win || (typeof window !== 'undefined' ? window : null);
    if (win && typeof win.addLogEntry === 'function') win.addLogEntry(text, 'error');
  }
}
