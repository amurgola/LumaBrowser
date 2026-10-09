const PowerShellArgs = require('../../PowerShellArgs');

class OptionHazard {
  static WRITES = 'writes';
  static EXECUTES = 'executes';
  static SENDS = 'sends';
  static CHANGES_SYSTEM = 'changes-system';
  static UNVERIFIABLE = 'unverifiable';
  static BLOCKS = 'blocks';
  static EFFECTS = Object.freeze(['writes', 'executes', 'sends', 'changes-system', 'unverifiable', 'blocks']);

  constructor({ effect, why, short = '', long = [], words = [], params = [], when = null }) {
    if (!OptionHazard.EFFECTS.includes(effect)) throw new Error(`Unknown option hazard effect: ${effect}`);
    this.effect = effect;
    this.why = why;
    this.short = new Set(short);
    this.long = Object.freeze([...long]);
    this.words = new Set(words);
    this.params = Object.freeze([...params]);
    this.when = when;
    Object.freeze(this);
  }

  findIn(scanned, grammar) {
    return scanned.options.find((option) => this._covers(option, grammar)) || null;
  }

  describe(option) {
    return `${option.spelling} ${this.why}`;
  }

  _covers(option, grammar) {
    if (!this._spellingMatches(option, grammar)) return false;
    return this.when ? !!this.when(option.value) : true;
  }

  _spellingMatches(option, grammar) {
    if (option.form === 'short') return this.short.has(option.name);
    if (option.form === 'long') return this.long.some((full) => grammar.namesLong(option.name, full));
    if (option.form === 'word') return this.words.has(option.name);
    if (option.form === 'param') return this.params.length > 0 && PowerShellArgs.param([option.spelling], this.params) !== null;
    return false;
  }
}

module.exports = OptionHazard;
