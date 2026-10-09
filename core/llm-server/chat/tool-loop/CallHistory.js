const CallRecord = require('./CallRecord');

class CallHistory {
  constructor() {
    this._records = [];
  }

  get size() {
    return this._records.length;
  }

  open(name, params) {
    const record = new CallRecord(this._records.length + 1, name, params);
    this._records.push(record);
    return record;
  }

  identicalRunBefore(record) {
    let count = 0;
    for (let i = record.step - 2; i >= 0 && this._records[i].signature.matches(record.signature); i -= 1) count += 1;
    return count;
  }

  lastSucceededBefore(record, test) {
    for (let i = record.step - 2; i >= 0; i -= 1) {
      const earlier = this._records[i];
      if (earlier.ran && earlier.succeeded && test(earlier)) return earlier;
    }
    return null;
  }

  countRan(test) {
    return this._records.filter((r) => r.ran && test(r)).length;
  }

  latestRan(test, count) {
    const out = [];
    for (let i = this._records.length - 1; i >= 0 && out.length < count; i -= 1) {
      if (this._records[i].ran && test(this._records[i])) out.push(this._records[i]);
    }
    return out;
  }
}

module.exports = CallHistory;
