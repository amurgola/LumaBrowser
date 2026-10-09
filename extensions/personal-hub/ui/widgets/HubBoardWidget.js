import HubWidgetBase from './HubWidgetBase.js';
import HubTaskDetail from './HubTaskDetail.js';
import StatusPicker from './StatusPicker.js';
import TaskChrome from './TaskChrome.js';
import WidgetDom from './WidgetDom.js';

export default class HubBoardWidget extends HubWidgetBase {
  static ATTENTION_AREA = 'tasks';
  static REFRESH_EVENTS = ['task.changed', 'board.changed'];
  static ALL_SOURCES = '*';
  static LOCAL_TARGET = '';
  static TARGET_SEPARATOR = '::';
  static TARGET_STORAGE_KEY = 'hub.board.addTarget';
  static PSEUDO_PREFIX = '~';

  static mount(root, host) {
    return new HubBoardWidget(root, host).mount();
  }

  constructor(root, host) {
    super(root, host);
    this._filter = HubBoardWidget.ALL_SOURCES;
    this._showHidden = false;
    this._dragging = null;
    this._targets = [];
    this._addTarget = HubBoardWidget._storedTarget();
    this._picker = new StatusPicker(root);
    this._detail = new HubTaskDetail(root, host, { onChange: () => this._scheduleRefresh(), onHide: (id, hidden) => this._setHidden([id], hidden) });
  }

  dispose() {
    this._detail.close();
    this._picker.close();
    super.dispose();
  }

  _renderShell() {
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-head' }, [
      WidgetDom.el('h2', { class: 'hub-title', text: 'Task board' }),
      WidgetDom.el('div', { class: 'hub-chips hub-sources' }),
      WidgetDom.el('span', { class: 'hub-spacer' }),
      WidgetDom.el('span', { class: 'hub-sub hub-total' }),
      WidgetDom.el('span', { class: 'hub-hidden-slot' }),
    ]));
    this.root.appendChild(this._errorLine());
    this.root.appendChild(WidgetDom.el('div', { class: 'hub-body hub-lanes' }));
  }

  async _load() {
    this._refreshTargets();
    const [columns, tasks] = await Promise.all([this.host.call('listColumns'), this.host.call('listTasks', { includeHidden: true })]);
    return { columns: columns || [], tasks: (tasks || []).filter((t) => !t.archived) };
  }

  _paint() {
    const { columns, tasks } = this._data;
    const colors = TaskChrome.sourceColors(tasks);
    this._paintSources(tasks, colors);
    const inSource = tasks.filter((t) => this._matchesFilter(t));
    const shownCount = inSource.filter((t) => !t.hidden).length;
    const hiddenCount = inSource.length - shownCount;
    this._paintTotals(shownCount, hiddenCount);
    const visible = inSource.filter((t) => this._showHidden || !t.hidden);
    const focus = this._captureQuickAdd();
    const lanes = this.root.querySelector('.hub-lanes');
    lanes.innerHTML = '';
    if (!columns.length) {
      lanes.appendChild(this._empty('No board columns. Add some in Settings > Hub.'));
      return;
    }
    for (const group of HubBoardWidget._pseudoGroups(visible)) lanes.appendChild(this._pseudoLane(group, columns, colors));
    for (const column of columns) lanes.appendChild(this._lane(column, visible.filter((t) => t.columnKey === column.key), colors));
    this._restoreQuickAdd(focus);
  }


  static isPseudo(columnKey) {
    return String(columnKey || '').startsWith(HubBoardWidget.PSEUDO_PREFIX);
  }

  static _pseudoGroups(tasks) {
    const groups = new Map();
    for (const t of tasks) {
      if (!HubBoardWidget.isPseudo(t.columnKey)) continue;
      if (!groups.has(t.columnKey)) groups.set(t.columnKey, { key: t.columnKey, status: t.remoteStatus, color: t.remoteStatusColor, tasks: [], sources: new Set() });
      const group = groups.get(t.columnKey);
      group.tasks.push(t);
      if (t.sourceLabel) group.sources.add(t.sourceLabel);
    }
    return [...groups.values()].sort((a, b) => String(a.status).localeCompare(String(b.status)));
  }

  _pseudoLane(group, columns, colors) {
    const merge = WidgetDom.el('select', { class: 'hub-merge', 'aria-label': `Merge "${group.status}" into a column` }, [
      WidgetDom.el('option', { value: '', text: 'Merge into...' }),
      ...columns.map((c) => WidgetDom.el('option', { value: c.key, text: c.title })),
    ]);
    merge.addEventListener('change', () => {
      if (merge.value) this.act(() => this.host.call('linkStatus', group.status, merge.value));
    });
    const shown = group.tasks.filter((t) => !t.hidden);
    return WidgetDom.el('div', { class: 'hub-lane is-pseudo', data: { column: group.key } }, [
      WidgetDom.el('div', { class: 'hub-lane-head' }, [
        TaskChrome.statusPill({ remoteStatus: group.status, remoteStatusColor: group.color, sourceLabel: [...group.sources].join(', ') }),
        WidgetDom.el('span', { class: 'hub-count', text: String(shown.length) }),
      ]),
      WidgetDom.el('div', { class: 'hub-pseudo-note', text: `${[...group.sources].join(', ') || 'ClickUp'} status with no column yet` }),
      WidgetDom.el('div', { class: 'hub-pseudo-actions' }, [
        WidgetDom.el('button', {
          class: 'hub-btn hub-make-column',
          text: 'Make column',
          title: `Add a "${group.status}" column to the board`,
          on: { click: () => this.act(() => this.host.call('addStatusColumn', group.status)) },
        }),
        merge,
      ]),
      WidgetDom.el('div', { class: 'hub-lane-body' }, group.tasks.map((t) => this._card(t, colors))),
    ]);
  }


  _paintSources(tasks, colors) {
    const chips = this.root.querySelector('.hub-sources');
    chips.innerHTML = '';
    const sources = new Map();
    for (const t of tasks) {
      const key = TaskChrome.sourceKey(t);
      if (!sources.has(key)) sources.set(key, { label: t.sourceId ? (t.sourceLabel || t.sourceId) : 'Local', count: 0 });
      if (!t.hidden) sources.get(key).count += 1;
    }
    if (sources.size < 2) {
      this._filter = HubBoardWidget.ALL_SOURCES;
      return;
    }
    if (this._filter !== HubBoardWidget.ALL_SOURCES && !sources.has(this._filter)) this._filter = HubBoardWidget.ALL_SOURCES;
    const total = [...sources.values()].reduce((n, s) => n + s.count, 0);
    chips.appendChild(this._chip('All', HubBoardWidget.ALL_SOURCES, total, null));
    const ordered = [...sources.entries()].sort(([a, x], [b, y]) => HubBoardWidget._sourceOrder(a, x, b, y));
    for (const [key, s] of ordered) chips.appendChild(this._chip(s.label, key, s.count, colors[key]));
  }

  static _sourceOrder(keyA, a, keyB, b) {
    if (keyA === TaskChrome.LOCAL) return 1;
    if (keyB === TaskChrome.LOCAL) return -1;
    return a.label.localeCompare(b.label);
  }

  _chip(label, value, count, color) {
    return WidgetDom.el('button', {
      class: `hub-chip${this._filter === value ? ' is-on' : ''}`,
      data: { source: value },
      title: `${count} task${count === 1 ? '' : 's'}`,
      on: { click: () => { this._filter = value; this._paint(); } },
    }, [
      color ? WidgetDom.el('span', { class: 'hub-swatch', style: `background:${color}` }) : null,
      WidgetDom.el('span', { class: 'hub-chip-label', text: label }),
      WidgetDom.el('span', { class: 'hub-chip-n', text: String(count) }),
    ]);
  }

  _paintTotals(shownCount, hiddenCount) {
    this.root.querySelector('.hub-total').textContent = `${shownCount} task${shownCount === 1 ? '' : 's'}`;
    const slot = this.root.querySelector('.hub-hidden-slot');
    slot.innerHTML = '';
    if (!hiddenCount) {
      this._showHidden = false;
      return;
    }
    slot.appendChild(WidgetDom.el('button', {
      class: `hub-toggle hub-show-hidden${this._showHidden ? ' is-on' : ''}`,
      title: this._showHidden ? 'Stop showing hidden tasks' : 'Show the tasks you hid',
      'aria-pressed': this._showHidden ? 'true' : 'false',
      on: { click: () => { this._showHidden = !this._showHidden; this._paint(); } },
    }, [TaskChrome.icon(this._showHidden ? 'show' : 'hide'), WidgetDom.el('span', { text: `${hiddenCount} hidden` })]));
  }

  _matchesFilter(task) {
    if (this._filter === HubBoardWidget.ALL_SOURCES) return true;
    return TaskChrome.sourceKey(task) === this._filter;
  }


  _lane(column, tasks, colors) {
    const cards = tasks.map((t) => this._card(t, colors));
    const body = WidgetDom.el('div', { class: 'hub-lane-body' }, cards.length ? cards : [WidgetDom.el('div', { class: 'hub-lane-empty', text: 'Nothing here' })]);
    const lane = WidgetDom.el('div', { class: `hub-lane${column.isDone ? ' is-done' : ''}`, data: { column: column.key } }, [
      WidgetDom.el('div', { class: 'hub-lane-head' }, [
        WidgetDom.el('span', { text: column.title }),
        WidgetDom.el('span', { class: 'hub-count', text: String(tasks.filter((t) => !t.hidden).length) }),
        WidgetDom.el('span', { class: 'hub-spacer' }),
        this._hideAllButton(column, tasks),
      ]),
      this._quickAdd(column),
      body,
    ]);
    this._wireDropTarget(lane, column.key);
    return lane;
  }

  _hideAllButton(column, tasks) {
    const ids = tasks.filter((t) => !t.hidden).map((t) => t.id);
    if (!column.isDone || !ids.length) return null;
    return WidgetDom.el('button', {
      class: 'hub-lane-action hub-hide-all',
      text: 'Hide all',
      title: `Hide the ${ids.length} task${ids.length === 1 ? '' : 's'} in ${column.title}`,
      on: { click: () => this._setHidden(ids, true) },
    });
  }

  _card(task, colors) {
    const overdue = task.dueAt && new Date(task.dueAt).getTime() < Date.now() && !task.hidden;
    const where = [task.sourceId ? task.sourceLabel : '', task.listName].filter(Boolean).join(' / ');
    const card = WidgetDom.el('div', {
      class: `hub-card${task.hidden ? ' is-hidden' : ''}`,
      draggable: 'true',
      data: { task: task.id },
      style: `--hub-source:${colors[TaskChrome.sourceKey(task)] || TaskChrome.LOCAL_COLOR}`,
    }, [
      WidgetDom.el('div', { class: 'hub-card-title', text: task.title || 'Untitled task' }),
      task.remoteStatus ? WidgetDom.el('div', { class: 'hub-card-status' }, [TaskChrome.statusPill(task)]) : null,
      WidgetDom.el('div', { class: 'hub-card-meta' }, [
        task.priority ? WidgetDom.el('span', { class: `hub-dot p-${task.priority}`, title: `Priority: ${task.priority}` }) : null,
        WidgetDom.el('span', { class: 'hub-card-where', text: where || 'Local', title: where || 'Local task' }),
        task.dueAt ? WidgetDom.el('span', { class: `hub-due${overdue ? ' is-overdue' : ''}`, text: WidgetDom.formatDate(task.dueAt) }) : null,
        HubBoardWidget._syncBadge(task),
        TaskChrome.avatars(task.assignees),
      ]),
      this._hideButton(task),
    ]);
    card.addEventListener('click', () => this._detail.open(task.id));
    card.addEventListener('dragstart', (e) => this._onDragStart(e, card, task.id));
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); this._dragging = null; });
    return card;
  }

  static _syncBadge(task) {
    if (task.syncError) return WidgetDom.el('span', { class: 'hub-sync-error', title: task.syncError, text: 'sync failed' });
    if (task.pendingStatus) return WidgetDom.el('span', { class: 'hub-pending', title: `Moving to "${task.pendingStatus}" has not reached the tracker yet`, text: 'sync pending' });
    return null;
  }

  _hideButton(task) {
    const label = task.hidden ? 'Show on the board' : 'Hide from the board';
    return WidgetDom.el('button', {
      class: 'hub-card-hide',
      title: label,
      'aria-label': label,
      on: { click: (e) => { e.stopPropagation(); this._setHidden([task.id], !task.hidden); } },
    }, [TaskChrome.icon(task.hidden ? 'show' : 'hide')]);
  }

  _setHidden(ids, hidden) {
    return this.act(() => this.host.call('setTasksHidden', ids, hidden));
  }


  _quickAdd(column) {
    const input = WidgetDom.el('input', { type: 'text', placeholder: '+ Add a task', 'aria-label': `Add a task to ${column.title}` });
    const select = WidgetDom.el('select', { 'aria-label': 'Where the task is created' });
    this._fillTargets(select);
    select.addEventListener('change', () => this._rememberTarget(select.value));
    const wrap = WidgetDom.el('div', { class: 'hub-lane-add', data: { column: column.key } }, [
      input,
      WidgetDom.el('label', { class: 'hub-target' }, [WidgetDom.el('span', { text: 'Add to' }), select]),
    ]);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submitQuickAdd(column, input, select, wrap);
      else if (e.key === 'Escape') input.blur();
    });
    return wrap;
  }

  async _submitQuickAdd(column, input, select, wrap) {
    const title = input.value.trim();
    if (!title || input.disabled) return;
    const target = HubBoardWidget._parseTarget(select.value);
    const payload = { title, columnKey: column.key };
    if (target) Object.assign(payload, target);
    const placeholder = input.placeholder;
    input.value = '';
    if (target) {
      input.disabled = true;
      wrap.classList.add('is-busy');
      input.placeholder = `Adding to ${this._targetLabel(target.sourceId)}...`;
    }
    try {
      const result = await this.host.call('createTask', payload);
      if (result && result.needsStatus) {
        const list = this._targetListName(target);
        const status = await this._askStatus({ title, sourceLabel: this._targetLabel(target.sourceId), listName: list }, result);
        if (!status) throw new Error('Not added: no ClickUp status was picked.');
        const retried = await this.host.call('createTask', { ...payload, status });
        if (retried && retried.needsStatus) throw new Error(`Not added: "${status}" could not be used for this column.`);
      }
      await this.refresh();
    } catch (err) {
      this._showError(err);
      if (input.isConnected) input.value = title;
    } finally {
      if (input.isConnected) {
        input.disabled = false;
        wrap.classList.remove('is-busy');
        input.placeholder = placeholder;
      }
    }
  }

  _fillTargets(select) {
    const value = this._defaultTarget();
    select.innerHTML = '';
    select.appendChild(WidgetDom.el('option', { value: HubBoardWidget.LOCAL_TARGET, text: 'Local only' }));
    for (const target of this._targets) {
      const lists = target.lists || [];
      if (lists.length === 1) {
        select.appendChild(WidgetDom.el('option', { value: HubBoardWidget._targetValue(target.sourceId, lists[0].id), text: `${target.label} (ClickUp)` }));
        continue;
      }
      select.appendChild(WidgetDom.el('optgroup', { label: target.label }, lists.map((list) => WidgetDom.el('option', {
        value: HubBoardWidget._targetValue(target.sourceId, list.id), text: list.name,
      }))));
    }
    select.value = value;
    if (select.value !== value) select.value = HubBoardWidget.LOCAL_TARGET;
  }

  _defaultTarget() {
    if (this._filter === TaskChrome.LOCAL) return HubBoardWidget.LOCAL_TARGET;
    if (this._filter !== HubBoardWidget.ALL_SOURCES) {
      const remembered = HubBoardWidget._parseTarget(this._addTarget);
      if (remembered && remembered.sourceId === this._filter) return this._addTarget;
      const target = this._targets.find((t) => t.sourceId === this._filter);
      if (target && target.lists && target.lists.length) return HubBoardWidget._targetValue(target.sourceId, target.lists[0].id);
    }
    return this._addTarget || HubBoardWidget.LOCAL_TARGET;
  }

  _rememberTarget(value) {
    this._addTarget = value || HubBoardWidget.LOCAL_TARGET;
    try { window.localStorage.setItem(HubBoardWidget.TARGET_STORAGE_KEY, this._addTarget); } catch (_) {}
  }

  static _storedTarget() {
    try { return window.localStorage.getItem(HubBoardWidget.TARGET_STORAGE_KEY) || HubBoardWidget.LOCAL_TARGET; } catch (_) { return HubBoardWidget.LOCAL_TARGET; }
  }

  async _refreshTargets() {
    try {
      const targets = await this.host.call('listTaskTargets');
      if (this._disposed) return;
      this._targets = Array.isArray(targets) ? targets : [];
      for (const select of this.root.querySelectorAll('.hub-target select')) this._fillTargets(select);
    } catch (_) {
      this._targets = [];
    }
  }

  _targetListName(target) {
    const source = this._targets.find((t) => t.sourceId === target.sourceId);
    const list = source && (source.lists || []).find((l) => l.id === target.listId);
    return list ? list.name : '';
  }

  _targetLabel(sourceId) {
    const target = this._targets.find((t) => t.sourceId === sourceId);
    return target ? target.label : 'ClickUp';
  }

  static _targetValue(sourceId, listId) {
    return `${sourceId}${HubBoardWidget.TARGET_SEPARATOR}${listId}`;
  }

  static _parseTarget(value) {
    const [sourceId, listId] = String(value || '').split(HubBoardWidget.TARGET_SEPARATOR);
    return sourceId && listId ? { sourceId, listId } : null;
  }

  _captureQuickAdd() {
    const active = this.root.ownerDocument.activeElement;
    const wrap = active && active.closest ? active.closest('.hub-lane-add') : null;
    if (!wrap || !this.root.contains(wrap)) return null;
    const input = wrap.querySelector('input');
    return { column: wrap.dataset.column, value: input.value, onSelect: active.tagName === 'SELECT' };
  }

  _restoreQuickAdd(state) {
    if (!state) return;
    const wrap = this.root.querySelector(`.hub-lane-add[data-column="${state.column}"]`);
    if (!wrap) return;
    const input = wrap.querySelector('input');
    input.value = state.value;
    (state.onSelect ? wrap.querySelector('select') : input).focus();
  }


  _onDragStart(e, card, taskId) {
    this._dragging = taskId;
    card.classList.add('is-dragging');
    try { if (e.dataTransfer) e.dataTransfer.setData('text/plain', taskId); } catch (_) {}
  }

  _wireDropTarget(lane, columnKey) {
    lane.addEventListener('dragover', (e) => {
      if (!this._dragging) return;
      e.preventDefault();
      lane.classList.add('is-over');
    });
    lane.addEventListener('dragleave', () => lane.classList.remove('is-over'));
    lane.addEventListener('drop', (e) => {
      e.preventDefault();
      lane.classList.remove('is-over');
      const taskId = this._dragging;
      this._dragging = null;
      if (taskId) this._moveTask(taskId, columnKey);
    });
  }

  _moveTask(taskId, columnKey) {
    const task = (this._data && this._data.tasks || []).find((t) => t.id === taskId);
    if (task && task.columnKey === columnKey) return;
    this.act(async () => {
      let result = await this.host.call('moveTask', taskId, columnKey, {});
      if (result && result.needsStatus) {
        const status = await this._askStatus(task, result);
        if (!status) return;
        result = await this.host.call('moveTask', taskId, columnKey, { status });
      }
      if (result && result.pushError) throw new Error(`Moved locally; tracker update failed: ${result.pushError}`);
    });
  }

  _askStatus(task, reply) {
    return this._picker.pick({
      taskTitle: (task && task.title) || 'This task',
      columnTitle: reply.column ? reply.column.title : '',
      where: task ? [task.sourceLabel, task.listName].filter(Boolean).join(' / ') : '',
      statuses: reply.statuses || [],
    });
  }
}
