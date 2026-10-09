import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import FoldMemory from '../setup/FoldMemory.js';
import CatalogModelRow from './CatalogModelRow.js';
import DownloadDetail from './DownloadDetail.js';
import InstalledModelRow from './InstalledModelRow.js';
import ModelsDirControls from './ModelsDirControls.js';
import ProgressPercent from './ProgressPercent.js';
import QuantPicker from './QuantPicker.js';

export default class ImageModelsCard {
  static SCAN_TEXT = {
    note: 'Finds SD 1.5 and SDXL checkpoints in ComfyUI, Forge, Stable Diffusion WebUI, SD.Next, Fooocus, SwarmUI and Stability Matrix. Nothing is copied: a link is placed in your models folder.',
    empty: 'No compatible checkpoints found. Installs live anywhere, so use "Choose a folder" to point at yours.',
    more: 'Use "Choose a folder" to narrow the scan.',
  };

  static IMPORT_HINT = '<details class="fit-note img-import-hint"><summary>Run a fine-tune like Pony Diffusion V6 XL?</summary>Click <strong>Import custom model</strong>: paste a direct download URL or pick a local .safetensors / .gguf file, choose the base architecture, and the app will install it like a catalog entry.</details>';

  constructor(panel) {
    this._panel = panel;
    this._body = null;
    this._installedCtl = null;
    this._catalogCtl = null;
    this._catalogFoldSeeded = false;
  }

  paint() {
    const body = Dom.byId('imageModelsBody');
    if (!body) return;
    this._ensureScaffold(body);
    body.className = '';
    const store = this._panel.store;
    const installed = store.installedModels();
    this._paintPill(installed);
    this._paintTopChrome(body, installed);
    this.paintInstalledMeta();
    this.paintCatalogMeta();
    this._seedCatalogFold(body, installed);
    this._paintCatalogChrome(body);
    body.querySelector('[data-ml-chrome="bottom"]').innerHTML = ImageModelsCard.IMPORT_HINT;
    this._setRows(installed);
  }

  onModelEvent(evt) {
    if (!evt) return;
    const { type, payload } = evt;
    const store = this._panel.store;
    if (type === 'start') {
      store.downloadError = null;
      store.activeDl = ImageModelsCard.newDownload(payload);
      this.paint();
    } else if (type === 'file-start' || type === 'download') {
      ImageModelsCard.applyProgress(store.activeDl, type, payload);
      this.patchDownloadRow();
    } else if (type === 'done' || type === 'canceled' || type === 'error') {
      if (type === 'error') store.downloadError = (payload && payload.message) || 'Download failed.';
      store.activeDl = null;
      this._panel.refreshModelsAndDefaults();
    }
  }

  static newDownload(payload) {
    const files = (payload && payload.files) || [];
    return {
      id: payload && payload.id, dir: payload && payload.dir, files,
      role: null, received: 0, total: 0, index: 0, totalFiles: files.length || 0,
    };
  }

  static applyProgress(dl, type, payload) {
    if (!dl) return;
    if (type === 'file-start') {
      dl.role = payload.role; dl.received = 0; dl.total = 0;
      dl.index = payload.index; dl.totalFiles = payload.total;
    } else {
      dl.role = payload.role;
      dl.received = payload.received || 0;
      dl.total = payload.total || 0;
    }
  }

  patchDownloadRow() {
    const dl = this._panel.store.activeDl;
    if (dl && this._catalogCtl) this._catalogCtl.patchRow(dl.id, { dlHtml: DownloadDetail.html(dl) });
    this.paintCatalogMeta();
  }

  paintInstalledMeta() {
    const meta = document.querySelector('#imageModelsBody [data-ml-chrome="installed-meta"]');
    if (!meta) return;
    const store = this._panel.store;
    const installed = store.installedModels();
    meta.innerHTML = `<span class="fold-chip">${installed.length}</span>`
      + [...ImageModelsCard.jobsByModel(installed, store.defaults || {})]
        .map(([name, jobs]) => `<span class="fold-chip is-current">${HtmlEscaper.escape(jobs.join(' + '))}: ${HtmlEscaper.escape(name)}</span>`).join('');
  }

  static jobsByModel(installed, defaults) {
    const nameOf = (id) => {
      const m = id && installed.find((x) => x.id === id);
      return m ? (m.displayName || m.label || m.id) : '';
    };
    const byName = new Map();
    for (const [job, id] of [['Generation', defaults.modelId], ['Edit', defaults.editModelId], ['Video', defaults.videoModelId]]) {
      const name = nameOf(id);
      if (name) byName.set(name, (byName.get(name) || []).concat(job));
    }
    return byName;
  }

  paintCatalogMeta() {
    const meta = document.querySelector('#imageModelsBody [data-ml-chrome="catalog-meta"]');
    if (!meta) return;
    const store = this._panel.store;
    const installed = store.installedModels();
    const left = (store.catalog || []).filter((m) => !installed.some((x) => x.id === m.id)).length;
    let dl = '';
    if (store.activeDl) {
      const pct = ProgressPercent.of(store.activeDl.received, store.activeDl.total);
      dl = `<span class="fold-chip is-current">downloading${pct == null ? '' : ' ' + pct + '%'}</span>`;
    }
    meta.innerHTML = `<span class="fold-chip">${left} available</span>` + dl;
  }

  onQuantChange(row, control) {
    const id = control.dataset.id || (row && row.mlKey);
    const model = (this._panel.store.catalog || []).find((x) => x.id === id);
    if (!model) return;
    const rowEl = control.closest('.model-row');
    const chip = rowEl && rowEl.querySelector('.model-size');
    if (!chip) return;
    const bytes = QuantPicker.totalBytes(model, control.value);
    chip.textContent = `~${bytes ? ByteFormatter.bytes(bytes) : '?'}`;
  }

  _ensureScaffold(body) {
    if (this._body === body && body.querySelector('[data-ml-mount="installed"]')) return;
    body.innerHTML = ImageModelsCard._scaffoldHtml();
    this._body = body;
    const actions = (row, act, event, btn) => this._panel.actions.handle(row, act, event, btn);
    this._installedCtl = this._panel.modelList.mount(body.querySelector('[data-ml-mount="installed"]'), 'mlImgInstalled', {
      onAction: actions,
      libraryScan: this._libraryScanOptions(),
    });
    this._catalogCtl = this._panel.modelList.mount(body.querySelector('[data-ml-mount="catalog"]'), 'mlImgCatalog', {
      onAction: actions,
      onChange: (row, control) => this.onQuantChange(row, control),
    });
  }

  _libraryScanOptions() {
    const api = this._panel.api();
    return {
      api,
      onRefresh: () => { this._panel.refreshModelsAndDefaults(); },
      importArgs: (m) => ({ sourcePath: m.path, name: m.name, promptStyle: m.promptStyle }),
      pickDir: async () => {
        const result = await api.pickLibraryDir();
        return (result && result.success && !result.canceled && result.dir) || null;
      },
      text: ImageModelsCard.SCAN_TEXT,
    };
  }

  static _scaffoldHtml() {
    return '<div data-ml-chrome="top"></div>'
      + `<details class="setup-fold" data-fold-key="image.installedModels" data-ml-fold="installed" ${FoldMemory.attr('image.installedModels')}>`
      + '<summary><span class="setup-fold-title">Installed models</span><span class="setup-fold-meta" data-ml-chrome="installed-meta"></span></summary>'
      + '<div class="setup-fold-body"><div class="model-row-list" data-ml-mount="installed"></div></div>'
      + '</details>'
      + `<details class="setup-fold" data-fold-key="image.modelCatalogue" data-ml-fold="catalog" ${FoldMemory.attr('image.modelCatalogue')}>`
      + '<summary><span class="setup-fold-title">Catalogue</span><span class="setup-fold-meta" data-ml-chrome="catalog-meta"></span></summary>'
      + '<div class="setup-fold-body">'
      + '<div data-ml-chrome="cat"></div>'
      + '<div class="model-row-list" data-ml-mount="catalog"></div>'
      + '<div data-ml-chrome="bottom"></div>'
      + '</div>'
      + '</details>';
  }

  _paintPill(installed) {
    const pill = Dom.byId('imageModelsPill');
    if (!pill) return;
    pill.textContent = `${installed.length} installed`;
    pill.className = installed.length ? 'luma-badge ok' : 'luma-badge muted';
  }

  _paintTopChrome(body, installed) {
    const store = this._panel.store;
    const top = body.querySelector('[data-ml-chrome="top"]');
    const cfg = store.models && store.models.config;
    top.innerHTML = ImageModelsCard._errorBanner(store.downloadError)
      + (cfg ? ModelsDirControls.html(cfg) : '')
      + (installed.length === 0 ? '<div class="luma-empty">No models downloaded yet: pick one from the catalogue below.</div>' : '');
    new ModelsDirControls(top, this._panel.api(), () => this._panel.refreshModels()).wire();
    const dismiss = top.querySelector('[data-act="dismiss-err"]');
    if (dismiss) dismiss.addEventListener('click', () => { store.downloadError = null; this.paint(); });
  }

  static _errorBanner(error) {
    if (!error) return '';
    return `<div class="luma-callout bad img-error">
           <span class="img-error-ic">!</span>
           <span class="img-error-msg">${HtmlEscaper.escape(error)}</span>
           <button class="luma-btn luma-btn--sm img-error-dismiss" data-act="dismiss-err">Dismiss</button>
         </div>`;
  }

  _seedCatalogFold(body, installed) {
    if (!this._panel.store.models || installed.length !== 0 || this._catalogFoldSeeded) return;
    this._catalogFoldSeeded = true;
    let stored = null;
    try { stored = window.localStorage.getItem(FoldMemory.PREFIX + 'image.modelCatalogue'); } catch (_) { stored = null; }
    if (stored == null) body.querySelector('[data-ml-fold="catalog"]').open = true;
  }

  _paintCatalogChrome(body) {
    const chrome = body.querySelector('[data-ml-chrome="cat"]');
    chrome.innerHTML = `
      <div class="img-section-title">
        <span></span>
        <button class="luma-btn luma-btn--sm img-import-btn" data-act="import-open"${this._panel.store.activeDl ? ' disabled' : ''}>+ Import custom model</button>
      </div>`;
    chrome.querySelector('[data-act="import-open"]').addEventListener('click', () => this._panel.importModal.open());
  }

  _setRows(installed) {
    const store = this._panel.store;
    if (this._installedCtl) this._installedCtl.set(installed.map((m) => InstalledModelRow.view(m, store.defaults, !!store.activeDl)));
    const catalog = (store.catalog || []).filter((m) => !installed.some((x) => x.id === m.id));
    if (this._catalogCtl) this._catalogCtl.set(catalog.map((m) => CatalogModelRow.view(m, installed, store.activeDl, store.vramBytes)));
  }
}
