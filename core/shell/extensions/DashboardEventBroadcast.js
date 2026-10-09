class DashboardEventBroadcast {
  static SUFFIX = '.dashboard.event';

  static channel(extensionId) {
    return `ext.${extensionId}${DashboardEventBroadcast.SUFFIX}`;
  }

  static send(extensionId, type, payload) {
    const channel = DashboardEventBroadcast.channel(extensionId);
    const message = { type, payload: payload === undefined ? null : payload };
    try {
      const { webContents } = require('electron');
      for (const wc of webContents.getAllWebContents()) DashboardEventBroadcast._sendTo(wc, channel, message);
    } catch (_) {}
  }

  static _sendTo(wc, channel, message) {
    if (!wc || wc.isDestroyed()) return;
    try { wc.send(channel, message); } catch (_) {}
  }
}

module.exports = DashboardEventBroadcast;
