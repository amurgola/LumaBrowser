const RendererBroadcast = require('../../core/shell/extensions/RendererBroadcast');
const DashboardEventBroadcast = require('../../core/shell/extensions/DashboardEventBroadcast');

class DesktopBroadcast {
  static EXTENSION_ID = 'desktop-integration';
  static SETTINGS_CHANNEL = 'ext.desktop-integration.changed';

  constructor({ sendDashboard = null, sendWindow = null } = {}) {
    this._sendDashboard = sendDashboard || ((type, payload) => DashboardEventBroadcast.send(DesktopBroadcast.EXTENSION_ID, type, payload));
    this._sendWindow = sendWindow || ((channel, payload) => RendererBroadcast.send(channel, payload));
  }

  emit(type, payload = {}, feature = null) {
    const fullType = feature ? `${feature}.${type}` : String(type);
    try { this._sendDashboard(fullType, payload); } catch (_) {}
    try { this._sendWindow(DesktopBroadcast.SETTINGS_CHANNEL, { type: fullType, feature, payload }); } catch (_) {}
  }

  forFeature(featureId) {
    return (type, payload) => this.emit(type, payload, featureId);
  }
}

module.exports = DesktopBroadcast;
