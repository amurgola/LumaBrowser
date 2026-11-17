class ConversationJobs {
  static RUNNING = 'running';
  static DONE = 'done';
  static FAILED = 'failed';
  static CANCELED = 'canceled';
  static END_STATES = [ConversationJobs.DONE, ConversationJobs.FAILED, ConversationJobs.CANCELED];
  static CHANGED = 'changed';
  static FINISHED = 'finished';
  static TEXT_MAX = 200;

  static shared = new ConversationJobs();

  constructor({ now = () => Date.now() } = {}) {
    this._now = now;
    this._jobs = new Map();
    this._listeners = new Set();
  }

  start({ id, conversationId, kind, title, cancel = null } = {}) {
    if (!id || !conversationId) return false;
    this._jobs.set(String(id), {
      id: String(id),
      conversationId: String(conversationId),
      kind: String(kind || 'job'),
      title: ConversationJobs._text(title) || 'Background job',
      state: ConversationJobs.RUNNING,
      detail: '',
      step: null,
      totalSteps: null,
      timeLeft: null,
      startedAt: this._now(),
      cancel: typeof cancel === 'function' ? cancel : null,
    });
    this._emit(ConversationJobs.CHANGED, id);
    return true;
  }

  update(id, progress = {}) {
    const job = this._jobs.get(String(id));
    if (!job) return;
    if (progress.detail !== undefined) job.detail = ConversationJobs._text(progress.detail);
    for (const field of ['step', 'totalSteps']) {
      if (progress[field] !== undefined) job[field] = ConversationJobs._count(progress[field]);
    }
    if (progress.timeLeft !== undefined) job.timeLeft = progress.timeLeft ? String(progress.timeLeft) : null;
    this._emit(ConversationJobs.CHANGED, id);
  }

  finish(id, { state = ConversationJobs.DONE, message = '' } = {}) {
    const job = this._jobs.get(String(id));
    if (!job) return;
    this._jobs.delete(job.id);
    job.state = ConversationJobs.END_STATES.includes(state) ? state : ConversationJobs.DONE;
    this._notify(ConversationJobs.FINISHED, { conversationId: job.conversationId, job: ConversationJobs.view(job), message: String(message || '') });
  }

  cancel(id) {
    const job = this._jobs.get(String(id));
    if (!job || !job.cancel) return false;
    try { job.cancel(); } catch (_) {}
    return true;
  }

  activeFor(conversationId) {
    const wanted = String(conversationId || '');
    return [...this._jobs.values()].filter((job) => job.conversationId === wanted).map((job) => ConversationJobs.view(job));
  }

  onEvent(listener) {
    if (typeof listener !== 'function') return () => {};
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  static view(job) {
    const { cancel, ...rest } = job;
    return { ...rest, cancellable: !!cancel };
  }

  _emit(type, id) {
    const job = this._jobs.get(String(id));
    if (job) this._notify(type, { conversationId: job.conversationId, job: ConversationJobs.view(job) });
  }

  _notify(type, payload) {
    for (const listener of this._listeners) {
      try { listener(type, payload); } catch (_) {}
    }
  }

  static _count(value) {
    if (value == null || value === '') return null;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }

  static _text(value) {
    return String(value == null ? '' : value).trim().slice(0, ConversationJobs.TEXT_MAX);
  }
}

module.exports = ConversationJobs;
