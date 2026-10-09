import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import HarnessText from './HarnessText.js';

export default class RunDetailView {
  static render(run, detail) {
    if (!detail) return '';
    const parts = HarnessText.detailParts(run, detail);
    return '<div class="th-run-detail">'
      + RunDetailView._actions(run)
      + RunDetailView._assertions(parts.assertions)
      + RunDetailView._toolCalls(parts.toolCalls)
      + RunDetailView._notes(parts.notes)
      + RunDetailView._finalResponse(parts.fullLog.finalResponse || '')
      + RunDetailView._conversation(parts.conversation)
      + RunDetailView._error(parts.fullLog.error)
      + '</div>';
  }

  static _actions(run) {
    return `<div class="th-run-detail-actions">
        <button class="luma-btn luma-btn--sm th-copy-md-btn" data-run-id="${HtmlEscaper.escape(run.id)}">Copy as MD</button>
      </div>`;
  }

  static _assertions(assertions) {
    if (!assertions.length) return '';
    const esc = HtmlEscaper.escape;
    return '<div><strong>Assertions:</strong></div>' + assertions.map((a) => `
          <div class="th-assertion">
            <span class="th-assertion-badge ${a.passed ? 'pass' : 'fail'}">${a.passed ? 'PASS' : 'FAIL'}</span>
            <span>${esc(a.name)}</span>
            ${a.detail ? `<span style="opacity:0.5;font-size:10px">${esc(String(a.detail).substring(0, 100))}</span>` : ''}
          </div>
        `).join('');
  }

  static _toolCalls(toolCalls) {
    if (!toolCalls.length) return '';
    const esc = HtmlEscaper.escape;
    return '<div class="th-tool-timeline"><strong>Tool Calls:</strong></div>' + toolCalls.map((tc) => `
          <div class="th-tool-call">
            <span style="opacity:0.4">${esc(tc.iteration)}.</span>
            <span class="th-tool-name">${esc(tc.tool)}</span>
            <span style="opacity:0.6">${esc(String(JSON.stringify(tc.params)).substring(0, 80))}</span>
            <span class="th-tool-duration">${HarnessText.formatDuration(tc.durationMs)}</span>
            <span style="opacity:0.5">${tc.result?.success !== false ? 'ok' : 'err'}</span>
          </div>
        `).join('');
  }

  static _notes(notes) {
    if (!notes.length) return '';
    const esc = HtmlEscaper.escape;
    return '<div class="th-notes-section"><strong>Notes (Manual Review):</strong></div>' + notes.map((n) => `
          <div class="th-note-item">
            ${esc(n.message)}
            ${n.data ? `<pre>${esc(typeof n.data === 'string' ? n.data : JSON.stringify(n.data, null, 2))}</pre>` : ''}
          </div>
        `).join('');
  }

  static _finalResponse(text) {
    if (!text) return '';
    return '<div style="margin-top:8px"><strong>Final Response:</strong></div>' + `<pre>${HtmlEscaper.escape(text)}</pre>`;
  }

  static _conversation(messages) {
    if (!messages.length) return '';
    return '<details class="th-conversation-details"><summary><strong>Conversation Log</strong> (' + messages.length + ' messages)</summary>'
      + messages.map((msg) => RunDetailView._message(msg)).join('')
      + '</details>';
  }

  static _message(msg) {
    const roleClass = msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user';
    return `<div class="th-conv-msg th-conv-msg--${roleClass}"><strong>${HarnessText.roleLabel(msg.role)}:</strong><pre>${HtmlEscaper.escape(msg.content || '')}</pre></div>`;
  }

  static _error(error) {
    if (!error) return '';
    return `<div style="margin-top:8px;color:#f44336"><strong>Error:</strong> ${HtmlEscaper.escape(error)}</div>`;
  }
}
