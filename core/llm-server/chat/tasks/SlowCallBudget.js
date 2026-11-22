const BackgroundTaskRules = require('./BackgroundTaskRules');

class SlowCallBudget {
  static BUDGET_MS = 8000;

  constructor({ handOn, budgetMs = SlowCallBudget.BUDGET_MS, now = () => Date.now() }) {
    this._handOn = handOn;
    this._budgetMs = budgetMs;
    this._now = now;
  }

  covers(tool, kind) {
    return BackgroundTaskRules.yields(tool, kind);
  }

  async settle({ tool, params, call, ctx }) {
    const startedAt = this._now();
    const stillGoing = await this._outlivesBudget(call.pending);
    if (!stillGoing || SlowCallBudget._stopped(ctx)) return call.pending;
    return this._handOn({ tool, params, call, ctx, startedAt, waitedMs: this._budgetMs });
  }

  _outlivesBudget(pending) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(true), this._budgetMs);
      pending.then(() => { clearTimeout(timer); resolve(false); });
    });
  }

  static _stopped(ctx) {
    return !!(ctx && typeof ctx.isAborted === 'function' && ctx.isAborted());
  }
}

module.exports = SlowCallBudget;
