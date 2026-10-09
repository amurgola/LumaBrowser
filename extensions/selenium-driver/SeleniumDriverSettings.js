class SeleniumDriverSettings {
  static DEFAULT_PORT = 9515;

  static DEFAULT_HOST = '127.0.0.1';

  static KEYS = {
    enabled: 'selenium.enabled',
    port: 'selenium.port',
    host: 'selenium.host',
    prefix: 'selenium.prefix',
    fbEnabled: 'selenium.fallback.enabled',
    fbFind: 'selenium.fallback.onFindFail',
    fbClick: 'selenium.fallback.onClickIntercepted',
    fbSlot: 'selenium.fallback.slot',
  };

  constructor(rawDb) {
    this._db = rawDb;
  }

  read() {
    const K = SeleniumDriverSettings.KEYS;
    return {
      enabled: this._db.get(K.enabled, false),
      port: this._db.get(K.port, SeleniumDriverSettings.DEFAULT_PORT),
      host: this._db.get(K.host, SeleniumDriverSettings.DEFAULT_HOST),
      prefix: this._db.get(K.prefix, ''),
      fallback: {
        defaultEnabled: this._db.get(K.fbEnabled, false),
        onFindFail: this._db.get(K.fbFind, true),
        onClickIntercepted: this._db.get(K.fbClick, true),
        slot: this._db.get(K.fbSlot, null),
      },
    };
  }

  write(patch) {
    const K = SeleniumDriverSettings.KEYS;
    if (patch.enabled !== undefined) this._db.set(K.enabled, !!patch.enabled);
    if (patch.port !== undefined) this._db.set(K.port, Number(patch.port) || SeleniumDriverSettings.DEFAULT_PORT);
    if (patch.host !== undefined) this._db.set(K.host, String(patch.host));
    if (patch.prefix !== undefined) this._db.set(K.prefix, String(patch.prefix || ''));
    if (patch.fallback) this._writeFallback(patch.fallback);
  }

  _writeFallback(fallback) {
    const K = SeleniumDriverSettings.KEYS;
    if (fallback.defaultEnabled !== undefined) this._db.set(K.fbEnabled, !!fallback.defaultEnabled);
    if (fallback.onFindFail !== undefined) this._db.set(K.fbFind, !!fallback.onFindFail);
    if (fallback.onClickIntercepted !== undefined) this._db.set(K.fbClick, !!fallback.onClickIntercepted);
    if (fallback.slot !== undefined) this._db.set(K.fbSlot, fallback.slot || null);
  }
}

module.exports = SeleniumDriverSettings;
