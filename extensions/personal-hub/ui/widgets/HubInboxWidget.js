import HubWidgetBase from './HubWidgetBase.js';
import HubSettingsPanel from './HubSettingsPanel.js';
import StatusPicker from './StatusPicker.js';
import TaskChrome from './TaskChrome.js';
import WidgetDom from './WidgetDom.js';

export default class HubInboxWidget extends HubWidgetBase {
  static ATTENTION_AREA = 'queue';
  static REFRESH_EVENTS = ['thread.changed', 'summary.changed', 'context.changed'];
  static SUMMARY = 'summary';
  static DETAIL = 'detail';
  static MODE_STORAGE_KEY = 'hub.activity.mode';
  static TICK_MS = 60000;
  static ALL_APPS = '*';
  static PAGE = 100;
  static DISMISSED = 'done';
  static UNDO_MS = 12000;
  static LOCAL_TARGET = '';
  static TARGET_SEPARATOR = '::';
  static TARGET_STORAGE_KEY = 'hub.board.addTarget';

  static APPS = {
    slack: { short: 'Slack', color: '#4a154b' },
    teams: { short: 'Teams', color: '#5059c9' },
    gmail: { short: 'Gmail', color: '#d93025' },
    outlook: { short: 'Outlook', color: '#0f6cbd' },
    messages: { short: 'SMS', color: '#1a73e8' },
    clickup: { short: 'ClickUp', color: '#7b68ee' },
    proton: { short: 'Proton', color: '#6d4aff' },
    discord: { short: 'Discord', color: '#5865f2' },
    whatsapp: { short: 'WhatsApp', color: '#25d366' },
    telegram: { short: 'Telegram', color: '#2aabee' },
    'google-calendar': { short: 'Calendar', color: '#1a73e8' },
    'calendar.google.com': { short: 'Calendar', color: '#1a73e8' },
  };

  static KINDS = { chat: 'Chat', mail: 'Mail', calendar: 'Calendar', task: 'Task', other: 'Notification' };

  static mount(root, host) {
    return new HubInboxWidget(root, host).mount();
  }

  constructor(root, host) {
    super(root, host);
    this._filter = HubInboxWidget.ALL_APPS;
    this._mode = HubInboxWidget._storedMode();
    this._openCards = new Set();
    this._snapshots = new Map();
    this._limit = HubInboxWidget.PAGE;
    this._showDismissed = false;
    this._undo = null;
    this._undoTimer = null;
    this._taskForm = null;
    this._columns = null;
    this._targets = [];
    this._picker = new StatusPicker(root);
  }

  dispose() {
    clearTimeout(this._undoTimer);
    HubSettingsPanel.closeCurrent();
    this._picker.close();
    super.dispose();
  }

  _renderShell() {
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-head' }, [
      WidgetDom.el('h2', { class: 'hub-title', text: 'Activity' }),
      WidgetDom.el('div', { class: 'hub-seg hub-mode', role: 'tablist', 'aria-label': 'Activity view' }),
      WidgetDom.el('div', { class: 'hub-chips hub-apps' }),
      WidgetDom.el('span', { class: 'hub-spacer' }),
      WidgetDom.el('span', { class: 'hub-dismissed-slot' }),
      HubSettingsPanel.button(this.host, 'summary'),
    ]));
    this.root.appendChild(this._errorLine());
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-undo' }));
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-body hub-threads' }));
  }

  async _load() {
    if (this._mode === HubInboxWidget.SUMMARY) {
      const listed = (await this.host.call('listSummaries')) || {};
      return { mode: HubInboxWidget.SUMMARY, cards: listed.cards || [], status: listed.status || {} };
    }
    const state = this._showDismissed ? 'all' : 'active';
    const listed = (await this.host.call('listThreads', { state, limit: this._limit + 1 })) || [];
    const threads = listed.slice().sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')));
    return { mode: HubInboxWidget.DETAIL, threads: threads.slice(0, this._limit), hasMore: threads.length > this._limit };
  }

  _tick() {
    if (!this._taskForm) this.refresh();
  }

  _paint() {
    this._paintMode();
    this._paintUndo();
    if (this._data.mode === HubInboxWidget.SUMMARY) {
      this._paintSummary();
      return;
    }
    const { threads, hasMore } = this._data;
    this._paintApps(threads);
    this._paintDismissedToggle();
    const visible = threads.filter((t) => this._filter === HubInboxWidget.ALL_APPS || t.app === this._filter);
    const list = this.root.querySelector('.hub-threads');
    list.innerHTML = '';
    if (!visible.length && !hasMore) {
      list.appendChild(this._empty('Nothing yet. Notifications from your chat, mail, calendar and other tabs show up here as they arrive.'));
      return;
    }
    let day = null;
    for (const thread of visible) {
      const key = WidgetDom.dayKey(thread.lastAt);
      if (key !== day) {
        day = key;
        list.appendChild(WidgetDom.el('div', { class: 'hub-day-label hub-feed-day', text: WidgetDom.dayLabel(key) || 'Undated' }));
      }
      list.appendChild(this._row(thread));
    }
    if (hasMore) list.appendChild(this._moreButton());
  }


  _paintMode() {
    const seg = this.root.querySelector('.hub-mode');
    seg.innerHTML = '';
    for (const [mode, label] of [[HubInboxWidget.SUMMARY, 'Summary'], [HubInboxWidget.DETAIL, 'Detail']]) {
      seg.appendChild(WidgetDom.el('button', {
        class: this._mode === mode ? 'is-on' : '', text: label, role: 'tab', data: { mode },
        'aria-selected': this._mode === mode ? 'true' : 'false',
        on: { click: () => this._setMode(mode) },
      }));
    }
  }

  _setMode(mode) {
    if (this._mode === mode) return;
    this._mode = mode;
    this._taskForm = null;
    try { window.localStorage.setItem(HubInboxWidget.MODE_STORAGE_KEY, mode); } catch (_) {}
    this.refresh();
  }

  static _storedMode() {
    try {
      return window.localStorage.getItem(HubInboxWidget.MODE_STORAGE_KEY) === HubInboxWidget.DETAIL ? HubInboxWidget.DETAIL : HubInboxWidget.SUMMARY;
    } catch (_) {
      return HubInboxWidget.SUMMARY;
    }
  }

  _paintSummary() {
    const { cards, status } = this._data;
    this.root.querySelector('.hub-apps').innerHTML = '';
    this.root.querySelector('.hub-dismissed-slot').innerHTML = '';
    const list = this.root.querySelector('.hub-threads');
    list.innerHTML = '';
    if (!cards.length) {
      list.appendChild(this._empty('Nothing going on. Activity from your chat, mail, calendar and other tabs is summed up here by context.'));
      return;
    }
    if (!status.enabled) {
      list.appendChild(WidgetDom.el('div', { class: 'hub-sum-note' }, [
        WidgetDom.el('span', { text: 'These cards are filled in by rules. ' }),
        WidgetDom.el('button', {
          class: 'hub-link hub-sum-setup', text: 'Have a model write them',
          on: { click: (e) => HubSettingsPanel.open(this.host, 'summary', e.currentTarget.ownerDocument) },
        }),
      ]));
    }
    for (const card of cards) list.appendChild(this._card(card, status));
  }

  _card(card, status) {
    const open = this._openCards.has(card.key);
    const ids = card.items.map((t) => t.id);
    const button = (cls, text, fn, title) => WidgetDom.el('button', { class: `hub-row-action ${cls}`, text, title, on: { click: fn } });
    const updating = status.enabled && !!status.model && (card.stale || (card.source === 'rules' && !card.error));
    return WidgetDom.el('div', { class: `hub-sum-card${card.needsYou ? ' needs-you' : ''}`, data: { card: card.key } }, [
      WidgetDom.el('div', { class: 'hub-sum-top' }, [
        WidgetDom.el('span', { class: 'hub-swatch', style: `background:${TaskChrome.safeColor(card.color, '#6b7280')}` }),
        WidgetDom.el('span', { class: 'hub-sum-name', text: card.name }),
        WidgetDom.el('span', { class: 'hub-count', text: `${card.count} item${card.count === 1 ? '' : 's'}` }),
        WidgetDom.el('span', { class: 'hub-spacer' }),
        updating ? WidgetDom.el('span', { class: 'hub-sum-updating', text: 'updating' }) : null,
        WidgetDom.el('span', { class: 'hub-thread-time', text: HubInboxWidget._when(card.lastAt), title: HubInboxWidget._fullTime(card.lastAt) }),
      ]),
      WidgetDom.el('div', { class: 'hub-sum-headline', text: card.headline }),
      card.summary && card.summary !== card.headline ? WidgetDom.el('div', { class: 'hub-sum-text', text: card.summary }) : null,
      card.needsYou ? WidgetDom.el('div', { class: 'hub-sum-needs' }, [
        WidgetDom.el('span', { class: 'hub-prio p-high', text: 'May need you' }),
        WidgetDom.el('span', { class: 'hub-sum-reason', text: card.reason }),
      ]) : null,
      card.asks.length ? WidgetDom.el('div', { class: 'hub-sum-asks' }, card.asks.map((ask) => this._ask(card, ask))) : null,
      card.error ? WidgetDom.el('div', { class: 'hub-sum-error', text: `Summary not updated: ${card.error}`, title: card.error }) : null,
      WidgetDom.el('div', { class: 'hub-sum-actions' }, [
        button('hub-sum-toggle', open ? 'Hide items' : 'Show items', () => this._toggleCard(card.key), 'The notifications behind this card'),
        button('hub-sum-dismiss', 'Dismiss', () => this._dismissMany(ids, card.name), 'Take all of this context out of the feed; new activity brings it back'),
      ]),
      open ? WidgetDom.el('div', { class: 'hub-sum-items' }, card.items.map((t) => this._row(t))) : null,
    ]);
  }

  _ask(card, ask) {
    const item = card.items.find((t) => t.id === ask.threadId);
    const onBoard = !!(item && item.taskId);
    return WidgetDom.el('div', { class: 'hub-sum-ask', data: { thread: ask.threadId } }, [
      WidgetDom.el('span', { class: 'hub-sum-ask-text', text: ask.what }),
      onBoard
        ? WidgetDom.el('span', { class: 'hub-task-mark', text: 'On the board' })
        : WidgetDom.el('button', {
          class: 'hub-row-action hub-ask-to-task', text: 'To task', title: 'Make a board task from this',
          on: { click: () => this.act(() => this.host.call('threadToTask', ask.threadId, {})) },
        }),
    ]);
  }

  _toggleCard(key) {
    if (this._openCards.has(key)) this._openCards.delete(key);
    else this._openCards.add(key);
    this._paint();
  }


  _paintApps(threads) {
    const chips = this.root.querySelector('.hub-apps');
    chips.innerHTML = '';
    const apps = [...new Set(threads.map((t) => t.app).filter(Boolean))].sort();
    if (apps.length < 2) {
      this._filter = HubInboxWidget.ALL_APPS;
      return;
    }
    if (this._filter !== HubInboxWidget.ALL_APPS && !apps.includes(this._filter)) this._filter = HubInboxWidget.ALL_APPS;
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

  _paintDismissedToggle() {
    const slot = this.root.querySelector('.hub-dismissed-slot');
    slot.innerHTML = '';
    slot.appendChild(WidgetDom.el('button', {
      class: `hub-toggle hub-show-dismissed${this._showDismissed ? ' is-on' : ''}`,
      title: this._showDismissed ? 'Stop showing dismissed items' : 'Also show the items you dismissed, to restore them',
      'aria-pressed': this._showDismissed ? 'true' : 'false',
      on: { click: () => { this._showDismissed = !this._showDismissed; this.refresh(); } },
    }, [TaskChrome.icon(this._showDismissed ? 'show' : 'hide'), WidgetDom.el('span', { text: 'Dismissed' })]));
  }

  _moreButton() {
    return WidgetDom.el('div', { class: 'hub-feed-more' }, [
      WidgetDom.el('button', {
        class: 'hub-btn hub-show-earlier',
        text: 'Show earlier',
        on: { click: () => { this._limit += HubInboxWidget.PAGE; this.refresh(); } },
      }),
    ]);
  }


  _row(thread) {
    const meta = HubInboxWidget._appMeta(thread.app);
    const last = thread.lastNotification || {};
    const text = thread.summary || last.body || last.title || '';
    const people = (thread.participants || []).join(', ');
    const dismissed = thread.state === HubInboxWidget.DISMISSED;
    const notable = thread.priority === 'high' || thread.priority === 'urgent';
    const forming = !!this._taskForm && this._taskForm.threadId === thread.id;
    return WidgetDom.el('div', { class: `hub-thread${dismissed ? ' is-dismissed' : ''}`, data: { thread: thread.id, kind: thread.kind || 'other' } }, [
      WidgetDom.el('div', { class: 'hub-thread-main' }, [
        WidgetDom.el('div', { class: 'hub-thread-top' }, [
          WidgetDom.el('span', {
            class: 'hub-badge hub-app', style: `--hub-app:${meta.color}`, text: meta.short,
            title: HubInboxWidget.KINDS[thread.kind] || HubInboxWidget.KINDS.other,
          }),
          WidgetDom.el('span', { class: 'hub-thread-title', text: thread.title || people || '(untitled)' }),
          notable ? WidgetDom.el('span', { class: `hub-prio p-${thread.priority}`, text: thread.priority }) : null,
          thread.count > 1 ? WidgetDom.el('span', { class: 'hub-count', text: String(thread.count), title: `${thread.count} notifications` }) : null,
          WidgetDom.el('span', { class: 'hub-thread-time', text: HubInboxWidget._when(thread.lastAt), title: HubInboxWidget._fullTime(thread.lastAt) }),
        ]),
        people && people !== thread.title ? WidgetDom.el('div', { class: 'hub-thread-people', text: people }) : null,
        text ? WidgetDom.el('div', { class: 'hub-thread-text', text }) : null,
        thread.taskId ? WidgetDom.el('span', { class: 'hub-task-mark', text: 'On the board' }) : null,
        this._snapshotEl(thread.id),
        forming ? this._taskFormEl(thread) : this._actions(thread, dismissed),
      ]),
    ]);
  }

  _actions(thread, dismissed) {
    const button = (cls, text, fn, title) => WidgetDom.el('button', { class: `hub-row-action ${cls}`, text, title, on: { click: fn } });
    return WidgetDom.el('div', { class: 'hub-thread-actions' }, [
      thread.url ? button('hub-open-url', 'Open', () => this._openUrl(thread.url), 'Open in the app') : null,
      this._snapshots.has(thread.id)
        ? button('hub-read-hide', 'Hide', () => { this._snapshots.delete(thread.id); this._paint(); }, 'Hide the conversation text')
        : button('hub-read', 'Read', () => this._readConversation(thread.id), 'Read the conversation from its tab, without opening it'),
      thread.taskId ? null : button('hub-to-task', 'To task', () => this._openTaskForm(thread), 'Make a board task from this'),
      dismissed
        ? button('hub-restore', 'Restore', () => this._restore(thread.id), 'Put it back in the feed')
        : button('hub-dismiss', 'Dismiss', () => this._dismiss(thread), 'Take it out of the feed; new activity brings it back'),
    ]);
  }


  async _readConversation(threadId) {
    this._snapshots.set(threadId, { loading: true });
    this._paint();
    let shown;
    try {
      const { snapshot, reason } = (await this.host.call('snapshotThread', threadId, {})) || {};
      shown = snapshot && snapshot.text ? { text: snapshot.text, scope: snapshot.scope, takenAt: snapshot.takenAt } : { note: reason || 'There was nothing more to read.' };
    } catch (err) {
      shown = { note: (err && err.message) || String(err) };
    }
    if (this._disposed || !this._snapshots.has(threadId)) return;
    this._snapshots.set(threadId, shown);
    this._paint();
  }

  _snapshotEl(threadId) {
    const shown = this._snapshots.get(threadId);
    if (!shown) return null;
    if (shown.loading) return WidgetDom.el('div', { class: 'hub-snapshot is-note', text: 'Reading the conversation...' });
    if (shown.note) return WidgetDom.el('div', { class: 'hub-snapshot is-note', text: shown.note });
    const from = shown.scope === 'conversation' ? 'Read from the conversation' : 'Read from what its tab is showing';
    return WidgetDom.el('div', { class: 'hub-snapshot' }, [
      WidgetDom.el('div', { class: 'hub-snapshot-from', text: `${from}, ${WidgetDom.relativeTime(shown.takenAt)}` }),
      WidgetDom.el('div', { class: 'hub-snapshot-text', text: shown.text }),
    ]);
  }

  static _when(iso) {
    if (!iso) return '';
    return WidgetDom.dayKey(iso) === WidgetDom.dayKey(null) ? WidgetDom.formatTime(iso) : WidgetDom.relativeTime(iso);
  }

  static _fullTime(iso) {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  }


  _dismiss(thread) {
    if (this._taskForm && this._taskForm.threadId === thread.id) this._taskForm = null;
    this._offerUndo({ ids: [thread.id], title: thread.title || (thread.participants || []).join(', ') || 'Item' });
    this.act(() => this.host.call('setThreadState', thread.id, HubInboxWidget.DISMISSED, {}));
  }

  _dismissMany(ids, title) {
    if (!ids.length) return;
    this._taskForm = null;
    this._offerUndo({ ids, title });
    this.act(() => this.host.call('setThreadsState', ids, HubInboxWidget.DISMISSED));
  }

  _restore(id) {
    if (this._undo && this._undo.ids.length === 1 && this._undo.ids[0] === id) this._offerUndo(null);
    this.act(() => this.host.call('setThreadState', id, 'open', {}));
  }

  _undoDismiss() {
    const undo = this._undo;
    if (!undo) return;
    this._offerUndo(null);
    if (undo.ids.length === 1) this.act(() => this.host.call('setThreadState', undo.ids[0], 'open', {}));
    else this.act(() => this.host.call('setThreadsState', undo.ids, 'open'));
  }

  _offerUndo(undo) {
    clearTimeout(this._undoTimer);
    this._undo = undo;
    if (!undo) return;
    this._undoTimer = setTimeout(() => { this._undo = null; if (!this._disposed) this._paintUndo(); }, HubInboxWidget.UNDO_MS);
    if (this._undoTimer && typeof this._undoTimer.unref === 'function') this._undoTimer.unref();
  }

  _paintUndo() {
    const bar = this.root.querySelector('.hub-undo');
    bar.innerHTML = '';
    if (!this._undo) return;
    const { title } = this._undo;
    bar.appendChild(WidgetDom.el('span', { class: 'hub-undo-text', text: `Dismissed "${title}"` }));
    bar.appendChild(WidgetDom.el('button', { class: 'hub-row-action hub-undo-btn', text: 'Undo', on: { click: () => this._undoDismiss() } }));
  }


  async _openTaskForm(thread) {
    this._taskForm = { threadId: thread.id, columnKey: '', target: HubInboxWidget._storedTarget(), busy: false };
    this._paint();
    if (this._columns) return;
    try {
      const [columns, targets] = await Promise.all([this.host.call('listColumns'), this.host.call('listTaskTargets').catch(() => [])]);
      this._columns = Array.isArray(columns) ? columns : [];
      this._targets = Array.isArray(targets) ? targets : [];
    } catch (err) {
      this._columns = null;
      this._showError(err);
    }
    if (!this._disposed && this._taskForm) this._paint();
  }

  _taskFormEl(thread) {
    const form = this._taskForm;
    const column = WidgetDom.el('select', { class: 'hub-task-column', 'aria-label': 'Board column' },
      (this._columns || []).map((c) => WidgetDom.el('option', { value: c.key, text: c.title })));
    if (form.columnKey) column.value = form.columnKey;
    column.addEventListener('change', () => { form.columnKey = column.value; });
    const target = WidgetDom.el('select', { class: 'hub-task-target', 'aria-label': 'Where the task is created' });
    this._fillTargets(target, form.target);
    if (this._columns) form.target = target.value;
    target.addEventListener('change', () => { form.target = target.value; });
    const add = WidgetDom.el('button', {
      class: 'hub-btn hub-primary hub-task-add', text: form.busy ? 'Adding...' : 'Add task', disabled: form.busy || !this._columns,
      on: { click: () => this._submitTask(thread) },
    });
    const cancel = WidgetDom.el('button', {
      class: 'hub-btn hub-task-cancel', text: 'Cancel', disabled: form.busy,
      on: { click: () => { this._taskForm = null; this._paint(); } },
    });
    return WidgetDom.el('div', { class: 'hub-task-form' }, [column, target, add, cancel]);
  }

  _fillTargets(select, value) {
    select.appendChild(WidgetDom.el('option', { value: HubInboxWidget.LOCAL_TARGET, text: 'Local only' }));
    for (const source of this._targets) {
      for (const list of source.lists || []) {
        const single = (source.lists || []).length === 1;
        select.appendChild(WidgetDom.el('option', {
          value: `${source.sourceId}${HubInboxWidget.TARGET_SEPARATOR}${list.id}`,
          text: single ? `${source.label} (ClickUp)` : `${source.label} / ${list.name}`,
        }));
      }
    }
    select.value = value || HubInboxWidget.LOCAL_TARGET;
    if (select.value !== value) select.value = HubInboxWidget.LOCAL_TARGET;
  }

  async _submitTask(thread) {
    const form = this._taskForm;
    if (!form || form.busy) return;
    form.busy = true;
    this._paint();
    const opts = {};
    if (form.columnKey) opts.columnKey = form.columnKey;
    const target = HubInboxWidget._parseTarget(form.target);
    if (target) Object.assign(opts, target);
    try {
      let result = await this.host.call('threadToTask', thread.id, opts);
      if (result && result.needsStatus) {
        const status = await this._picker.pick({
          taskTitle: thread.title || 'This item',
          columnTitle: result.column ? result.column.title : '',
          where: target ? this._targetLabel(target.sourceId) : '',
          statuses: result.statuses || [],
        });
        if (!status) throw new Error('Not added: no ClickUp status was picked.');
        result = await this.host.call('threadToTask', thread.id, { ...opts, status });
        if (result && result.needsStatus) throw new Error(`Not added: "${status}" could not be used for this column.`);
      }
      this._taskForm = null;
      await this.refresh();
    } catch (err) {
      form.busy = false;
      if (!this._disposed) this._paint();
      this._showError(err);
    }
  }

  _targetLabel(sourceId) {
    const source = this._targets.find((t) => t.sourceId === sourceId);
    return source ? source.label : 'ClickUp';
  }

  static _parseTarget(value) {
    const [sourceId, listId] = String(value || '').split(HubInboxWidget.TARGET_SEPARATOR);
    return sourceId && listId ? { sourceId, listId } : null;
  }

  static _storedTarget() {
    try { return window.localStorage.getItem(HubInboxWidget.TARGET_STORAGE_KEY) || HubInboxWidget.LOCAL_TARGET; } catch (_) { return HubInboxWidget.LOCAL_TARGET; }
  }

  static _appMeta(app) {
    return HubInboxWidget.APPS[app] || { short: app || 'web', color: '#6b7280' };
  }
}
