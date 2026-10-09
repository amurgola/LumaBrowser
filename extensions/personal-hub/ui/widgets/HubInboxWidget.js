import HubWidgetBase from './HubWidgetBase.js';
import WidgetDom from './WidgetDom.js';

export default class HubInboxWidget extends HubWidgetBase {
  static ATTENTION_AREA = 'queue';
  static REFRESH_EVENTS = ['thread.changed'];
  static ALL_APPS = '*';
  static SNOOZE_MS = 4 * 3600000;

  static APPS = {
    slack: { short: 'Slack', color: '#4a154b' },
    teams: { short: 'Teams', color: '#5059c9' },
    gmail: { short: 'Gmail', color: '#d93025' },
    outlook: { short: 'Outlook', color: '#0f6cbd' },
    messages: { short: 'SMS', color: '#1a73e8' },
    clickup: { short: 'ClickUp', color: '#7b68ee' },
    proton: { short: 'Proton', color: '#6d4aff' },
    discord: { short: 'Discord', color: '#5865f2' },
  };

  static mount(root, host) {
    return new HubInboxWidget(root, host).mount();
  }

  constructor(root, host) {
    super(root, host);
    this._filter = HubInboxWidget.ALL_APPS;
  }

  _renderShell() {
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-head' }, [
      WidgetDom.el('h2', { class: 'hub-title', text: 'Conversation queue' }),
      WidgetDom.el('div', { class: 'hub-chips hub-apps' }),
      WidgetDom.el('span', { class: 'hub-spacer' }),
      WidgetDom.el('span', { class: 'hub-count hub-open' }),
    ]));
    this.root.appendChild(this._errorLine());
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-body hub-threads' }));
  }

  async _load() {
    const threads = (await this.host.call('listThreads', { state: 'open' })) || [];
    return threads.slice().sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')));
  }

  _paint() {
    const threads = this._data;
    this._paintApps(threads);
    const visible = threads.filter((t) => this._filter === HubInboxWidget.ALL_APPS || t.app === this._filter);
    this.root.querySelector('.hub-open').textContent = String(visible.length);
    const list = this.root.querySelector('.hub-threads');
    list.innerHTML = '';
    if (!visible.length) {
      list.appendChild(this._empty('Queue clear. New chat and mail notifications land here.'));
      return;
    }
    for (const thread of visible) list.appendChild(this._row(thread));
  }

  _paintApps(threads) {
    const chips = this.root.querySelector('.hub-apps');
    chips.innerHTML = '';
    const apps = [...new Set(threads.map((t) => t.app).filter(Boolean))].sort();
    if (apps.length < 2) {
      this._filter = HubInboxWidget.ALL_APPS;
      return;
    }
    chips.appendChild(this._chip('All', HubInboxWidget.ALL_APPS));
    for (const app of apps) chips.appendChild(this._chip(HubInboxWidget._appMeta(app).short, app));
  }

  _chip(label, value) {
    return WidgetDom.el('button', {
      class: `hub-chip${this._filter === value ? ' is-on' : ''}`,
      text: label,
      data: { app: value },
      on: { click: () => { this._filter = value; this._paint(); } },
    });
  }

  _row(thread) {
    const meta = HubInboxWidget._appMeta(thread.app);
    const last = thread.lastNotification || {};
    const text = thread.summary || last.body || last.title || '';
    const people = (thread.participants || []).join(', ');
    return WidgetDom.el('div', { class: 'hub-thread', data: { thread: thread.id } }, [
      WidgetDom.el('div', { class: 'hub-thread-main' }, [
        WidgetDom.el('div', { class: 'hub-thread-top' }, [
          WidgetDom.el('span', { class: 'hub-badge hub-app', style: `background:${meta.color}`, text: meta.short }),
          WidgetDom.el('span', { class: 'hub-thread-title', text: thread.title || people || '(untitled)' }),
          thread.priority && thread.priority !== 'normal' ? WidgetDom.el('span', { class: `hub-prio p-${thread.priority}`, text: thread.priority }) : null,
          thread.count > 1 ? WidgetDom.el('span', { class: 'hub-count', text: String(thread.count) }) : null,
          WidgetDom.el('span', { class: 'hub-thread-time', text: WidgetDom.relativeTime(thread.lastAt) }),
        ]),
        people && people !== thread.title ? WidgetDom.el('div', { class: 'hub-thread-people', text: people }) : null,
        text ? WidgetDom.el('div', { class: 'hub-thread-text', text }) : null,
        this._actions(thread),
      ]),
    ]);
  }

  _actions(thread) {
    const button = (cls, text, fn, title) => WidgetDom.el('button', { class: `hub-btn ${cls}`, text, title, on: { click: fn } });
    return WidgetDom.el('div', { class: 'hub-thread-actions' }, [
      button('hub-reviewed', 'Reviewed', () => this._setState(thread, 'reviewed'), 'Mark as reviewed'),
      button('hub-snooze', 'Snooze 4h', () => this._snooze(thread), 'Hide for four hours'),
      button('hub-done', 'Done', () => this._setState(thread, 'done'), 'Nothing more to do here'),
      thread.url ? button('hub-open-url', 'Open', () => this._openUrl(thread.url), 'Open in the app') : null,
      thread.taskId
        ? WidgetDom.el('span', { class: 'hub-task-mark', text: 'On the board' })
        : button('hub-to-task', 'To task', () => this._toTask(thread), 'Create a board task from this thread'),
    ]);
  }

  _setState(thread, state) {
    this.act(() => this.host.call('setThreadState', thread.id, state, {}));
  }

  _snooze(thread) {
    const until = new Date(Date.now() + HubInboxWidget.SNOOZE_MS).toISOString();
    this.act(() => this.host.call('setThreadState', thread.id, 'snoozed', { snoozeUntil: until }));
  }

  _toTask(thread) {
    const last = thread.lastNotification || {};
    this.act(async () => {
      const task = await this.host.call('createTask', { title: thread.title || last.title || 'Follow up', description: thread.summary || last.body || '' });
      if (task && task.id) await this.host.call('linkThreadToTask', thread.id, task.id);
    });
  }

  static _appMeta(app) {
    return HubInboxWidget.APPS[app] || { short: app || 'web', color: '#6b7280' };
  }
}
