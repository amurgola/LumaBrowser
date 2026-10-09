import Dom from '../dom/Dom.js';
import GroundingMarkup from './GroundingMarkup.js';

export default class GroundingSetupCard {
  static POLL_MS = 5000;

  constructor(opts) {
    const options = opts || {};
    this._getRoot = options.getApi || (() => window.llmDiagAPI);
    this._view = null;
    this._desktop = null;
    this._dl = null;
    this._busy = false;
    this._error = null;
    this._timer = null;
    this._onChange = (event) => this._handleChange(event);
    this._onClick = (event) => this._handleClick(event);
  }

  start() {
    this._api = this._getRoot() && this._getRoot().grounding;
    if (!this._api) return false;
    document.addEventListener('change', this._onChange);
    document.addEventListener('click', this._onClick);
    this._api.onEvent((event) => this._onEvent(event));
    this.refresh();
    this._timer = setInterval(() => { if (!document.hidden) this.refresh(); }, GroundingSetupCard.POLL_MS);
    return true;
  }

  stop() {
    document.removeEventListener('change', this._onChange);
    document.removeEventListener('click', this._onClick);
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  async refresh() {
    const [view, desktop] = await Promise.all([this._api.getView(), this._api.desktopState ? this._api.desktopState() : null]);
    if (view && view.success) this._view = view;
    if (desktop && desktop.success) this._desktop = desktop;
    this.render();
  }

  render() {
    const body = Dom.byId('groundingBody');
    if (!body || !this._view) return;
    this._paintPill();
    body.className = '';
    body.innerHTML = GroundingMarkup.html({ view: this._view, desktop: this._desktop, dl: this._dl, busy: this._busy, error: this._error });
  }

  _paintPill() {
    const pill = Dom.byId('groundingPill');
    if (!pill) return;
    const { text, className } = GroundingMarkup.pill(this._view);
    pill.textContent = text;
    pill.className = className;
  }

  _handleChange(event) {
    const box = event.target.closest('#groundingBody input[data-g-desktop]');
    if (box) this._api.setDesktopEnabled(box.checked).then(() => this.refresh());
  }

  async _act(fn) {
    this._busy = true;
    this._error = null;
    this.render();
    try {
      const result = await fn();
      if (result && result.success === false && !result.canceled) this._error = result.error || 'Failed';
    } finally {
      this._busy = false;
      await this.refresh();
    }
  }

  _handleClick(event) {
    const button = event.target.closest('#groundingBody button');
    if (!button) return;
    const api = this._api;
    if (button.hasAttribute('data-g-dl')) this._download(button.getAttribute('data-g-dl'));
    else if (button.hasAttribute('data-g-use')) this._use(button.getAttribute('data-g-use'));
    else if (button.hasAttribute('data-g-cancel')) api.cancelDownload();
    else if (button.hasAttribute('data-g-pick')) this._act(() => api.pickModel());
    else if (button.hasAttribute('data-g-start')) this._act(() => api.start());
    else if (button.hasAttribute('data-g-stop')) this._act(() => api.stop());
    else if (button.hasAttribute('data-g-clear')) this._act(() => api.setModel({ modelPath: null }));
  }

  _download(id) {
    this._dl = { id, file: null, received: 0, total: 0 };
    return this._act(() => this._api.downloadRecommended(id)).finally(() => { this._dl = null; this.render(); });
  }

  _use(id) {
    const rec = (this._view.recommended || []).find((r) => r.id === id);
    if (rec && rec.path) this._act(() => this._api.setModel({ modelPath: rec.path }));
  }

  _onEvent(event) {
    if (!event || event.scope !== 'grounding-model' || !this._dl) return;
    const p = event.payload || {};
    if (event.type !== 'download') return;
    this._dl.file = p.file;
    this._dl.received = p.received || 0;
    this._dl.total = p.total || 0;
    this.render();
  }
}
