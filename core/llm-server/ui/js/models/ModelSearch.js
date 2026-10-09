import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import HostPlatform from '../wizard/HostPlatform.js';
import ModelSearchDetail from './ModelSearchDetail.js';
import ModelSearchDownload from './ModelSearchDownload.js';
import SearchText from './SearchText.js';

export default class ModelSearch {
  static DEBOUNCE_MS = 200;

  static RESULT_LIMIT = 30;

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
    this._detail = new ModelSearchDetail(this);
    this._onKeydown = (event) => this._handleKeydown(event);
  }

  api() {
    return this._getApi();
  }

  open() {
    if (!this.overlay) this._build();
    this.state = { sort: 'downloads', mlx: false, results: [], selectedRepo: null, sel: null, downloading: false };
    this.overlay.hidden = false;
    this._resetControls();
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
    const mlx = this.overlay.querySelector('.ms-mlx');
    if (mlx) mlx.addEventListener('change', (event) => this._onMlx(event.target.checked));
    this.overlay.addEventListener('click', (event) => this._onOverlayClick(event));
    document.body.appendChild(this.overlay);
  }

  _resetControls() {
    document.removeEventListener('keydown', this._onKeydown);
    document.addEventListener('keydown', this._onKeydown);
    this.overlay.querySelector('.ms-search-in').value = '';
    this.overlay.querySelector('.ms-sort').value = 'downloads';
    const mlx = this.overlay.querySelector('.ms-mlx');
    if (mlx) mlx.checked = false;
    this._setSubtitle();
    this.overlay.querySelector('.ms-right').innerHTML = ModelSearch.EMPTY_DETAIL;
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

  _onMlx(checked) {
    this.state.mlx = checked;
    this._setSubtitle();
    this._runSearch();
  }

  _setSubtitle() {
    const sub = this.overlay.querySelector('.ms-sub');
    if (sub) sub.textContent = 'Hugging Face · ' + (this.state && this.state.mlx ? 'MLX' : 'GGUF');
  }

  async _runSearch() {
    if (!this.state) return;
    const query = this.overlay.querySelector('.ms-search-in').value.trim();
    const seq = ++this._searchSeq;
    const status = this.overlay.querySelector('.ms-status');
    status.textContent = 'Searching…';
    let result;
    try { result = await this.api().searchModels({ query, sort: this.state.sort, limit: ModelSearch.RESULT_LIMIT, mlx: this.state.mlx }); } catch (err) { result = { success: false, error: err.message }; }
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
    status.textContent = this.state.results.length
      ? this.state.results.length + (query ? ' matches' : ' models')
      : 'No matches.';
    resultsEl.innerHTML = '';
    for (const model of this.state.results) resultsEl.appendChild(this._resultRow(model));
  }

  _resultRow(model) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const row = Dom.el('button', 'ms-row' + (this.state.selectedRepo === model.repoId ? ' sel' : ''));
    row.type = 'button';
    row.dataset.repo = model.repoId;
    row.innerHTML = '<div class="ms-row-id">' + esc(model.repoId) + (model.gated ? ' <span class="ms-gated">gated</span>' : '') + '</div>'
      + '<div class="ms-row-stats"><span>↓ ' + esc(SearchText.count(model.downloads)) + '</span>'
      + '<span>♥ ' + esc(SearchText.count(model.likes)) + '</span></div>';
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
    const api = this.api();
    return Promise.all([
      api.expandModelRepo(repoId, { mlx: this.state.mlx }).catch((err) => ({ success: false, error: err.message })),
      api.getModelReadme(repoId).catch(() => ({ success: false })),
    ]);
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
      + '<option value="downloads">Most downloaded</option>'
      + '<option value="likes">Most liked</option>'
      + '<option value="lastModified">Recently updated</option>'
      + '</select>'
      + (this._isMac
        ? '<label class="ms-mlx-toggle" title="Search Apple MLX models (runs on the Apple Silicon GPU) instead of GGUF">'
          + '<input type="checkbox" class="ms-mlx" /> MLX</label>'
        : '')
      + '</div>'
      + '<div class="ms-status"></div>'
      + '<div class="ms-results"></div>'
      + '</div>'
      + '<div class="ms-right">' + ModelSearch.EMPTY_DETAIL + '</div>'
      + '</div></div>';
  }
}
