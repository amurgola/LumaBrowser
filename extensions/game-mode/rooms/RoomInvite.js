const os = require('os');

class RoomInvite {
  static WS_PATH = '/api/ext/game-mode/ws';

  static build({ room, token, host, interfaces = RoomInvite._interfaces() }) {
    const wsPath = `${RoomInvite.WS_PATH}?room=${encodeURIComponent(room)}&token=${token}`;
    const port = String(host || '').split(':')[1] || '80';
    const wsUrls = [`ws://${host}${wsPath}`, ...RoomInvite._lanAddresses(interfaces).map((ip) => `ws://${ip}:${port}${wsPath}`)];
    return { wsPath, wsUrls };
  }

  static _interfaces() {
    try { return os.networkInterfaces(); } catch (_) { return {}; }
  }

  static _lanAddresses(interfaces) {
    const out = [];
    for (const list of Object.values(interfaces || {})) {
      for (const ni of list || []) if (ni.family === 'IPv4' && !ni.internal) out.push(ni.address);
    }
    return out;
  }
}

module.exports = RoomInvite;
