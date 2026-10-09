const CommandProfile = require('./CommandProfile');
const ReadOnlyVerdict = require('./ReadOnlyVerdict');

class PredicateProfile extends CommandProfile {
  static READS = 'is in a version, list or inspect form';
  static REFUSES = 'only reads in its version, list and inspect forms';

  constructor(names, test, { reads = PredicateProfile.READS, refuses = PredicateProfile.REFUSES } = {}) {
    super(names);
    this.test = test;
    this.readsPhrase = reads;
    this.refusesPhrase = refuses;
    Object.freeze(this);
  }

  static never(names, refuses) {
    return new PredicateProfile(names, () => false, { refuses });
  }

  static always(names, reads) {
    return new PredicateProfile(names, () => true, { reads });
  }

  judge(name, args) {
    const words = (args || []).map((arg) => String(arg == null ? '' : arg));
    if (this.test(words)) return ReadOnlyVerdict.reads(`${name} ${this.readsPhrase}.`);
    return ReadOnlyVerdict.refuses(`${name} ${this.refusesPhrase}.`);
  }
}

module.exports = PredicateProfile;
