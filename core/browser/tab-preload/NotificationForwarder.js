const MainWorldScript = require('./MainWorldScript');

class NotificationForwarder {
  static CHANNEL = 'notification-intercepted';

  constructor(ipcRenderer, win) {
    this._ipcRenderer = ipcRenderer;
    this._window = win;
  }

  listen() {
    this._window.addEventListener('message', (event) => this._onMessage(event));
  }

  _onMessage(event) {
    const payload = NotificationForwarder.payloadOf(event);
    if (!payload) return;
    console.log('Notification intercepted:', payload);
    this._ipcRenderer.send(NotificationForwarder.CHANNEL, payload);
  }

  static payloadOf(event) {
    const d = event && event.data;
    if (!d || d[MainWorldScript.NOTIFY_KEY] !== true || !d.payload || typeof d.payload !== 'object') return null;
    return d.payload;
  }
}

module.exports = NotificationForwarder;
