const LanInterfaces = require('./LanInterfaces');

class MdnsBrowser {
  static REQUERY_INTERVAL_MS = 8000;

  constructor(pool, { serviceType, onUp, onDown } = {}) {
    this._pool = pool;
    this._serviceType = serviceType;
    this._onUp = onUp;
    this._onDown = onDown;
    this._browsers = [];
    this._lastKey = null;
    this._timer = null;
  }

  start() {
    if (!this._pool.isAvailable()) return this;
    this._startAll();
    this._lastKey = LanInterfaces.addressKey();
    this._scheduleRequery();
    return this;
  }

  stop() {
    clearInterval(this._timer);
    this._timer = null;
    this._stopAll();
  }

  list() {
    const seen = new Set();
    const peers = [];
    for (const service of this._allServices()) {
      const key = service.fqdn || service.name;
      if (seen.has(key)) continue;
      seen.add(key);
      peers.push(MdnsBrowser.normalize(service));
    }
    return peers;
  }

  static normalize(service) {
    return {
      name: service.name,
      host: service.host,
      addresses: Array.isArray(service.addresses) ? service.addresses : [],
      port: service.port,
      txt: service.txt || {},
      fqdn: service.fqdn,
    };
  }

  _startAll() {
    for (const bonjour of this._pool.currentInstances()) this._browseOn(bonjour);
  }

  _browseOn(bonjour) {
    try {
      const browser = bonjour.find({ type: this._serviceType });
      this._forward(browser, 'up', this._onUp);
      this._forward(browser, 'down', this._onDown);
      this._browsers.push(browser);
    } catch (err) {
      console.warn('[sharing] mDNS browse failed:', err && err.message);
    }
  }

  _forward(browser, event, listener) {
    if (!listener) return;
    browser.on(event, (service) => {
      try { listener(MdnsBrowser.normalize(service)); } catch (_) {}
    });
  }

  _stopAll() {
    for (const browser of this._browsers) {
      try { browser.stop(); } catch (_) {}
    }
    this._browsers = [];
  }

  _scheduleRequery() {
    this._timer = setInterval(() => this._requery(), MdnsBrowser.REQUERY_INTERVAL_MS);
    if (this._timer.unref) this._timer.unref();
  }

  _requery() {
    const key = LanInterfaces.addressKey();
    if (key !== this._lastKey) return this._restart(key);
    for (const browser of this._browsers) {
      try { browser.update(); } catch (_) {}
    }
  }

  _restart(key) {
    this._lastKey = key;
    this._stopAll();
    this._startAll();
  }

  _allServices() {
    const services = [];
    for (const browser of this._browsers) {
      try { services.push(...(browser.services || [])); } catch (_) {}
    }
    return services;
  }
}

module.exports = MdnsBrowser;
