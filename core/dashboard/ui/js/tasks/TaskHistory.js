import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import MarkdownRenderer from '../../../../llm-server/ui/js/markdown/MarkdownRenderer.js';

export default class TaskHistory {
  static RUN_LIMIT = 30;

  constructor(api, doc, modal) {
    this._api = api;
    this._doc = doc;
    this._modal = modal;
  }

  async open(task) {
    const body = this._body();
    const runs = await this._runs(task.id);
    if (!runs.length) body.innerHTML = '<p class="db-muted">No runs yet.</p>';
    for (const run of runs) body.appendChild(this._runRow(run, task));
    this._modal.open('Run history: ' + task.title, body);
  }

  async openTranscript(run, task) {
    const body = this._body();
    const messages = await this._transcript(run.id, body);
    for (const m of messages) body.appendChild(this._messageRow(m));
    this._modal.open('Run transcript: ' + task.title, body);
  }

  _body() {
    const body = this._doc.createElement('div');
    body.className = 'db-modal-body';
    return body;
  }

  async _runs(taskId) {
    try {
      const r = await this._api.tasks.runs(taskId, { limit: TaskHistory.RUN_LIMIT });
      if (r && r.success) return r.runs || [];
    } catch (_) {}
    return [];
  }

  _runRow(run, task) {
    const row = this._doc.createElement('div');
    row.className = 'db-run-row';
    row.innerHTML = TaskHistory._runRowHtml(run);
    const viewBtn = row.querySelector('.r-view');
    if (viewBtn) viewBtn.addEventListener('click', () => this.openTranscript(run, task));
    return row;
  }

  async _transcript(runId, body) {
    try {
      const r = await this._api.tasks.runTranscript(runId);
      if (r && r.success) return r.messages || [];
      body.innerHTML = '<p class="db-muted">' + HtmlEscaper.escape((r && r.error) || 'Transcript unavailable.') + '</p>';
    } catch (_) {}
    return [];
  }

  _messageRow(m) {
    const row = this._doc.createElement('div');
    row.className = 'db-msg db-msg-' + HtmlEscaper.escape(m.role);
    const label = this._doc.createElement('b');
    label.textContent = m.role === 'user' ? 'Task prompt' : 'Agent';
    const content = this._doc.createElement('div');
    content.className = 'db-msg-body';
    content.innerHTML = MarkdownRenderer.render(m.content || '');
    row.appendChild(label);
    row.appendChild(content);
    return row;
  }

  static _dotClass(status) {
    if (status === 'ok') return 'ok';
    return status === 'running' ? 'run' : 'err';
  }

  static _runRowHtml(run) {
    const esc = HtmlEscaper.escape;
    return '<span class="db-run-dot ' + TaskHistory._dotClass(run.status) + '"></span>'
      + '<div class="db-run-main">'
      + '<b>' + esc((run.startedAt || '').replace('T', ' ').slice(0, 16)) + ' · ' + esc(run.status) + '</b>'
      + '<span class="db-muted">' + esc(run.summary || run.error || '') + '</span>'
      + '</div>'
      + (run.conversationId ? '<button class="db-ghost r-view" type="button">Transcript</button>' : '');
  }
}
