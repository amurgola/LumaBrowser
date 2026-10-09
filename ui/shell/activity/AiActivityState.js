export default class AiActivityState {
  constructor() {
    this.models = new Map();
    this.runs = new Map();
  }

  loadSnapshot(snapshot) {
    this.models.clear();
    for (const q of snapshot) {
      this.models.set(q.modelId, {
        maxConcurrency: q.maxConcurrency, activeCount: q.activeCount, pendingCount: q.pendingCount, tasks: new Map(),
      });
      for (const t of q.pendingTasks) this.models.get(q.modelId).tasks.set(t.id, t);
    }
  }

  ensureModel(modelId, maxConcurrency) {
    if (this.models.has(modelId)) return;
    this.models.set(modelId, { maxConcurrency: maxConcurrency || 1, activeCount: 0, pendingCount: 0, tasks: new Map() });
  }

  queued(task) {
    this.ensureModel(task.modelId);
    this.models.get(task.modelId).tasks.set(task.id, task);
  }

  processing(task) {
    this.ensureModel(task.modelId);
    const tasks = this.models.get(task.modelId).tasks;
    const existing = tasks.get(task.id);
    if (existing) {
      existing.status = 'processing';
      existing.startedAt = task.startedAt;
    } else {
      tasks.set(task.id, task);
    }
  }

  completed(task) {
    const model = this.models.get(task.modelId);
    if (model) model.tasks.delete(task.id);
  }

  stats(stats) {
    this.ensureModel(stats.modelId);
    const model = this.models.get(stats.modelId);
    model.activeCount = stats.activeCount;
    model.pendingCount = stats.pendingCount;
    model.maxConcurrency = stats.maxConcurrency;
  }

  backgroundRun(evt, fallbackTitle, now = Date.now()) {
    const p = evt && evt.payload;
    if (!p || p.runId == null) return false;
    const key = String(p.runId);
    if (evt.type === 'run-started') { this.runs.set(key, { title: p.title || fallbackTitle, startedAt: now }); return true; }
    if (evt.type === 'run-finished') { this.runs.delete(key); return true; }
    return false;
  }

  totalActive() {
    let total = this.runs.size;
    for (const model of this.models.values()) total += model.tasks.size;
    return total;
  }
}
