const PinnedTls = require('../tls/PinnedTls');
const ServerCertificateProbe = require('../tls/ServerCertificateProbe');

class PeerTlsUpgrade {
  static async resolve(base, info) {
    const target = PeerTlsUpgrade._target(base, info);
    if (!target) return { success: true };
    const captured = await PeerTlsUpgrade._capture(target);
    if (!captured.success) return captured;
    return PeerTlsUpgrade._pin(target, captured.pin);
  }

  static _target(base, info) {
    if (!/^http:/i.test(base || '')) return null;
    const tls = info && info.tls;
    if (!tls || !tls.port) return null;
    try {
      return { host: new URL(base).hostname, port: tls.port, fingerprint256: tls.fingerprint256 };
    } catch (_) {
      return null;
    }
  }

  static async _capture(target) {
    let pin;
    try {
      pin = await ServerCertificateProbe.fetch(target.host, target.port);
    } catch (err) {
      return { success: false, error: `The host advertises encrypted sharing on port ${target.port}, but it could not be reached (${(err && err.message) || err}). Check the host's firewall and try again.` };
    }
    if (target.fingerprint256 && !PinnedTls.sameFingerprint(pin.fingerprint256, target.fingerprint256)) {
      return { success: false, error: "The certificate on the host's encrypted port does not match what the host advertised. Someone may be intercepting the connection, so pairing was aborted." };
    }
    return { success: true, pin };
  }

  static _pin(target, pin) {
    const base = `https://${target.host}:${target.port}`;
    PinnedTls.setPin(base, pin);
    return { success: true, base, pin };
  }
}

module.exports = PeerTlsUpgrade;
