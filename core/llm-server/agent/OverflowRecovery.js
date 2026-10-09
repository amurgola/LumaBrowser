const ContextOverflow = require('./ContextOverflow');
const MidTurnCompactor = require('./MidTurnCompactor');
const ToolHistoryBudget = require('./ToolHistoryBudget');

class OverflowRecovery {
  static MAX_PER_RUN = MidTurnCompactor.MAX_PER_RUN;

  constructor(options) {
    this._history = options.history;
    this._compactor = options.compactor;
    this._sender = options.sender;
    this._steps = options.steps;
    this._count = 0;
  }

  get count() {
    return this._count;
  }

  async recover(iteration, result) {
    if (!this._canRecover(result)) return result;
    this._calibrateFrom(result, this._history.chars());
    const requestBefore = this._history.chars();
    const trimmed = this._trimToolHistory();
    const compacted = await this._compactor.compact(iteration, 'overflow', true);
    const freedChars = requestBefore - this._history.chars();
    if (freedChars <= 0) return result;
    this._count += 1;
    this._steps.push({ iteration, overflowRecovery: { freedChars, evictedChars: trimmed.evicted, compactedChars: compacted, target: trimmed.target } });
    const retried = await this._sender.send(this._history.messages);
    return this._recoverAgain(iteration, retried, trimmed.target);
  }

  _canRecover(result) {
    return !result.success && ContextOverflow.isExceeded(result.error) && this._count <= OverflowRecovery.MAX_PER_RUN;
  }

  _calibrateFrom(result, chars) {
    const counts = ContextOverflow.parseCounts(result.error);
    if (counts) this._compactor.calibrate(chars, counts.request);
  }

  _trimToolHistory() {
    const before = this._history.toolHistoryChars();
    const hard = this._history.hardToolBudget();
    const ceiling = Number.isFinite(hard) ? hard : ToolHistoryBudget.DEFAULT_CHARS;
    const target = Math.floor(Math.max(ToolHistoryBudget.MIN_CHARS, ceiling / 2));
    this._history.evictToolHistory(target, target);
    let after = this._history.toolHistoryChars();
    if (after > target) after -= this._history.shrinkNewestToolResult(target);
    return { target, evicted: before - after };
  }

  async _recoverAgain(iteration, result, target) {
    if (!this._canRecover(result)) return result;
    const again = this._history.chars();
    this._calibrateFrom(result, again);
    const freed = await this._compactor.compact(iteration, 'overflow', true);
    if (!(freed > 0 && this._history.chars() < again)) return result;
    this._count += 1;
    this._steps.push({ iteration, overflowRecovery: { freedChars: again - this._history.chars(), target } });
    return this._sender.send(this._history.messages);
  }
}

module.exports = OverflowRecovery;
