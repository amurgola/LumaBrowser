class ApprovalAttention {
  static TITLE = 'LumaBrowser needs your approval';
  static TAIL = 'It is waiting in the chat.';
  static MAX_BODY = 180;

  constructor({ getWindow, notify = ApprovalAttention._electronNotify, title = ApprovalAttention.TITLE, tail = ApprovalAttention.TAIL } = {}) {
    this._getWindow = typeof getWindow === 'function' ? getWindow : () => null;
    this._notify = notify;
    this._title = title;
    this._tail = tail;
    this._flashing = null;
    this._presenters = new Set();
  }

  request(detail, info = {}) {
    const win = this._window();
    if (!win || win.isFocused()) return;
    try { win.flashFrame(true); this._flashing = win; } catch (_) {}
    const presented = this._present('request', { detail: String(detail || ''), ...(info || {}) });
    if (!this._notify || presented) return;
    this._notify({
      title: this._title,
      body: ApprovalAttention._body(detail, this._tail),
      onClick: () => ApprovalAttention._bringBack(win),
    });
  }

  clear() {
    this._present('clear');
    const win = this._flashing;
    this._flashing = null;
    if (!win || ApprovalAttention._gone(win)) return;
    try { win.flashFrame(false); } catch (_) {}
  }

  addPresenter(presenter) {
    this._presenters.add(presenter);
    return () => { this._presenters.delete(presenter); };
  }

  _present(method, payload) {
    let shown = false;
    for (const p of this._presenters) {
      try { if (typeof p[method] === 'function' && p[method](payload) === true) shown = true; } catch (_) {}
    }
    return shown;
  }

  _window() {
    let win = null;
    try { win = this._getWindow(); } catch (_) { win = null; }
    return win && !ApprovalAttention._gone(win) ? win : null;
  }

  static _body(detail, tail = ApprovalAttention.TAIL) {
    const text = String(detail || 'An agent wants to make a change.').replace(/\s+/g, ' ').trim();
    const cut = text.length > ApprovalAttention.MAX_BODY ? text.slice(0, ApprovalAttention.MAX_BODY - 3) + '...' : text;
    return `${cut} ${tail}`;
  }

  static _bringBack(win) {
    if (ApprovalAttention._gone(win)) return;
    try {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    } catch (_) {}
  }

  static _gone(win) {
    try { return typeof win.isDestroyed === 'function' && win.isDestroyed(); } catch (_) { return true; }
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

module.exports = ApprovalAttention;
