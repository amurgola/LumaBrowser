const https = require('https');

class PinnedTls {
  static KEEP_ALIVE_MS = 30000;

  static _pins = new Map();
  static _agents = new Map();

  static setPin(url, { certPem, fingerprint256 } = {}) {
    const origin = PinnedTls.originOf(url);
    if (!origin || !certPem || !fingerprint256) return false;
    PinnedTls._pins.set(origin, { certPem, fingerprint256 });
    PinnedTls._agents.delete(origin);
    return true;
  }

  static removePin(url) {
    const origin = PinnedTls.originOf(url);
    if (!origin) return;
    PinnedTls._pins.delete(origin);
    PinnedTls._destroyAgent(origin);
  }

  static getPin(url) {
    return PinnedTls._pins.get(PinnedTls.originOf(url)) || null;
  }

  static clearPins() {
    for (const origin of [...PinnedTls._agents.keys()]) PinnedTls._destroyAgent(origin);
    PinnedTls._pins.clear();
  }

  static agentFor(url) {
    const origin = PinnedTls.originOf(url);
    const pin = origin && PinnedTls._pins.get(origin);
    if (!pin) return null;
    if (!PinnedTls._agents.has(origin)) PinnedTls._agents.set(origin, PinnedTls._createAgent(origin, pin));
    return PinnedTls._agents.get(origin);
  }

  static sameFingerprint(a, b) {
    const normalized = PinnedTls._normalizeFingerprint(a);
    return !!normalized && normalized === PinnedTls._normalizeFingerprint(b);
  }

  static originOf(url) {
    try {
      const parsed = new URL(String(url));
      if (parsed.protocol !== 'https:') return null;
      return `https://${parsed.hostname}:${parsed.port || 443}`;
    } catch (_) {
      return null;
    }
  }

  static _createAgent(origin, pin) {
    return new https.Agent({
      keepAlive: true,
      keepAliveMsecs: PinnedTls.KEEP_ALIVE_MS,
      ca: pin.certPem,
      checkServerIdentity: (host, cert) => {
        if (cert && PinnedTls.sameFingerprint(cert.fingerprint256, pin.fingerprint256)) return undefined;
        return new Error(`Peer TLS certificate does not match the pinned fingerprint for ${origin}. Re-pair with the host if it regenerated its certificate.`);
      },
    });
  }

  static _destroyAgent(origin) {
    const agent = PinnedTls._agents.get(origin);
    if (agent) {
      try { agent.destroy(); } catch (_) {}
    }
    PinnedTls._agents.delete(origin);
  }

  static _normalizeFingerprint(fingerprint) {
    return String(fingerprint || '').replace(/[:\s]/g, '').toLowerCase();
  }
}

module.exports = PinnedTls;
