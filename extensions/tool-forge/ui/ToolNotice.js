import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class ToolNotice {
  static render(host, notice, onDismiss) {
    if (!notice) return;
    const n = Dom.el('div', 'luma-callout tf-notice ' + (notice.kind === 'warn' ? 'warn' : 'ok'));
    if (notice.title) n.appendChild(Dom.el('div', 'tf-notice-title', HtmlEscaper.escape(notice.title)));
    if (notice.text) n.appendChild(Dom.el('div', 'tf-notice-line', HtmlEscaper.escape(notice.text)));
    for (const line of (notice.lines || [])) n.appendChild(Dom.el('div', 'tf-notice-line', HtmlEscaper.escape(line)));
    const dismiss = Dom.el('button', 'luma-btn link tf-notice-dismiss', 'Dismiss');
    dismiss.addEventListener('click', onDismiss);
    n.appendChild(dismiss);
    host.appendChild(n);
  }
}
