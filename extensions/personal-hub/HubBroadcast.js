const RendererBroadcast = require('../../core/shell/extensions/RendererBroadcast');

class HubBroadcast {
  static EXTENSION_ID = 'personal-hub';
  static SETTINGS_CHANNEL = 'ext.personal-hub.changed';

  constructor({ sendDashboard = null, sendWindow = null } = {}) {
    this._sendDashboard = sendDashboard || HubBroadcast._dashboardSender();
    this._sendWindow = sendWindow || ((channel, payload) => RendererBroadcast.send(channel, payload));
  }

  emit(type, payload = {}) {
    try { this._sendDashboard(type, payload); } catch (_) {}
    try { this._sendWindow(HubBroadcast.SETTINGS_CHANNEL, { type, payload }); } catch (_) {}
  }

  emitter() {
    return (type, payload) => this.emit(type, payload);
  }

  static _dashboardSender() {
    try {
      const DashboardEventBroadcast = require('../../core/shell/extensions/DashboardEventBroadcast');
      return (type, payload) => DashboardEventBroadcast.send(HubBroadcast.EXTENSION_ID, type, payload);
    } catch (_) {
      return () => {};
    }
  }
}

module.exports = HubBroadcast;
