import CodePanelMarkup from './CodePanelMarkup.js';

export default class CodeBuildPanel {
  constructor() {
    this._el = null;
    this._build = null;
    this._lanes = null;
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
  }
}
