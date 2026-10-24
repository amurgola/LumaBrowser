class TimedTaskJobSource {
  static POLL_MS = 3000;
  static KIND = 'timed-task';

  constructor({ registry, getApi, pollMs = TimedTaskJobSource.POLL_MS, setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._registry = registry;
    this._getApi = getApi;
    this._pollMs = pollMs;
    this._si = si;
    this._ci = ci;
    this._timer = null;
    this._running = new Map();
  }

  start() {
    if (this._timer) return;
    this._timer = this._si(() => { this.poll(); }, this._pollMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
    this.poll();
  }

  stop() {
    if (this._timer) this._ci(this._timer);
    this._timer = null;
    this._running.clear();
  }

  async poll() {
    const api = this._api();
    let tasks = [];
    if (api && typeof api.getAllTasks === 'function') {
      try { tasks = (await api.getAllTasks()) || []; } catch (_) { tasks = []; }
    }
    const now = new Set();
    for (const task of Array.isArray(tasks) ? tasks : []) {
      if (!task || task.status !== 'running') continue;
      now.add(task.id);
      if (!this._running.has(task.id)) {
        const id = this._registry.newId(TimedTaskJobSource.KIND);
        this._running.set(task.id, id);
        this._registry.start(id, { kind: TimedTaskJobSource.KIND, title: `Timed task: ${task.name || task.id}`, detail: 'Running', source: 'timed-tasks' });
      }
    }
    for (const [taskId, jobId] of [...this._running]) {
      if (now.has(taskId)) continue;
      this._running.delete(taskId);
      const run = await this._latestRun(api, taskId);
      if (run && run.status === 'error') this._registry.finish(jobId, 'failed', { error: run.error || run.response || 'Run failed' });
      else this._registry.finish(jobId, 'done');
    }
  }

  async _latestRun(api, taskId) {
    if (!api || typeof api.getTaskRuns !== 'function') return null;
    try {
      const runs = await api.getTaskRuns(taskId, 1, 0);
      return Array.isArray(runs) ? runs[0] || null : null;
    } catch (_) {
      return null;
    }
  }

  _api() {
    try { return this._getApi() || null; } catch (_) { return null; }
  }
}

module.exports = TimedTaskJobSource;
