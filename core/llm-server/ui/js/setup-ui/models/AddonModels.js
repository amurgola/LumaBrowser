import Dialogs from '../../dialogs/Dialogs.js';
import AddonProgress from './AddonProgress.js';
import AddonRow from './AddonRow.js';

export default class AddonModels {
  static NOTE = '<div class="models-default-note">Contributed by extensions and bound to their own runtime. '
    + '<strong>Download &amp; set up</strong> installs that runtime if needed, fetches the file, verifies it, and registers it in the list above.</div>';

  constructor(ctx) {
    this._ctx = ctx;
    this._ctl = null;
    this._models = [];
    this._active = null;
  }

  attach(controller) {
    this._ctl = controller;
  }

  async render(body) {
    const api = this._ctx.api;
    const chrome = body && body.querySelector('[data-ml-chrome="addon-top"]');
    if (!chrome || !this._ctl || !api || !api.addonModelCatalog) return;
    let res = null;
    try { res = await api.addonModelCatalog(); } catch (_) { res = null; }
    this._models = (res && res.success && Array.isArray(res.models)) ? res.models : [];
    const fold = body.querySelector('[data-ml-fold="addon"]');
    if (fold) fold.hidden = this._models.length === 0;
    if (this._models.length === 0) { chrome.innerHTML = ''; this._ctl.set([]); return; }
    const meta = body.querySelector('[data-ml-chrome="addon-meta"]');
    if (meta) meta.innerHTML = AddonModels.metaHtml(this._models);
    chrome.innerHTML = AddonModels.NOTE;
    this._repaintRows();
  }

  static metaHtml(models) {
    const have = models.filter((m) => m.installed).length;
    return `<span class="fold-chip">${models.length} available${have ? ', ' + have + ' installed' : ''}</span>`;
  }

  async onAction(row, act, _e, btn) {
    const id = (btn && btn.dataset.id) || (row && row.mlKey);
    if (act === 'addon-cancel') {
      try { await this._ctx.api.cancelAddonSetup(); } catch (_) {}
      return;
    }
    if (act !== 'addon-dl' || !id) return;
    if (!(await this._acceptLicense(id))) return;
    await this._setup(id);
  }

  bindEvents() {
    const api = this._ctx.api;
    if (!api || !api.onAddonEvent) return;
    api.onAddonEvent(({ id, type, payload }) => {
      if (!this._active || this._active.id !== id) return;
      AddonProgress.apply(this._active, type, payload);
      if (this._ctl) this._ctl.patchRow(id, { dlHtml: AddonRow.progressHtml(this._active) });
    });
  }

  async _acceptLicense(id) {
    const m = this._models.find((x) => x.id === id);
    if (!m || !m.licenseNote) return true;
    return Dialogs.confirm(`${m.label || m.id}\n\n${m.licenseNote}\n\nContinue with the download?`);
  }

  async _setup(id) {
    this._active = { id, phase: 'Starting…', indeterminate: true, received: 0, total: 0, label: '' };
    this._repaintRows();
    const res = await this._ctx.api.setupAddonModel(id);
    const failed = (!res || !res.success) && !(res && res.canceled)
      ? { ...this._active, phase: `Failed: ${(res && res.error) || 'unknown'}`, indeterminate: false, received: 0, total: 0 }
      : null;
    this._active = null;
    if (!failed) { this._ctx.refreshLibrary({ runtimes: true }); return; }
    if (!this._ctl) return;
    this._repaintRows();
    this._ctl.patchRow(id, { dlHtml: AddonRow.progressHtml(failed), expanded: true });
  }

  _repaintRows() {
    if (this._ctl) this._ctl.set(this._models.map((m) => AddonRow.view(m, this._active)), { preserveExpanded: true });
  }
}
