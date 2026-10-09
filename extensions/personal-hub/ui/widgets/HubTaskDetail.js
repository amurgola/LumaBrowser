import TaskChrome from './TaskChrome.js';
import WidgetDom from './WidgetDom.js';

export default class HubTaskDetail {
  constructor(root, host, { onChange = () => {}, onHide = null } = {}) {
    this._root = root;
    this._host = host;
    this._onChange = onChange;
    this._onHide = onHide;
    this._el = null;
    this._taskId = null;
  }

  isOpen() {
    return !!this._el;
  }

  async open(taskId) {
    this.close();
    this._taskId = taskId;
    this._el = WidgetDom.el('div', { class: 'hub-detail' }, [WidgetDom.el('div', { class: 'hub-empty', text: 'Loading' })]);
    this._root.appendChild(this._el);
    try {
      const { task, messages, source } = await this._host.call('getTask', taskId);
      if (this._el && this._taskId === taskId) this._render(task, messages || [], source || null);
    } catch (err) {
      if (this._el) this._el.innerHTML = `<div class="hub-error">${WidgetDom.esc((err && err.message) || err)}</div>`;
    }
  }

  close() {
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
    this._taskId = null;
  }

  _render(task, messages, source) {
    this._el.innerHTML = '';
    this._el.appendChild(this._head(task, source));
    this._el.appendChild(this._body(task, messages, source));
    this._el.appendChild(this._composer());
  }

  _head(task, source) {
    const buttons = [];
    if (task.url) {
      buttons.push(WidgetDom.el('button', {
        class: 'hub-btn',
        on: { click: () => this._host.openTab(task.url) },
      }, [TaskChrome.icon('open'), WidgetDom.el('span', { text: task.sourceKind === 'clickup' ? 'Open in ClickUp' : 'Open' })]));
    }
    if (this._onHide) {
      buttons.push(WidgetDom.el('button', {
        class: 'hub-btn hub-hide',
        title: task.hidden ? 'Show this task on the board again' : 'Hide this task from the board',
        on: { click: () => this._toggleHidden(task) },
      }, [TaskChrome.icon(task.hidden ? 'show' : 'hide'), WidgetDom.el('span', { text: task.hidden ? 'Unhide' : 'Hide' })]));
    }
    buttons.push(WidgetDom.el('button', { class: 'hub-btn hub-close', title: 'Close', 'aria-label': 'Close', on: { click: () => this.close() } }, [TaskChrome.icon('close')]));
    const where = (source && source.label) || task.sourceLabel || 'Local task';
    return WidgetDom.el('div', { class: 'hub-detail-head' }, [
      WidgetDom.el('div', { class: 'hub-detail-titles' }, [
        WidgetDom.el('div', { class: 'hub-detail-source', text: where }),
        WidgetDom.el('h3', { class: 'hub-detail-title', text: task.title || 'Untitled task' }),
      ]),
      ...buttons,
    ]);
  }

  async _toggleHidden(task) {
    const hidden = !task.hidden;
    await this._onHide(task.id, hidden);
    if (hidden) this.close();
    else if (this._taskId === task.id) await this.open(task.id);
  }

  _body(task, messages, source) {
    return WidgetDom.el('div', { class: 'hub-detail-body' }, [
      WidgetDom.el('dl', { class: 'hub-detail-meta' }, HubTaskDetail._metaRows(task, source)),
      task.description ? WidgetDom.el('section', {}, [
        WidgetDom.el('h4', { class: 'hub-section-label', text: 'Description' }),
        WidgetDom.el('div', { class: 'hub-detail-desc', text: task.description }),
      ]) : null,
      WidgetDom.el('section', {}, [
        WidgetDom.el('h4', { class: 'hub-section-label', text: messages.length ? `Messages (${messages.length})` : 'Messages' }),
        WidgetDom.el('div', { class: 'hub-msgs' }, messages.length
          ? messages.map((m) => HubTaskDetail._message(m))
          : [WidgetDom.el('div', { class: 'hub-sub', text: 'No messages yet.' })]),
      ]),
    ]);
  }

  static _metaRows(task, source) {
    const rows = [];
    const add = (label, children) => {
      const list = (Array.isArray(children) ? children : [children]).filter(Boolean);
      if (list.length) rows.push(WidgetDom.el('dt', { text: label }), WidgetDom.el('dd', {}, list));
    };
    add('Status', [
      TaskChrome.statusPill(task),
      task.pendingStatus ? WidgetDom.el('span', { class: 'hub-pending', text: `Moving to "${task.pendingStatus}" (not synced yet)` }) : null,
      task.hidden ? WidgetDom.el('span', { class: 'hub-badge', text: 'Hidden' }) : null,
    ]);
    add('Sync', task.syncError ? WidgetDom.el('span', { class: 'hub-sync-error', text: task.syncError }) : null);
    const where = [(source && source.label) || task.sourceLabel, task.spaceName, task.listName].filter(Boolean).join(' / ');
    add('List', where ? WidgetDom.el('span', { text: where }) : null);
    add('Assignees', TaskChrome.names(task.assignees).map((name) => WidgetDom.el('span', { class: 'hub-person' }, [
      WidgetDom.el('span', { class: 'hub-avatar', text: TaskChrome.initials(name) }),
      WidgetDom.el('span', { text: name }),
    ])));
    add('Due', task.dueAt ? WidgetDom.el('span', { text: WidgetDom.formatDate(task.dueAt) }) : null);
    add('Priority', task.priority ? WidgetDom.el('span', { class: `hub-prio p-${task.priority}`, text: task.priority }) : null);
    add('Tags', (task.tags || []).map((tag) => WidgetDom.el('span', { class: 'hub-badge', text: String(tag) })));
    return rows;
  }

  static _message(m) {
    const unsynced = m.direction === 'local' && !m.synced;
    return WidgetDom.el('div', { class: `hub-msg${m.direction === 'local' ? ' is-local' : ''}` }, [
      WidgetDom.el('div', { class: 'hub-msg-head' }, [
        WidgetDom.el('span', { class: 'hub-author', text: m.author || (m.direction === 'local' ? 'You' : 'Remote') }),
        WidgetDom.el('span', { text: WidgetDom.relativeTime(m.at) }),
        unsynced ? WidgetDom.el('span', { class: 'hub-unsynced', text: m.syncError ? `Not sent: ${m.syncError}` : 'Sending' }) : null,
      ]),
      WidgetDom.el('div', { class: 'hub-msg-body', text: m.body }),
    ]);
  }

  _composer() {
    const textarea = WidgetDom.el('textarea', { placeholder: 'Write a message (synced to the task). Ctrl+Enter sends.' });
    const send = WidgetDom.el('button', { class: 'hub-btn hub-primary hub-send', text: 'Send', on: { click: () => this._send(textarea, send) } });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) this._send(textarea, send);
    });
    return WidgetDom.el('div', { class: 'hub-compose' }, [textarea, send]);
  }

  async _send(textarea, button) {
    const body = textarea.value.trim();
    if (!body || !this._taskId) return;
    button.disabled = true;
    try {
      await this._host.call('addTaskMessage', this._taskId, body, {});
      textarea.value = '';
      await this.open(this._taskId);
      this._onChange();
    } catch (err) {
      button.disabled = false;
      const line = this._el && this._el.querySelector('.hub-compose');
      if (line) line.insertAdjacentHTML('beforebegin', `<div class="hub-error">${WidgetDom.esc((err && err.message) || err)}</div>`);
    }
  }
}
