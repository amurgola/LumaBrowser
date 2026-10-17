import PersonaSeeds from './PersonaSeeds.js';
import LandingStarts from './LandingStarts.js';
import ChatIcons from '../ChatIcons.js';
import ComposerView from '../composer/ComposerView.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class LandingView {
  constructor(ctx) {
    this._ctx = ctx;
  }

  render() {
    this._resetState();
    this._resetChrome();
    this._ctx.els.scroll.innerHTML = this._markup();
    const wrap = this._ctx.els.scroll.querySelector('.cm-landing');
    wrap.querySelectorAll('.cm-chip[data-seed]').forEach((c) => c.addEventListener('click', () => this._fill(c.dataset.seed)));
    this._ctx.composer.wire(wrap);
    if (this._ctx.models) this._ctx.models.renderPill();
    if (!this._override()) this._fillStarts(wrap);
  }

  async _fillStarts(wrap) {
    const ctx = this._ctx;
    const [tabs, persona] = await Promise.all([
      ctx.tabs && ctx.tabs.available() ? ctx.tabs.list() : [],
      this._persona(),
    ]);
    const grid = wrap.querySelector('[data-cm-starts]');
    if (!grid || !wrap.isConnected) return;
    const cards = LandingStarts.build({ tabs, conversations: ctx.state.conversations, seeds: PersonaSeeds.forPersona(persona) });
    grid.innerHTML = cards.map((c, i) => LandingView._card(c, i)).join('');
    grid.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => this._start(cards[+b.dataset.start], b)));
    grid.querySelectorAll('.cm-start-icon img').forEach((img) => img.addEventListener('error', () => img.remove()));
  }

  _persona() {
    const api = this._ctx.api;
    if (!this._personaP) {
      this._personaP = api && typeof api.getPersona === 'function'
        ? Promise.resolve(api.getPersona()).catch(() => 'chat')
        : Promise.resolve('chat');
    }
    return this._personaP;
  }

  async _start(card, btn) {
    if (!card) return;
    if (card.kind === 'tab') {
      await this._ctx.tabs.attach(card.tab, null);
      const ok = this._ctx.state.attachments.some((f) => f.page && f.page.tabId === card.tab.id);
      btn.classList.toggle('cm-start--on', ok);
      btn.querySelector('.cm-start-desc').textContent = ok ? 'Attached to your message' : 'This page could not be read';
    } else if (card.kind === 'conversation') this._ctx.conversation.open(card.id);
    else this._fill(card.seed);
  }

  _fill(text) {
    const ta = this._ctx.root.querySelector('.cm-composer textarea');
    if (ta) { ta.value = text; ta.focus(); ta.dispatchEvent(new Event('input')); }
  }

  _override() {
    const seeds = window.LumaLandingSeeds;
    return Array.isArray(seeds) && seeds.length > 0;
  }

  static _card(c, i) {
    const esc = HtmlEscaper.escape;
    let icon = '';
    if (c.kind === 'tab') {
      icon = '<span class="cm-start-icon">' + ChatIcons.globe + (c.favicon ? '<img src="' + esc(c.favicon) + '" alt="">' : '') + '</span>';
    } else if (c.kind === 'conversation') {
      icon = '<span class="cm-start-icon">' + ChatIcons.clock + '</span>';
    }
    return '<button type="button" class="cm-start cm-start--' + c.kind + '" data-start="' + i + '">'
      + '<span class="cm-start-title">' + icon + '<span class="cm-start-name">' + esc(c.title) + '</span></span>'
      + '<span class="cm-start-desc">' + esc(c.desc) + '</span>'
      + '</button>';
  }

  isShowing() {
    const scroll = this._ctx.els.scroll;
    return !!(scroll && scroll.querySelector('.cm-landing'));
  }

  _resetState() {
    const ctx = this._ctx;
    const { state } = ctx;
    ctx.launcher.leaveActive();
    state.activeId = null;
    state.activeTaskId = null;
    state.activeTriggerId = null;
    state.messages = [];
    state.lastUsage = null;
    state.firstTurn = false;
    state.enterPlainChat();
    state.timingsByMsgId.clear();
    state.previewByMsgId.clear();
  }

  _resetChrome() {
    const ctx = this._ctx;
    ctx.theme.clear();
    ctx.panel.close();
    ctx.codeSurface.report();
    ctx.main.hideTitle();
    if (ctx.els.artifactsBtn) ctx.els.artifactsBtn.style.display = 'none';
    ctx.previewSlot.release();
    ctx.main.clearComposerBar();
  }

  _markup() {
    const esc = HtmlEscaper.escape;
    const seeds = PersonaSeeds.resolve(null)
      .map(([t, ic, seed]) => '<button class="cm-chip" data-seed="' + esc(seed) + '">' + (ic || '') + esc(t) + '</button>').join('');
    return '<div class="cm-landing">'
      + '<div class="cm-landing-col">'
      + '<h1 class="cm-landing-title">Where do you want to start?</h1>'
      + '<p class="cm-landing-context" data-cm-landing-context></p>'
      + ComposerView.html(true)
      + (seeds ? '<div class="cm-starters">' + seeds + '</div>' : '<div class="cm-starts" data-cm-starts></div>')
      + '</div>'
      + '</div>';
  }
}
