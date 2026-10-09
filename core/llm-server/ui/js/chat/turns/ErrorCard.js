import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ErrorCard {
  static KINDS = [
    { re: /context (length|window|size)|too (long|many tokens)|maximum context|n_ctx|exceeds? the (context|limit)|prompt is too long/i,
      title: 'This conversation is too long for the model.',
      hint: 'Start a new chat, or pick a model with a larger context window.' },
    { re: /\b(401|403)\b|api[ _-]?key|unauthori[sz]ed|forbidden|invalid (x-)?api|authentication/i,
      title: 'The provider rejected the request.',
      hint: 'Check the provider\'s API key in Setup.', setup: true },
    { re: /\b429\b|rate.?limit|quota|overloaded|too many requests/i,
      title: 'The provider is busy or rate limiting.',
      hint: 'Wait a moment, then retry.' },
    { re: /ECONNREFUSED|ENOTFOUND|ECONNRESET|EAI_AGAIN|network|fetch failed|socket hang up|timed? ?out|unreachable|offline/i,
      title: 'Could not reach the model.',
      hint: 'Check that the model server or your connection is up, then retry.' },
    { re: /no model|model not found|not loaded|no slot|failed to load/i,
      title: 'The model is not ready.',
      hint: 'Retry, or pick another model in Setup.', setup: true },
  ];

  static STOPPED = 'stopped';

  constructor(ctx) {
    this._ctx = ctx;
  }

  static describe(error) {
    const raw = String(error || '');
    if (raw === ErrorCard.STOPPED) return { title: 'Stopped before a reply.', hint: '', setup: false, muted: true };
    const kind = ErrorCard.KINDS.find((k) => k.re.test(raw));
    if (kind) return { title: kind.title, hint: kind.hint, setup: !!kind.setup, muted: false };
    return { title: 'Something went wrong.', hint: '', setup: false, muted: false };
  }

  create(m) {
    const d = ErrorCard.describe(m.error);
    const esc = HtmlEscaper.escape;
    const card = Dom.el('div', 'cm-error' + (d.muted ? ' muted' : ''));
    card.setAttribute('role', 'alert');
    const raw = String(m.error || '');
    card.innerHTML = '<div class="cm-error-main">'
      + '<div class="cm-error-title">' + esc(d.title) + '</div>'
      + (d.hint ? '<div class="cm-error-hint">' + esc(d.hint) + '</div>' : '')
      + (raw && raw !== ErrorCard.STOPPED ? '<div class="cm-error-detail">' + esc(raw) + '</div>' : '')
      + '</div>'
      + '<div class="cm-error-btns">'
      + (d.setup ? '<button type="button" class="cm-error-btn" data-err="setup">Open Setup</button>' : '')
      + (this._retryable(m) ? '<button type="button" class="cm-error-btn primary" data-err="retry">' + ChatIcons.retry + '<span>Retry</span></button>' : '')
      + '</div>';
    this._wire(card, m);
    return card;
  }

  _retryable(m) {
    const { state } = this._ctx;
    return !state.streaming && state.isNewestMessage(m);
  }

  _wire(card, m) {
    const retry = card.querySelector('[data-err="retry"]');
    if (retry) retry.addEventListener('click', () => this._ctx.sender.regenerate(m));
    const setup = card.querySelector('[data-err="setup"]');
    if (setup) setup.addEventListener('click', () => this._ctx.composer.openSetup());
  }
}
