import ExistingLibraryView from '../setup/ExistingLibraryView.js';
import LibraryScanMarkup from './LibraryScanMarkup.js';

export default class LibraryScan {
  static VIEW_LIMIT = 50;

  static DEFAULT_TEXT = {
    note: 'Finds models in LM Studio, Ollama and the Hugging Face cache. Nothing is copied: a link is placed in your models folder.',
    empty: 'No models found outside your models folder. LM Studio, Ollama and the Hugging Face cache were checked.',
    more: 'Point your models folder at that library to use them all.',
  };

  static _mounted = new WeakMap();

  static mount(mountEl, opts) {
    if (!mountEl) return null;
    const existing = LibraryScan._mounted.get(mountEl);
    if (existing) return existing;
    const scan = new LibraryScan(opts || {});
    const root = scan._build();
    if (mountEl.parentElement) mountEl.insertAdjacentElement('afterend', root);
    else mountEl.appendChild(root);
    LibraryScan._mounted.set(mountEl, root);
    return root;
  }

  constructor(opts) {
    this._opts = opts;
    this._text = Object.assign({}, LibraryScan.DEFAULT_TEXT, opts.text || {});
    this._found = [];
    this._scanning = false;
  }

  _build() {
    this._root = document.createElement('div');
    this._root.className = 'ml-scan';
    this._root.innerHTML = LibraryScanMarkup.head(this._text, typeof this._opts.pickDir === 'function');
    this._button = this._root.querySelector('[data-ml-scan="run"]');
    this._body = this._root.querySelector('.ml-scan-body');
    this._root.addEventListener('click', (event) => this._onClick(event));
    return this._root;
  }

  _api() {
    return this._opts.api || window.llmDiagAPI;
  }

  _refresh() {
    if (typeof this._opts.onRefresh === 'function') { this._opts.onRefresh(); return; }
    try { window.dispatchEvent(new Event('luma-models-changed')); } catch (_) {}
  }

  _importArgs(model) {
    if (typeof this._opts.importArgs === 'function') return this._opts.importArgs(model);
    return { sourcePath: model.path, fileName: model.file };
  }

  async _onClick(event) {
    const target = event.target.closest('[data-ml-scan]');
    if (!target || !this._root.contains(target)) return;
    const act = target.getAttribute('data-ml-scan');
    if (act === 'run') await this._runScan();
    else if (act === 'pick') await this._pickAndScan();
    else if (act === 'import') await this._importAndRefresh(Number(target.getAttribute('data-idx')));
    else if (act === 'import-all') await this._importAll(target);
  }

  async _pickAndScan() {
    let dir = null;
    try { dir = await this._opts.pickDir(); } catch (_) { dir = null; }
    if (dir) await this._runScan({ roots: [dir] });
  }

  async _runScan(args) {
    const api = this._api();
    if (this._scanning || !api || typeof api.scanExistingLibraries !== 'function') return;
    const label = this._setScanning(true, null);
    let result = null;
    try { result = await api.scanExistingLibraries(args); } catch (err) { result = { success: false, error: err && err.message }; }
    this._setScanning(false, label);
    if (!result || result.success === false) {
      this._body.hidden = false;
      this._body.innerHTML = LibraryScanMarkup.failure(result && result.error);
      return;
    }
    this._paintResults(result);
  }

  _setScanning(on, label) {
    this._scanning = on;
    this._button.disabled = on;
    const previous = this._button.textContent;
    this._button.textContent = on ? 'Scanning...' : label;
    return previous;
  }

  _paintResults(scan) {
    const view = ExistingLibraryView.view(scan, { limit: LibraryScan.VIEW_LIMIT });
    const skipped = (scan && Array.isArray(scan.skipped)) ? scan.skipped : [];
    this._found = view.shown;
    this._body.hidden = false;
    this._body.innerHTML = LibraryScanMarkup.results(view, skipped, this._text);
    this._found.forEach((m, i) => { if (m.adopted) this._rowAt(i).classList.add('is-done'); });
  }

  _rowAt(index) {
    return this._body.querySelector('[data-ml-scan-row="' + index + '"]');
  }

  async _importAndRefresh(index) {
    if (await this._importOne(index)) this._refresh();
  }

  async _importAll(button) {
    button.disabled = true;
    let any = false;
    for (let i = 0; i < this._found.length; i++) {
      const row = this._rowAt(i);
      if (row && row.classList.contains('is-done')) continue;
      if (await this._importOne(i)) any = true;
    }
    button.remove();
    if (any) this._refresh();
  }

  async _importOne(index) {
    const api = this._api();
    const model = this._found[index];
    const row = this._rowAt(index);
    if (!model || !row || !api || typeof api.importExistingModel !== 'function') return false;
    const button = row.querySelector('[data-ml-scan="import"]');
    const status = row.querySelector('.ml-scan-status');
    if (button) { button.disabled = true; button.textContent = 'Importing...'; }
    let result = null;
    try { result = await api.importExistingModel(this._importArgs(model)); } catch (err) { result = { success: false, error: err && err.message }; }
    if (!result || !result.success) {
      if (button) { button.disabled = false; button.textContent = 'Import'; }
      if (status) status.textContent = (result && result.error) || 'Could not import that model.';
      return false;
    }
    if (button) button.remove();
    if (status) status.textContent = result.mode === 'existing' ? 'Already in your models folder' : 'Added';
    row.classList.add('is-done');
    return true;
  }
}
