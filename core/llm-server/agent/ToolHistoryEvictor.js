const fs = require('fs');
const AgentLoopText = require('./AgentLoopText');

class ToolHistoryEvictor {
  static KEEP_RECENT = 4;
  static LOG_ENV = 'LUMA_EVICT_LOG';

  static evict(messages, ledger, budget, onEvicted = null, hardBudget = Infinity) {
    const pass = new ToolHistoryEvictor(messages, ledger, budget, onEvicted, hardBudget);
    pass._softPass();
    pass._hardPass();
  }

  constructor(messages, ledger, budget, onEvicted, hardBudget) {
    this._messages = messages;
    this._ledger = ledger;
    this._budget = budget;
    this._onEvicted = onEvicted;
    this._hardBudget = hardBudget;
    this._total = ledger.reduce((n, entry) => n + entry.chars, 0);
    this._resultsSoFar = messages.filter((m) => m && m.role === 'user').length - 1;
  }

  _softPass() {
    while (this._total > this._budget && this._ledger.length > ToolHistoryEvictor.KEEP_RECENT) {
      const victim = this._pickVictim(this._ledger.length - ToolHistoryEvictor.KEEP_RECENT);
      if (victim < 0) break;
      this._drop('soft', victim);
    }
  }

  _hardPass() {
    while (this._total > this._hardBudget && this._ledger.length > 1) {
      const victim = this._pickVictim(this._ledger.length - 1);
      if (victim < 0) break;
      this._drop('hard', victim);
    }
  }

  _pickVictim(evictable) {
    let best = -1;
    let bestScore = 0;
    for (let k = 0; k < this._ledger.length; k++) {
      if (k >= evictable && !this._isOversizedAndOld(k)) continue;
      const score = this._ledger[k].chars * (this._ledger.length - k);
      if (score > bestScore) { bestScore = score; best = k; }
    }
    return best;
  }

  _isOversizedAndOld(k) {
    return this._ledger[k].chars > this._budget / 2 && k < this._ledger.length - 1;
  }

  _drop(phase, k) {
    const entry = this._ledger[k];
    this._log(phase, entry);
    this._messages[entry.index].content = AgentLoopText.evicted(entry.tool, entry.chars);
    this._total -= entry.chars;
    this._notify(entry);
    this._ledger.splice(k, 1);
  }

  _notify(entry) {
    if (!this._onEvicted) return;
    try { this._onEvicted({ tool: entry.tool, params: entry.params }); } catch (_) {}
  }

  _log(phase, entry) {
    const target = process.env[ToolHistoryEvictor.LOG_ENV];
    if (!target) return;
    try {
      fs.appendFileSync(target, JSON.stringify({
        phase,
        afterResult: this._resultsSoFar,
        tool: entry.tool,
        params: entry.params,
        chars: entry.chars,
        total: this._total,
        budget: this._budget,
        hardBudget: Number.isFinite(this._hardBudget) ? this._hardBudget : null,
        ledger: this._ledger.map((x) => [x.tool, x.chars]),
      }) + '\n');
    } catch (_) {}
  }
}

module.exports = ToolHistoryEvictor;
