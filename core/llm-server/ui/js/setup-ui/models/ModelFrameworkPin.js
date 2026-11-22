import HtmlEscaper from '../../format/HtmlEscaper.js';
import StatusLine from '../StatusLine.js';

export default class ModelFrameworkPin {
  constructor(ctx) {
    this._ctx = ctx;
  }

  static html(m, frameworks, { path, key }) {
    const served = m.servedBy || {};
    const format = frameworks && frameworks.view && served.format ? frameworks.format(served.format) : null;
    if (!path || !format || !format.needsChoice) return '';
    const esc = HtmlEscaper.escape;
    const current = format.frameworkIds.includes(served.pinnedFrameworkId) ? served.pinnedFrameworkId : '';
    const option = (value, label) => `<option value="${esc(value)}"${value === current ? ' selected' : ''}>${esc(label)}</option>`;
    const options = [option('', `Default (${frameworks.nameOf(format.defaultFrameworkId) || format.defaultFrameworkId})`)]
      .concat(format.frameworkIds.map((id) => option(id, frameworks.nameOf(id) || id)));
    return '<label class="model-frame-pin"><span class="model-frame-pin-label">Framework</span>'
      + `<select data-ml-change="framework" data-key="${esc(key)}" data-model-framework="${esc(path)}">${options.join('')}</select>`
      + '<span class="model-frame-pin-status" data-model-framework-status></span></label>';
  }

  async save(select) {
    const api = this._ctx.api;
    if (!api || typeof api.setModelFramework !== 'function') return;
    const status = StatusLine.for(select.parentElement.querySelector('[data-model-framework-status]'), 'model-frame-pin-status');
    select.disabled = true;
    const res = await api.setModelFramework(select.dataset.modelFramework, select.value || null);
    select.disabled = false;
    if (!(res && res.success)) { ModelFrameworkPin._revert(select); status('bad', (res && res.error) || 'Save failed.'); return; }
    this._storeView(res.view);
    this._reportStoppedServer(res.serverStopped);
    this._ctx.refreshLibrary();
  }

  static _revert(select) {
    const saved = Array.from(select.options).find((option) => option.defaultSelected) || select.options[0];
    if (saved) select.value = saved.value;
  }

  _storeView(view) {
    const store = this._ctx.frameworks;
    if (view && store && typeof store.setView === 'function') store.setView(view);
  }

  _reportStoppedServer(serverStopped) {
    const defaults = this._ctx.cards.defaults;
    if (serverStopped && defaults && typeof defaults.showSaveNote === 'function') defaults.showSaveNote(true);
  }
}
