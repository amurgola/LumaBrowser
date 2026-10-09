const TurnChecks = require('./TurnChecks');
const TranscriptHealth = require('./TranscriptHealth');

class Scorer {
  static PASS_EPSILON = 1e-9;
  static UNCATEGORIZED = 'uncategorized';

  static scoreTask(task, transcript) {
    const turns = Scorer.normalizeTurns(task);
    const transcripts = Array.isArray(transcript) ? transcript : [transcript || {}];
    const checks = [];
    const meta = Scorer._collectTurnChecks(turns, transcripts, checks);
    Scorer._checkAllTurnsRan(turns, transcripts, checks);
    return Scorer._buildResult(task, checks, transcripts, meta);
  }

  static normalizeTurns(task) {
    const t = task || {};
    if (Array.isArray(t.turns) && t.turns.length) {
      return t.turns.map((turn) => ({
        prompt: String((turn && turn.prompt) || ''),
        expect: (turn && turn.expect) || {},
      }));
    }
    return [{ prompt: String(t.prompt || ''), expect: t.expect || {} }];
  }

  static harvestHealth(transcripts) {
    return TranscriptHealth.harvest(transcripts);
  }

  static _collectTurnChecks(turns, transcripts, checks) {
    const meta = { iterations: 0, durationMs: 0, toolCount: 0, turns: turns.length };
    turns.forEach((turn, i) => {
      const transcript = transcripts[i] || {};
      const prefix = turns.length > 1 ? `turn ${i + 1}: ` : '';
      new TurnChecks(turn.expect || {}, transcript, Scorer._checkAdder(checks, prefix)).collect();
      Scorer._addTurnMeta(meta, transcript);
    });
    return meta;
  }

  static _checkAdder(checks, prefix) {
    return (name, passed, weight, detail) => checks.push({
      name: prefix + name,
      passed: !!passed,
      weight: weight == null ? 1 : weight,
      detail: detail || '',
    });
  }

  static _addTurnMeta(meta, transcript) {
    meta.iterations += Number(transcript.iterations || 0);
    meta.durationMs += Number(transcript.durationMs || 0);
    meta.toolCount += Array.isArray(transcript.toolCalls) ? transcript.toolCalls.length : 0;
  }

  static _checkAllTurnsRan(turns, transcripts, checks) {
    if (transcripts.length >= turns.length) return;
    checks.push({
      name: 'all turns completed',
      passed: false,
      weight: 1,
      detail: `${transcripts.length} of ${turns.length} turns ran`,
    });
  }

  static _buildResult(task, checks, transcripts, meta) {
    const score = Scorer._weightedScore(checks);
    const threshold = task.passThreshold == null ? 1 : task.passThreshold;
    return {
      taskId: task.id,
      group: task.group || task.category || Scorer.UNCATEGORIZED,
      category: task.category || task.group || Scorer.UNCATEGORIZED,
      score,
      passed: score >= threshold - Scorer.PASS_EPSILON,
      checks,
      health: TranscriptHealth.harvest(transcripts),
      meta,
    };
  }

  static _weightedScore(checks) {
    const total = checks.reduce((sum, c) => sum + c.weight, 0);
    const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
    return total > 0 ? earned / total : 1;
  }
}

module.exports = Scorer;
