class TelemetryConsent {
  static OPT_OUT_KEY = 'core.telemetry.optOut';

  constructor(db, { isDev = false } = {}) {
    this._db = db;
    this._isDev = isDev;
  }

  get allowed() {
    return !this._isDev && !this.optOut;
  }

  get optOut() {
    return !!this._db.get(TelemetryConsent.OPT_OUT_KEY, false);
  }

  setOptOut(optOut) {
    this._db.set(TelemetryConsent.OPT_OUT_KEY, !!optOut);
    return this.optOut;
  }

  status() {
    return { allowed: this.allowed, optOut: this.optOut, developerMode: this._isDev };
  }
}

module.exports = TelemetryConsent;
