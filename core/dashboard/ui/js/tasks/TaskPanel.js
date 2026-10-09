import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import TaskForm from './TaskForm.js';

export default class TaskPanel {
  static DELETE_ARM_MS = 3000;

  constructor({ api, doc, modal, badges, history }) {
    this._api = api;
    this._doc = doc;
    this._modal = modal;
    this._badges = badges;
    this._history = history;
  }

  async open(rootId, widgetTitle) {
    const body = this._doc.createElement('div');
    body.className = 'db-modal-body';
    await this.render(body, rootId);
    this._modal.open('Scheduled updates: ' + (widgetTitle || 'Live module'), body);
  }

  async render(el, rootId) {
    el.innerHTML = '';
    const tasks = await this._tasks(rootId);
    const rerender = () => this.render(el, rootId);
    for (const t of tasks) el.appendChild(this._row(t, rerender));
    if (!tasks.length) el.appendChild(this._emptyNote());
    el.appendChild(new TaskForm(this._api, this._doc, rootId, rerender).build());
    this._badges.refresh();
  }

  async _tasks(rootId) {
    try {
      const r = await this._api.tasks.list(rootId);
      if (r && r.success) return r.tasks || [];
    } catch (_) {}
    return [];
  }

  _emptyNote() {
    const p = this._doc.createElement('p');
    p.className = 'db-muted';
    p.textContent = 'No scheduled updates for this widget yet.';
    return p;
  }

  _row(t, rerender) {
    const row = this._doc.createElement('div');
    row.className = 'db-task-row';
    row.innerHTML = TaskPanel._rowHtml(t);
    row.querySelector('.t-run').addEventListener('click', (e) => this._runNow(t, e.currentTarget, row.querySelector('.t-status')));
    row.querySelector('.t-toggle').addEventListener('click', async () => {
      await this._api.tasks.setEnabled(t.id, !t.enabled);
      rerender();
    });
    row.querySelector('.t-delete').addEventListener('click', (e) => this._delete(t, e.currentTarget, rerender));
    row.querySelector('.t-history').addEventListener('click', () => this._history.open(t));
    return row;
  }

  async _runNow(t, btn, status) {
    btn.textContent = 'Running…';
    btn.disabled = true;
    const r = await this._api.tasks.runNow(t.id);
    btn.disabled = false;
    btn.textContent = 'Run now';
    if (!status) return;
    status.textContent = (r && r.success)
      ? 'Run finished. Widget data is up to date.'
      : 'Run failed: ' + ((r && r.error) || 'unknown error');
  }

  async _delete(t, btn, rerender) {
    if (btn.dataset.armed !== '1') {
      btn.dataset.armed = '1';
      btn.textContent = 'Really delete?';
      setTimeout(() => { btn.dataset.armed = ''; btn.textContent = 'Delete'; }, TaskPanel.DELETE_ARM_MS);
      return;
    }
    await this._api.tasks.delete(t.id);
    rerender();
  }

  static _rowHtml(t) {
    const esc = HtmlEscaper.escape;
    return '<div class="db-task-main">'
      + '<b>' + esc(t.title) + '</b>'
      + '<span class="db-muted">' + Math.round(t.intervalMs / 60000) + ' min'
      + (t.lastStatus ? ' · last run ' + esc(t.lastStatus) : '')
      + (t.enabled ? '' : ' · paused') + '</span>'
      + '<div class="db-task-prompt">' + esc(t.prompt) + '</div>'
      + '<span class="db-muted t-status"></span>'
      + '</div>'
      + '<div class="db-task-actions">'
      + '<button class="db-ghost t-run" type="button">Run now</button>'
      + '<button class="db-ghost t-toggle" type="button">' + (t.enabled ? 'Pause' : 'Resume') + '</button>'
      + '<button class="db-ghost t-history" type="button">History</button>'
      + '<button class="db-ghost t-delete" type="button">Delete</button>'
      + '</div>';
  }
}
