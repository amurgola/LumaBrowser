import ChatIcons from '../ChatIcons.js';
import ActionButton from '../common/ActionButton.js';
import RunTimeText from '../common/RunTimeText.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import MarkdownRenderer from '../../markdown/MarkdownRenderer.js';

export default class ScheduledTaskView {
  constructor(ctx) {
    this._ctx = ctx;
  }

  async open(taskId) {
    const ctx = this._ctx;
    const { api, state } = ctx;
    if (!api.schedTasks) return;
    ScheduledTaskView.enterRunsView(ctx);
    state.activeTaskId = taskId;
    const task = await ScheduledTaskView._fetch(() => api.schedTasks.get(taskId), 'task');
    if (!task) {
      state.activeTaskId = null;
      ctx.landing.render();
      ctx.convList.render(state.conversations);
      return;
    }
    const runs = (await ScheduledTaskView._fetch(() => api.schedTasks.runs(taskId, { limit: 100 }), 'runs')) || [];
    this._render(task, runs);
    ctx.convList.render(state.conversations);
    ctx.codeSurface.report();
  }

  static enterRunsView(ctx, leaveMode) {
    ctx.popovers.closeAll();
    ctx.panel.close();
    ctx.liveArtifacts.dispose();
    ctx.theme.clear();
    if (leaveMode) ctx.launcher.leaveActive();
    ctx.state.activeId = null;
    ctx.state.activeTaskId = null;
    ctx.state.activeTriggerId = null;
    ctx.state.messages = [];
  }

  static async _fetch(call, key) {
    try {
      const r = await call();
      return (r && r.success && r[key]) || null;
    } catch (_) {
      return null;
    }
  }

  static runRowHtml(r, kindChip, extraBody) {
    const esc = HtmlEscaper.escape;
    const dur = RunTimeText.duration(r.startedAt, r.completedAt);
    return '<summary class="cm-run-head">'
      +   '<span class="cm-run-dot ' + esc(r.status || 'running') + '"></span>'
      +   '<span class="cm-run-when">' + esc(RunTimeText.when(r.startedAt)) + '</span>'
      +   kindChip
      +   (dur ? '<span class="cm-run-dur">' + esc(dur) + '</span>' : '')
      +   '<span class="cm-run-status">' + esc(r.status || 'running') + '</span>'
      + '</summary>'
      + '<div class="cm-run-body">'
      +   (extraBody.before || '')
      +   (r.error ? '<div class="cm-run-error">' + esc(r.error) + '</div>' : '')
      +   ScheduledTaskView._responseHtml(r)
      +   (extraBody.after || '')
      + '</div>';
  }

  static _responseHtml(r) {
    if (r.response) return '<div class="cm-run-response cm-md">' + MarkdownRenderer.render(r.response) + '</div>';
    if (r.status === 'running') return '<div class="cm-run-pending">Running…</div>';
    return r.error ? '' : '<div class="cm-run-pending">No response recorded</div>';
  }

  _render(task, runs) {
    const { els } = this._ctx;
    this._ctx.main.showStaticView(task.title);
    const view = Dom.el('div', 'cm-sched-view');
    view.appendChild(this._head(task));
    const listHead = Dom.el('div', 'cm-sched-runs-head');
    listHead.textContent = 'Runs (' + runs.length + ')';
    view.appendChild(listHead);
    if (!runs.length) view.appendChild(Dom.el('div', 'cm-empty', 'No runs yet'));
    for (const r of runs) view.appendChild(ScheduledTaskView._runRow(r));
    const firstRun = view.querySelector('.cm-run');
    if (firstRun) firstRun.open = true;
    els.scroll.appendChild(view);
    els.scroll.scrollTop = 0;
  }

  static _runRow(r) {
    const row = Dom.el('details', 'cm-run');
    const kindChip = r.kind && r.kind !== 'scheduled' ? '<span class="cm-run-kind">' + HtmlEscaper.escape(r.kind) + '</span>' : '';
    row.innerHTML = ScheduledTaskView.runRowHtml(r, kindChip, {});
    return row;
  }

  _head(task) {
    const esc = HtmlEscaper.escape;
    const head = Dom.el('div', 'cm-sched-head');
    const nextRun = task.enabled && task.nextRunAt ? 'Next run ' + RunTimeText.when(task.nextRunAt) : 'Paused';
    head.innerHTML = '<div class="cm-sched-facts">'
      +   '<span class="cm-sched-fact">' + ChatIcons.clock + esc(RunTimeText.every(task.intervalMs)) + '</span>'
      +   '<span class="cm-sched-fact' + (task.enabled ? '' : ' off') + '">' + esc(nextRun) + '</span>'
      +   (task.lastStatus ? '<span class="cm-sched-fact">Last run: ' + esc(task.lastStatus) + '</span>' : '')
      + '</div>'
      + '<details class="cm-sched-prompt"><summary>Task instructions</summary>'
      +   '<div class="cm-sched-prompt-body">' + esc(task.prompt) + '</div>'
      + '</details>'
      + '<div class="cm-sched-actions">'
      +   '<button type="button" class="cm-sched-btn" data-act="run">' + ChatIcons.play + 'Run now</button>'
      +   '<button type="button" class="cm-sched-btn" data-act="toggle">' + (task.enabled ? ChatIcons.pause + 'Pause' : ChatIcons.play + 'Resume') + '</button>'
      +   '<button type="button" class="cm-sched-btn" data-act="edit">' + ChatIcons.edit + 'Edit in chat</button>'
      + '</div>';
    this._wireHead(head, task);
    return head;
  }

  _wireHead(head, task) {
    const { api } = this._ctx;
    const runBtn = head.querySelector('[data-act="run"]');
    runBtn.addEventListener('click', () => ActionButton.run(runBtn, () => api.schedTasks.runNow(task.id), {
      fallback: 'could not start', restoreHtml: ChatIcons.play + 'Run now',
    }));
    head.querySelector('[data-act="toggle"]').addEventListener('click', async () => {
      try { await api.schedTasks.update(task.id, { enabled: !task.enabled }); } catch (_) {}
      await this._ctx.convList.refresh();
      this.open(task.id);
    });
    head.querySelector('[data-act="edit"]').addEventListener('click', () => this._ctx.conversation.open(task.conversationId));
  }
}
