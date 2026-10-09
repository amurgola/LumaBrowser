import ChatIcons from '../ChatIcons.js';
import TurnTimings from './TurnTimings.js';
import UsageMeter from '../composer/UsageMeter.js';
import Clipboard from '../../dom/Clipboard.js';
import AttachmentParser from '../../markdown/AttachmentParser.js';

export default class TurnActions {
  static SNIPPET_MAX = 90;

  constructor(ctx) {
    this._ctx = ctx;
  }

  actionRowHtml(m) {
    const { state } = this._ctx;
    const editable = m.id && !state.streaming && state.isNewestMessage(m);
    const edit = editable ? '<button class="cm-act" data-tact="edit" title="Edit this reply and continue from it">' + ChatIcons.edit + '</button>' : '';
    return '<div class="cm-actions">'
      + '<button class="cm-act" data-tact="copy" title="Copy">' + ChatIcons.copy + '</button>'
      + '<button class="cm-act" data-tact="retry" title="Regenerate">' + ChatIcons.retry + '</button>'
      + this._ctx.voice.readButtonHtml(m)
      + edit + TurnTimings.pillHtml(m.timings) + TurnActions._pagerHtml(m) + '</div>';
  }

  userActionRowHtml(m) {
    const edit = m.id ? '<button class="cm-act" data-tact="edit" title="Edit and resend (Up arrow in an empty reply box)">' + ChatIcons.edit + '</button>' : '';
    return '<div class="cm-actions">' + TurnActions._pagerHtml(m)
      + '<button class="cm-act" data-tact="copy" title="Copy">' + ChatIcons.copy + '</button>' + edit + '</div>';
  }

  metaRowHtml(m) {
    if (!m.tokensIn && !m.tokensOut) return '';
    const num = UsageMeter.num;
    let html = '<span class="cm-act-tok" title="This turn used ' + (m.tokensIn || 0)
      + ' input + ' + (m.tokensOut || 0) + ' output tokens">↑' + num(m.tokensIn || 0)
      + ' ↓' + num(m.tokensOut || 0) + ' tok</span>';
    const u = this._ctx.state.lastUsage;
    if (this._isLastAnswer(m) && u && u.window) {
      const used = (m.tokensIn || 0) + (m.tokensOut || 0);
      const pct = Math.min(100, Math.round((used / u.window) * 100));
      html += '<span class="cm-act-tok cm-act-ctx" title="' + used + ' of ' + u.window
        + ' context tokens used (' + pct + '%)">' + pct + '% · ' + num(used) + '/' + num(u.window) + ' ctx</span>';
    }
    return '<div class="cm-meta-row">' + html + '</div>';
  }

  onClick(e) {
    const btn = e.target.closest('[data-tact]');
    if (!btn) return;
    const turn = btn.closest('.cm-turn[data-msg-id]');
    const m = turn && this._ctx.state.messages.find((x) => x.id === turn.dataset.msgId);
    if (!m) return;
    const act = btn.dataset.tact;
    if (act === 'copy') this._copy(m, btn);
    else if (act === 'retry') this._ctx.sender.regenerate(m);
    else if (act === 'speak') this._ctx.voice.readAloud(m, btn);
    else if (act === 'edit' && m.role === 'user') this._ctx.userEditor.edit(m, turn);
    else if (act === 'edit') this._ctx.turnEditor.edit(m, turn);
    else if (act === 'vprev') this.navVariant(m, -1);
    else if (act === 'vnext') this.navVariant(m, 1);
  }

  async navVariant(m, delta) {
    const { api, state } = this._ctx;
    if (state.streaming) return;
    const tgt = (m.variantIndex || 1) + delta;
    if (tgt < 1 || tgt > m.variantCount) return;
    let list = [];
    try {
      const r = await api.conv.variants(m.variantGroup);
      list = (r && r.success && r.variants) || [];
    } catch (_) {}
    const pick = list[tgt - 1];
    if (!pick || !pick.id) return;
    try { await api.conv.setVariant(pick.id); } catch (_) {}
    if (state.activeId) this._ctx.conversation.open(state.activeId);
  }

  async onHover(e) {
    const btn = e.target.closest && e.target.closest('[data-tact="vprev"], [data-tact="vnext"]');
    if (!btn || btn.disabled || btn.dataset.previewed) return;
    btn.dataset.previewed = '1';
    const turn = btn.closest('.cm-turn[data-msg-id]');
    const m = turn && this._ctx.state.messages.find((x) => x.id === turn.dataset.msgId);
    if (!m || !m.variantGroup) return;
    let list = [];
    try {
      const r = await this._ctx.api.conv.variants(m.variantGroup);
      list = (r && r.success && r.variants) || [];
    } catch (_) {}
    const prev = btn.dataset.tact === 'vprev';
    const other = list[(m.variantIndex || 1) - 1 + (prev ? -1 : 1)];
    if (!other) return;
    const text = m.role === 'user' ? AttachmentParser.parse(other.content).text : String(other.content || '');
    btn.title = (prev ? 'Previous version: ' : 'Next version: ') + TurnActions.snippet(text);
  }

  static snippet(text) {
    const flat = String(text || '').replace(/\s+/g, ' ').trim();
    return flat.length > TurnActions.SNIPPET_MAX ? flat.slice(0, TurnActions.SNIPPET_MAX - 1) + '…' : (flat || '(empty)');
  }

  static _pagerHtml(m) {
    if (!(m.variantCount > 1 && m.variantGroup)) return '';
    const idx = m.variantIndex || 1;
    const what = m.role === 'user'
      ? 'Version ' + idx + ' of ' + m.variantCount + ' of this prompt. Each version keeps its own replies.'
      : 'Answer ' + idx + ' of ' + m.variantCount;
    return '<div class="cm-variants">'
      + '<button class="cm-act" data-tact="vprev" title="Previous version"' + (idx <= 1 ? ' disabled' : '') + '>‹</button>'
      + '<span class="cm-var-lbl" title="' + what + '">' + idx + ' / ' + m.variantCount + '</span>'
      + '<button class="cm-act" data-tact="vnext" title="Next version"' + (idx >= m.variantCount ? ' disabled' : '') + '>›</button>'
      + '</div>';
  }

  _isLastAnswer(m) {
    const msgs = this._ctx.state.messages;
    return msgs[msgs.length - 1] === m
      || (msgs.length >= 2 && msgs[msgs.length - 1].role === 'user' && msgs[msgs.length - 2] === m);
  }

  _copy(m, btn) {
    const text = m.role === 'user' ? AttachmentParser.parse(m.content).text : m.content;
    Clipboard.copyText(text).then((ok) => {
      btn.innerHTML = ok ? ChatIcons.check : ChatIcons.x;
      btn.classList.toggle('done', ok);
      btn.title = ok ? '' : 'Copy failed: the clipboard is unavailable';
      setTimeout(() => { btn.innerHTML = ChatIcons.copy; btn.classList.remove('done'); btn.title = ''; }, 1400);
    });
  }
}
