const CommandProfile = require('./CommandProfile');
const OptionGrammar = require('./OptionGrammar');
const ReadOnlyVerdict = require('./ReadOnlyVerdict');

class UtilityProfile extends CommandProfile {
  static DEFAULT_GRAMMAR = new OptionGrammar();

  constructor({ names, summary, grammar = UtilityProfile.DEFAULT_GRAMMAR, hazards = [], maxOperands = null, requires = null, inspect = null }) {
    super(names);
    this.summary = summary;
    this.grammar = grammar;
    this.hazards = Object.freeze([...hazards]);
    this.maxOperands = maxOperands;
    this.requires = requires;
    this.inspect = inspect;
    Object.freeze(this);
  }

  static plain(names, summary) {
    return new UtilityProfile({ names, summary });
  }

  judge(name, args) {
    const scanned = this.grammar.scan(args);
    const refusal = this._hazardRefusal(scanned)
      || this._operandRefusal(scanned)
      || this._requirementRefusal(scanned)
      || this._inspectionRefusal(scanned);
    return refusal ? ReadOnlyVerdict.refuses(`${name} ${refusal}.`) : ReadOnlyVerdict.reads(`${name} ${this.summary}.`);
  }

  _hazardRefusal(scanned) {
    for (const hazard of this.hazards) {
      const option = hazard.findIn(scanned, this.grammar);
      if (option) return hazard.describe(option);
    }
    return null;
  }

  _operandRefusal(scanned) {
    if (!this.maxOperands || scanned.operands.length <= this.maxOperands.count) return null;
    return this.maxOperands.why;
  }

  _requirementRefusal(scanned) {
    if (!this.requires || this.requires.test(scanned)) return null;
    return this.requires.why;
  }

  _inspectionRefusal(scanned) {
    return this.inspect ? this.inspect(scanned) : null;
  }
}

module.exports = UtilityProfile;
