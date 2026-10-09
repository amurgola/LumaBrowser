const LoopCheck = require('./LoopCheck');

class InertActionCheck extends LoopCheck {
  static PATTERN = 'inert-action';
  static TOLERATED = 2;

  constructor() {
    super(InertActionCheck.PATTERN);
  }

  inspectOutcome(record, history) {
    if (!record.inertKey) return null;
    const times = history.countRan((r) => r.inertKey === record.inertKey);
    return times > InertActionCheck.TOLERATED ? this._annotate(record, { times }) : null;
  }
}

module.exports = InertActionCheck;
