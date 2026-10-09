const LanInterfaces = require('./LanInterfaces');

class MdnsInstancePool {
  static FALLBACK_KEY = null;

  constructor({ loadBonjour = MdnsInstancePool._requireBonjour } = {}) {
    this._loadBonjour = loadBonjour;
    this._Bonjour = null;
    this._loadFailed = false;
    this._instances = new Map();
  }

  isAvailable() {
    return !!this._bonjourConstructor();
  }

  currentInstances() {
    if (!this.isAvailable()) return [];
    return this._wantedKeys()
      .map((key) => this._instanceFor(key))
      .filter(Boolean);
  }

  destroy() {
    for (const instance of this._instances.values()) {
      try { instance.destroy(); } catch (_) {}
    }
    this._instances.clear();
  }

  static _requireBonjour() {
    const mod = require('bonjour-service');
    return mod.Bonjour || mod.default || mod;
  }

  _bonjourConstructor() {
    if (this._Bonjour || this._loadFailed) return this._Bonjour;
    try {
      this._Bonjour = this._loadBonjour();
    } catch (err) {
      this._loadFailed = true;
      console.warn('[sharing] mDNS discovery unavailable (bonjour-service not installed):', err && err.message);
    }
    return this._Bonjour;
  }

  _wantedKeys() {
    const addresses = LanInterfaces.ipv4Addresses();
    return addresses.length ? addresses : [MdnsInstancePool.FALLBACK_KEY];
  }

  _instanceFor(key) {
    if (!this._instances.has(key)) {
      const instance = this._createInstance(key);
      if (instance) this._instances.set(key, instance);
    }
    return this._instances.get(key) || null;
  }

  _createInstance(address) {
    const Bonjour = this._bonjourConstructor();
    const onError = (err) => console.warn('[sharing] mDNS error:', err && err.message);
    try {
      const options = address === MdnsInstancePool.FALLBACK_KEY ? {} : { interface: address, bind: '0.0.0.0' };
      const instance = new Bonjour(options, onError);
      MdnsInstancePool._guardSocketErrors(instance, onError);
      return instance;
    } catch (err) {
      console.warn(`[sharing] mDNS instance for ${address || 'default'} failed:`, err && err.message);
      return null;
    }
  }

  static _guardSocketErrors(instance, onError) {
    try { instance.server.mdns.on('error', onError); } catch (_) {}
  }
}

module.exports = MdnsInstancePool;
