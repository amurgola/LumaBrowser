import CodePanelMarkup from './CodePanelMarkup.js';

export default class CodeBuildPanel {
  static GAP_PX = 12;

  constructor() {
    this._el = null;
    this._build = null;
    this._lanes = null;
    this._followed = null;
    this._barObserver = null;
  }

  get element() {
    return this._el;
  }

  get build() {
    return this._build;
  }

  setBuild(build) {
    this._build = build;
  }

  setLanes(lanes) {
    this._lanes = lanes;
  }

  ensure() {
    if (this._el && this._el.isConnected) return this._el;
    this._el = document.createElement('div');
    this._el.className = 'cm-code-panel';
    this._el.setAttribute('data-cm-overlay', '');
    this._el.hidden = true;
    document.body.appendChild(this._el);
    return this._el;
  }

  render() {
    if (!this._el) return;
    if (Array.isArray(this._lanes) && this._lanes.length) return this._show(CodePanelMarkup.batchHtml(this._lanes));
    if (!this._build || !Array.isArray(this._build.files) || this._build.files.length === 0) return this.clear();
    return this._show(CodePanelMarkup.buildHtml(this._build));
  }

  clear() {
    if (!this._el) return;
    this._el.hidden = true;
    this._el.innerHTML = '';
  }

  _show(html) {
    this._el.hidden = false;
    this._el.innerHTML = html;
    this._followComposerBar();
  }

  _followComposerBar() {
    const bar = document.querySelector('.cm-composer-bar');
    if (!bar) return;
    this._placeAbove(bar);
    if (this._followed === bar || typeof ResizeObserver !== 'function') return;
    if (this._barObserver) this._barObserver.disconnect();
    this._barObserver = new ResizeObserver(() => this._placeAbove(bar));
    this._barObserver.observe(bar);
    this._followed = bar;
  }

  _placeAbove(bar) {
    const height = bar.getBoundingClientRect().height;
    if (height > 0) this._el.style.bottom = Math.round(height + CodeBuildPanel.GAP_PX) + 'px';
    else this._el.style.removeProperty('bottom');
  }
}
