import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import PageIcons from './PageIcons.js';

export default class HeroCard {
  static STARTERS = [
    'Explain how this project is put together',
    'Find the bugs in the file I have open',
    'Add tests for the selected function',
  ];

  constructor(container, page) {
    this._container = container;
    this._page = page;
  }

  static baseName(p) {
    const s = String(p || '').replace(/[\\/]+$/, '');
    const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
    return i >= 0 ? s.slice(i + 1) : s || 'project';
  }

  hide() {
    this._container.classList.remove('show');
  }

  paint() {
    const state = this._page.state;
    if (state.status === 'ready' && this._page.transcript.hasBlocks()) { this.hide(); return; }
    this._container.innerHTML = this._markup(state);
    this._container.classList.add('show');
    this._wireButtons();
  }

  _markup(state) {
    if (state.status === 'ready') return this._readyMarkup(state);
    if (state.status === 'connecting' || state.status === 'starting') return this._connectingMarkup(state);
    return this._offlineMarkup(state);
  }

  _readyMarkup(state) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const who = state.agent ? state.agent.name : 'Code';
    return '<div class="hero-card"><h2>' + PageIcons.ICONS.logo + esc(who) + ' in ' + esc(HeroCard.baseName(state.root)) + '</h2>'
      + '<p>' + (state.resumedMessages ? esc(state.resumedMessages + ' messages resumed. ') : '') + 'Ask for anything in this project: it reads, searches, edits and runs commands with your local model' + (state.model ? ' (' + esc(state.model) + ')' : '') + '.</p>'
      + '<div class="hero-starters">'
      + HeroCard.STARTERS.map((text) => '<button class="starter">' + esc(text) + '</button>').join('')
      + '</div></div>';
  }

  _connectingMarkup(state) {
    const fallback = state.status === 'starting' ? 'Starting LumaBrowser…' : 'Connecting to LumaBrowser…';
    return '<div class="hero-card"><h2>' + PageIcons.ICONS.logo + 'Luma</h2><p><span class="spin"></span> ' + HtmlEscaper.escapeKeepingApostrophes(state.statusMessage || fallback) + '</p></div>';
  }

  _offlineMarkup(state) {
    const err = state.statusMessage ? '<p class="err">' + HtmlEscaper.escapeKeepingApostrophes(state.statusMessage) + '</p>' : '';
    return '<div class="hero-card"><h2>' + PageIcons.ICONS.logo + 'LumaBrowser is not connected</h2>'
      + '<p>The Code agent runs inside LumaBrowser: your local models, tools and agents, with this project as its workspace.</p>' + err
      + '<div class="row"><button class="btn primary" data-a="start">Start LumaBrowser</button><button class="btn" data-a="reconnect">Reconnect</button><button class="btn" data-a="settings">Settings</button></div></div>';
  }

  _wireButtons() {
    const page = this._page;
    this._container.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => page.host.send(b.dataset.a, {})));
    this._container.querySelectorAll('.starter').forEach((b) => b.addEventListener('click', () => {
      page.composer.value = b.textContent;
      page.composer.grow();
      page.composer.focus();
    }));
  }
}
