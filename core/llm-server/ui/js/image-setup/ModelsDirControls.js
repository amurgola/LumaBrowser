import HtmlEscaper from '../format/HtmlEscaper.js';

export default class ModelsDirControls {
  static html(cfg) {
    const esc = HtmlEscaper.escape;
    const isDefault = !!cfg.isUsingDefault;
    const title = isDefault
      ? 'Default location. Type or browse to point at an existing image-model library.'
      : 'Custom path. Default is ' + esc(cfg.defaultPath || '');
    return `
      <div class="models-controls">
        <input type="text" class="models-path-input ${isDefault ? 'is-default' : ''}" id="imgModelsPathInput" value="${esc(cfg.effectivePath || '')}" placeholder="${esc(cfg.defaultPath || '')}"
          title="${title}">
        <button class="luma-btn luma-btn--sm" data-act="dir-browse">Browse…</button>
        ${isDefault ? '' : '<button class="luma-btn luma-btn--sm" data-act="dir-reset">Use default</button>'}
        <span class="path-hint-status" data-img-dir-status></span>
      </div>
    `;
  }

  constructor(body, api, onSaved) {
    this._body = body;
    this._api = api;
    this._onSaved = onSaved;
    this._status = body.querySelector('[data-img-dir-status]');
    this._input = body.querySelector('#imgModelsPathInput');
  }

  wire() {
    const browse = this._body.querySelector('[data-act="dir-browse"]');
    if (browse) browse.addEventListener('click', () => this._browse());
    const reset = this._body.querySelector('[data-act="dir-reset"]');
    if (reset) reset.addEventListener('click', () => { if (this._input) this._input.value = ''; this.save(null); });
    if (!this._input) return;
    this._input.addEventListener('change', () => this.save((this._input.value || '').trim() || null));
    this._input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      this._input.blur();
    });
  }

  async save(dir) {
    this._setStatus('', 'Saving…');
    try {
      const result = await this._api.setModelsDir(dir);
      if (result && result.success === false) { this._setStatus('bad', result.error || 'Save failed.'); return; }
      this._setStatus('ok', 'Saved.');
      await this._onSaved();
    } catch (err) { this._setStatus('bad', (err && err.message) || 'Save failed.'); }
  }

  async _browse() {
    try {
      const result = await this._api.pickModelsDir();
      if (!result || result.canceled || !result.dir) return;
      if (this._input) this._input.value = result.dir;
      await this.save(result.dir);
    } catch (_) {}
  }

  _setStatus(cls, text) {
    if (!this._status) return;
    this._status.className = 'path-hint-status' + (cls ? ' ' + cls : '');
    this._status.textContent = text || '';
  }
}
