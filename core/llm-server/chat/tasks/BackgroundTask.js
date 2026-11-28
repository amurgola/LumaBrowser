class BackgroundTask {
  static QUEUED = 'queued';
  static RUNNING = 'running';
  static DONE = 'done';
  static FAILED = 'failed';
  static CANCELED = 'canceled';
  static END_STATES = [BackgroundTask.DONE, BackgroundTask.FAILED, BackgroundTask.CANCELED];

  constructor({ id, conversationId, batchId, tool, title, now, quiet = false }) {
    this.id = String(id);
    this.conversationId = String(conversationId);
    this.batchId = String(batchId || id);
    this.tool = String(tool);
    this.title = String(title);
    this.state = BackgroundTask.QUEUED;
    this.createdAt = now;
    this.startedAt = null;
    this.endedAt = null;
    this.result = '';
    this.artifacts = [];
    this.stopRequestedBy = null;
    this.delivered = !!quiet;
    this.artifactsShown = false;
  }

  get ended() {
    return BackgroundTask.END_STATES.includes(this.state);
  }

  begin(now) {
    this.state = BackgroundTask.RUNNING;
    this.startedAt = now;
  }

  end(state, result, now) {
    this.state = BackgroundTask.END_STATES.includes(state) ? state : BackgroundTask.FAILED;
    this.result = String(result || '');
    this.endedAt = now;
  }

  durationMs(now) {
    if (this.startedAt == null) return 0;
    return Math.max(0, (this.endedAt == null ? now : this.endedAt) - this.startedAt);
  }

  view(now) {
    return {
      id: this.id,
      conversationId: this.conversationId,
      batchId: this.batchId,
      tool: this.tool,
      title: this.title,
      state: this.state,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationMs: this.durationMs(now),
      result: this.result,
      artifacts: this.artifacts.map(BackgroundTask._artifactRow),
      stoppedBy: this.state === BackgroundTask.CANCELED ? this.stopRequestedBy : null,
      delivered: this.delivered,
    };
  }

  static _artifactRow(artifact) {
    return { id: artifact.id, title: artifact.title, type: artifact.type, language: artifact.language };
  }
}

module.exports = BackgroundTask;
