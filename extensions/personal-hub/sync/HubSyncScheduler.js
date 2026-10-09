class HubSyncScheduler {
  static TICK_MS = 30 * 1000;
  static CATCH_UP_MS = 5 * 1000;
  static KINDS = ['calendar', 'tasks'];

  constructor({ calendarSources, taskSources, calendar, board, emit = () => {}, now = () => new Date() }) {
    this._calendarSources = calendarSources;
    this._taskSources = taskSources;
    this._calendar = calendar;
    this._board = board;
    this._emit = emit;
    this._now = now;
    this._timer = null;
    this._catchUp = null;
    this._running = false;
    this._lastRunAt = null;
    this._lastResults = [];
  }

  start() {
    this.stop();
    this._timer = setInterval(() => { this.tick().catch(() => {}); }, HubSyncScheduler.TICK_MS);
    if (typeof this._timer.unref === 'function') this._timer.unref();
    this._catchUp = setTimeout(() => { this.tick().catch(() => {}); }, HubSyncScheduler.CATCH_UP_MS);
    if (typeof this._catchUp.unref === 'function') this._catchUp.unref();
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._catchUp) { clearTimeout(this._catchUp); this._catchUp = null; }
  }

  async tick() {
    if (this._running) return null;
    const nowIso = this._now().toISOString();
    const jobs = [
      ...this._calendarSources.due(nowIso).map((source) => ({ kind: 'calendar', source })),
      ...this._taskSources.due(nowIso).map((source) => ({ kind: 'tasks', source })),
    ];
    if (!jobs.length) return [];
    return this._runJobs(jobs);
  }

  async syncNow({ kind = 'all', sourceId = null } = {}) {
    if (this._running) return { success: false, error: 'a sync is already running', results: [] };
    const jobs = this._jobsFor(kind, sourceId);
    if (sourceId && !jobs.length) return { success: false, error: 'source not found', results: [] };
    const results = await this._runJobs(jobs);
    return { success: true, results };
  }

  status() {
    return {
      running: this._running,
      lastRunAt: this._lastRunAt,
      lastResults: this._lastResults,
      calendars: this._calendarSources.list(),
      tasks: this._taskSources.list(),
    };
  }

  _jobsFor(kind, sourceId) {
    const wantCalendar = kind === 'all' || kind === 'calendar';
    const wantTasks = kind === 'all' || kind === 'tasks';
    const pick = (repo, k) => {
      if (sourceId) {
        const source = repo.get(sourceId);
        return source ? [{ kind: k, source }] : [];
      }
      return repo.list().filter((s) => s.enabled).map((source) => ({ kind: k, source }));
    };
    return [...(wantCalendar ? pick(this._calendarSources, 'calendar') : []), ...(wantTasks ? pick(this._taskSources, 'tasks') : [])];
  }

  async _runJobs(jobs) {
    this._running = true;
    this._emit('sync.status', { running: true });
    const results = [];
    try {
      for (const job of jobs) results.push(await this._runOne(job));
    } finally {
      this._running = false;
      this._lastRunAt = this._now().toISOString();
      this._lastResults = results;
      this._emit('sync.status', { running: false, results });
    }
    return results;
  }

  async _runOne({ kind, source }) {
    const service = kind === 'calendar' ? this._calendar : this._board;
    try {
      const outcome = await service.syncSource(source);
      return { kind, sourceId: source.id, ...(outcome || { status: 'ok' }) };
    } catch (err) {
      return { kind, sourceId: source.id, status: 'error', error: (err && err.message) || String(err) };
    }
  }
}

module.exports = HubSyncScheduler;
