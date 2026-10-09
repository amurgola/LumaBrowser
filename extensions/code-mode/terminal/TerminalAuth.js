const CoreRequire = require('../CoreRequire');

const IpClass = CoreRequire.require('shared/net/IpClass');

class TerminalAuth {
  static authorize(req, handshake) {
    if (!IpClass.isLoopbackIp(req.socket && req.socket.remoteAddress)) return { ok: false, reason: 'not loopback' };
    if (!handshake || typeof handshake.verify !== 'function') return { ok: false, reason: 'no handshake' };
    if (!handshake.verify(TerminalAuth.tokenFrom(req))) return { ok: false, reason: 'bad token' };
    return { ok: true };
  }

  static tokenFrom(req) {
    const fromQuery = TerminalAuth._queryToken(req);
    if (fromQuery) return fromQuery;
    const header = req.headers && req.headers.authorization;
    const m = header && /^Bearer\s+(.+)$/i.exec(String(header));
    return m ? m[1].trim() : '';
  }

  static _queryToken(req) {
    try {
      const token = new URL(String(req.url || ''), 'http://localhost').searchParams.get('token');
      return token ? String(token) : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = TerminalAuth;
