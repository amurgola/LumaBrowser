import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class CivitaiResultRow {
  static BASE_LABELS = {
    'sd-1-5': 'SD 1.5', sdxl: 'SDXL', flux: 'Flux', 'qwen-image-edit': 'Qwen-Image-Edit', 'qwen-image-2-1': 'Qwen-Image 2.1', anima: 'Anima',
  };

  static PROFILE_LABELS = {
    'sdxl-illustrious': 'Illustrious / NoobAI tags', 'sdxl-pony': 'Pony score tags', 'sdxl-photo': 'photoreal prose', 'sdxl-generic': 'SDXL generic', 'sd-1-5-generic': 'SD 1.5 generic',
  };

  static html(item) {
    const esc = HtmlEscaper.escape;
    const newest = (item.versions || [])[0] || null;
    const thumb = item.thumbnail
      ? `<img class="ms-thumb" src="${esc(item.thumbnail.url)}" alt="" loading="lazy"/>`
      : '<div class="ms-thumb ms-thumb--empty"></div>';
    const facts = [newest && newest.baseModel ? newest.baseModel : null, item.creator ? `by ${item.creator}` : null].filter(Boolean).join(' · ');
    return `${thumb}<div class="ms-row-main">`
      + `<div class="ms-row-id">${esc(item.name)}${CivitaiResultRow.badges(item)}</div>`
      + `<div class="ms-row-facts">${CivitaiResultRow.dot(newest)}<span>${esc(facts)}</span></div>`
      + `<div class="ms-row-stats"><span>↓ ${esc(CivitaiResultRow.count(item.downloads))}</span><span>♥ ${esc(CivitaiResultRow.count(item.likes))}</span></div>`
      + '</div>';
  }

  static dot(v) {
    if (!v) return '';
    return `<span class="ms-badge${v.installable ? ' green' : ''}" title="${HtmlEscaper.escape(CivitaiResultRow.verdictText(v))}"></span>`;
  }

  static badges(item) {
    const parts = [];
    if (item.type && item.type !== 'Checkpoint') parts.push(`<span class="ms-gated">${HtmlEscaper.escape(item.type)}</span>`);
    if (item.nsfw) parts.push('<span class="ms-gated" title="Adult-rated on CivitAI">adult</span>');
    return parts.length ? ` ${parts.join(' ')}` : '';
  }

  static versionLabel(v) {
    const base = v.baseModel || 'unknown base';
    return v.name ? `${v.name} · ${base}` : base;
  }

  static verdictText(v) {
    if (!v) return '';
    if (!v.installable) return v.reason || 'Not installable.';
    const base = CivitaiResultRow.BASE_LABELS[v.baseType] || v.baseType;
    const profile = v.profile ? `, ${CivitaiResultRow.PROFILE_LABELS[v.profile] || v.profile}` : '';
    const size = v.file && v.file.bytes ? ` · ${ByteFormatter.bytes(v.file.bytes)}` : '';
    const fmt = v.file && v.file.format ? ` ${v.file.format}` : '';
    const early = v.earlyAccess ? ' · early access (needs an API key)' : '';
    return `Installs as ${base}${profile}${size}${fmt}${early}`;
  }

  static detailHtml(d, { busy = false } = {}) {
    const esc = HtmlEscaper.escape;
    const v = d.version || {};
    const facts = [
      d.type && d.type !== 'Checkpoint' ? d.type : null,
      v.baseModel || null,
      d.creator ? `by ${d.creator}` : null,
      `${CivitaiResultRow.count(d.downloads)} downloads`,
      `${CivitaiResultRow.count(d.likes)} likes`,
      d.nsfw ? 'adult' : null,
    ].filter(Boolean).map((f) => `<span class="luma-chip ms-fact">${esc(f)}</span>`).join('');
    const images = (d.images || []).map((img) => `<img class="ms-sample" src="${esc(img.url)}" alt="" loading="lazy"/>`).join('');
    const versions = (d.versions || []);
    const picker = `<select class="ms-quant-select img-civ-version" data-civ-model="${d.modelId}">${versions.map((o) => `<option value="${o.versionId}"${o.versionId === d.versionId ? ' selected' : ''}>${esc(CivitaiResultRow.versionLabel(o))}</option>`).join('')}</select>`;
    return '<div class="ms-detail-head">'
      + `<div class="ms-detail-id">${esc(d.name)} <button class="ms-open-hf" data-href="${esc(d.pageUrl)}" title="Open on CivitAI">↗</button></div>`
      + `<div class="ms-facts">${facts}</div>`
      + '</div>'
      + (images ? `<div class="ms-samples">${images}</div>` : '')
      + '<div class="ms-quants"><div class="luma-section-label ms-quants-title">Version</div>'
      + `<div class="ms-quant-pick">${picker}<span class="ms-quant-badge"><span class="ms-badge${v.installable ? ' green' : ' red'}"></span>`
      + `<span class="ms-quant-fitlabel">${esc(CivitaiResultRow.verdictText(v))}</span></span></div></div>`
      + `<div class="ms-dl">${CivitaiResultRow.installBarHtml(d, busy)}</div>`
      + (d.trainedWords && d.trainedWords.length ? `<div class="ms-dim ms-civ-line">Trigger words: ${esc(d.trainedWords.join(', '))}</div>` : '')
      + (d.licenseNote ? `<div class="ms-dim ms-civ-line">${esc(d.licenseNote)}</div>` : '')
      + '<div class="ms-card"><div class="luma-section-label ms-card-title">Model page</div><div class="ms-card-md"></div></div>';
  }

  static installBarHtml(d, busy) {
    const esc = HtmlEscaper.escape;
    const v = d.version || {};
    if (!v.installable) return '';
    const settings = CivitaiResultRow.settingsText(d.defaults);
    const file = v.file || {};
    return '<div class="ms-dl-row">'
      + `<div class="ms-dl-info"><b>${esc(file.name || d.label)}</b>${file.bytes ? ` · ${ByteFormatter.bytes(file.bytes)}` : ''}`
      + (settings ? ` <span class="ms-dim">${esc(settings)}</span>` : '') + '</div>'
      + `<button class="luma-btn primary ms-dl-go" type="button" data-act="install" data-model="${d.modelId}" data-version="${d.versionId}"${d.fileId ? ` data-file="${d.fileId}"` : ''}${busy ? ' disabled' : ''}>Install</button>`
      + '</div>'
      + `<div class="ms-dim ms-civ-line">${busy ? 'Another download is running; install when it finishes.' : 'Settings are refined from the model page and sample images during the install.'}</div>`;
  }

  static settingsText(defaults) {
    const d = defaults || {};
    const parts = [
      d.width && d.height ? `${d.width}x${d.height}` : null,
      d.steps ? `${d.steps} steps` : null,
      d.cfgScale != null ? `cfg ${d.cfgScale}` : null,
      d.sampler ? `${d.sampler}${d.scheduler ? ` / ${d.scheduler}` : ''}` : null,
    ].filter(Boolean);
    return parts.length ? `starts at ${parts.join(' · ')}` : '';
  }

  static statusText(count, query) {
    if (!count) return 'No models matched.';
    return `${count}${query ? ' matches' : ' models'}`;
  }

  static count(n) {
    const v = Number(n) || 0;
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return String(v);
  }
}
