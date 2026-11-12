class FocusService {
  static TASK_KEY = 'focus.taskId';
  static MAX_NEEDS = 5;

  constructor({ board, calendar, summarizer, db, emit = () => {}, now = () => new Date() }) {
    this._board = board;
    this._calendar = calendar;
    this._summarizer = summarizer;
    this._db = db;
    this._emit = emit;
    this._now = now;
  }

  get() {
    const columns = this._board.listColumns();
    const done = new Set(columns.filter((c) => c.isDone).map((c) => c.key));
    const tasks = this._board.listTasks({}).filter((t) => !done.has(t.columnKey));
    const working = this._workingTask(tasks);
    const needs = [...this._taskNeeds(tasks, working), ...this._activityNeeds()];
    return {
      now: working,
      needs: needs.slice(0, FocusService.MAX_NEEDS),
      more: Math.max(0, needs.length - FocusService.MAX_NEEDS),
      calendar: this._calendarNow(),
    };
  }

  setTask(taskId) {
    if (taskId) {
      const found = this._board.getTask(taskId);
      if (!found || found.task.archived) throw new Error('Task not found.');
    }
    this._db.set(FocusService.TASK_KEY, taskId || '');
    this._emit('focus.changed', { taskId: taskId || null });
    return this.get();
  }

  _workingTask(openTasks) {
    const id = this._db.get(FocusService.TASK_KEY, '');
    return (id && openTasks.find((t) => t.id === id)) || null;
  }

  _taskNeeds(tasks, working) {
    const now = this._now();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    return tasks
      .filter((t) => t.dueAt && (!working || t.id !== working.id))
      .map((t) => ({ t, due: Date.parse(t.dueAt) }))
      .filter((x) => Number.isFinite(x.due) && x.due < dayEnd)
      .sort((a, b) => a.due - b.due)
      .map(({ t, due }) => ({
        kind: 'task', id: t.id, taskId: t.id, title: t.title || 'Untitled task', url: t.url || '',
        reason: due < dayStart ? 'Overdue' : 'Due today', where: [t.sourceLabel, t.listName].filter(Boolean).join(' / '),
      }));
  }

  _activityNeeds() {
    const needs = [];
    for (const card of this._summarizer.cards()) {
      if (card.needsYou) {
        needs.push({
          kind: 'context', id: card.key, contextId: card.contextId, title: card.name, color: card.color, headline: card.headline,
          reason: card.reason || card.headline, threadIds: card.items.map((i) => i.id), asks: card.asks,
        });
        continue;
      }
      for (const item of card.items) {
        if (item.priority !== 'high' && item.priority !== 'urgent') continue;
        needs.push({
          kind: 'item', id: item.id, threadId: item.id, title: item.title || (item.participants || []).join(', ') || item.app,
          reason: `Marked ${item.priority}`, where: card.name, url: item.url || '', taskId: item.taskId || null,
        });
      }
    }
    return needs;
  }

  _calendarNow() {
    const nowMs = this._now().getTime();
    const brief = (e) => (e ? { id: e.id, title: e.title || '(no title)', startsAt: e.startsAt, endsAt: e.endsAt || null, location: e.location || '', url: e.url || '', sourceLabel: e.sourceLabel || '' } : null);
    let events = [];
    try { events = this._calendar.listEvents({ days: 2 }) || []; } catch (_) { events = []; }
    const timed = events
      .filter((e) => e && !e.allDay && e.startsAt && String(e.status || '').toLowerCase() !== 'cancelled')
      .map((e) => ({ e, start: Date.parse(e.startsAt), end: e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt) }))
      .filter((x) => Number.isFinite(x.start))
      .sort((a, b) => a.start - b.start);
    const current = timed.find((x) => x.start <= nowMs && x.end > nowMs);
    const next = timed.find((x) => x.start > nowMs);
    return { current: brief(current && current.e), next: brief(next && next.e) };
  }
}

module.exports = FocusService;
