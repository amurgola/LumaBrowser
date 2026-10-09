const JsonPath = require('./JsonPath');
const RangeTracker = require('./stats/RangeTracker');
const DistinctCounter = require('./stats/DistinctCounter');
const NumberStats = require('./stats/NumberStats');
const StringStats = require('./stats/StringStats');
const BooleanStats = require('./stats/BooleanStats');

class ValueProfile {
  static MAX_FIELDS = 100;

  constructor(path) {
    this.path = path;
    this.seen = 0;
    this.firstValue = undefined;
    this.kinds = new Map();
    this.stats = { number: new NumberStats(), string: new StringStats(), boolean: new BooleanStats() };
    this.arrayLengths = new RangeTracker();
    this.fields = new Map();
    this.element = null;
    this._unprofiledKeys = new DistinctCounter(Number.MAX_SAFE_INTEGER);
  }

  record(value, kind) {
    if (this.seen === 0) this.firstValue = value;
    this.seen++;
    this.kinds.set(kind, this.countOf(kind) + 1);
    if (this.stats[kind]) this.stats[kind].observe(value);
    if (kind === 'array') this.arrayLengths.observe(value.length);
  }

  countOf(kind) {
    return this.kinds.get(kind) || 0;
  }

  field(key) {
    if (this.fields.has(key)) return this.fields.get(key);
    if (this.fields.size >= ValueProfile.MAX_FIELDS) {
      this._unprofiledKeys.add(key);
      return null;
    }
    const profile = new ValueProfile(JsonPath.child(this.path, key));
    this.fields.set(key, profile);
    return profile;
  }

  elementProfile() {
    if (!this.element) this.element = new ValueProfile(JsonPath.everyElement(this.path));
    return this.element;
  }

  get unprofiledFieldCount() {
    return this._unprofiledKeys.count;
  }

  get fieldCount() {
    return this.fields.size + this.unprofiledFieldCount;
  }
}

module.exports = ValueProfile;
