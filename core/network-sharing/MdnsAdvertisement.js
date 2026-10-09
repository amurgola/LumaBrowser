const LanInterfaces = require('./LanInterfaces');

class MdnsAdvertisement {
  static INTERFACE_RESCAN_MS = 30000;
  static DEFAULT_NAME = 'LumaBrowser';
  static DEFAULT_PORT = 3000;
  static MAX_NAME_LENGTH = 63;

  constructor(pool, { serviceType, name, port, txt } = {}) {
    this._pool = pool;
    this._record = MdnsAdvertisement._record(serviceType, name, port, txt);
    this._services = [];
    this._lastKey = null;
    this._timer = null;
  }

  start() {
    if (!this._pool.isAvailable()) return this;
    this._publishAll();
    this._watchInterfaces();
    return this;
  }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
    this._stopAll();
  }

  static _record(serviceType, name, port, txt) {
    return {
      name: (name || MdnsAdvertisement.DEFAULT_NAME).slice(0, MdnsAdvertisement.MAX_NAME_LENGTH),
      type: serviceType,
      port: Number(port) || MdnsAdvertisement.DEFAULT_PORT,
      txt: txt || {},
      probe: false,
    };
  }

  _publishAll() {
    this._lastKey = LanInterfaces.addressKey();
    for (const bonjour of this._pool.currentInstances()) this._publishOn(bonjour);
  }

  _publishOn(bonjour) {
    try {
      this._services.push(bonjour.publish({ ...this._record }));
    } catch (err) {
      console.warn('[sharing] mDNS advertise failed:', err && err.message);
    }
  }

  _stopAll() {
    for (const service of this._services) {
      try { service.stop(); } catch (_) {}
    }
    this._services = [];
  }

  _watchInterfaces() {
    this._timer = setInterval(() => this._republishIfInterfacesChanged(), MdnsAdvertisement.INTERFACE_RESCAN_MS);
    if (this._timer.unref) this._timer.unref();
  }

  _republishIfInterfacesChanged() {
    if (LanInterfaces.addressKey() === this._lastKey) return;
    this._stopAll();
    this._publishAll();
  }
}

module.exports = MdnsAdvertisement;
