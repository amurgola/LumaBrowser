import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import QuantVariantPicker from './QuantVariantPicker.js';
import ReadmeRenderer from './ReadmeRenderer.js';
import SearchText from './SearchText.js';

export default class ModelSearchDetail {
  constructor(search) {
    this._search = search;
  }

  render(info, readme) {
    const right = this._search.overlay.querySelector('.ms-right');
    const detail = Dom.el('div', 'ms-detail');
    detail.innerHTML = ModelSearchDetail._html(info);
    const variants = info.variants || [];
    if (variants.length) this._fillQuantSelect(detail, info, variants);
    else detail.querySelector('.ms-quant-pick').innerHTML = this._noVariantsHtml();
    detail.querySelector('.ms-card-md').innerHTML = ReadmeRenderer.render(readme);
    right.innerHTML = '';
    right.appendChild(detail);
    if (variants.length) this.pickQuant(info, QuantVariantPicker.defaultIndex(variants));
  }

  pickQuant(info, index) {
    const state = this._search.state;
    if (!state || state.downloading) return;
    const variant = (info.variants || [])[index];
    if (!variant) { state.sel = null; this.renderDownloadBar(); return; }
    state.sel = ModelSearchDetail.selection(info, variant);
    this._paintFitBadge(variant.fit || {});
    this.renderDownloadBar();
  }

  static selection(info, v) {
    return {
      repoId: info.repoId, url: v.url, file: v.file, quant: v.quant,
      approxBytes: v.approxBytes, mlx: !!v.mlx,
      parts: (v.sharded && Array.isArray(v.partUrls) && v.partUrls.length > 1) ? v.partUrls.map((u) => ({ url: u })) : null,
    };
  }

  renderDownloadBar() {
    const host = this._search.overlay.querySelector('.ms-dl');
    if (!host) return;
    const sel = this._search.state.sel;
    if (!sel) { host.innerHTML = ''; return; }
    host.innerHTML = ModelSearchDetail._downloadBarHtml(sel);
    host.querySelector('.ms-dl-go').addEventListener('click', () => this._search.startDownload());
  }

  _fillQuantSelect(detail, info, variants) {
    const select = detail.querySelector('.ms-quant-select');
    variants.forEach((v, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = `${v.quant} · ${ByteFormatter.gb(v.approxBytes)}${ModelSearchDetail._variantNote(v)}`;
      select.appendChild(option);
    });
    select.value = String(QuantVariantPicker.defaultIndex(variants));
    select.addEventListener('change', () => this.pickQuant(info, Number(select.value)));
  }

  static _variantNote(v) {
    return (v.sharded && v.partUrls ? ': ' + v.partUrls.length + ' parts' : '')
      + (v.fit && v.fit.label ? ': ' + v.fit.label : '')
      + (v.fit && v.fit.speedLabel ? ' · ' + v.fit.speedLabel : '');
  }

  _noVariantsHtml() {
    const state = this._search.state;
    return '<div class="ms-dim">' + (state && state.mlx
      ? 'No MLX weights found in this repo.'
      : 'No recognised GGUF quants in this repo.') + '</div>';
  }

  _paintFitBadge(fit) {
    const overlay = this._search.overlay;
    const badge = overlay.querySelector('.ms-quant-badge .ms-badge');
    const label = overlay.querySelector('.ms-quant-fitlabel');
    if (badge) badge.className = 'ms-badge ' + (fit.badge || 'green');
    if (label) label.textContent = SearchText.fitLabel(fit);
  }

  static _facts(info) {
    return [
      info.paramsB ? info.paramsB.toFixed(1).replace(/\.0$/, '') + 'B params' : null,
      info.maxContext ? (info.maxContext / 1024).toFixed(0) + 'K context' : null,
      info.architecture || null,
    ].filter(Boolean).map((x) => '<span class="luma-chip ms-fact">' + HtmlEscaper.escapeKeepingApostrophes(x) + '</span>').join('');
  }

  static _html(info) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const facts = ModelSearchDetail._facts(info);
    return '<div class="ms-detail-head">'
      + '<div class="ms-detail-id">' + esc(info.repoId)
      + ' <button class="ms-open-hf" data-href="https://huggingface.co/' + esc(info.repoId) + '" title="Open on Hugging Face">↗</button></div>'
      + (facts ? '<div class="ms-facts">' + facts + '</div>' : '')
      + '</div>'
      + '<div class="ms-quants"><div class="luma-section-label ms-quants-title">Quantization</div>'
      + '<div class="ms-quant-pick">'
      + '<select class="ms-quant-select"></select>'
      + '<span class="ms-quant-badge"><span class="ms-badge"></span><span class="ms-quant-fitlabel"></span></span>'
      + '</div></div>'
      + '<div class="ms-dl"></div>'
      + '<div class="ms-card"><div class="luma-section-label ms-card-title">Model card</div><div class="ms-card-md"></div></div>';
  }

  static _downloadBarHtml(sel) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    return '<div class="ms-dl-row">'
      + '<div class="ms-dl-info"><b>' + esc(sel.quant) + '</b> · ' + ByteFormatter.gb(sel.approxBytes)
      + (sel.parts ? ' · ' + sel.parts.length + ' parts' : '')
      + ' <span class="ms-dim">' + esc(sel.file) + '</span></div>'
      + '<button class="luma-btn primary ms-dl-go" type="button">Download</button>'
      + '</div>'
      + '<div class="ms-dl-prog" hidden><div class="luma-progress ms-dl-bar"><div class="luma-progress-fill ms-dl-fill"></div></div>'
      + '<div class="ms-dl-sub"></div><button class="luma-btn luma-btn--sm ms-dl-cancel" type="button">Cancel</button></div>'
      + '<div class="ms-dl-msg"></div>';
  }
}
