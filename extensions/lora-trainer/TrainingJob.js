class TrainingJob {
  static QUEUED = 'queued';
  static COLLECTING = 'collecting pictures';
  static CAPTIONING = 'writing captions';
  static INSTALLING = 'installing the trainer';
  static TRAINING = 'training';
  static IMPORTING = 'adding the LoRA to the library';
  static DONE = 'done';
  static FAILED = 'failed';
  static CANCELED = 'canceled';
  static INTERRUPTED = 'interrupted';

  static END_PHASES = new Set([TrainingJob.DONE, TrainingJob.FAILED, TrainingJob.CANCELED, TrainingJob.INTERRUPTED]);

  constructor({ id, request, model, recipe, conversationId = null, now = () => new Date().toISOString(), ownerPid = process.pid }) {
    this._now = now;
    this.id = id;
    this.ownerPid = ownerPid;
    this.conversationId = conversationId || null;
    this.name = request.name;
    this.trigger = request.trigger;
    this.subject = request.subject || '';
    this.modelId = model.id;
    this.modelLabel = model.label || model.id;
    this.family = model.family;
    this.recipeId = recipe.id;
    this.steps = request.steps || recipe.steps;
    this.rank = request.rank || null;
    this.applyWhenDone = !!request.applyWhenDone;
    this.phase = TrainingJob.QUEUED;
    this.detail = '';
    this.progress = null;
    this.images = null;
    this.lora = null;
    this.applied = false;
    this.warning = null;
    this.error = null;
    this.createdAt = now();
    this.finishedAt = null;
    this.cancelRequested = false;
  }

  get active() {
    return !TrainingJob.END_PHASES.has(this.phase);
  }

  enter(phase, detail = '') {
    this.phase = phase;
    this.detail = detail;
  }

  note(detail) {
    if (detail) this.detail = String(detail);
  }

  advance(progress) {
    this.progress = progress;
  }

  finish({ lora, applied }) {
    this.lora = lora;
    this.applied = !!applied;
    this._end(TrainingJob.DONE, '');
  }

  fail(message) {
    this.error = String(message || 'Training failed.');
    this._end(TrainingJob.FAILED, '');
  }

  cancel() {
    this._end(TrainingJob.CANCELED, '');
  }

  requestCancel() {
    this.cancelRequested = true;
  }

  snapshot() {
    const { _now, ...state } = this;
    return { ...state, active: this.active };
  }

  static fromSnapshot(stored) {
    const { active, ...state } = stored;
    const job = Object.assign(Object.create(TrainingJob.prototype), state, { _now: () => new Date().toISOString() });
    job.wasRunning = !TrainingJob.END_PHASES.has(job.phase);
    if (job.wasRunning) job.phase = TrainingJob.INTERRUPTED;
    return job;
  }

  _end(phase, detail) {
    this.enter(phase, detail);
    this.finishedAt = this._now();
  }
}

module.exports = TrainingJob;
