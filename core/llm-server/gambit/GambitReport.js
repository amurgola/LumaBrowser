const Aggregator = require('../eval/Aggregator');
const GambitHealth = require('./GambitHealth');

class GambitReport {
  static VERSION = 1;

  static GROUP_ORDER = [
    'instruction', 'conversation', 'web', 'answer',
    'artifacts', 'validation', 'execution', 'health',
  ];

  static GROUP_LABELS = {
    instruction: 'Instruction following',
    conversation: 'Conversation memory',
    web: 'Web navigation and tools',
    answer: 'Correct answer',
    artifacts: 'Artifacts',
    validation: 'Code validation',
    execution: 'Code execution',
    health: 'Health',
  };

  static WORST_FRACTION = 0.1;

  static build(options) {
    return new GambitReport(options).build();
  }

  static band(pct) {
    if (pct >= 0.9) return 'good';
    if (pct >= 0.7) return 'usable';
    return 'poor';
  }

  static orderGroups(keys) {
    const rank = (key) => GambitReport.GROUP_ORDER.indexOf(key);
    return keys.slice().sort((a, b) => {
      const ia = rank(a);
      const ib = rank(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  constructor({ results = [], skipped = [], meta = {} } = {}) {
    this._results = results;
    this._skipped = skipped;
    this._meta = meta;
  }

  build() {
    const healthTotals = GambitHealth.totals(this._results);
    const health = GambitHealth.score(healthTotals);
    const groups = this._taskGroups();
    if (healthTotals.turns > 0) groups.push(GambitReport._healthGroup(health, healthTotals));
    const overall = groups.length ? Aggregator.mean(groups.map((g) => g.score)) : 0;
    return {
      version: GambitReport.VERSION,
      meta: this._meta,
      overall,
      band: GambitReport.band(overall),
      groups,
      health: { ...health, totals: healthTotals },
      coverage: this._coverage(),
      worstDecile: this._worstDecile(),
      passRate: this._passRate(),
    };
  }

  _taskGroups() {
    const buckets = new Map();
    for (const result of this._results) {
      const key = result.group || result.category || 'uncategorized';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(result);
    }
    return GambitReport.orderGroups([...buckets.keys()])
      .map((key) => GambitReport._taskGroup(key, buckets.get(key)));
  }

  static _taskGroup(key, rows) {
    return {
      key,
      label: GambitReport.GROUP_LABELS[key] || key,
      n: rows.length,
      score: Aggregator.mean(rows.map((r) => r.score)),
      passed: rows.filter((r) => r.passed).length,
      failures: rows.filter((r) => !r.passed).map(GambitReport._failure),
    };
  }

  static _failure(result) {
    return {
      taskId: result.taskId,
      score: result.score,
      failedChecks: (result.checks || []).filter((c) => !c.passed && c.weight > 0)
        .map((c) => ({ name: c.name, detail: c.detail })),
    };
  }

  static _healthGroup(health, totals) {
    return {
      key: 'health',
      label: GambitReport.GROUP_LABELS.health,
      n: totals.turns,
      score: health.score,
      passed: health.incidents === 0 ? totals.turns : 0,
      derived: true,
      detail: health.detail,
      totals: { ...totals },
      failures: [],
    };
  }

  _coverage() {
    const reasons = {};
    for (const skip of this._skipped) {
      const key = skip.reason || 'unavailable';
      (reasons[key] || (reasons[key] = [])).push(skip.taskId);
    }
    const ran = this._results.length;
    return { ran, skipped: this._skipped.length, total: ran + this._skipped.length, reasons };
  }

  _worstDecile() {
    const sorted = this._results.map((r) => r.score).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const count = Math.max(1, Math.floor(sorted.length * GambitReport.WORST_FRACTION));
    return Aggregator.mean(sorted.slice(0, count));
  }

  _passRate() {
    if (!this._results.length) return 0;
    return this._results.filter((r) => r.passed).length / this._results.length;
  }
}

module.exports = GambitReport;
