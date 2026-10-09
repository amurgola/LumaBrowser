const NetworkDiscovery = require('../NetworkDiscovery');

class HostAdvertiser {
  constructor({ discovery = NetworkDiscovery } = {}) {
    this._discovery = discovery;
    this._advert = null;
  }

  start({ name, port, instanceId, proto, tlsPort }) {
    this.stop();
    try {
      this._advert = this._discovery.advertise({
        name,
        port,
        txt: { id: instanceId, requiresPin: '1', api: '/api/sharing', proto: String(proto), tlsPort: String(tlsPort) },
      });
    } catch (err) {
      console.warn('[sharing] advertise failed:', err && err.message);
    }
  }

  stop() {
    if (!this._advert) return;
    try {
      this._advert.stop();
    } catch (_) {}
    this._advert = null;
  }

  isAvailable() {
    return this._discovery.isAvailable();
  }
}

module.exports = HostAdvertiser;
