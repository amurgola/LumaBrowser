const LoopCheck = require('./LoopCheck');

class IdenticalStreakCheck extends LoopCheck {
  static PATTERN = 'identical-streak';
  static TOLERATED = 3;

  constructor() {
    super(IdenticalStreakCheck.PATTERN);
  }

  inspectRequest(record, history) {
    const before = history.identicalRunBefore(record);
    if (before < IdenticalStreakCheck.TOLERATED) return null;
    return this._hold(record, { times: before + 1 });
  }
}

module.exports = IdenticalStreakCheck;
