class GambitHealth {
  static COUNTERS = [
    'repetitionAborted', 'offFormatCalls', 'emptyReplies', 'timedOut', 'errors', 'turns',
    'lengthCutCompletions', 'missingArgCalls', 'overflowRecoveries',
  ];

  static SOFT_WEIGHT = 0.5;

  static totals(results) {
    const totals = Object.fromEntries(GambitHealth.COUNTERS.map((key) => [key, 0]));
    const offFormatShapes = {};
    for (const result of results) {
      const health = (result && result.health) || {};
      for (const key of GambitHealth.COUNTERS) totals[key] += Number(health[key] || 0);
      GambitHealth._addShapes(offFormatShapes, health.offFormatShapes);
    }
    totals.offFormatShapes = offFormatShapes;
    return totals;
  }

  static score(totals) {
    const turns = Number(totals.turns || 0);
    if (!turns) return { score: 1, turns: 0, incidents: 0, detail: 'no turns ran' };
    const hard = GambitHealth._hardIncidents(totals);
    const softCount = Number(totals.offFormatCalls || 0) + Number(totals.missingArgCalls || 0);
    const damaged = Math.min(turns, hard + softCount * GambitHealth.SOFT_WEIGHT);
    const bits = GambitHealth._describe(totals);
    return {
      score: 1 - (damaged / turns),
      turns,
      incidents: hard + softCount,
      detail: bits.length ? bits.join(', ') : 'clean',
    };
  }

  static _addShapes(into, shapes) {
    for (const [shape, count] of Object.entries(shapes || {})) into[shape] = (into[shape] || 0) + Number(count || 0);
  }

  static _hardIncidents(totals) {
    return Number(totals.repetitionAborted || 0) + Number(totals.timedOut || 0)
      + Number(totals.errors || 0) + Number(totals.emptyReplies || 0);
  }

  static _describe(totals) {
    const plural = GambitHealth._plural;
    const bits = [];
    if (totals.repetitionAborted) bits.push(plural(totals.repetitionAborted, 'repetition abort', 'repetition aborts'));
    if (totals.timedOut) bits.push(plural(totals.timedOut, 'timeout', 'timeouts'));
    if (totals.errors) bits.push(plural(totals.errors, 'error', 'errors'));
    if (totals.emptyReplies) bits.push(plural(totals.emptyReplies, 'empty reply', 'empty replies'));
    if (totals.offFormatCalls) bits.push(GambitHealth._describeOffFormat(totals));
    if (totals.missingArgCalls) {
      bits.push(`${plural(totals.missingArgCalls, 'call', 'calls')} refused for missing required arguments`);
    }
    if (totals.overflowRecoveries) {
      bits.push(`${plural(totals.overflowRecoveries, 'context overflow', 'context overflows')} recovered`);
    }
    if (totals.lengthCutCompletions) {
      bits.push(plural(totals.lengthCutCompletions, 'length-cut completion', 'length-cut completions'));
    }
    return bits;
  }

  static _describeOffFormat(totals) {
    const shapes = Object.entries(totals.offFormatShapes || {})
      .sort((a, b) => b[1] - a[1])
      .map(([shape, count]) => `${shape} ${count}`)
      .join(', ');
    const base = GambitHealth._plural(totals.offFormatCalls, 'off-format tool call', 'off-format tool calls');
    return shapes ? `${base} (${shapes})` : base;
  }

  static _plural(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`;
  }
}

module.exports = GambitHealth;
