class JobRegistry {
  static STATES = new Set(['running', 'queued', 'done', 'failed', 'canceled']);
  static ACTIVE = new Set(['running', 'queued']);
  static RECENT_MAX = 20;
  static RECENT_MS = 30 * 60 * 1000;
  static PROGRESS_INTERVAL_MS = 250;

  constructor({ now = () => Date.now() } = {}) {
    this._now = now;
    this._jobs = new Map();
    this._cancels = new Map();
    this._listeners = new Set();
    this._lastEmit = new Map();
    this._seq = 0;
    this._finishOrder = new Map();
  }

  newId(prefix) {
    this._seq += 1;
    return `${prefix}-${this._now().toString(36)}-${this._seq}`;
  }

  start(id, fields = {}, cancel = null) {
    const job = {
      id,
      kind: String(fields.kind || 'other'),
      title: String(fields.title || 'Working'),
      progress: JobRegistry.progressOf(fields.progress),
      state: JobRegistry.ACTIVE.has(fields.state) ? fields.state : 'running',
      startedAt: this._now(),
      cancellable: typeof cancel === 'function',
    };
    if (fields.detail) job.detail = String(fields.detail);
    if (fields.source) job.source = String(fields.source);
    if (Number.isFinite(fields.eta)) job.eta = Math.max(0, Math.round(fields.eta));
    this._jobs.set(id, job);
    if (typeof cancel === 'function') this._cancels.set(id, cancel);
    else this._cancels.delete(id);
    this._emit(job, true);
    return job;
  }

  update(id, patch = {}) {
    const job = this._jobs.get(id);
    if (!job || !JobRegistry.ACTIVE.has(job.state)) return null;
    let significant = false;
    if (patch.title && String(patch.title) !== job.title) { job.title = String(patch.title); significant = true; }
    if (patch.detail !== undefined) {
      const detail = patch.detail ? String(patch.detail) : undefined;
      if (detail !== job.detail) { significant = true; if (detail) job.detail = detail; else delete job.detail; }
    }
    if (JobRegistry.ACTIVE.has(patch.state) && patch.state !== job.state) { job.state = patch.state; significant = true; }
    if (patch.progress !== undefined) job.progress = JobRegistry.progressOf(patch.progress);
    if (patch.eta !== undefined) {
      if (Number.isFinite(patch.eta)) job.eta = Math.max(0, Math.round(patch.eta));
      else delete job.eta;
    }
    this._emit(job, significant);
    return job;
  }

  finish(id, state = 'done', extra = {}) {
    const job = this._jobs.get(id);
    if (!job || !JobRegistry.ACTIVE.has(job.state)) return null;
    job.state = ['done', 'failed', 'canceled'].includes(state) ? state : 'done';
    job.finishedAt = this._now();
    job.cancellable = false;
    delete job.eta;
    if (job.state === 'done' && job.progress !== null) job.progress = 1;
    if (extra.error) job.error = String(extra.error).slice(0, 500);
    if (extra.detail) job.detail = String(extra.detail);
    this._cancels.delete(id);
    this._finishOrder.set(id, ++this._seq);
    this._emit(job, true);
    this._prune();
    return job;
  }

  get(id) {
    const job = this._jobs.get(id);
    return job ? { ...job } : null;
  }

  isActive(id) {
    const job = this._jobs.get(id);
    return !!job && JobRegistry.ACTIVE.has(job.state);
  }

  list() {
    this._prune();
    const active = [];
    const recent = [];
    for (const job of this._jobs.values()) (JobRegistry.ACTIVE.has(job.state) ? active : recent).push({ ...job });
    active.sort((a, b) => a.startedAt - b.startedAt);
    recent.sort((a, b) => this._newerFirst(a, b));
    return { active, recent };
  }

  async cancel(id) {
    const job = this._jobs.get(id);
    if (!job) return { success: false, status: 404, error: 'No such job' };
    if (!JobRegistry.ACTIVE.has(job.state)) return { success: false, status: 409, error: `Job already ${job.state}` };
    const fn = this._cancels.get(id);
    if (!fn) return { success: false, status: 409, error: 'This job cannot be canceled' };
    try {
      await fn();
    } catch (err) {
      return { success: false, status: 500, error: (err && err.message) || String(err) };
    }
    return { success: true, status: 200, job: this.get(id) };
  }

  aggregate(filter = null) {
    const jobs = this.list().active.filter((j) => !filter || filter(j));
    const running = jobs.filter((j) => j.state === 'running');
    const known = running.filter((j) => j.progress !== null);
    const progress = known.length ? known.reduce((s, j) => s + j.progress, 0) / known.length : null;
    const etas = running.map((j) => j.eta).filter(Number.isFinite);
    return {
      running: running.length,
      queued: jobs.length - running.length,
      progress,
      indeterminate: running.length > 0 && progress === null,
      eta: etas.length ? Math.max(...etas) : null,
      jobs,
    };
  }

  onChange(fn) {
    this._listeners.add(fn);
    return () => { this._listeners.delete(fn); };
  }

  dispose() {
    this._listeners.clear();
    this._cancels.clear();
    this._jobs.clear();
    this._lastEmit.clear();
    this._finishOrder.clear();
  }

  static progressOf(value) {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.min(1, Math.max(0, n));
  }

  _emit(job, significant) {
    const now = this._now();
    const last = this._lastEmit.get(job.id) || 0;
    if (!significant && now - last < JobRegistry.PROGRESS_INTERVAL_MS) return;
    this._lastEmit.set(job.id, now);
    const event = { type: 'job', job: { ...job } };
    for (const fn of this._listeners) {
      try { fn(event); } catch (_) {}
    }
  }

  _newerFirst(a, b) {
    return (b.finishedAt - a.finishedAt) || ((this._finishOrder.get(b.id) || 0) - (this._finishOrder.get(a.id) || 0));
  }

  _prune() {
    const cutoff = this._now() - JobRegistry.RECENT_MS;
    const finished = [...this._jobs.values()].filter((j) => !JobRegistry.ACTIVE.has(j.state)).sort((a, b) => this._newerFirst(a, b));
    finished.forEach((job, i) => {
      if (i >= JobRegistry.RECENT_MAX || job.finishedAt < cutoff) {
        this._jobs.delete(job.id);
        this._lastEmit.delete(job.id);
        this._finishOrder.delete(job.id);
      }
    });
  }
}

module.exports = JobRegistry;
