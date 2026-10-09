import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import ExtIcons from '../../ui-kit/ui/ExtIcons.js';
import OverflowMenu from '../../ui-kit/ui/OverflowMenu.js';
import TaskRowText from './TaskRowText.js';

export default class TaskList {
  constructor(deps) {
    this._listEl = deps.listEl;
    this._invoke = deps.invoke;
    this._runList = deps.runList;
    this._form = deps.form;
    this._reload = deps.reload;
    this._tasks = [];
    this._expandedId = null;
  }

  get expandedId() { return this._expandedId; }

  render(tasks) {
    this._tasks = tasks;
    if (!this._listEl) return;
    if (tasks.length === 0) {
      this._listEl.innerHTML = '<div class="luma-empty">No timed tasks yet. Click New task to schedule a prompt that runs on its own.</div>';
      return;
    }
    this._listEl.innerHTML = tasks.map((t) => this._rowHtml(t)).join('');
    this._bindRows();
    if (this._expandedId) this.loadRuns(this._expandedId);
  }

  tick() {
    if (!this._listEl) return;
    for (const t of this._tasks) {
      const meta = this._listEl.querySelector(`.luma-dockpanel-row[data-task-id="${t.id}"] .luma-dockpanel-rowmeta`);
      if (meta) meta.textContent = TaskRowText.meta(t);
    }
  }

  reopenRuns(taskId) {
    this._runList.resetPage(taskId);
    return this.loadRuns(taskId);
  }

  loadRuns(taskId) {
    const runsEl = this._listEl?.querySelector(`[data-runs-for="${taskId}"]`);
    return this._runList.load(taskId, runsEl);
  }

  _rowHtml(t) {
    const esc = HtmlEscaper.escape;
    const dot = TaskRowText.dot(t);
    const open = this._expandedId === t.id;
    const running = t.status === 'running';
    return `
          <div class="luma-dockpanel-row is-clickable${open ? ' is-open' : ''}" data-task-id="${esc(t.id)}">
            <div class="luma-dockpanel-rowhead">
              <span class="luma-dot ${dot.cls}" title="${esc(dot.title)}"></span>
              <span class="luma-dockpanel-rowname" title="${esc(t.name)}">${esc(t.name)}</span>
              ${!t.enabled ? '<span class="luma-badge muted">Paused</span>' : ''}
              <div class="luma-dockpanel-rowactions">
                <button class="luma-btn luma-btn--sm tt-run-btn" data-task-id="${esc(t.id)}" title="Run now"${running ? ' disabled' : ''}>${running ? 'Running' : 'Run'}</button>
                <button class="luma-btn luma-btn--sm tt-more-btn" data-task-id="${esc(t.id)}" title="More actions" aria-haspopup="menu">${ExtIcons.MORE}</button>
              </div>
            </div>
            <div class="luma-dockpanel-rowmeta">${esc(TaskRowText.meta(t))}</div>
            ${t.last_error ? `<div class="luma-dockpanel-rowerr" title="${esc(t.last_error)}">${esc(t.last_error)}</div>` : ''}
            <div class="luma-dockpanel-detail${open ? '' : ' ext-hidden'}" data-runs-for="${esc(t.id)}"></div>
          </div>`;
  }

  _bindRows() {
    const list = this._listEl;
    list.querySelectorAll('.luma-dockpanel-row').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.luma-dockpanel-rowactions') || e.target.closest('.luma-dockpanel-detail')) return;
        this._toggleRuns(el.dataset.taskId);
      });
    });
    list.querySelectorAll('.tt-run-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this._trigger(btn.dataset.taskId, btn); });
    });
    list.querySelectorAll('.tt-more-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const task = this._tasks.find((t) => t.id === btn.dataset.taskId);
        if (task) this._openRowMenu(btn, task);
      });
    });
  }

  _toggleRuns(taskId) {
    this._expandedId = this._expandedId === taskId ? null : taskId;
    this.render(this._tasks);
  }

  _openRowMenu(anchor, task) {
    OverflowMenu.open(anchor, [
      { label: task.enabled ? 'Pause' : 'Resume', onClick: () => this._toggleEnabled(task) },
      { label: 'Edit', onClick: () => this._form && this._form.open(task) },
      { sep: true },
      { label: 'Delete', danger: true, onClick: () => this._delete(task) },
    ]);
  }

  async _trigger(taskId, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Running'; }
    try {
      const result = await this._invoke('triggerNow', taskId);
      if (!result.success && result.error) await Dialogs.alert(`Run failed: ${result.error}`);
    } catch (err) {
      console.error('timed-tasks: trigger failed:', err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Run'; }
      await this._reload();
      if (this._expandedId === taskId) await this.reopenRuns(taskId);
    }
  }

  async _toggleEnabled(task) {
    try {
      await this._invoke('updateTask', task.id, { enabled: !task.enabled });
      await this._reload();
    } catch (err) {
      console.error('timed-tasks: pause/resume failed:', err);
    }
  }

  async _delete(task) {
    const ok = await Dialogs.confirm(`Delete "${task.name}" and all of its run history?`, { okLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const result = await this._invoke('deleteTask', task.id);
      if (result.success) await this._afterDelete(task);
      else await Dialogs.alert(`Could not delete the task: ${result.error || 'unknown error'}`);
    } catch (err) {
      console.error('timed-tasks: delete failed:', err);
    }
  }

  async _afterDelete(task) {
    if (this._form && this._form.editingId === task.id) this._form.close();
    if (this._expandedId === task.id) this._expandedId = null;
    await this._reload();
  }
}
