import HubWidgetBase from './HubWidgetBase.js';
import HubSettingsPanel from './HubSettingsPanel.js';
import TaskChrome from './TaskChrome.js';
import WidgetDom from './WidgetDom.js';

export default class HubFocusWidget extends HubWidgetBase {
  static REFRESH_EVENTS = ['focus.changed', 'task.changed', 'board.changed', 'thread.changed', 'summary.changed', 'context.changed', 'calendar.changed', 'calendar.synced'];
  static TICK_MS = 60000;
  static DISMISSED = 'done';

  static mount(root, host) {
    return new HubFocusWidget(root, host).mount();
  }

  constructor(root, host) {
    super(root, host);
    this._picking = false;
    this._tasks = null;
  }

  _renderShell() {
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-head' }, [
      WidgetDom.el('h2', { class: 'hub-title', text: 'Focus' }),
      WidgetDom.el('span', { class: 'hub-spacer' }),
      HubSettingsPanel.button(this.host, 'contexts'),
    ]));
    this.root.appendChild(this._errorLine());
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-body hub-focus' }));
  }

  dispose() {
    HubSettingsPanel.closeCurrent();
    super.dispose();
  }

  async _load() {
    return (await this.host.call('getFocus')) || { now: null, needs: [], more: 0, calendar: {} };
  }

  _tick() {
    if (!this._picking) this.refresh();
  }

  _paint() {
    const focus = this._data;
    const body = this.root.querySelector('.hub-focus');
    body.innerHTML = '';
    body.appendChild(this._section('Now', [this._now(focus.now)]));
    body.appendChild(this._section(`Needs you${focus.needs.length ? ` (${focus.needs.length + (focus.more || 0)})` : ''}`, this._needs(focus)));
    body.appendChild(this._section('Calendar', this._calendar(focus.calendar || {})));
  }

  _section(label, children) {
    return WidgetDom.el('div', { class: 'hub-focus-section' }, [WidgetDom.el('div', { class: 'hub-focus-label', text: label }), ...children]);
  }


  _now(task) {
    if (this._picking) return this._picker();
    if (!task) {
      return WidgetDom.el('div', { class: 'hub-focus-now is-empty' }, [
        WidgetDom.el('div', { class: 'hub-focus-quiet', text: 'Nothing picked. What are you working on?' }),
        WidgetDom.el('div', { class: 'hub-focus-actions' }, [
          WidgetDom.el('button', { class: 'hub-btn hub-primary hub-focus-choose', text: 'Pick a task', on: { click: () => this._openPicker() } }),
        ]),
      ]);
    }
    const meta = [[task.sourceLabel, task.listName].filter(Boolean).join(' / '), task.dueAt ? `due ${WidgetDom.formatDate(task.dueAt)}` : ''].filter(Boolean).join(' · ');
    return WidgetDom.el('div', { class: 'hub-focus-now', data: { task: task.id } }, [
      WidgetDom.el('div', { class: 'hub-focus-title', text: task.title || 'Untitled task' }),
      meta ? WidgetDom.el('div', { class: 'hub-focus-meta', text: meta }) : null,
      WidgetDom.el('div', { class: 'hub-focus-actions' }, [
        task.url ? WidgetDom.el('button', { class: 'hub-btn hub-focus-open', on: { click: () => this._openUrl(task.url) } }, [TaskChrome.icon('open'), WidgetDom.el('span', { text: 'Open' })]) : null,
        WidgetDom.el('button', { class: 'hub-btn hub-focus-switch', text: 'Switch', title: 'Work on a different task', on: { click: () => this._openPicker() } }),
        WidgetDom.el('button', { class: 'hub-btn hub-focus-clear', text: 'Clear', title: 'Stop showing this as what you are working on', on: { click: () => this._setTask(null) } }),
      ]),
    ]);
  }

  async _openPicker() {
    this._picking = true;
    this._paint();
    try {
      const [columns, tasks] = await Promise.all([this.host.call('listColumns'), this.host.call('listTasks', {})]);
      const open = (columns || []).filter((c) => !c.isDone);
      this._tasks = open.map((c) => ({ column: c, tasks: (tasks || []).filter((t) => t.columnKey === c.key && !t.archived) })).filter((g) => g.tasks.length);
    } catch (err) {
      this._tasks = [];
      this._showError(err);
    }
    if (!this._disposed && this._picking) this._paint();
  }

  _picker() {
    const select = WidgetDom.el('select', { class: 'hub-focus-pick', 'aria-label': 'The task you are working on' }, [
      WidgetDom.el('option', { value: '', text: this._tasks ? 'Choose a task...' : 'Loading tasks...' }),
      ...(this._tasks || []).map((group) => WidgetDom.el('optgroup', { label: group.column.title }, group.tasks.map((t) => WidgetDom.el('option', { value: t.id, text: t.title || 'Untitled task' })))),
    ]);
    select.addEventListener('change', () => { if (select.value) this._setTask(select.value); });
    return WidgetDom.el('div', { class: 'hub-focus-now is-empty' }, [
      select,
      WidgetDom.el('div', { class: 'hub-focus-actions' }, [
        WidgetDom.el('button', { class: 'hub-btn hub-focus-cancel', text: 'Cancel', on: { click: () => { this._picking = false; this._paint(); } } }),
      ]),
    ]);
  }

  _setTask(taskId) {
    this._picking = false;
    return this.act(() => this.host.call('setFocusTask', taskId));
  }


  _needs(focus) {
    if (!focus.needs.length) return [WidgetDom.el('div', { class: 'hub-focus-quiet hub-focus-clear-note', text: 'Nothing needs you right now.' })];
    const rows = focus.needs.map((need) => this._need(need));
    if (focus.more) rows.push(WidgetDom.el('div', { class: 'hub-focus-quiet hub-focus-more', text: `and ${focus.more} more in the board and Activity` }));
    return rows;
  }

  _need(need) {
    const button = (cls, text, fn, title) => WidgetDom.el('button', { class: `hub-row-action ${cls}`, text, title, on: { click: fn } });
    const actions = [];
    if (need.kind === 'task') {
      actions.push(button('hub-need-start', 'Start', () => this._setTask(need.taskId), 'Make this what you are working on'));
    } else {
      if (need.kind === 'item' && !need.taskId) actions.push(button('hub-need-task', 'To task', () => this.act(() => this.host.call('threadToTask', need.threadId, {})), 'Make a board task from this'));
      const ids = need.kind === 'context' ? need.threadIds || [] : [need.threadId];
      actions.push(button('hub-need-dismiss', 'Dismiss', () => this.act(() => this.host.call('setThreadsState', ids, HubFocusWidget.DISMISSED)), 'Rule this out; new activity brings it back'));
    }
    const reason = need.kind === 'context' ? need.reason : [need.reason, need.where].filter(Boolean).join(' · ');
    return WidgetDom.el('div', {
      class: `hub-need k-${need.kind}${need.reason === 'Due today' ? ' is-today' : ''}`, data: { need: need.id, kind: need.kind },
    }, [
      WidgetDom.el('span', { class: 'hub-dot', style: need.kind === 'context' && TaskChrome.safeColor(need.color) ? `background:${TaskChrome.safeColor(need.color)}` : null }),
      WidgetDom.el('div', { class: 'hub-need-main' }, [
        WidgetDom.el('div', { class: 'hub-need-title', text: need.title }),
        reason ? WidgetDom.el('div', { class: 'hub-need-reason', text: reason }) : null,
      ]),
      WidgetDom.el('div', { class: 'hub-need-actions' }, actions),
    ]);
  }


  _calendar({ current = null, next = null }) {
    if (!current && !next) return [WidgetDom.el('div', { class: 'hub-focus-quiet', text: 'Nothing coming up.' })];
    const rows = [];
    if (current) rows.push(this._event(current, `Now, until ${WidgetDom.formatTime(current.endsAt)}`, true));
    if (next) rows.push(this._event(next, HubFocusWidget._startsIn(next.startsAt), false));
    return rows;
  }

  _event(event, when, isNow) {
    const row = WidgetDom.el('div', { class: `hub-focus-cal${isNow ? ' is-now' : ''}${event.url ? ' has-url' : ''}`, data: { event: event.id }, title: [event.location, event.sourceLabel].filter(Boolean).join(' / ') }, [
      WidgetDom.el('span', { class: 'hub-focus-cal-when', text: when }),
      WidgetDom.el('span', { class: 'hub-focus-cal-title', text: event.title }),
    ]);
    if (event.url) row.addEventListener('click', () => this._openUrl(event.url));
    return row;
  }

  static _startsIn(iso, now = Date.now()) {
    const minutes = Math.round((new Date(iso).getTime() - now) / WidgetDom.MINUTE_MS);
    if (minutes <= 60) return `in ${Math.max(1, minutes)} min`;
    const time = WidgetDom.formatTime(iso);
    return WidgetDom.dayKey(iso) === WidgetDom.dayKey(null, now) ? time : `${WidgetDom.dayLabel(WidgetDom.dayKey(iso), now)} ${time}`;
  }
}
