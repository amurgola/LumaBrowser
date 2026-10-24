const GlanceText = require('./GlanceText');

const TITLE_CHARS = 60;
const TOOLTIP_ITEMS = 3;

async function call(api, method, ...args) {
  if (!api || typeof api[method] !== 'function') return null;
  return api[method](...args);
}

const calendar = {
  id: 'calendar',
  label: 'Next calendar event',
  setting: 'showCalendar',
  extension: 'personal-hub',
  LOOKAHEAD_HOURS: 24,
  SOON_MINUTES: 60,

  async collect({ api, now, timeFormat }) {
    const events = await call(api, 'listEvents', { days: 2 });
    if (!Array.isArray(events)) return null;
    const nowMs = now.getTime();
    const horizon = nowMs + calendar.LOOKAHEAD_HOURS * 3600000;
    const timed = events
      .filter((e) => e && !e.allDay && e.startsAt && String(e.status || '').toLowerCase() !== 'cancelled')
      .map((e) => ({ e, start: Date.parse(e.startsAt), end: e.endsAt ? Date.parse(e.endsAt) : Date.parse(e.startsAt) }))
      .filter((x) => Number.isFinite(x.start))
      .sort((a, b) => a.start - b.start);
    const current = timed.find((x) => x.start <= nowMs && x.end > nowMs) || null;
    const next = timed.find((x) => x.start > nowMs && x.start <= horizon) || null;
    if (!current && !next) return null;

    const shape = (x, inProgress) => ({
      id: x.e.id, title: GlanceText.oneLine(x.e.title) || '(no title)', startsAt: x.e.startsAt, endsAt: x.e.endsAt || null,
      inProgress, location: x.e.location || '', url: x.e.url || '', source: x.e.sourceLabel || '',
    });
    const items = { currentEvent: current ? shape(current, true) : null, nextEvent: next ? shape(next, false) : null };
    const tooltip = [];
    if (current) tooltip.push(`Now: ${calendar._clip(current.e.title)} (until ${GlanceText.clock(new Date(current.end), timeFormat)})${calendar._where(current.e)}`);
    if (next) tooltip.push(`Next: ${calendar._clip(next.e.title)} at ${calendar._when(next.start, now, timeFormat)}${calendar._where(next.e)}`);

    const showNext = next && (!current || next.start - nowMs <= 5 * 60000);
    const pick = showNext ? next : current;
    const minutes = (pick.start - nowMs) / 60000;
    let post;
    if (!showNext) post = ' now';
    else if (minutes <= calendar.SOON_MINUTES) post = ` in ${GlanceText.duration(minutes)}`;
    else post = ` ${calendar._when(pick.start, now, timeFormat)}`;
    const text = `${GlanceText.oneLine(pick.e.title) || '(no title)'}${post}`;
    return {
      segment: { title: GlanceText.oneLine(pick.e.title) || '(no title)', post },
      line: {
        id: `event:${pick.e.id}`, icon: 'calendar', text,
        detail: [pick.e.location, pick.e.sourceLabel].filter(Boolean).join(' / ') || undefined,
        url: pick.e.url || undefined,
      },
      items,
      tooltip,
    };
  },

  _clip(title) { return GlanceText.clip(title || '(no title)', TITLE_CHARS); },
  _where(e) { return e.location ? `, ${GlanceText.clip(e.location, 40)}` : ''; },
  _when(ms, now, timeFormat) {
    const d = new Date(ms);
    const day = GlanceText.dayWord(d, now);
    return day === 'today' ? GlanceText.clock(d, timeFormat) : `${day} ${GlanceText.clock(d, timeFormat)}`;
  },
};

const queue = {
  id: 'queue',
  label: 'Unread conversations',
  setting: 'showQueue',
  extension: 'personal-hub',
  LIMIT: 500,

  async collect({ api }) {
    const threads = await call(api, 'listThreads', { state: 'open', limit: queue.LIMIT });
    if (!Array.isArray(threads)) return null;
    const sorted = threads.slice().sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')));
    const top = sorted[0] || null;
    const items = {
      unreadCount: threads.length,
      latestThread: top ? { id: top.id, app: top.app || '', title: queue._title(top), lastAt: top.lastAt || null, url: top.url || '' } : null,
    };
    if (!threads.length) return { segment: null, line: null, items, tooltip: [] };
    const tooltip = [`Queue: ${threads.length} open thread${threads.length === 1 ? '' : 's'}`];
    for (const t of sorted.slice(0, TOOLTIP_ITEMS)) tooltip.push(`  ${t.app ? `${t.app}: ` : ''}${GlanceText.clip(queue._title(t), TITLE_CHARS)}`);
    const text = `${threads.length} unread`;
    return {
      segment: { pre: text },
      line: { id: 'queue', icon: 'inbox', text, detail: top ? GlanceText.clip(`${top.app ? `${top.app}: ` : ''}${queue._title(top)}`, TITLE_CHARS) : undefined },
      items,
      tooltip,
    };
  },

  _title(t) {
    return GlanceText.oneLine(t.title || (Array.isArray(t.participants) ? t.participants.join(', ') : '') || t.summary || '(untitled)');
  },
};

const tasks = {
  id: 'tasks',
  label: 'Tasks due today or overdue',
  setting: 'showTasks',
  extension: 'personal-hub',

  async collect({ api, now }) {
    const list = await call(api, 'listTasks', {});
    if (!Array.isArray(list)) return null;
    const columns = (await call(api, 'listColumns')) || [];
    const done = new Set((Array.isArray(columns) ? columns : []).filter((c) => c && c.isDone).map((c) => c.key));
    const dayStart = GlanceText.startOfDay(now).getTime();
    const dayEnd = dayStart + 86400000;
    const due = list
      .filter((t) => t && !t.archived && !t.hidden && !done.has(t.columnKey) && t.dueAt)
      .map((t) => ({ t, due: Date.parse(t.dueAt) }))
      .filter((x) => Number.isFinite(x.due) && x.due < dayEnd)
      .sort((a, b) => a.due - b.due);
    const overdue = due.filter((x) => x.due < dayStart).length;
    const items = {
      dueTasks: {
        count: due.length,
        overdue,
        today: due.length - overdue,
        tasks: due.slice(0, 10).map((x) => ({ id: x.t.id, title: GlanceText.oneLine(x.t.title) || '(untitled)', dueAt: x.t.dueAt, overdue: x.due < dayStart, url: x.t.url || '' })),
      },
    };
    if (!due.length) return { segment: null, line: null, items, tooltip: [] };
    const tooltip = [`Due: ${due.length} task${due.length === 1 ? '' : 's'}${overdue ? ` (${overdue} overdue)` : ''}`];
    for (const x of due.slice(0, TOOLTIP_ITEMS)) tooltip.push(`  ${GlanceText.clip(x.t.title || '(untitled)', TITLE_CHARS)}${x.due < dayStart ? ' (overdue)' : ''}`);
    const text = `${due.length} due`;
    const first = due[0].t;
    return {
      segment: { pre: text },
      line: { id: 'tasks', icon: 'task', text, detail: overdue ? `${overdue} overdue` : undefined, url: first.url || undefined },
      items,
      tooltip,
    };
  },
};

const running = {
  id: 'running',
  label: 'Running timed tasks',
  setting: 'showRunning',
  extension: 'timed-tasks',
  resolve: (deps, lookup) => (jobsOn(deps) ? null : lookup('timed-tasks')),

  async collect({ api }) {
    const all = await call(api, 'getAllTasks');
    if (!Array.isArray(all)) return null;
    const active = all.filter((t) => t && t.status === 'running');
    const items = { runningJobs: active.map((t) => ({ id: t.id, name: GlanceText.oneLine(t.name) || '(unnamed)' })) };
    if (!active.length) return { segment: null, line: null, items, tooltip: [] };
    const text = `${active.length} running`;
    return {
      segment: { pre: text },
      line: { id: 'running', icon: 'clock', text, detail: GlanceText.clip(active.map((t) => t.name).join(', '), TITLE_CHARS) },
      items,
      tooltip: [`Running: ${GlanceText.clip(active.map((t) => t.name || '(unnamed)').join(', '), TITLE_CHARS)}`],
    };
  },
};

function jobsOn(deps) {
  try { return !!(deps.features && deps.features.isEnabled('jobs')); } catch (_) { return false; }
}

const jobs = {
  id: 'jobs',
  label: 'Running jobs',
  setting: 'showJobs',
  extension: null,
  resolve: (deps) => {
    if (!jobsOn(deps)) return null;
    try { return require('../jobs'); } catch (_) { return null; }
  },

  async collect({ api }) {
    const summary = typeof api.summary === 'function' ? api.summary() : null;
    if (!summary) return null;
    const items = { jobs: { running: summary.running, queued: summary.queued, progress: summary.progress, line: summary.line } };
    if (!summary.line) return { segment: null, line: null, items, tooltip: [] };
    const short = summary.progress === null ? `${summary.running + summary.queued} running` : `${Math.round(summary.progress * 100)}%`;
    return {
      segment: { pre: short },
      line: { id: 'jobs', icon: 'progress', text: GlanceText.clip(summary.line, TITLE_CHARS) },
      items,
      tooltip: [GlanceText.clip(summary.line, TITLE_CHARS)],
    };
  },
};

module.exports = { ALL: [calendar, queue, tasks, running, jobs], calendar, queue, tasks, running, jobs };
