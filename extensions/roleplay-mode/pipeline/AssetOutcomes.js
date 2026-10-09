const AssetLedger = require('./AssetLedger');

class AssetOutcomes {
  constructor(data) {
    this._data = data;
    this.dirty = false;
    this.lastFailKey = null;
  }

  fail(key) {
    AssetLedger.noteFail(this._data, key);
    this.dirty = true;
    this.lastFailKey = key;
  }

  ok(key) {
    if (AssetLedger.noteOk(this._data, key)) this.dirty = true;
  }
}

module.exports = AssetOutcomes;
