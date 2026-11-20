const LoopCheck = require('./LoopCheck');

class IdenticalStreakCheck extends LoopCheck {
  static PATTERN = 'identical-streak';
  static TOLERATED = 3;
  static REPEATED_ON_PURPOSE = new Set(['click_until']);

  constructor() {
    super(IdenticalStreakCheck.PATTERN);
  }

  inspectRequest(record, history) {
    if (IdenticalStreakCheck.REPEATED_ON_PURPOSE.has(record.name)) return null;
    const before = history.identicalRunBefore(record);
    if (before < IdenticalStreakCheck.TOLERATED) return null;
    return this._hold(record, { times: before + 1 });
  }
}

module.exports = IdenticalStreakCheck;
