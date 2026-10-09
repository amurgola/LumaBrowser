import WidgetDom from './WidgetDom.js';

export default class TaskChrome {
  static LOCAL = 'local';
  static LOCAL_COLOR = '#8a95ad';
  static SOURCE_PALETTE = ['#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#22d3ee', '#facc15'];
  static HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
  static MAX_AVATARS = 3;

  static ICONS = {
    hide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>',
    show: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  };

  static sourceKey(task) {
    return (task && task.sourceId) || TaskChrome.LOCAL;
  }

  static sourceColors(tasks) {
    const labels = new Map();
    for (const t of tasks || []) if (t.sourceId) labels.set(t.sourceId, t.sourceLabel || t.sourceId);
    const ordered = [...labels.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])));
    const colors = { [TaskChrome.LOCAL]: TaskChrome.LOCAL_COLOR };
    ordered.forEach(([id], i) => { colors[id] = TaskChrome.SOURCE_PALETTE[i % TaskChrome.SOURCE_PALETTE.length]; });
    return colors;
  }

  static safeColor(value, fallback = '') {
    return TaskChrome.HEX_COLOR.test(String(value || '')) ? String(value) : fallback;
  }

  static statusPill(task) {
    if (!task || !task.remoteStatus) return null;
    const color = TaskChrome.safeColor(task.remoteStatusColor);
    return WidgetDom.el('span', {
      class: 'hub-status',
      text: task.remoteStatus,
      title: `Status in ${task.sourceLabel || 'the tracker'}: ${task.remoteStatus}`,
      style: color ? `--hub-status:${color}` : null,
    });
  }

  static names(assignees) {
    return (Array.isArray(assignees) ? assignees : [])
      .map((a) => (a && typeof a === 'object' ? a.name || a.email || a.id : a))
      .filter((n) => n != null && String(n).trim())
      .map(String);
  }

  static initials(name) {
    const parts = String(name || '').replace(/@.*$/, '').split(/[\s._]+/).filter(Boolean);
    if (!parts.length) return '?';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
    return letters.toUpperCase();
  }

  static avatars(assignees) {
    const names = TaskChrome.names(assignees);
    if (!names.length) return null;
    const shown = names.slice(0, TaskChrome.MAX_AVATARS).map((n) => WidgetDom.el('span', { class: 'hub-avatar', text: TaskChrome.initials(n) }));
    if (names.length > TaskChrome.MAX_AVATARS) shown.push(WidgetDom.el('span', { class: 'hub-avatar', text: `+${names.length - TaskChrome.MAX_AVATARS}` }));
    return WidgetDom.el('span', { class: 'hub-avatars', title: names.join(', ') }, shown);
  }

  static icon(name) {
    return WidgetDom.el('span', { html: TaskChrome.ICONS[name] || '', style: 'display:inline-flex' });
  }
}
