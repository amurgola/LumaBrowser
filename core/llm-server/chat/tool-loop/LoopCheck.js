const LoopFinding = require('./LoopFinding');

class LoopCheck {
  constructor(pattern) {
    this.pattern = pattern;
  }

  inspectRequest(_record, _history) {
    return null;
  }

  inspectOutcome(_record, _history) {
    return null;
  }

  _hold(record, facts) {
    return new LoopFinding({ pattern: this.pattern, record, held: true, facts });
  }

  _annotate(record, facts) {
    return new LoopFinding({ pattern: this.pattern, record, held: false, facts });
  }
}

module.exports = LoopCheck;
