import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import PageIcons from './PageIcons.js';

export default class ApprovalBar {
  static KEYS = Object.freeze({ y: 'once', a: 'run', n: 'reject', escape: 'reject' });

  constructor(container, page) {
    this._container = container;
    this._page = page;
    this.lastParams = null;
    document.addEventListener('keydown', (e) => this._onKeydown(e));
  }

  isOpen() {
    return !this._container.hidden;
  }

  show(p) {
    this.lastParams = p.params || null;
    this._page.transcript.setStatus(null);
    this._container.innerHTML = this._markup(p);
    this._container.hidden = false;
    this._container.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => this.decide(b.dataset.d)));
    this._page.composer.setSuggestion('');
    this._container.querySelector('button').focus();
    this._page.transcript.autoscroll();
  }

  hide() {
    this._container.hidden = true;
    this._container.innerHTML = '';
  }

  decide(decision) {
    if (!this.isOpen()) return;
    this._page.host.send('approve', { decision });
    this.hide();
    this._page.transcript.setStatus('working');
    this._page.composer.focus();
  }

  _markup(p) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const g = this._page.grammar;
    const detail = p.detail || g.toolDetail(p.tool, p.params) || p.tool;
    return '<div class="h"><span class="g">' + PageIcons.ICONS.approval + '</span>Approval needed · ' + esc(g.toolStyle(p.tool).verb || p.tool) + '</div>'
      + '<div class="d">' + esc(detail) + '</div>'
      + '<div class="row"><button class="btn primary" data-d="once">Allow once</button><button class="btn" data-d="run">Allow for this run</button><button class="btn" data-d="reject">Deny</button><span class="k">y · a · n</span></div>';
  }

  _onKeydown(e) {
    if (!this.isOpen()) return;
    const key = String(e.key || '').toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(ApprovalBar.KEYS, key)) return;
    const decision = ApprovalBar.KEYS[key];
    e.preventDefault();
    this.decide(decision);
  }
}
