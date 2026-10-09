class GambitLive {
  constructor(modelPath, startedAt) {
    this.running = true;
    this.modelPath = modelPath;
    this.startedAt = startedAt;
    this.total = 0;
    this.done = 0;
    this.taskId = null;
    this.group = null;
    this.turn = null;
    this.results = [];
    this.skipped = [];
    this.report = null;
  }

  apply(p) {
    if (typeof p.total === 'number') this.total = p.total;
    if (typeof p.done === 'number') this.done = p.done;
    if (p.taskId) this.taskId = p.taskId;
    if (p.group) this.group = p.group;
    this.turn = p.phase === 'turn' ? { turn: p.turn, of: p.of } : null;
    if (p.phase === 'result') this.results.push({ taskId: p.taskId, group: p.group, score: p.score, passed: p.passed });
    if (p.phase === 'skip') this.skipped.push({ taskId: p.taskId, reason: p.reason });
  }
}

module.exports = GambitLive;
