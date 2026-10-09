const tls = require('tls');

class ServerCertificateProbe {
  static DEFAULT_TIMEOUT_MS = 6000;
  static PEM_LINE_LENGTH = 64;

  static fetch(host, port, { timeoutMs = ServerCertificateProbe.DEFAULT_TIMEOUT_MS } = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (err, value) => {
        if (settled) return;
        settled = true;
        try { socket.destroy(); } catch (_) {}
        if (err) reject(err); else resolve(value);
      };
      const socket = tls.connect({ host, port: Number(port), rejectUnauthorized: false }, () => {
        finish(...ServerCertificateProbe._readPeer(socket));
      });
      socket.setTimeout(timeoutMs, () => finish(new Error('Timed out reading the host’s TLS certificate.')));
      socket.on('error', (err) => finish(new Error((err && err.message) || 'TLS probe failed.')));
    });
  }

  static derToPem(der) {
    const base64 = Buffer.from(der).toString('base64');
    const lines = base64.match(new RegExp(`.{1,${ServerCertificateProbe.PEM_LINE_LENGTH}}`, 'g')) || [];
    return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
  }

  static _readPeer(socket) {
    const cert = socket.getPeerCertificate(true);
    if (!cert || !cert.raw) return [new Error('Host presented no TLS certificate.')];
    return [null, { certPem: ServerCertificateProbe.derToPem(cert.raw), fingerprint256: cert.fingerprint256 }];
  }
}

module.exports = ServerCertificateProbe;
