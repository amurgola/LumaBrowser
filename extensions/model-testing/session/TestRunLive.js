class TestRunLive {
  constructor({ modelPath, suiteIds, startedAt }) {
    this.running = true;
    this.modelPath = modelPath;
    this.suiteIds = suiteIds;
    this.startedAt = startedAt;
    this.server = null;
    this.outcomes = [];
    this.beginSuite(null);
  }

  noteServer(state) {
    this.server = state;
  }

  beginSuite(suiteId) {
    this.suiteId = suiteId;
    this.total = 0;
    this.done = 0;
    this.taskId = null;
    this.group = null;
    this.turn = null;
    this.capabilities = null;
  }

  apply(progress) {
    if (typeof progress.total === 'number') this.total = progress.total;
    if (typeof progress.done === 'number') this.done = progress.done;
    if (progress.taskId) this.taskId = progress.taskId;
    if (progress.group) this.group = progress.group;
    if (progress.capabilities) this.capabilities = progress.capabilities;
    this.turn = progress.phase === 'turn' ? { turn: progress.turn, of: progress.of } : null;
    const outcome = TestRunLive._outcome(progress);
    if (outcome) this.outcomes.push({ suiteId: this.suiteId, taskId: progress.taskId, group: progress.group, ...outcome });
  }

  static _outcome(progress) {
    if (progress.phase === 'result') return { score: progress.score, passed: progress.passed };
    if (progress.phase === 'skip') return { skipped: progress.reason };
    return null;
  }
}

module.exports = TestRunLive;
