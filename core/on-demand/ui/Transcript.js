import HtmlEscaper from '../../llm-server/ui/js/format/HtmlEscaper.js';
import MarkdownRenderer from '../../llm-server/ui/js/markdown/MarkdownRenderer.js';

export default class Transcript {
  static EXAMPLES = ['What is this page about?', 'Click the first headline', 'Scroll to the bottom', 'Find the search box'];
  static LISTENING = 'Listening' + String.fromCharCode(0x2026);

  constructor(logEl) {
    this._log = logEl;
    this._doc = logEl.ownerDocument;
    this._liveBubble = null;
  }

  scrollBottom() {
    this._log.scrollTop = this._log.scrollHeight;
  }

  clear() {
    this._log.innerHTML = '';
    this._liveBubble = null;
    const empty = this._doc.createElement('div');
    empty.className = 'od-empty';
    empty.innerHTML = '<strong>Talk to this page</strong>'
      + 'Ask about it, or tell me what to do here.<div>'
      + Transcript.EXAMPLES.map((t) => '<span class="od-ex" data-ex="' + HtmlEscaper.escape(t) + '">' + HtmlEscaper.escape(t) + '</span>').join('')
      + '</div>';
    this._log.appendChild(empty);
  }

  addUser(text) {
    this._dropEmpty();
    this._dropLiveBubble();
    const b = this._doc.createElement('div');
    b.className = 'od-msg user';
    b.textContent = text;
    this._log.appendChild(b);
    this.scrollBottom();
  }

  addAssistant(initialHtml, cls) {
    this._dropEmpty();
    const bubble = this._doc.createElement('div');
    bubble.className = 'od-msg assistant' + (cls ? ' ' + cls : '');
    const steps = this._doc.createElement('div');
    steps.className = 'od-steps';
    steps.hidden = true;
    const body = this._doc.createElement('div');
    body.className = 'od-body';
    if (initialHtml) body.innerHTML = initialHtml;
    bubble.appendChild(steps);
    bubble.appendChild(body);
    this._log.appendChild(bubble);
    this.scrollBottom();
    return { bubble, body, steps, thinking: null };
  }

  showPartial(text) {
    if (text == null) { this._dropLiveBubble(); return; }
    this._dropEmpty();
    if (!this._liveBubble) {
      this._liveBubble = this._doc.createElement('div');
      this._liveBubble.className = 'od-msg user live';
      this._log.appendChild(this._liveBubble);
    }
    this._liveBubble.textContent = text || Transcript.LISTENING;
    this.scrollBottom();
  }

  restore(rows) {
    if (!Array.isArray(rows) || !rows.length) { this.clear(); return; }
    this._log.innerHTML = '';
    this._liveBubble = null;
    for (const m of rows) {
      if (m.role === 'user') this.addUser(m.content);
      else this.addAssistant(m.error ? HtmlEscaper.escape(m.error) : MarkdownRenderer.render(m.content), m.error ? 'error' : '');
    }
    this.scrollBottom();
  }

  _dropEmpty() {
    const e = this._log.querySelector('.od-empty');
    if (e) e.remove();
  }

  _dropLiveBubble() {
    if (!this._liveBubble) return;
    this._liveBubble.remove();
    this._liveBubble = null;
  }
}
