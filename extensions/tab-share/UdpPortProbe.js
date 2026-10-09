const dgram = require('dgram');

class UdpPortProbe {
  static check(port) {
    return new Promise((resolve) => {
      const sock = dgram.createSocket('udp4');
      sock.once('error', (err) => {
        try { sock.close(); } catch (_) {}
        resolve(UdpPortProbe.describe(err, port));
      });
      sock.bind(port, '0.0.0.0', () => {
        try { sock.close(() => resolve(null)); } catch (_) { resolve(null); }
      });
    });
  }

  static describe(err, port) {
    if (err && err.code === 'EADDRINUSE') return `UDP port ${port} is already in use by another program.`;
    if (err && err.code === 'EACCES') return `Permission denied for UDP port ${port}. Try a port above 1024.`;
    return `Could not bind UDP port ${port}: ${(err && err.message) || 'unknown error'}`;
  }
}

module.exports = UdpPortProbe;
