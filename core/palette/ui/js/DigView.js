import PaletteHtml from './PaletteHtml.js';

export default class DigView {
  static TAG = /\[([SCD]\d{1,2})\]/g;

  constructor({ el, api, onOpen }) {
    this._el = el;
    this._api = api;
    this._onOpen = onOpen;
    this._chips = new Map();
    this._text = '';
    this.query = '';
    this.active = false;
    el.addEventListener('click', (e) => this._onClick(e));
  }

  start(query) {
    this.query = query;
    this.active = true;
    this._text = '';
    this._chips = new Map();
    this._el.hidden = false;
    this._el.innerHTML = `<div class="pal-dig-head">${PaletteHtml.icon({ kind: 'dig' })}<span>Digging into</span>`
      + `<span class="pal-dig-q">${PaletteHtml.esc(query)}</span></div>`
      + '<div class="pal-answer is-waiting" id="answer">Looking through your settings, chats and the docs...</div>'
      + '<div id="sources"></div>'
      + '<div class="pal-dig-actions"><button class="pal-btn" data-act="chat">Continue in chat</button>'
      + '<button class="pal-btn" data-act="back">Back to results</button></div>';
    this._api.dig(query);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this._el.hidden = true;
    this._el.innerHTML = '';
    this._api.digAbort();
  }

  handle(p) {
    if (!this.active || !p) return;
    if (p.type === 'context') this._context(p.chips || []);
    else if (p.type === 'delta') { this._text += p.text || ''; this._paint(false); }
    else if (p.type === 'done') { this._text = p.text || this._text; this._paint(true); }
    else if (p.type === 'error') this._error(p);
  }

  _context(chips) {
    for (const c of chips) this._chips.set(c.tag, c.item);
    const box = this._el.querySelector('#sources');
    if (!box || !chips.length) return;
    box.innerHTML = '<div class="pal-sources-label">Places it looked at</div>'
      + chips.map((c, i) => PaletteHtml.row(c.item, `src-${i}`).replace('class="pal-row"', `class="pal-row" data-tag="${PaletteHtml.esc(c.tag)}"`)).join('');
  }

  _paint(done) {
    const answer = this._el.querySelector('#answer');
    if (!answer) return;
    answer.classList.remove('is-waiting', 'is-error');
    const html = PaletteHtml.esc(this._text).replace(DigView.TAG, (whole, tag) => {
      const item = this._chips.get(tag);
      if (tag[0] === 'D') return '';
      return item ? DigView.cite(tag, item) : (done ? '' : whole);
    });
    answer.innerHTML = html || (done ? 'No answer came back.' : '');
  }

  static cite(tag, item) {
    const label = `Open ${item.title}`;
    return `<button class="pal-cite" data-tag="${tag}" title="${PaletteHtml.esc(label)}" aria-label="${PaletteHtml.esc(label)}">`
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></button>';
  }

  _error(p) {
    const answer = this._el.querySelector('#answer');
    if (!answer) return;
    answer.classList.remove('is-waiting');
    answer.classList.add('is-error');
    answer.textContent = p.noModel
      ? 'No chat model is set up yet, so there is nothing to answer with. The places below matched your words; Continue in chat opens the chat to pick a model.'
      : `The model could not answer: ${p.message || 'unknown error'}`;
  }

  _onClick(e) {
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'chat') { this._api.continueInChat(this.query); return; }
    if (act && act.dataset.act === 'back') { this.onBack && this.onBack(); return; }
    const tagged = e.target.closest('[data-tag]');
    const item = tagged && this._chips.get(tagged.dataset.tag);
    if (item) this._onOpen(item);
  }
}
