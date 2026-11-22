import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import HostPlatform from '../wizard/HostPlatform.js';
import FormatLabels from '../setup-ui/frameworks/FormatLabels.js';
import ModelSearchDetail from './ModelSearchDetail.js';
import ModelSearchDownload from './ModelSearchDownload.js';
import ModelSearchRow from './ModelSearchRow.js';

export default class ModelSearch {
  static DEBOUNCE_MS = 200;

  static RESULT_LIMIT = 30;

  static DEFAULT_SORT = 'trending';

  static GGUF = 'gguf';

  static MLX = 'mlx';

  static FORMAT_LABELS = Object.freeze({ gguf: 'GGUF', mlx: 'MLX' });

  static formatLabel(format) {
    return ModelSearch.FORMAT_LABELS[format] || FormatLabels.noun(format);
  }

  static EMPTY_DETAIL = '<div class="ms-detail ms-empty-detail">'
    + 'Search for a model on the left, then pick one to see its card and download a quant.</div>';

  constructor(opts) {
    const options = opts || {};
    this._getApi = options.getApi || (() => window.llmDiagAPI);
    this._isMac = options.isMac != null ? !!options.isMac : HostPlatform.isMac();
    this.overlay = null;
    this.state = null;
    this._searchTimer = null;
    this._searchSeq = 0;
    this._expandSeq = 0;
    this._offModelEvent = null;
    this._repoLoads = new Map();
    this._detail = new ModelSearchDetail(this);
    this._onKeydown = (event) => this._handleKeydown(event);
  }

  api() {
    return this._getApi();
  }

  open() {
    if (!this.overlay) this._build();
    this.state = { sort: ModelSearch.DEFAULT_SORT, format: ModelSearch.GGUF, fit: true, results: [], selectedRepo: null, sel: null, downloading: false };
    this._repoLoads.clear();
    this.overlay.hidden = false;
    this._resetControls();
    this._offerFormats();
    const input = this.overlay.querySelector('.ms-search-in');
    setTimeout(() => input.focus(), 30);
    this._runSearch();
  }

  close() {
    if (this._searchTimer) { clearTimeout(this._searchTimer); this._searchTimer = null; }
    this.setModelEventOff(null);
    if (this.state && this.state.downloading) { try { this.api().cancelModelDownload(); } catch (_) {} }
    document.removeEventListener('keydown', this._onKeydown);
    if (this.overlay) this.overlay.hidden = true;
    this.state = null;
  }

  startDownload() {
    return new ModelSearchDownload(this).start();
  }

  setModelEventOff(off) {
    if (this._offModelEvent) { try { this._offModelEvent(); } catch (_) {} }
    this._offModelEvent = off || null;
  }

  _build() {
    this.overlay = Dom.el('div', 'luma-modal-overlay ms-overlay');
    this.overlay.hidden = true;
    this.overlay.innerHTML = this._shellHtml();
    this.overlay.querySelector('.ms-x').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (event) => { if (event.target === this.overlay) this.close(); });
    this.overlay.querySelector('.ms-search-in').addEventListener('input', () => this._debounceSearch());
    this.overlay.querySelector('.ms-sort').addEventListener('change', (event) => this._onSort(event.target.value));
    this.overlay.querySelector('.ms-fit').addEventListener('change', (event) => this._onFit(event.target.checked));
    this.overlay.querySelector('.ms-format').addEventListener('change', (event) => this._onFormat(event.target.value));
    this.overlay.addEventListener('click', (event) => this._onOverlayClick(event));
    this.overlay.addEventListener('mouseover', (event) => this._onOverlayHover(event));
    document.body.appendChild(this.overlay);
  }

  _resetControls() {
    document.removeEventListener('keydown', this._onKeydown);
    document.addEventListener('keydown', this._onKeydown);
    this.overlay.querySelector('.ms-search-in').value = '';
    this.overlay.querySelector('.ms-sort').value = ModelSearch.DEFAULT_SORT;
    this.overlay.querySelector('.ms-fit').checked = true;
    this._paintFormatPicker([ModelSearch.GGUF]);
    this._applyFormat();
    this.overlay.querySelector('.ms-right').innerHTML = ModelSearch.EMPTY_DETAIL;
  }

  async _offerFormats() {
    const formats = [ModelSearch.GGUF].concat(this._isMac ? [ModelSearch.MLX] : [], await this._frameworkFormats());
    if (this.state) this._paintFormatPicker(formats);
  }

  async _frameworkFormats() {
    const api = this.api();
    if (!api || !api.getFrameworksView) return [];
    try {
      const result = await api.getFrameworksView();
      const formats = (result && result.success && result.view && result.view.formats) || [];
      return formats.filter((format) => format.hub).map((format) => format.id);
    } catch (_) {
      return [];
    }
  }

  _paintFormatPicker(formats) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const select = this.overlay.querySelector('.ms-format');
    select.innerHTML = formats.map((id) => '<option value="' + esc(id) + '">' + esc(ModelSearch.formatLabel(id)) + '</option>').join('');
    select.value = this.state.format;
    select.hidden = formats.length < 2;
  }

  _handleKeydown(event) {
    if (event.key === 'Escape' && this.overlay && !this.overlay.hidden) { event.stopPropagation(); this.close(); }
  }

  _debounceSearch() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this._runSearch(), ModelSearch.DEBOUNCE_MS);
  }

  _onSort(sort) {
    this.state.sort = sort;
    this._runSearch();
  }

  _onFit(checked) {
    this.state.fit = checked;
    this._runSearch();
  }

  _onFormat(format) {
    this.state.format = format;
    this.state.selectedRepo = null;
    this.state.sel = null;
    this.overlay.querySelector('.ms-right').innerHTML = ModelSearch.EMPTY_DETAIL;
    this._applyFormat();
    this._runSearch();
  }

  _applyFormat() {
    const format = this.state ? this.state.format : ModelSearch.GGUF;
    const sub = this.overlay.querySelector('.ms-sub');
    if (sub) sub.textContent = 'Hugging Face · ' + ModelSearch.formatLabel(format);
    this.overlay.querySelector('.ms-fit-toggle').hidden = format !== ModelSearch.GGUF;
  }

  _mode() {
    return { format: this.state.format, mlx: this.state.format === ModelSearch.MLX };
  }

  async _runSearch() {
    if (!this.state) return;
    const query = this.overlay.querySelector('.ms-search-in').value.trim();
    const seq = ++this._searchSeq;
    const status = this.overlay.querySelector('.ms-status');
    status.textContent = 'Searching…';
    let result;
    try {
      result = await this.api().searchModels({ query, sort: this.state.sort, limit: ModelSearch.RESULT_LIMIT, ...this._mode(), fit: this.state.fit });
    } catch (err) { result = { success: false, error: err.message }; }
    if (!this.state || seq !== this._searchSeq) return;
    this._paintResults(result, query, status);
  }

  _paintResults(result, query, status) {
    const resultsEl = this.overlay.querySelector('.ms-results');
    if (!result || !result.success) {
      status.innerHTML = '<span class="ms-bad">' + HtmlEscaper.escapeKeepingApostrophes((result && result.error) || 'Search failed.') + '</span>';
      resultsEl.innerHTML = '';
      return;
    }
    this.state.results = result.results || [];
    status.innerHTML = ModelSearchRow.statusHtml(this.state.results.length, query, result.hidden);
    resultsEl.innerHTML = '';
    for (const model of this.state.results) resultsEl.appendChild(this._resultRow(model));
  }

  _resultRow(model) {
    const row = Dom.el('button', 'ms-row' + (this.state.selectedRepo === model.repoId ? ' sel' : ''));
    row.type = 'button';
    row.dataset.repo = model.repoId;
    row.innerHTML = ModelSearchRow.html(model);
    return row;
  }

  async _selectRepo(repoId) {
    if (!this.state) return;
    this.state.selectedRepo = repoId;
    this.state.sel = null;
    this.overlay.querySelectorAll('.ms-row').forEach((row) => row.classList.toggle('sel', row.dataset.repo === repoId));
    const right = this.overlay.querySelector('.ms-right');
    right.innerHTML = '<div class="ms-detail"><div class="ms-loading">Loading model card…</div></div>';
    const seq = ++this._expandSeq;
    const [expanded, readme] = await this._loadRepo(repoId);
    if (!this.state || seq !== this._expandSeq) return;
    if (!expanded || !expanded.success) {
      right.innerHTML = '<div class="ms-detail"><div class="ms-bad">'
        + HtmlEscaper.escapeKeepingApostrophes((expanded && expanded.error) || 'Could not load this model.') + '</div></div>';
      return;
    }
    this._detail.render(expanded.info, (readme && readme.success) ? readme.readme : null);
  }

  _loadRepo(repoId) {
    const key = this.state.format + ':' + repoId;
    let load = this._repoLoads.get(key);
    if (!load) {
      const api = this.api();
      load = Promise.all([
        api.expandModelRepo(repoId, this._mode()).catch((err) => ({ success: false, error: err.message })),
        api.getModelReadme(repoId).catch(() => ({ success: false })),
      ]);
      this._repoLoads.set(key, load);
      load.then(([expanded]) => { if (!expanded || !expanded.success) this._repoLoads.delete(key); });
    }
    return load;
  }

  _onOverlayHover(event) {
    if (!this.state) return;
    const row = event.target.closest && event.target.closest('.ms-row');
    if (row && row.dataset.repo) this._loadRepo(row.dataset.repo);
  }

  _onOverlayClick(event) {
    const link = event.target.closest('[data-href]');
    if (link) {
      const url = link.dataset.href;
      const api = this.api();
      if (url && /^https?:/i.test(url) && api && api.openExternal) {
        event.preventDefault();
        api.openExternal(url);
      }
      return;
    }
    const row = event.target.closest('.ms-row');
    if (row && row.dataset.repo) this._selectRepo(row.dataset.repo);
  }

  _shellHtml() {
    return '<div class="luma-modal ms-modal">'
      + '<div class="ms-head">'
      + '<div class="ms-title luma-modal-title">Search models <span class="ms-sub">Hugging Face · GGUF</span></div>'
      + '<button class="luma-icon-btn luma-icon-btn--sq ms-x" title="Close" aria-label="Close">✕</button>'
      + '</div>'
      + '<div class="ms-body">'
      + '<div class="ms-left">'
      + '<div class="ms-search-bar">'
      + '<input class="ms-search-in" type="text" placeholder="Search models…" autocomplete="off" spellcheck="false" />'
      + '<select class="ms-sort" title="Order results by">'
      + '<option value="trending">Trending</option>'
      + '<option value="downloads">Most downloaded</option>'
      + '<option value="likes">Most liked</option>'
      + '<option value="lastModified">Recently updated</option>'
      + '</select>'
      + '</div>'
      + '<div class="ms-search-bar ms-toggles">'
      + '<label class="ms-mlx-toggle ms-fit-toggle" title="Hide models whose Q4 quant would not fit the GPU or RAM of this PC">'
      + '<input type="checkbox" class="ms-fit" checked /> Fits this PC</label>'
      + '<select class="ms-sort ms-format" title="Kind of model to search for" aria-label="Model format" hidden></select>'
      + '</div>'
      + '<div class="ms-status"></div>'
      + '<div class="ms-results"></div>'
      + '</div>'
      + '<div class="ms-right">' + ModelSearch.EMPTY_DETAIL + '</div>'
      + '</div></div>';
  }
}
