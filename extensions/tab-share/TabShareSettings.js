const TurnRelay = require('./TurnRelay');

class TabShareSettings {
  static KEY = 'settings';
  static DEFAULTS = Object.freeze({ rtcEnabled: true, turnEnabled: false, turnPort: TurnRelay.DEFAULT_PORT, turnHost: '' });
  static PORT_ERROR = 'Relay port must be between 1 and 65535.';

  constructor({ db = null, log } = {}) {
    this._db = db;
    this._log = log || (() => {});
    this._values = { ...TabShareSettings.DEFAULTS };
  }

  get() {
    return { ...this._values };
  }

  load() {
    const raw = this._db ? this._db.get(TabShareSettings.KEY, null) : null;
    this._values = TabShareSettings._fromStored(raw);
  }

  update(patch = {}) {
    const next = TabShareSettings._merge(this._values, patch);
    if (next.error) return { error: next.error };
    const relayChanged = next.values.turnEnabled !== this._values.turnEnabled || next.values.turnPort !== this._values.turnPort;
    this._values = next.values;
    this._save();
    return { relayChanged };
  }

  static normalizeHost(value) {
    return value.trim().replace(/^[a-z]+:\/\//i, '').replace(/[/:].*$/, '');
  }

  static _merge(current, patch) {
    const values = { ...current };
    if (typeof patch.rtcEnabled === 'boolean') values.rtcEnabled = patch.rtcEnabled;
    if (typeof patch.turnEnabled === 'boolean') values.turnEnabled = patch.turnEnabled;
    if (patch.turnPort != null) {
      const port = Number(patch.turnPort);
      if (!TabShareSettings._validPort(port)) return { error: TabShareSettings.PORT_ERROR };
      values.turnPort = port;
    }
    if (typeof patch.turnHost === 'string') values.turnHost = TabShareSettings.normalizeHost(patch.turnHost);
    return { values };
  }

  static _fromStored(raw) {
    const values = { ...TabShareSettings.DEFAULTS };
    if (!raw || typeof raw !== 'object') return values;
    if (typeof raw.rtcEnabled === 'boolean') values.rtcEnabled = raw.rtcEnabled;
    if (typeof raw.turnEnabled === 'boolean') values.turnEnabled = raw.turnEnabled;
    if (TabShareSettings._validPort(raw.turnPort)) values.turnPort = raw.turnPort;
    if (typeof raw.turnHost === 'string') values.turnHost = raw.turnHost;
    return values;
  }

  static _validPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  _save() {
    if (!this._db) return;
    try { this._db.set(TabShareSettings.KEY, { ...this._values }); } catch (err) { this._log(`settings save failed: ${err && err.message}`); }
  }
}

module.exports = TabShareSettings;
