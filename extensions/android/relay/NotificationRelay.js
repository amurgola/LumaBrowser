const HubItemMapper = require('./HubItemMapper');

class NotificationRelay {
  static SYSTEM_PACKAGES = new Set(['android', 'com.android.systemui', 'com.android.shell']);

  constructor({ getHub, settings }) {
    this._getHub = getHub;
    this._settings = settings;
  }

  forward(deviceName, notification) {
    if (!this._settings.read().relayNotifications) return 'off';
    if (NotificationRelay.SYSTEM_PACKAGES.has(notification.packageName)) return 'system';
    if (!notification.title && !notification.text) return 'empty';
    const hub = this._hub();
    if (!hub) return 'no-hub';
    try {
      hub.pushQueueItem(HubItemMapper.toQueueItem(deviceName, notification));
      return 'relayed';
    } catch (_) {
      return 'error';
    }
  }

  _hub() {
    let hub = null;
    try { hub = this._getHub(); } catch (_) { hub = null; }
    return hub && typeof hub.pushQueueItem === 'function' ? hub : null;
  }
}

module.exports = NotificationRelay;
