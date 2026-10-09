const HumanWait = require('./HumanWait');

class ApprovalWait extends HumanWait {
  static TIMEOUT_MS = 2 * 60 * 1000;

  _defaultTimeoutMs() {
    return ApprovalWait.TIMEOUT_MS;
  }

  _normalize(decision) {
    if (decision === 'run') return 'run';
    return decision === 'once' ? 'once' : 'reject';
  }

  _supersededAnswer() {
    return 'reject';
  }

  _resultFor(decision) {
    return decision;
  }
}

module.exports = ApprovalWait;
