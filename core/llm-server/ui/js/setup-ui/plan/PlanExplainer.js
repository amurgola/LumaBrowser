import PlanExplainerHtml from './PlanExplainerHtml.js';

export default class PlanExplainer {
  static LOG_MAX_LINES = 400;

  constructor(ctx) {
    this._ctx = ctx;
    this._startError = null;
    this._lastState = null;
  }

  async refresh() {
    const doc = this._ctx.doc;
    const api = this._ctx.api;
    const card = doc.getElementById('cardPlanExplainer');
    if (!card || !api || !api.getServerStatus) return;
    let status = null;
    try { status = await api.getServerStatus(); } catch (_) { return; }
    const notes = status && status.plan && Array.isArray(status.plan.notes) ? status.plan.notes : [];
    if (notes.length === 0) { card.hidden = true; return; }
    this._paint(card, status);
  }

  bindEvents() {
    const api = this._ctx.api;
    if (!api || !api.onServerEvent) return;
    api.onServerEvent((evt) => {
      if (!evt) return;
      if (evt.type === 'state-change') this.refresh();
      else if (evt.type === 'log') this.appendLog(evt.payload);
    });
  }

  appendLog(entry) {
    const doc = this._ctx.doc;
    const pre = doc.getElementById('planLogPre');
    if (!pre || !entry || !entry.line) return;
    const span = doc.createElement('span');
    if (entry.stream === 'stderr') span.className = 'plan-log-err';
    span.textContent = entry.line;
    if (pre.childNodes.length > 0) pre.appendChild(doc.createTextNode('\n'));
    pre.appendChild(span);
    while (pre.childNodes.length > PlanExplainer.LOG_MAX_LINES * 2) pre.removeChild(pre.firstChild);
    pre.scrollTop = pre.scrollHeight;
  }

  _paint(card, status) {
    const doc = this._ctx.doc;
    const body = doc.getElementById('planExplainerBody');
    const notesOpen = !!(body.querySelector('.plan-notes-details') || {}).open;
    const logOpen = !!(body.querySelector('.plan-log-details') || {}).open || (status.state === 'error' && this._lastState !== 'error');
    if (status.state !== 'idle') this._startError = null;
    this._lastState = status.state;
    const [pillClass, pillText] = PlanExplainerHtml.pill(status.state);
    const pill = doc.getElementById('planExplainerPill');
    pill.className = 'luma-badge ' + pillClass;
    pill.textContent = pillText;
    card.hidden = false;
    body.className = '';
    body.innerHTML = PlanExplainerHtml.html(status, { notesOpen, logOpen, startError: this._startError });
    this._wireButtons(doc);
  }

  _wireButtons(doc) {
    const api = this._ctx.api;
    const start = doc.getElementById('planStartBtn');
    if (start && api.startServer) start.addEventListener('click', () => this._start(start));
    const stop = doc.getElementById('planStopBtn');
    if (stop && api.stopServer) {
      stop.addEventListener('click', async () => {
        stop.disabled = true;
        try { await api.stopServer(); } catch (_) {}
        this.refresh();
      });
    }
  }

  async _start(button) {
    button.disabled = true;
    button.textContent = 'Starting…';
    this._startError = null;
    try {
      const res = await this._ctx.api.startServer();
      if (res && res.success === false) this._startError = res.error || 'Start failed.';
    } catch (e) { this._startError = (e && e.message) || 'Start failed.'; }
    this.refresh();
  }
}
