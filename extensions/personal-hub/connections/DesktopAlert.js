class DesktopAlert {
  constructor({ electronModule = null } = {}) {
    this._electron = electronModule;
    this._live = new Set();
  }

  show({ title, body, onClick = null } = {}) {
    const electron = this._electron || DesktopAlert._load();
    const Notification = electron && electron.Notification;
    if (!Notification || (typeof Notification.isSupported === 'function' && !Notification.isSupported())) return false;
    try {
      const notification = new Notification({ title: String(title || ''), body: String(body || '') });
      if (onClick) notification.on('click', () => { try { onClick(); } catch (_) {} });
      notification.on('close', () => this._live.delete(notification));
      this._live.add(notification);
      notification.show();
      return true;
    } catch (_) {
      return false;
    }
  }

  static _load() {
    try { return require('electron'); } catch (_) { return null; }
  }
}

module.exports = DesktopAlert;
