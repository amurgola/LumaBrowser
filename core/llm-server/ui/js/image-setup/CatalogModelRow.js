import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import DownloadDetail from './DownloadDetail.js';
import QuantPicker from './QuantPicker.js';

export default class CatalogModelRow {
  static view(m, installed, dl, vramBytes) {
    const isInstalled = installed.some((x) => x.id === m.id);
    const isDownloading = !!(dl && dl.id === m.id);
    const quantHtml = (!isInstalled && !dl) ? QuantPicker.html(m, vramBytes) : '';
    const sizeBytes = quantHtml ? QuantPicker.totalBytes(m, QuantPicker.defaultId(m, vramBytes)) : CatalogModelRow._approxTotal(m);
    const action = CatalogModelRow._action(m, isInstalled, isDownloading, dl);
    return {
      mlKey: m.id,
      expanded: isDownloading,
      caretEmpty: !(action || m.blurb || m.licenseNote || quantHtml || isDownloading),
      name: m.label || m.id,
      tagsHtml: CatalogModelRow._tags(m, isInstalled),
      sizeText: `~${sizeBytes ? ByteFormatter.bytes(sizeBytes) : '?'}`,
      actionsHtml: action,
      metaHtml: '',
      ctxFitHtml: '', fitHtml: '',
      quantHtml,
      dlHtml: isDownloading ? DownloadDetail.html(dl) : '',
      blurbHtml: CatalogModelRow._blurb(m),
      shardsHtml: '',
    };
  }

  static kindLabel(m) {
    if (m.kind === 'edit') return 'edit';
    if (m.kind === 'video') return 'video';
    return m.supportsEdit ? 'generation + edit' : 'generation';
  }

  static _approxTotal(m) {
    return m.files ? Object.keys(m.files).reduce((s, k) => s + (m.files[k].approxBytes || 0), 0) : 0;
  }

  static _tags(m, isInstalled) {
    const ncPill = m.licenseNote
      ? `<span class="luma-badge warn" title="NC = non-commercial license. ${HtmlEscaper.escape(m.licenseNote)}">NC</span>` : '';
    const kindPill = `<span class="luma-badge ${m.kind === 'video' ? 'accent' : 'muted'}" title="Image category">${CatalogModelRow.kindLabel(m)}</span>`;
    const installedTag = isInstalled ? '<span class="luma-badge ok">installed</span>' : '';
    return `${kindPill} ${ncPill} ${installedTag}`;
  }

  static _action(m, isInstalled, isDownloading, dl) {
    const esc = HtmlEscaper.escape;
    if (isInstalled) return '';
    if (isDownloading) return '<button class="luma-btn luma-btn--sm danger" data-ml-act="dl-cancel">Cancel</button>';
    if (dl) return '<button class="luma-btn primary luma-btn--sm" disabled title="Another download is in progress">Download</button>';
    if (m.licenseNote) {
      return `<button class="luma-btn primary luma-btn--sm" data-ml-act="dl-nc" data-id="${esc(m.id)}" data-note="${esc(m.licenseNote)}">Download (NC)</button>`;
    }
    return `<button class="luma-btn primary luma-btn--sm" data-ml-act="dl" data-id="${esc(m.id)}">Auto-download</button>`;
  }

  static _blurb(m) {
    const esc = HtmlEscaper.escape;
    return (m.blurb ? `<div class="img-mrow-blurb">${esc(m.blurb)}</div>` : '')
      + (m.minVramBytes
        ? `<div class="img-mrow-blurb">Needs about ${ByteFormatter.bytes(m.minVramBytes)} of graphics memory. Smaller cards fall back to slower streaming from system RAM.</div>`
        : '')
      + (m.licenseNote ? `<div class="img-mrow-blurb img-license-note">NC (non-commercial): ${esc(m.licenseNote)}</div>` : '');
  }
}
