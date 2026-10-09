const LoopCheck = require('./LoopCheck');

class SearchAllowanceCheck extends LoopCheck {
  static PATTERN = 'search-allowance';
  static DEFAULT_ALLOWANCE = 8;

  constructor(allowance = SearchAllowanceCheck.DEFAULT_ALLOWANCE) {
    super(SearchAllowanceCheck.PATTERN);
    this.allowance = allowance;
  }

  spent(history) {
    return history.countRan((r) => r.isSearch);
  }

  inspectRequest(record, history) {
    if (!record.isSearch || this.spent(history) < this.allowance) return null;
    return this._hold(record, { allowance: this.allowance });
  }
}

module.exports = SearchAllowanceCheck;
