class RunProgress {
  constructor({ now = Date.now } = {}) {
    this._now = now;
    this._runs = new Map();
    this._listeners = new Set();
  }

  get live() {
    return [...this._runs.values()].map((r) => ({ ...r, elapsedMs: this._now() - r.startedAt }));
  }

  report({ conversationId, iteration, maxIterations }) {
    const id = conversationId == null ? 'run' : String(conversationId);
    const prior = this._runs.get(id);
    const run = { conversationId: id, iteration: Number(iteration) || 0, maxIterations: Number(maxIterations) || 0, startedAt: prior ? prior.startedAt : this._now() };
    this._runs.set(id, run);
    const progress = { ...run, elapsedMs: this._now() - run.startedAt, done: false };
    this._emit(progress);
    return progress;
  }

  end(conversationId) {
    const id = conversationId == null ? 'run' : String(conversationId);
    const run = this._runs.get(id);
    if (!run) return false;
    this._runs.delete(id);
    this._emit({ ...run, elapsedMs: this._now() - run.startedAt, done: true });
    return true;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  _emit(progress) {
    for (const fn of this._listeners) {
      try { fn(progress); } catch (_) {}
    }
  }
}

module.exports = RunProgress;
