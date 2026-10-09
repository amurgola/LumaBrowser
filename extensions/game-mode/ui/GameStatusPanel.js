import GamePanelMarkup from './GamePanelMarkup.js';

export default class GameStatusPanel {
  static STAGE_SELECTOR = '#chatRoot .cm-stage';

  constructor(actions) {
    this._actions = actions;
    this._el = null;
  }

  get element() {
    return this._el;
  }

  ensure() {
    if (this._el && this._el.isConnected) {
      this._dock();
      return this._el;
    }
    this._el = this._create();
    this._dock();
    return this._el;
  }

  render(game, collapsed) {
    if (!this._el) return;
    if (!GamePanelMarkup.hasContent(game)) {
      this.clear();
      return;
    }
    this._el.hidden = false;
    this._el.classList.toggle('gm-collapsed', collapsed);
    this._el.innerHTML = GamePanelMarkup.html(game, collapsed);
  }

  clear() {
    if (!this._el) return;
    this._el.hidden = true;
    this._el.innerHTML = '';
  }

  note(text, isErr) {
    const n = this._el && this._el.querySelector('.gm-note');
    if (!n) return;
    n.hidden = false;
    n.textContent = text;
    n.classList.toggle('gm-note-err', !!isErr);
  }

  _create() {
    const el = document.createElement('div');
    el.className = 'gm-panel';
    el.setAttribute('data-cm-overlay', '');
    el.hidden = true;
    el.addEventListener('click', (e) => this._onClick(e));
    return el;
  }

  _onClick(e) {
    const btn = e.target && e.target.closest ? e.target.closest('[data-gm]') : null;
    if (!btn) return;
    const handler = this._actions[btn.getAttribute('data-gm')];
    if (typeof handler === 'function') handler();
  }

  _dock() {
    if (this._el.classList.contains('gm-docked')) return;
    const stage = document.querySelector(GameStatusPanel.STAGE_SELECTOR);
    if (stage) {
      this._el.classList.add('gm-docked');
      stage.appendChild(this._el);
    } else if (!this._el.isConnected) {
      document.body.appendChild(this._el);
    }
  }
}
