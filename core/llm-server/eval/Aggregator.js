class Aggregator {
  static WORST_FRACTION = 0.1;
  static DELTA_EPSILON = 1e-9;
  static REGRESSIONS_SHOWN = 5;

  static mean(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  static aggregate(results) {
    const n = results.length;
    const scores = results.map((r) => r.score).sort((a, b) => a - b);
    const worstCount = Aggregator._worstCount(n);
    return {
      n,
      mean: Aggregator.mean(scores),
      passRate: n ? results.filter((r) => r.passed).length / n : 0,
      worstDecile: n ? Aggregator.mean(scores.slice(0, worstCount)) : 0,
      worstDecileN: n ? worstCount : 0,
      byCategory: Aggregator._byCategory(results),
    };
  }

  static diffVariants(baseline, candidate) {
    const baselineStats = Aggregator.aggregate(baseline.results);
    const candidateStats = Aggregator.aggregate(candidate.results);
    const { regressions, improvements } = Aggregator._compareTasks(baseline.results, candidate.results);
    return {
      baseline: { variantId: baseline.variantId, ...baselineStats },
      candidate: { variantId: candidate.variantId, ...candidateStats },
      delta: {
        mean: candidateStats.mean - baselineStats.mean,
        worstDecile: candidateStats.worstDecile - baselineStats.worstDecile,
        passRate: candidateStats.passRate - baselineStats.passRate,
      },
      regressions,
      improvements,
    };
  }

  static formatDiff(diff) {
    const pct = Aggregator._percent;
    const { baseline, candidate, delta } = diff;
    return [
      `baseline ${baseline.variantId}: mean ${pct(baseline.mean)} · worst-decile ${pct(baseline.worstDecile)} · pass ${pct(baseline.passRate)} (n=${baseline.n})`,
      `candidate ${candidate.variantId}: mean ${pct(candidate.mean)} · worst-decile ${pct(candidate.worstDecile)} · pass ${pct(candidate.passRate)}`,
      `Δ mean ${pct(delta.mean)} · Δ worst-decile ${pct(delta.worstDecile)} · Δ pass ${pct(delta.passRate)}`,
      Aggregator._regressionLine(diff.regressions),
    ].join('\n');
  }

  static _worstCount(n) {
    return Math.max(1, Math.floor(n * Aggregator.WORST_FRACTION));
  }

  static _byCategory(results) {
    const buckets = {};
    for (const r of results) (buckets[r.category] || (buckets[r.category] = [])).push(r.score);
    const out = {};
    for (const [category, scores] of Object.entries(buckets)) {
      out[category] = { n: scores.length, mean: Aggregator.mean(scores) };
    }
    return out;
  }

  static _compareTasks(baselineResults, candidateResults) {
    const baselineById = Aggregator._indexByTask(baselineResults);
    const candidateById = Aggregator._indexByTask(candidateResults);
    const regressions = [];
    const improvements = [];
    for (const id of Object.keys(candidateById)) {
      if (!(id in baselineById)) continue;
      const row = Aggregator._deltaRow(id, baselineById[id].score, candidateById[id].score);
      if (row.delta < -Aggregator.DELTA_EPSILON) regressions.push(row);
      else if (row.delta > Aggregator.DELTA_EPSILON) improvements.push(row);
    }
    regressions.sort((a, b) => a.delta - b.delta);
    improvements.sort((a, b) => b.delta - a.delta);
    return { regressions, improvements };
  }

  static _indexByTask(results) {
    return Object.fromEntries(results.map((r) => [r.taskId, r]));
  }

  static _deltaRow(taskId, baseline, candidate) {
    return { taskId, delta: candidate - baseline, baseline, candidate };
  }

  static _regressionLine(regressions) {
    if (!regressions.length) return 'regressions: none';
    const shown = regressions.slice(0, Aggregator.REGRESSIONS_SHOWN)
      .map((r) => `${r.taskId} ${Aggregator._percent(r.delta)}`);
    return `regressions (${regressions.length}): ${shown.join(', ')}`;
  }

  static _percent(value) {
    return (value >= 0 ? '+' : '') + (value * 100).toFixed(1) + '%';
  }
}

module.exports = Aggregator;
