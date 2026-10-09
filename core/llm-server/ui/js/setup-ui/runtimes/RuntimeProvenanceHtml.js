import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class RuntimeProvenanceHtml {
  static ACQUISITION_LABELS = {
    'github-release': 'GitHub Releases (auto-download)',
    'manual-source': 'source-only: build it yourself',
    extension: 'installed by its extension',
  };

  static NO_PREBUILT = 'no prebuilt for this platform';

  static html(r) {
    if (r.kind === 'format' || !(r.repo && r.repo.owner && r.repo.repo)) return '';
    return RuntimeProvenanceHtml._sourceRow(r) + RuntimeProvenanceHtml._downloadedRows(r);
  }

  static sourceLink(url, label) {
    return `<button class="src-link" data-runtime-action="open-external" data-runtime-url="${HtmlEscaper.escape(url)}">${label}</button>`;
  }

  static _sourceRow(r) {
    const esc = HtmlEscaper.escape;
    const slug = `${r.repo.owner}/${r.repo.repo}`;
    const label = RuntimeProvenanceHtml.ACQUISITION_LABELS[r.acquisition] || RuntimeProvenanceHtml.NO_PREBUILT;
    return '<div class="runtime-detail-row"><span>Source</span><span>'
      + `<button class="src-link" data-runtime-action="open-external" `
      + `data-runtime-url="https://github.com/${esc(slug)}">github.com/${esc(slug)} ↗</button>`
      + ` · ${esc(label)}</span></div>`;
  }

  static _downloadedRows(r) {
    const man = r.manifest;
    if (!(r.installed && r.source === 'managed' && man && man.asset && man.asset.name)) return '';
    const esc = HtmlEscaper.escape;
    const size = man.asset.size ? ByteFormatter.bytes(man.asset.size) : '';
    const sha = man.asset.sha256 ? String(man.asset.sha256) : '';
    const companions = Array.isArray(man.companions) ? man.companions.filter((c) => c && c.status === 'installed').length : 0;
    return '<div class="runtime-detail-row"><span>Downloaded</span><span>'
      + `<b>${esc(man.asset.name)}</b>${size ? ' · ' + esc(size) : ''}`
      + (companions ? ` · +${companions} companion${companions === 1 ? '' : 's'}` : '')
      + RuntimeProvenanceHtml._tagHtml(man.release)
      + '</span></div>'
      + (sha ? `<div class="runtime-detail-row"><span>SHA-256</span><span class="path" title="${esc(sha)}">${esc(sha.slice(0, 24))}…</span></div>` : '');
  }

  static _tagHtml(release) {
    const esc = HtmlEscaper.escape;
    const tag = release && release.tag ? release.tag : '';
    if (!tag) return '';
    const url = release && release.url ? release.url : '';
    return url ? ' · ' + RuntimeProvenanceHtml.sourceLink(url, `${esc(tag)} ↗`) : ' · ' + esc(tag);
  }
}
