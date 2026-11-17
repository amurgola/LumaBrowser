const ConversationJobs = require('../../core/llm-server/chat/jobs/ConversationJobs');
const TrainingJob = require('./TrainingJob');
const TrainingOutcomeText = require('./TrainingOutcomeText');

class TrainingAnnouncer {
  static KIND = 'lora-training';
  static MIN_INTERVAL_MS = 2000;

  constructor({ cancel, logPathOf = () => null, conversationJobs = ConversationJobs.shared, now = () => Date.now() }) {
    this._cancel = cancel;
    this._logPathOf = logPathOf;
    this._conversationJobs = conversationJobs;
    this._now = now;
    this._lastSent = 0;
  }

  started(job) {
    const tracked = this._conversationJobs.start({
      id: job.id,
      conversationId: job.conversationId,
      kind: TrainingAnnouncer.KIND,
      title: `Training LoRA "${job.name}"`,
      cancel: () => this._cancel(job.id),
    });
    if (tracked) this._send(job);
  }

  progressed(job, { force = false } = {}) {
    if (!force && this._now() - this._lastSent < TrainingAnnouncer.MIN_INTERVAL_MS) return;
    this._send(job);
  }

  ended(job) {
    this._conversationJobs.finish(job.id, {
      state: TrainingAnnouncer.stateOf(job),
      message: TrainingOutcomeText.of(job, { logPath: job.error ? this._logPathOf(job.id) : null }),
    });
  }

  _send(job) {
    this._lastSent = this._now();
    const progress = job.progress || {};
    this._conversationJobs.update(job.id, {
      detail: TrainingAnnouncer.detailOf(job),
      step: progress.step != null ? progress.step : null,
      totalSteps: progress.totalSteps != null ? progress.totalSteps : null,
      timeLeft: progress.timeLeft || null,
    });
  }

  static detailOf(job) {
    return job.progress || !job.detail ? job.phase : `${job.phase}: ${job.detail}`;
  }

  static stateOf(job) {
    if (job.phase === TrainingJob.DONE) return ConversationJobs.DONE;
    return job.phase === TrainingJob.CANCELED ? ConversationJobs.CANCELED : ConversationJobs.FAILED;
  }
}

module.exports = TrainingAnnouncer;
