class HubContext {
  static WEEK_DAYS = 7;
  static MAX_EVENTS = 150;
  static MAX_TASKS_PER_COLUMN = 60;
  static MAX_THREADS = 60;
  static MAX_NOTIFICATIONS = 120;
  static DESCRIPTION_CHARS = 200;
  static BODY_CHARS = 240;

  static WIDGETS = {
    agenda: (api, opts) => HubContext.agenda(api, opts),
    board: (api, opts) => HubContext.board(api, opts),
    inbox: (api, opts) => HubContext.queue(api, opts),
  };

  static render(api, widgetId, { now = new Date() } = {}) {
    const build = HubContext.WIDGETS[String(widgetId || '')];
    if (!build) throw new Error(`Unknown Hub widget "${widgetId}"`);
    return build(api, { now });
  }

  static agenda(api, { now }) {
    const events = (api.listEvents({ days: HubContext.WEEK_DAYS }) || []).slice(0, HubContext.MAX_EVENTS);
    const lines = [];
    if (!events.length) {
      const sources = api.listCalendarSources ? api.listCalendarSources() : null;
      lines.push(Array.isArray(sources) && !sources.length ? 'No calendars are connected yet.' : 'Nothing on the calendar for the next 7 days.');
    } else {
      const days = HubContext._groupByDay(events);
      for (const [key, list] of days) {
        lines.push(`### ${HubContext._dayLabel(key, now)}`);
        for (const e of list) lines.push(HubContext._eventLine(e, now));
        lines.push('');
      }
    }
    lines.push(HubContext._more('hub_list_events for other dates'));
    return { title: 'Agenda', text: HubContext._join(lines) };
  }

  static _eventLine(e, now) {
    const time = e.allDay ? 'all day' : HubContext._timeRange(e.startsAt, e.endsAt);
    const past = !e.allDay && e.endsAt && Date.parse(e.endsAt) < now.getTime();
    const extra = [e.location, e.sourceLabel, e.organizer ? `organizer ${e.organizer}` : '', e.status && e.status !== 'confirmed' ? e.status : '']
      .filter(Boolean).join(' / ');
    return `- ${time}: ${e.title || '(no title)'}${extra ? ` (${extra})` : ''}${past ? ' [ended]' : ''}`;
  }

  static board(api, { now }) {
    const columns = api.listColumns() || [];
    const tasks = (api.listTasks({ includeHidden: true }) || []).filter((t) => !t.archived);
    const visible = tasks.filter((t) => !t.hidden);
    const lines = [];
    if (!tasks.length) {
      lines.push('The board is empty.');
    } else {
      const known = new Set(columns.map((c) => c.key));
      for (const column of columns) lines.push(...HubContext._lane(column.title, visible.filter((t) => t.columnKey === column.key), now));
      for (const group of HubContext._pseudoGroups(visible.filter((t) => !known.has(t.columnKey)))) {
        lines.push(...HubContext._lane(`${group.status} (tracker status with no column yet)`, group.tasks, now));
      }
      const hidden = tasks.length - visible.length;
      if (hidden) lines.push(`${hidden} finished task${hidden === 1 ? '' : 's'} hidden from the board (hub_list_tasks with includeHidden lists them).`, '');
    }
    lines.push(HubContext._more('hub_get_task for a task\'s description and messages'));
    return { title: 'Task board', text: HubContext._join(lines) };
  }

  static _lane(title, tasks, now) {
    const lines = [`### ${title} (${tasks.length})`];
    if (!tasks.length) lines.push('- (empty)');
    for (const t of tasks.slice(0, HubContext.MAX_TASKS_PER_COLUMN)) lines.push(HubContext._taskLine(t, now));
    if (tasks.length > HubContext.MAX_TASKS_PER_COLUMN) lines.push(`- ...and ${tasks.length - HubContext.MAX_TASKS_PER_COLUMN} more`);
    lines.push('');
    return lines;
  }

  static _taskLine(t, now) {
    const bits = [];
    if (t.priority && t.priority !== 'normal') bits.push(t.priority);
    if (t.dueAt) bits.push(`due ${HubContext._dueLabel(t.dueAt, now)}`);
    const where = [t.sourceLabel, t.spaceName, t.listName].filter(Boolean).join(' > ');
    if (where) bits.push(where);
    if (Array.isArray(t.assignees) && t.assignees.length) bits.push(`assigned ${t.assignees.join(', ')}`);
    if (Array.isArray(t.tags) && t.tags.length) bits.push(`tags ${t.tags.join(', ')}`);
    if (t.syncError) bits.push('sync error');
    const desc = HubContext._clip(t.description, HubContext.DESCRIPTION_CHARS);
    return `- [${t.id}] ${t.title || '(untitled)'}${bits.length ? ` (${bits.join('; ')})` : ''}${desc ? `: ${desc}` : ''}`;
  }

  static _pseudoGroups(tasks) {
    const groups = new Map();
    for (const t of tasks) {
      if (!groups.has(t.columnKey)) groups.set(t.columnKey, { status: t.remoteStatus || t.columnKey, tasks: [] });
      groups.get(t.columnKey).tasks.push(t);
    }
    return [...groups.values()];
  }

  static queue(api, { now }) {
    const threads = (api.listThreads({ state: 'open', limit: HubContext.MAX_THREADS }) || [])
      .slice().sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')));
    const lines = [`### Open threads (${threads.length})`];
    if (!threads.length) lines.push('- Queue clear.');
    for (const t of threads) lines.push(HubContext._threadLine(t, now));
    lines.push('', ...HubContext._todayLog(api, now));
    lines.push(HubContext._more('hub_list_threads for reviewed, snoozed or done threads; hub_get_thread for a thread\'s notifications; hub_list_notifications for earlier days'));
    return { title: 'Conversation queue', text: HubContext._join(lines) };
  }

  static _threadLine(t, now) {
    const last = t.lastNotification || {};
    const bits = [HubContext._ago(t.lastAt, now)];
    if (t.priority && t.priority !== 'normal') bits.push(t.priority);
    if (t.count > 1) bits.push(`${t.count} notifications`);
    if (Array.isArray(t.labels) && t.labels.length) bits.push(`labels ${t.labels.join(', ')}`);
    if (t.taskId) bits.push(`on the board as ${t.taskId}`);
    const people = (t.participants || []).join(', ');
    const text = HubContext._clip(t.summary || last.body || last.title, HubContext.BODY_CHARS);
    const title = t.title || people || '(untitled)';
    return `- [${t.id}] ${t.app}: ${title}${people && people !== title ? ` with ${people}` : ''} (${bits.join('; ')})${text ? `: ${text}` : ''}`;
  }

  static _todayLog(api, now) {
    const since = HubContext._startOfDay(now).toISOString();
    const log = api.listNotifications({ since, limit: HubContext.MAX_NOTIFICATIONS + 1 }) || [];
    const lines = [`### Notifications today (${log.length > HubContext.MAX_NOTIFICATIONS ? `${HubContext.MAX_NOTIFICATIONS}+` : log.length})`];
    if (!log.length) lines.push('- None yet today.');
    for (const n of log.slice(0, HubContext.MAX_NOTIFICATIONS)) {
      const who = n.sender || n.title || n.tabTitle || n.host || n.app;
      const body = HubContext._clip(n.body || (n.sender ? n.title : ''), HubContext.BODY_CHARS);
      lines.push(`- ${HubContext._clock(n.receivedAt)} ${n.app}: ${who}${body ? `: ${body}` : ''}`);
    }
    lines.push('');
    return lines;
  }

  static _groupByDay(events) {
    const byDay = new Map();
    for (const e of events) {
      const key = HubContext._dayKey(e.startsAt);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(e);
    }
    for (const list of byDay.values()) list.sort((a, b) => (b.allDay - a.allDay) || String(a.startsAt).localeCompare(String(b.startsAt)));
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }

  static _dayKey(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return `${d.getFullYear()}-${HubContext._pad(d.getMonth() + 1)}-${HubContext._pad(d.getDate())}`;
  }

  static _dayLabel(key, now) {
    const today = HubContext._dayKey(now.toISOString());
    const tomorrow = HubContext._dayKey(new Date(now.getTime() + 86400000).toISOString());
    const date = new Date(`${key}T12:00:00`);
    const pretty = Number.isNaN(date.getTime()) ? key : date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (key === today) return `Today, ${pretty}`;
    if (key === tomorrow) return `Tomorrow, ${pretty}`;
    return pretty;
  }

  static _timeRange(startsAt, endsAt) {
    const start = HubContext._clock(startsAt);
    const end = endsAt ? HubContext._clock(endsAt) : '';
    return end && end !== start ? `${start}-${end}` : start;
  }

  static _clock(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return `${HubContext._pad(d.getHours())}:${HubContext._pad(d.getMinutes())}`;
  }

  static _dueLabel(iso, now) {
    const key = HubContext._dayKey(iso);
    const today = HubContext._dayKey(now.toISOString());
    if (key === today) return 'today';
    const overdue = key < today;
    return `${key}${overdue ? ', overdue' : ''}`;
  }

  static _ago(iso, now) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return 'unknown time';
    const mins = Math.max(0, Math.round((now.getTime() - t) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  static _startOfDay(now) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  static _clip(text, max) {
    const s = String(text || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
  }

  static _more(hint) {
    return `More: ${hint}.`;
  }

  static _join(lines) {
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  static _pad(n) {
    return String(n).padStart(2, '0');
  }
}

module.exports = HubContext;
