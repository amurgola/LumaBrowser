const LoopCheck = require('./LoopCheck');

class StaleSearchCheck extends LoopCheck {
  static PATTERN = 'stale-search';
  static NOVELTY_FLOOR = 0.2;
  static STREAK = 2;

  constructor() {
    super(StaleSearchCheck.PATTERN);
  }

  inspectOutcome(record, history) {
    if (!record.isSearch || record.novelty === null) return null;
    const recent = history.latestRan((r) => r.isSearch && r.novelty !== null, StaleSearchCheck.STREAK);
    if (recent.length < StaleSearchCheck.STREAK) return null;
    if (!recent.every((r) => r.novelty < StaleSearchCheck.NOVELTY_FLOOR)) return null;
    return this._annotate(record, { searches: recent.length });
  }
}

module.exports = StaleSearchCheck;
