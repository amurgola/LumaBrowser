const WindowRaiser = require('./WindowRaiser');

class TabAttention {
  static MAX_BODY = 200;

  constructor(tabViewManager, { notify = TabAttention._electronNotify } = {}) {
    this._tabs = tabViewManager;
    this._notify = notify;
  }

  alert(tabId, { title, body }) {
    const win = this._windowOf(tabId);
    this._showTab(tabId);
    const raised = WindowRaiser.raise(win);
    TabAttention._flashUntilFocused(win);
    this._post(title, body, () => { this._showTab(tabId); WindowRaiser.raise(win); });
    return raised;
  }

  _windowOf(tabId) {
    try {
      const own = typeof this._tabs.windowOfTab === 'function' ? this._tabs.windowOfTab(tabId) : null;
      return own || this._tabs.mainWindow || null;
    } catch (_) {
      return null;
    }
  }

  _showTab(tabId) {
    try { this._tabs.switchToTab(tabId); } catch (_) {}
  }

  _post(title, body, onClick) {
    if (!this._notify) return;
    try { this._notify({ title: String(title || ''), body: TabAttention._clip(body), onClick }); } catch (_) {}
  }

  static _flashUntilFocused(win) {
    try {
      if (!win || win.isDestroyed() || win.isFocused()) return;
      win.flashFrame(true);
      win.once('focus', () => { try { win.flashFrame(false); } catch (_) {} });
    } catch (_) {}
  }

  static _clip(body) {
    const text = String(body || '').replace(/\s+/g, ' ').trim();
    return text.length > TabAttention.MAX_BODY ? text.slice(0, TabAttention.MAX_BODY - 3) + '...' : text;
  }

  static _electronNotify({ title, body, onClick }) {
    let Notification;
    try { ({ Notification } = require('electron')); } catch (_) { return; }
    if (!Notification || typeof Notification.isSupported !== 'function' || !Notification.isSupported()) return;
    const note = new Notification({ title, body });
    note.on('click', onClick);
    note.show();
  }
}

module.exports = TabAttention;
