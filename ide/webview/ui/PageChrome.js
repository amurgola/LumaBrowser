import HeroCard from './HeroCard.js';

export default class PageChrome {
  constructor(el, page) {
    this._el = el;
    this._page = page;
  }

  paint() {
    const state = this._page.state;
    this._paintHeader(state);
    this._paintButtons(state);
    this._page.composer.setPlaceholder(PageChrome.placeholder(state));
    this._page.composer.paintGhost();
    this._page.composer.paintHint();
    this._page.hero.paint();
  }

  static placeholder(state) {
    if (state.status !== 'ready') return 'Connect to LumaBrowser to start';
    if (state.context.length) return 'Ask about the attached ' + (state.context.length === 1 ? 'item' : 'items') + '…';
    return state.streaming ? 'Type to queue a follow-up…' : 'Ask about this project…';
  }

  static connClass(state) {
    if (state.status === 'ready') return state.streaming ? 'busy' : 'ready';
    if (state.status === 'error') return 'error';
    return state.status === 'offline' ? '' : 'starting';
  }

  static metaText(state) {
    const bits = [];
    if (state.status === 'ready') { if (state.model) bits.push(state.model); bits.push(HeroCard.baseName(state.root)); }
    else if (state.status === 'starting') bits.push('starting LumaBrowser…');
    else if (state.status === 'connecting') bits.push('connecting…');
    else if (state.status === 'error') bits.push(state.statusMessage || 'error');
    else bits.push('not connected');
    return bits.join(' · ');
  }

  _paintHeader(state) {
    this._el.whoAgent.textContent = state.status === 'ready' ? (state.agent ? state.agent.name : 'Code') : 'Luma';
    this._el.whoMeta.textContent = PageChrome.metaText(state);
    this._el.conn.className = PageChrome.connClass(state);
  }

  _paintButtons(state) {
    this._el.sendBtn.hidden = state.streaming;
    this._el.stopBtn.hidden = !state.streaming;
    this._el.sendBtn.disabled = state.status !== 'ready';
  }
}
