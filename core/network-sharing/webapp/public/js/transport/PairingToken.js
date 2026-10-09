export default class PairingToken {
  static TOKEN_KEY = 'luma.web.token';
  static HOST_KEY = 'luma.web.host';
  static COOKIE = 'luma_share_token';
  static COOKIE_MAX_AGE = 31536000;

  constructor({ storage, doc }) {
    this._storage = storage;
    this._doc = doc;
  }

  get() {
    return this._read(PairingToken.TOKEN_KEY) || null;
  }

  set(token) {
    this._write(PairingToken.TOKEN_KEY, token);
    this.syncCookie(token);
  }

  hostName() {
    return this._read(PairingToken.HOST_KEY) || '';
  }

  setHostName(name) {
    this._write(PairingToken.HOST_KEY, name);
  }

  syncCookie(token = this.get()) {
    const value = token
      ? `${PairingToken.COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${PairingToken.COOKIE_MAX_AGE}; SameSite=Strict`
      : `${PairingToken.COOKIE}=; path=/; max-age=0; SameSite=Strict`;
    try {
      this._doc.cookie = value;
    } catch (_) {}
  }

  _read(key) {
    try {
      return this._storage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  _write(key, value) {
    try {
      if (value) this._storage.setItem(key, value);
      else this._storage.removeItem(key);
    } catch (_) {}
  }
}
