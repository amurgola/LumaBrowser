import HtmlEscaper from '../format/HtmlEscaper.js';
import ReadmeRenderer from '../models/ReadmeRenderer.js';
import ImageModal from './ImageModal.js';
import CivitaiModalMarkup from './CivitaiModalMarkup.js';
import CivitaiResultRow from './CivitaiResultRow.js';

export default class CivitaiModal extends ImageModal {
  static DEBOUNCE_MS = 250;

  static CIVITAI_URL = /^https?:\/\/(?:www\.)?civitai\.com\//i;

  static DEFAULT_FILTERS = {
    types: [{ id: 'Checkpoint', label: 'Checkpoints' }, { id: 'LORA', label: 'LoRAs (browse only)' }],
    bases: [{ id: 'importable', label: 'Installable bases' }],
    sorts: ['Most Downloaded', 'Highest Rated', 'Newest'],
  };

  constructor(panel) {
    super();
    this._panel = panel;
    this._items = [];
    this._cursor = null;
    this._filters = null;
    this._settings = { hasToken: false, tokenSource: null, nsfw: false };
    this._selected = null;
    this._details = new Map();
    this._searchTimer = null;
    this._searchSeq = 0;
    this._detailSeq = 0;
  }

  open() {
    if (this.isOpen()) return;
    this.show(CivitaiModalMarkup.HTML);
    this._items = [];
    this._cursor = null;
    this._selected = null;
    this._details.clear();
    this._bind();
    this._paintFilters();
    setTimeout(() => { if (this._query) this._query.focus(); }, 30);
    this._loadSettings().then(() => this.search());
  }

  close() {
    if (this._searchTimer) { clearTimeout(this._searchTimer); this._searchTimer = null; }
    super.close();
  }

  _bind() {
    const q = (s) => this.wrap.querySelector(s);
    this._query = q('#civQuery');
    this._type = q('#civType');
    this._base = q('#civBase');
    this._sort = q('#civSort');
    this._nsfw = q('#civNsfw');
    this._token = q('#civToken');
    this._status = q('[data-civ="status"]');
    this._results = q('[data-civ="results"]');
    this._detail = q('[data-civ="detail"]');
    this._more = q('[data-civ="more"]');
    this._query.addEventListener('input', () => this._debounceSearch());
    this._query.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.search(); } });
    for (const el of [this._type, this._base, this._sort]) el.addEventListener('change', () => this.search());
    this._nsfw.addEventListener('change', () => this._saveSettings({ nsfw: this._nsfw.checked }).then(() => this.search()));
    q('[data-act="save-key"]').addEventListener('click', () => this._saveSettings({ token: this._token.value }));
    q('[data-act="clear-key"]').addEventListener('click', () => { this._token.value = ''; this._saveSettings({ token: '' }); });
    q('[data-act="more"]').addEventListener('click', () => this.search({ more: true }));
    this.wrap.addEventListener('click', (e) => this._onClick(e));
    this.wrap.addEventListener('change', (e) => this._onChange(e));
    this.wrap.addEventListener('mouseover', (e) => this._onHover(e));
  }

  _paintFilters() {
    const esc = HtmlEscaper.escape;
    const f = this._filters || CivitaiModal.DEFAULT_FILTERS;
    const keep = (el, options, fallback) => {
      const current = el.value || fallback;
      el.innerHTML = options.map((o) => `<option value="${esc(o.id)}"${o.id === current ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
    };
    keep(this._type, f.types, 'Checkpoint');
    keep(this._base, f.bases, 'importable');
    keep(this._sort, f.sorts.map((s) => ({ id: s, label: s })), 'Most Downloaded');
  }

  async _loadSettings() {
    try {
      const r = await this._panel.api().getCivitaiSettings();
      if (r && r.success) this._applySettings(r);
    } catch (_) {}
  }

  async _saveSettings(patch) {
    this.setError('');
    try {
      const r = await this._panel.api().setCivitaiSettings(patch);
      if (r && r.success) { this._applySettings(r); if (patch.token) this._token.value = ''; } else this.setError((r && r.error) || 'Could not save.');
    } catch (err) { this.setError(err.message); }
  }

  _applySettings(s) {
    this._settings = { hasToken: !!s.hasToken, tokenSource: s.tokenSource || null, nsfw: !!s.nsfw };
    this._nsfw.checked = this._settings.nsfw;
    const state = this.wrap.querySelector('[data-civ="key-state"]');
    if (state) state.textContent = this._settings.hasToken ? (this._settings.tokenSource === 'env' ? '(from environment)' : '(saved)') : '(none)';
  }

  _debounceSearch() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.search(), CivitaiModal.DEBOUNCE_MS);
  }

  async search({ more = false } = {}) {
    if (!this.isOpen()) return;
    if (this._searchTimer) { clearTimeout(this._searchTimer); this._searchTimer = null; }
    const query = this._query.value.trim();
    if (CivitaiModal.CIVITAI_URL.test(query)) { this.openUrl(query); return; }
    this.setError('');
    const seq = ++this._searchSeq;
    if (!more) { this._items = []; this._cursor = null; this._results.innerHTML = ''; }
    this._status.textContent = 'Searching…';
    this._more.hidden = true;
    let r;
    try {
      r = await this._panel.api().civitaiSearch({
        query: query || undefined, types: [this._type.value], base: this._base.value, sort: this._sort.value, cursor: more ? this._cursor : undefined,
      });
    } catch (err) { r = { success: false, error: err.message || 'CivitAI search failed.' }; }
    if (!this.isOpen() || seq !== this._searchSeq) return;
    if (!r || !r.success) { this._status.textContent = ''; this.setError((r && r.error) || 'CivitAI search failed.'); return; }
    if (r.filters) { this._filters = r.filters; this._paintFilters(); }
    const fresh = r.items || [];
    this._items = more ? this._items.concat(fresh) : fresh;
    this._cursor = r.nextCursor || null;
    if (!more) this._results.innerHTML = '';
    for (const item of fresh) this._results.appendChild(this._row(item));
    this._status.textContent = CivitaiResultRow.statusText(this._items.length, query);
    this._more.hidden = !this._cursor;
  }

  _row(item) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'ms-row ms-row-civ' + (this._selected && this._selected.modelId === item.modelId ? ' sel' : '');
    row.dataset.civModel = String(item.modelId);
    row.innerHTML = CivitaiResultRow.html(item);
    return row;
  }

  async openUrl(url) {
    this.setError('');
    this._searchSeq += 1;
    this._status.textContent = 'Reading the model page…';
    this._more.hidden = true;
    const r = await this._loadDetail({ url });
    if (!this.isOpen()) return;
    if (!r || !r.success || !r.preview) { this._status.textContent = ''; this.setError((r && r.error) || 'Could not read that model.'); return; }
    this._items = [r.preview];
    this._cursor = null;
    this._results.innerHTML = '';
    this._results.appendChild(this._row(r.preview));
    this._status.textContent = 'Model page';
    for (const key of [this._key(r.preview.modelId, null), this._key(r.preview.modelId, r.preview.versionId)]) this._details.set(key, Promise.resolve(r));
    this.select(r.preview.modelId, r.preview.versionId);
  }

  async select(modelId, versionId = null) {
    if (!this.isOpen()) return;
    this._selected = { modelId, versionId };
    this.wrap.querySelectorAll('.ms-row').forEach((row) => row.classList.toggle('sel', Number(row.dataset.civModel) === modelId));
    const seq = ++this._detailSeq;
    this._detail.innerHTML = '<div class="ms-detail"><div class="ms-loading">Loading model page…</div></div>';
    const r = await this._loadDetail({ modelId, versionId });
    if (!this.isOpen() || seq !== this._detailSeq) return;
    if (!r || !r.success || !r.preview) {
      this._detail.innerHTML = '<div class="ms-detail"><div class="ms-bad">' + HtmlEscaper.escape((r && r.error) || 'Could not load this model.') + '</div></div>';
      return;
    }
    this._paintDetail(r.preview);
  }

  _paintDetail(d) {
    const detail = document.createElement('div');
    detail.className = 'ms-detail';
    detail.innerHTML = CivitaiResultRow.detailHtml(d, { busy: !!this._panel.store.activeDl });
    detail.querySelector('.ms-card-md').innerHTML = ReadmeRenderer.render(d.description);
    this._detail.innerHTML = '';
    this._detail.appendChild(detail);
  }

  _loadDetail(args) {
    const key = args.url ? `url:${args.url}` : this._key(args.modelId, args.versionId);
    let load = this._details.get(key);
    if (!load) {
      load = this._panel.api().civitaiPreview(args).catch((err) => ({ success: false, error: err.message || 'Could not read that model.' }));
      this._details.set(key, load);
      load.then((r) => { if (!r || !r.success) this._details.delete(key); });
    }
    return load;
  }

  _key(modelId, versionId) {
    return `${modelId}:${versionId || ''}`;
  }

  _onHover(e) {
    const row = e.target.closest && e.target.closest('.ms-row');
    if (row && row.dataset.civModel) this._loadDetail({ modelId: Number(row.dataset.civModel), versionId: null });
  }

  _onChange(e) {
    const select = e.target.closest && e.target.closest('select.img-civ-version');
    if (!select) return;
    this.select(Number(select.dataset.civModel), Number(select.value));
  }

  _onClick(e) {
    const link = e.target.closest && e.target.closest('[data-href]');
    if (link) { e.preventDefault(); this._panel.openExternal(link.dataset.href); return; }
    const btn = e.target.closest && e.target.closest('button[data-act="install"]');
    if (btn) {
      this.install({ modelId: Number(btn.dataset.model), versionId: Number(btn.dataset.version), fileId: btn.dataset.file ? Number(btn.dataset.file) : undefined }, btn);
      return;
    }
    const row = e.target.closest && e.target.closest('.ms-row');
    if (row && row.dataset.civModel) this.select(Number(row.dataset.civModel), null);
  }

  async install(args, button) {
    this.setError('');
    if (this._panel.store.activeDl) { this.setError('Another download is still running.'); return; }
    if (button) { button.disabled = true; button.textContent = 'Starting…'; }
    this._panel.store.downloadError = null;
    try {
      const r = await this._panel.api().importModelFromCivitai(args);
      if (r && r.success === false && !r.canceled) { this.setError(r.error || 'Install failed.'); if (button) ImageModal.resetButton(button, 'Install'); return; }
      this.close();
    } catch (err) {
      this.setError(err.message || 'Install request failed.');
      if (button) ImageModal.resetButton(button, 'Install');
    }
  }
}
