import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class TaskNoticeView {
  static PROVIDER = 'background-task';
  static STATE_WORDS = { done: 'finished', failed: 'failed', canceled: 'stopped' };

  constructor(ctx) {
    this._ctx = ctx;
  }

  static isNotice(m) {
    return !!m && m.role === 'user' && m.provider === TaskNoticeView.PROVIDER;
  }

  render(m) {
    const turn = Dom.el('div', 'cm-turn task-notice' + (this._continuesReply(m) ? ' is-continuation' : ''));
    if (m.id) turn.dataset.msgId = m.id;
    const tasks = TaskNoticeView.tasks(m);
    turn.innerHTML = '<details class="cm-task-notice">'
      + `<summary>${TaskNoticeView._summary(tasks)}</summary>`
      + `<div class="cm-task-notice-body">${TaskNoticeView._rows(tasks)}`
      + '<div class="cm-task-notice-label">What the model was told</div>'
      + `<pre class="cm-task-notice-text">${HtmlEscaper.escape(m.content || '')}</pre></div>`
      + '</details>';
    const made = this._ctx.artifactChips.create(m);
    if (made) turn.appendChild(made);
    return turn;
  }

  _continuesReply(m) {
    const { messages } = this._ctx.state;
    const before = messages[messages.indexOf(m) - 1];
    const startedBy = m.toolCalls && m.toolCalls.startedBy;
    return !!(startedBy && before && before.role === 'assistant' && before.id === startedBy);
  }

  static tasks(m) {
    const list = m && m.toolCalls && Array.isArray(m.toolCalls.backgroundTasks) ? m.toolCalls.backgroundTasks : [];
    return list.filter((task) => task && typeof task.title === 'string');
  }

  static headline(tasks) {
    if (tasks.length !== 1) return `${tasks.length || ''} background tasks ended`.trim();
    return `Background task ${TaskNoticeView.STATE_WORDS[tasks[0].state] || 'ended'}`;
  }

  static detail(tasks) {
    if (tasks.length === 1) return [tasks[0].title, TaskNoticeView.duration(tasks[0].durationMs)].filter(Boolean).join(' · ');
    const counts = Object.entries(TaskNoticeView.STATE_WORDS)
      .map(([state, word]) => [tasks.filter((task) => task.state === state).length, word])
      .filter(([count]) => count > 0);
    return counts.map(([count, word]) => `${count} ${word}`).join(', ');
  }

  static duration(ms) {
    if (!Number.isFinite(Number(ms)) || ms == null) return '';
    const seconds = Math.max(0, Math.round(Number(ms) / 1000));
    if (seconds < 60) return `${seconds} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const rest = minutes % 60;
    return `${Math.floor(minutes / 60)} h ${rest < 10 ? '0' : ''}${rest} min`;
  }

  static _summary(tasks) {
    const esc = HtmlEscaper.escape;
    const failed = tasks.some((task) => task.state === 'failed');
    return `<span class="cm-task-notice-head${failed ? ' is-failed' : ''}">${esc(TaskNoticeView.headline(tasks))}</span>`
      + `<span class="cm-task-notice-detail">${esc(TaskNoticeView.detail(tasks))}</span>`
      + `<span class="cm-task-notice-chevron">${ChatIcons.chevron}</span>`;
  }

  static _rows(tasks) {
    const esc = HtmlEscaper.escape;
    return tasks.map((task) => '<div class="cm-task-notice-row">'
      + `<span class="cm-task-notice-title">${esc(task.title)}</span>`
      + `<span class="cm-task-notice-state">${esc([TaskNoticeView.STATE_WORDS[task.state] || task.state, TaskNoticeView.duration(task.durationMs)].filter(Boolean).join(' · '))}</span>`
      + '</div>').join('');
  }
}
