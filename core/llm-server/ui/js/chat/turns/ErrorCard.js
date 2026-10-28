import ChatIcons from '../ChatIcons.js';
import SettingLink from './SettingLink.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ErrorCard {
  static KINDS = [
    { re: /^Execution timed out after/i,
      title: 'The run hit its time limit.',
      hint: 'Send "continue" to pick up where it stopped, or give this model more time per run.',
      setting: { tune: 'agentTimeoutMinutes' }, continuable: true },
    { re: /context (length|window|size)|too (long|many tokens)|maximum context|n_ctx|exceeds? the (context|limit)|prompt is too long/i,
      title: 'This conversation is too long for the model.',
      hint: 'Start a new chat, or pick a model with a larger context window.' },
    { re: /\b(401|403)\b|api[ _-]?key|unauthori[sz]ed|forbidden|invalid (x-)?api|authentication/i,
      title: 'The provider rejected the request.',
      hint: 'Check the provider\'s API key in Setup.', setting: { setup: 'settings' } },
    { re: /\b429\b|rate.?limit|quota|overloaded|too many requests/i,
      title: 'The provider is busy or rate limiting.',
      hint: 'Wait a moment, then retry.' },
    { re: /ECONNREFUSED|ENOTFOUND|ECONNRESET|EAI_AGAIN|network|fetch failed|socket hang up|timed? ?out|unreachable|offline/i,
      title: 'Could not reach the model.',
      hint: 'Check that the model server or your connection is up, then retry.' },
    { re: /no model|model not found|not loaded|no slot|failed to load/i,
      title: 'The model is not ready.',
      hint: 'Retry, or pick another model in Setup.',
      setting: { setup: 'settings', selector: '#defaultModelSelect', label: 'Choose a model' } },
  ];

  static STOPPED = 'stopped';
  static CONTINUE_TEXT = 'continue';

  constructor(ctx) {
    this._ctx = ctx;
  }

  static describe(error, meta = null) {
    const raw = String(error || '');
    if (raw === ErrorCard.STOPPED) return { title: 'Stopped before a reply.', hint: '', setting: null, continuable: false, muted: true };
    const kind = ErrorCard.KINDS.find((k) => k.re.test(raw)) || { title: 'Something went wrong.', hint: '' };
    const hosted = meta && meta.setting && typeof meta.setting === 'object' ? meta.setting : null;
    return { title: kind.title, hint: kind.hint, setting: hosted || kind.setting || null, continuable: !!kind.continuable, muted: false };
  }

  create(m) {
    const d = ErrorCard.describe(m.error, m.errorMeta);
    const esc = HtmlEscaper.escape;
    const card = Dom.el('div', 'cm-error' + (d.muted ? ' muted' : ''));
    card.setAttribute('role', 'alert');
    const raw = String(m.error || '');
    const setting = this._ctx.settingLink && this._ctx.settingLink.available(d.setting) ? d.setting : null;
    card.innerHTML = '<div class="cm-error-main">'
      + '<div class="cm-error-title">' + esc(d.title) + '</div>'
      + (d.hint ? '<div class="cm-error-hint">' + esc(d.hint) + '</div>' : '')
      + (raw && raw !== ErrorCard.STOPPED ? '<div class="cm-error-detail">' + esc(raw) + '</div>' : '')
      + '</div>'
      + '<div class="cm-error-btns">'
      + (setting ? '<button type="button" class="cm-error-btn" data-err="setting" title="Open this setting, outlined">'
        + (setting.tune ? ChatIcons.sliders : ChatIcons.gear) + '<span>' + esc(SettingLink.label(setting)) + '</span></button>' : '')
      + (d.continuable && this._newest(m) ? '<button type="button" class="cm-error-btn primary" data-err="continue">Continue</button>' : '')
      + (!d.continuable && this._newest(m) ? '<button type="button" class="cm-error-btn primary" data-err="retry">' + ChatIcons.retry + '<span>Retry</span></button>' : '')
      + '</div>';
    this._wire(card, m, setting);
    return card;
  }

  _newest(m) {
    const { state } = this._ctx;
    return !state.streaming && state.isNewestMessage(m);
  }

  _wire(card, m, setting) {
    const retry = card.querySelector('[data-err="retry"]');
    if (retry) retry.addEventListener('click', () => this._ctx.sender.regenerate(m));
    const cont = card.querySelector('[data-err="continue"]');
    if (cont) cont.addEventListener('click', () => { if (!this._ctx.state.streaming) this._ctx.sender.submit(ErrorCard.CONTINUE_TEXT); });
    const edit = card.querySelector('[data-err="setting"]');
    if (edit) edit.addEventListener('click', () => this._ctx.settingLink.open(setting));
  }
}
