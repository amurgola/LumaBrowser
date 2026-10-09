import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import QuantText from '../setup/QuantText.js';
import HostPlatform from './HostPlatform.js';

export default class HfSearchPanel {
  static RESULT_LIMIT = 20;

  constructor(wizard, host, isMac) {
    this._wizard = wizard;
    this._host = host;
    this._isMac = isMac != null ? !!isMac : HostPlatform.isMac();
    this._mlx = false;
  }

  mount() {
    if (!this._host) return;
    this._host.innerHTML = this._html();
    const q = (s) => this._host.querySelector(s);
    this._input = q('.wz-srch-in');
    this._go = q('.wz-srch-go');
    this._status = q('.wz-srch-status');
    this._results = q('.wz-srch-results');
    this._pick = q('.wz-srch-pick');
    this._go.addEventListener('click', () => this.search());
    this._input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.search(); } });
    const mlx = q('.wz-srch-mlx-cb');
    if (mlx) mlx.addEventListener('change', (e) => this._onMlx(e.target.checked));
    this._renderPick();
  }

  async search() {
    const query = this._input.value.trim();
    this._go.disabled = true;
    this._status.textContent = 'Searching…';
    this._results.innerHTML = '';
    let result;
    try { result = await this._wizard.api().searchModels({ query, limit: HfSearchPanel.RESULT_LIMIT, mlx: this._mlx }); } catch (e) { result = { success: false, error: e.message }; }
    this._go.disabled = false;
    if (!result || !result.success) {
      this._status.innerHTML = '<span class="wz-bad">' + HtmlEscaper.escape((result && result.error) || 'Search failed.') + '</span>';
      return;
    }
    const rows = result.results || [];
    this._status.textContent = rows.length ? rows.length + ' models: most-downloaded first' : 'No matches.';
    for (const model of rows) this._results.appendChild(this._resultRow(model));
  }

  _onMlx(checked) {
    this._mlx = checked;
    this._wizard.state.override = null;
    this._renderPick();
    if (this._input.value.trim()) this.search();
  }

  _resultRow(model) {
    const esc = HtmlEscaper.escape;
    const row = Dom.el('div', 'wz-srch-row');
    const downloads = model.downloads >= 1000 ? (model.downloads / 1000).toFixed(0) + 'k' : String(model.downloads);
    row.innerHTML = '<div class="wz-srch-head">'
      + '<span class="wz-srch-id">' + esc(model.repoId) + '</span>'
      + '<span class="wz-dim">↓ ' + esc(downloads) + (model.gated ? ' · gated' : '') + '</span>'
      + '</div>';
    row.querySelector('.wz-srch-head').addEventListener('click', () => this._expand(model.repoId, row));
    return row;
  }

  async _expand(repoId, row) {
    const open = row.classList.toggle('open');
    const existing = row.querySelector('.wz-srch-quants');
    if (existing) { existing.hidden = !open; return; }
    if (!open) return;
    const box = Dom.el('div', 'wz-srch-quants', '<div class="wz-dim">Loading quants…</div>');
    row.appendChild(box);
    let result;
    try { result = await this._wizard.api().expandModelRepo(repoId, { mlx: this._mlx }); } catch (e) { result = { success: false, error: e.message }; }
    if (!result || !result.success) {
      box.innerHTML = '<div class="luma-callout bad">' + HtmlEscaper.escape((result && result.error) || 'Could not load this model.') + '</div>';
      return;
    }
    this._fillQuants(box, result.info);
  }

  _fillQuants(box, info) {
    const meta = [
      info.paramsB ? info.paramsB.toFixed(1).replace(/\.0$/, '') + 'B' : null,
      info.maxContext ? (info.maxContext / 1024).toFixed(0) + 'K ctx' : null,
      info.architecture || null,
    ].filter(Boolean).join(' · ');
    box.innerHTML = meta ? '<div class="wz-srch-meta">' + HtmlEscaper.escape(meta) + '</div>' : '';
    if (!info.variants.length) {
      box.innerHTML += '<div class="wz-dim">No recognised GGUF quants in this repo.</div>';
      return;
    }
    for (const variant of info.variants) box.appendChild(this._quantButton(info, variant));
  }

  _quantButton(info, v) {
    const esc = HtmlEscaper.escape;
    const fit = v.fit || {};
    const disabled = v.sharded;
    const row = Dom.el('button', 'wz-quant' + (disabled ? ' disabled' : ''),
      '<span class="wz-badge ' + esc(fit.badge || 'green') + '"></span>'
      + '<span class="wz-quant-q" title="' + esc(QuantText.title(v.quant)) + '">' + esc(v.quant) + '</span>'
      + '<span class="wz-quant-sz">' + ByteFormatter.gb(v.approxBytes) + '</span>'
      + '<span class="wz-quant-fit">' + esc(disabled ? 'Multi-part: paste URL to use'
        : ((fit.label || '') + (fit.speedLabel ? ' · ' + fit.speedLabel : ''))) + '</span>');
    row.type = 'button';
    if (disabled) row.disabled = true;
    else row.addEventListener('click', () => { this._wizard.state.override = HfSearchPanel.override(info, v); this._renderPick(); });
    return row;
  }

  static override(info, v) {
    const fit = v.fit || {};
    if (v.mlx) {
      return { mlx: true, repoId: v.repoId, runtimeId: 'mlx-lm', label: info.repoId, quant: v.quant, approxBytes: v.approxBytes, badge: fit.badge };
    }
    return { url: v.url, file: v.file, label: info.repoId, quant: v.quant, approxBytes: v.approxBytes, badge: fit.badge };
  }

  _renderPick() {
    const o = this._wizard.state.override;
    if (!o) { this._pick.innerHTML = ''; return; }
    const esc = HtmlEscaper.escape;
    this._pick.innerHTML = '<div class="wz-srch-chosen"><span class="wz-badge ' + esc(o.badge || 'green') + '"></span>'
      + '<b>' + esc(o.label) + '</b> <span class="wz-rec-q" title="' + esc(QuantText.title(o.quant)) + '">' + esc(o.quant) + '</span>'
      + ' <span class="wz-dim">' + ByteFormatter.gb(o.approxBytes) + '</span>'
      + '<button class="luma-btn luma-btn--sm wz-srch-clear" type="button">Clear</button></div>';
    this._pick.querySelector('.wz-srch-clear').addEventListener('click', () => { this._wizard.state.override = null; this._renderPick(); });
  }

  _html() {
    return '<div class="wz-srch-bar">'
      + '<input class="wz-srch-in" type="text" placeholder="Search models (e.g. qwen coder, llama 8b)…" />'
      + '<button class="luma-btn luma-btn--sm wz-srch-go" type="button">Search</button>'
      + (this._isMac
        ? '<label class="wz-srch-mlx" title="Search Apple MLX models (Apple Silicon GPU) instead of GGUF">'
          + '<input type="checkbox" class="wz-srch-mlx-cb" /> MLX</label>'
        : '')
      + '</div>'
      + '<div class="wz-srch-status"></div>'
      + '<div class="wz-srch-results"></div>'
      + '<div class="wz-srch-pick"></div>';
  }
}
