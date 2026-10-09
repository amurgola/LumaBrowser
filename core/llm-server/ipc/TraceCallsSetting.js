const LlmTrace = require('../chat/LlmTrace');

class TraceCallsSetting {
  static NO_DATABASE = 'Settings database is not available';

  constructor(db, trace = LlmTrace) {
    this._db = db;
    this._trace = trace;
  }

  status() {
    return this._trace.status(this._db);
  }

  set(value) {
    if (!this._db || typeof this._db.set !== 'function') throw new Error(TraceCallsSetting.NO_DATABASE);
    this._db.set(this._trace.SETTING_KEY, value === true);
    return this.status();
  }

  clear() {
    this._trace.wipeAll();
    return { cleared: true };
  }
}

module.exports = TraceCallsSetting;
