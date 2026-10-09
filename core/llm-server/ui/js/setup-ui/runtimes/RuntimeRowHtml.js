import HtmlEscaper from '../../format/HtmlEscaper.js';
import RuntimeProvenanceHtml from './RuntimeProvenanceHtml.js';

export default class RuntimeRowHtml {
  static html(r) {
    const esc = HtmlEscaper.escape;
    const secondary = RuntimeRowHtml.secondaryActions(r);
    return `
                <div class="runtime-row collapsed" data-runtime-row="${esc(r.id)}">
                    <div class="runtime-head" data-runtime-toggle>
                        <span class="runtime-caret" aria-hidden="true"></span>
                        <span class="runtime-name">${esc(r.name)}</span>
                        ${RuntimeRowHtml.badges(r).join(' ')}
                    </div>
                    <div class="runtime-actions">${RuntimeRowHtml._primaryAction(r)}</div>
                    <div class="runtime-details">
                        <div class="runtime-desc">${esc(r.description || '')}</div>
                        ${RuntimeRowHtml._detailRows(r)}
                        ${RuntimeRowHtml._sourceNote(r)}
                        ${secondary.length ? `<div class="runtime-secondary-actions">${secondary.join('')}</div>` : ''}
                    </div>
                    <div class="runtime-progress" data-runtime-progress>
                        <div class="runtime-progress-label"><span data-runtime-progress-phase>Idle</span><span data-runtime-progress-bytes></span></div>
                        <div class="luma-progress" data-runtime-progress-bar><div class="luma-progress-fill" data-runtime-progress-fill style="width:0%"></div></div>
                    </div>
                </div>
            `;
  }

  static statusLabel(r) {
    if (!r.installed) return 'not installed';
    if (r.source === 'manual') return 'registered';
    if (r.source === 'managed') return 'managed';
    return 'on PATH';
  }

  static badges(r) {
    if (r.kind === 'format') {
      return [
        `<span class="luma-badge ${r.installed ? 'ok' : 'muted'}">${r.installed ? 'available' : 'unavailable'}</span>`,
        '<span class="runtime-kind-tag">format</span>',
      ];
    }
    const esc = HtmlEscaper.escape;
    const out = [`<span class="luma-badge ${r.installed ? 'ok' : 'muted'}">${RuntimeRowHtml.statusLabel(r)}</span>`];
    if (r.staleManualRegistration && !r.installed) out.push('<span class="luma-badge bad" title="Registered binary no longer exists at its saved path">registered path missing</span>');
    if (r.hardware && !r.hardware.ready) out.push(`<span class="luma-badge bad" title="${esc(r.hardware.note || '')}">hardware: not ready</span>`);
    if (r.installed && r.probeError) out.push(`<span class="luma-badge warn" title="${esc(r.probeError)}">could not run: check system libraries</span>`);
    const release = r.manifest && r.manifest.release;
    if (r.installed && release && release.channel === 'prerelease') out.push('<span class="luma-badge accent" title="Installed from the pre-release channel: a build newer than the stable release">pre-release</span>');
    return out;
  }

  static secondaryActions(r) {
    if (r.kind === 'format') return [];
    const id = HtmlEscaper.escape(r.id);
    const out = [];
    if (r.installed && r.source === 'managed') out.push(`<button class="luma-btn luma-btn--sm" data-runtime-action="uninstall" data-runtime-id="${id}">Uninstall</button>`);
    if (r.installed && r.source === 'manual') out.push(`<button class="luma-btn luma-btn--sm" data-runtime-action="clear-binary" data-runtime-id="${id}">Clear registration</button>`);
    if (r.installed) out.push(`<button class="luma-btn luma-btn--sm" data-runtime-action="relocate" data-runtime-id="${id}">Relocate…</button>`);
    if (r.acquisition === 'github-release' && r.assetSupported !== false) {
      out.push(`<button class="luma-btn luma-btn--sm" data-runtime-action="install-prerelease" data-runtime-id="${id}" title="Replace this runtime with the newest upstream build, ahead of the stable release">Download pre-release</button>`);
    }
    const link = RuntimeRowHtml._externalLink(r);
    if (link) out.push(link);
    return out;
  }

  static _externalLink(r) {
    const repoPath = `${(r.repo && r.repo.owner) || ''}/${(r.repo && r.repo.repo) || ''}`;
    if (r.acquisition === 'manual-source') {
      const url = r.manualSourceUrl || `https://github.com/${repoPath}`;
      return `<button class="luma-btn luma-btn--sm" data-runtime-action="open-external" data-runtime-url="${HtmlEscaper.escape(url)}">Build instructions</button>`;
    }
    if (!r.assetSupported && r.acquisition !== 'extension') {
      return `<button class="luma-btn luma-btn--sm" data-runtime-action="open-external" data-runtime-url="${HtmlEscaper.escape(`https://github.com/${repoPath}/releases`)}">See releases</button>`;
    }
    return '';
  }

  static _primaryAction(r) {
    if (r.kind === 'format') return '';
    return `<button class="luma-btn primary luma-btn--sm" data-runtime-action="install" data-runtime-id="${HtmlEscaper.escape(r.id)}">${r.installed ? 'Update' : 'Install'}</button>`;
  }

  static _detailRows(r) {
    const esc = HtmlEscaper.escape;
    const meta = [];
    if (r.version) meta.push(`<div class="runtime-meta-row"><span class="runtime-meta-label">Version</span><span class="runtime-meta-value">${esc(r.version)}</span></div>`);
    if (r.binaryPath) meta.push(`<div class="runtime-meta-row"><span class="runtime-meta-label">Path</span><span class="runtime-meta-value dim">${esc(r.binaryPath)}</span></div>`);
    const rows = meta.length ? [`<div class="runtime-meta">${meta.join('')}</div>`] : [];
    if (r.kind === 'format' && r.providedBy && r.providedBy.length > 0) {
      rows.push(`<div class="runtime-detail-row"><span>Provided by</span><span><b>${esc(r.providedBy.map((p) => p.id + (p.version ? ' (' + p.version + ')' : '')).join(', '))}</b></span></div>`);
    }
    if (r.requirementNote) rows.push(`<div class="runtime-detail-row"><span>Requires</span><span>${esc(r.requirementNote)}</span></div>`);
    rows.push(RuntimeProvenanceHtml.html(r));
    return rows.join('');
  }

  static _sourceNote(r) {
    if (r.kind === 'format' || r.acquisition !== 'manual-source' || !r.manualSourceNote) return '';
    return `<div class="runtime-detail-row"><span>How to build</span><span>${HtmlEscaper.escape(r.manualSourceNote)}</span></div>`;
  }
}
