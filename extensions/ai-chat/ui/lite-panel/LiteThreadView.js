import LiteActionCard from './LiteActionCard.js';
import LiteMarkdown from './LiteMarkdown.js';

export default class LiteThreadView {
  constructor({ messagesEl, api }) {
    this._messagesEl = messagesEl;
    this._api = api;
    this._turn = null;
    this._answered = new Set();
  }

  showThread(messages) {
    if (!this._messagesEl) return;
    this._messagesEl.textContent = '';
    this._turn = null;
    for (const m of messages) this.appendMessage(m.role, m.content);
  }

  appendMessage(role, content) {
    if (!this._messagesEl) return;
    const div = LiteThreadView._el('div', `ai-msg ai-msg-${role}`);
    const body = LiteThreadView._el('span', 'ai-msg-content');
    if (role === 'assistant') body.innerHTML = LiteMarkdown.render(content);
    else body.textContent = ' ' + content;
    div.appendChild(LiteThreadView._el('span', 'ai-msg-label', role === 'user' ? 'You:' : 'AI:'));
    div.appendChild(body);
    this._messagesEl.appendChild(div);
    this.scrollToBottom();
  }

  startTurn() {
    this._answered = new Set();
    if (!this._messagesEl) return;
    const wrap = LiteThreadView._el('div', 'ai-lite-turn');
    const run = LiteThreadView._runGroup();
    const msgEl = LiteThreadView._el('div', 'ai-msg ai-msg-assistant');
    const msgContent = LiteThreadView._el('span', 'ai-msg-content');
    msgEl.appendChild(LiteThreadView._el('span', 'ai-msg-label', 'AI:'));
    msgEl.appendChild(msgContent);
    wrap.appendChild(run.group);
    wrap.appendChild(msgEl);
    this._messagesEl.appendChild(wrap);
    this._turn = { wrap, ...run, msgEl, msgContent };
    this.scrollToBottom();
  }

  renderTurn(state) {
    const turn = this._turn;
    if (!turn) return;
    if (state.tools.length > 0) this._renderRun(turn, state);
    turn.msgContent.innerHTML = LiteMarkdown.render(state.content);
    turn.msgEl.style.display = (state.content || !state.running) ? '' : 'none';
    this._renderStopNote(turn, state);
    this._renderError(turn, state);
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this._messagesEl) this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }

  _renderRun(turn, state) {
    turn.group.style.display = '';
    turn.title.textContent = state.running ? 'Working…' : 'Actions';
    turn.meta.textContent = state.running
      ? 'In progress'
      : `${state.tools.length} action${state.tools.length !== 1 ? 's' : ''}`;
    turn.body.textContent = '';
    state.tools.forEach((tool, idx) => turn.body.appendChild(this._toolLine(tool, idx, state.running)));
    if (state.tools.some((t) => t.status === 'approval' || t.status === 'takeover')) turn.group.open = true;
    if (!state.running) turn.group.open = false;
  }

  _toolLine(tool, idx, running) {
    if ((tool.status === 'approval' || tool.status === 'takeover') && running) {
      return LiteActionCard.build(tool, {
        api: this._api,
        answered: this._answered.has(idx),
        onAnswer: () => this._answered.add(idx),
      });
    }
    const status = tool.status === 'done' ? 'success' : (tool.status === 'error' ? 'error' : 'running');
    const name = tool.tool || 'preparing…';
    return LiteThreadView._el('div', `ai-msg-step ${status}`, tool.summary ? `${name}: ${tool.summary}` : name);
  }

  _renderStopNote(turn, state) {
    if (!state.aborted || state.error || turn.abortedEl) return;
    turn.abortedEl = LiteThreadView._el('div', 'ai-msg-step', 'Stopped before finishing.');
    turn.wrap.appendChild(turn.abortedEl);
  }

  _renderError(turn, state) {
    if (!state.error || turn.errorEl) return;
    turn.errorEl = LiteThreadView._el('div', 'ai-msg-step error', `Error: ${state.error.message}`);
    turn.wrap.appendChild(turn.errorEl);
  }

  static _runGroup() {
    const group = document.createElement('details');
    group.className = 'ai-run-group';
    group.open = true;
    group.style.display = 'none';
    const summary = document.createElement('summary');
    const title = LiteThreadView._el('span', 'ai-run-title', 'Working…');
    const meta = LiteThreadView._el('span', 'ai-run-meta', 'In progress');
    summary.appendChild(title);
    summary.appendChild(meta);
    const body = LiteThreadView._el('div', 'ai-run-body');
    group.appendChild(summary);
    group.appendChild(body);
    return { group, title, meta, body };
  }

  static _el(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
}
