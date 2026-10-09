import ChatIcons from '../ChatIcons.js';
import PersonaSeeds from './PersonaSeeds.js';
import ComposerView from '../composer/ComposerView.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class LandingView {
  constructor(ctx) {
    this._ctx = ctx;
    this._personaSeeds = null;
    this._personaRequested = false;
  }

  render() {
    this._resetState();
    this._resetChrome();
    this._ctx.els.scroll.innerHTML = this._markup();
    const wrap = this._ctx.els.scroll.querySelector('.cm-landing');
    wrap.querySelectorAll('.cm-chip[data-seed]').forEach((c) => c.addEventListener('click', () => {
      const ta = this._ctx.root.querySelector('.cm-composer textarea');
      if (ta) { ta.value = c.dataset.seed; ta.focus(); ta.dispatchEvent(new Event('input')); }
    }));
    this._ctx.composer.wire(wrap);
  }

  isShowing() {
    const scroll = this._ctx.els.scroll;
    return !!(scroll && scroll.querySelector('.cm-landing'));
  }

  _loadPersonaSeeds() {
    const api = this._ctx.api;
    if (this._personaRequested || !api || typeof api.getPersona !== 'function') return;
    this._personaRequested = true;
    Promise.resolve(api.getPersona()).then((p) => {
      this._personaSeeds = PersonaSeeds.forPersona(p);
      const override = window.LumaLandingSeeds;
      if ((!Array.isArray(override) || !override.length) && this._ctx.state.activeId == null) this.render();
    }).catch(() => {});
  }

  _resetState() {
    const ctx = this._ctx;
    const { state } = ctx;
    ctx.launcher.leaveActive();
    state.activeId = null;
    this._loadPersonaSeeds();
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
    const seeds = PersonaSeeds.resolve(this._personaSeeds)
      .map(([t, ic, seed]) => '<button class="cm-chip" data-seed="' + esc(seed) + '">' + (ic || '') + esc(t) + '</button>').join('');
    return '<div class="cm-landing">'
      + '<div class="cm-greet"><span class="cm-star">' + ChatIcons.logo + '</span>' + esc(PersonaSeeds.greeting()) + '</div>'
      + ComposerView.html(true)
      + (seeds ? '<div class="cm-starters">' + seeds + '</div>' : '')
      + '</div>';
  }
}
