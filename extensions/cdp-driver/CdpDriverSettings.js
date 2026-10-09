class CdpDriverSettings {
  static DEFAULT_PORT = 9222;

  static DEFAULT_HOST = '127.0.0.1';

  static KEYS = {
    enabled: 'cdp.enabled',
    port: 'cdp.port',
    host: 'cdp.host',
    fbEnabled: 'cdp.fallback.enabled',
    fbFind: 'cdp.fallback.onFindFail',
    fbClick: 'cdp.fallback.onClickIntercepted',
    fbSlot: 'cdp.fallback.slot',
  };

  constructor(rawDb) {
    this._db = rawDb;
  }

  read() {
    const K = CdpDriverSettings.KEYS;
    return {
      enabled: this._db.get(K.enabled, false),
      port: this._db.get(K.port, CdpDriverSettings.DEFAULT_PORT),
      host: this._db.get(K.host, CdpDriverSettings.DEFAULT_HOST),
      fallback: {
        defaultEnabled: this._db.get(K.fbEnabled, false),
        onFindFail: this._db.get(K.fbFind, true),
        onClickIntercepted: this._db.get(K.fbClick, true),
        slot: this._db.get(K.fbSlot, null),
      },
    };
  }

  write(patch) {
    const K = CdpDriverSettings.KEYS;
    if (patch.enabled !== undefined) this._db.set(K.enabled, !!patch.enabled);
    if (patch.port !== undefined) this._db.set(K.port, Number(patch.port) || CdpDriverSettings.DEFAULT_PORT);
    if (patch.host !== undefined) this._db.set(K.host, String(patch.host));
    if (patch.fallback) this._writeFallback(patch.fallback);
  }

  _writeFallback(fallback) {
    const K = CdpDriverSettings.KEYS;
    if (fallback.defaultEnabled !== undefined) this._db.set(K.fbEnabled, !!fallback.defaultEnabled);
    if (fallback.onFindFail !== undefined) this._db.set(K.fbFind, !!fallback.onFindFail);
    if (fallback.onClickIntercepted !== undefined) this._db.set(K.fbClick, !!fallback.onClickIntercepted);
    if (fallback.slot !== undefined) this._db.set(K.fbSlot, fallback.slot || null);
  }
}

module.exports = CdpDriverSettings;
