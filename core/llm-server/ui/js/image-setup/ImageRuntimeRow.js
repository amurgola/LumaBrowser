import HtmlEscaper from '../format/HtmlEscaper.js';
import RuntimeProgressMarkup from './RuntimeProgressMarkup.js';

export default class ImageRuntimeRow {
  static html(r, progress) {
    const esc = HtmlEscaper.escape;
    const secondary = ImageRuntimeRow._secondary(r);
    return `
      <div class="runtime-row collapsed" data-runtime-id="${esc(r.id)}">
        <div class="runtime-head">
          <span class="runtime-caret" aria-hidden="true"></span>
          <span class="runtime-name">${esc(r.name)}</span>
          ${ImageRuntimeRow.badges(r).join(' ')}
        </div>
        <div class="runtime-actions">${ImageRuntimeRow._primary(r, progress)}</div>
        <div class="runtime-details">
          ${r.description ? `<div class="runtime-desc">${esc(r.description)}</div>` : ''}
          ${r.acquisition === 'manual-source' && r.manualSourceNote ? `<div class="runtime-desc">${esc(r.manualSourceNote)}</div>` : ''}
          ${ImageRuntimeRow._meta(r)}
          ${secondary.length ? `<div class="runtime-secondary-actions">${secondary.join('')}</div>` : ''}
        </div>
        ${RuntimeProgressMarkup.html(progress)}
      </div>
    `;
  }

  static badges(r) {
    const esc = HtmlEscaper.escape;
    const hwReady = !!(r.hardware && r.hardware.ready);
    const ready = hwReady && (!!r.installed || r.assetSupported !== false);
    const badges = [r.installed ? '<span class="luma-badge ok">installed</span>' : '<span class="luma-badge muted">not installed</span>'];
    if (r.hardware) {
      badges.push(ready
        ? '<span class="luma-badge ok">ready</span>'
        : hwReady
          ? '<span class="luma-badge warn" title="No prebuilt download exists for this system. Build it yourself and use Locate, or pick another runtime.">no build for this system</span>'
          : `<span class="luma-badge warn" title="${esc(r.hardware.note || '')}">${esc(r.hardware.note || 'unavailable')}</span>`);
    }
    if (r.installed && r.probeError) {
      badges.push(`<span class="luma-badge warn" title="${esc(r.probeError)}">could not run: check system libraries</span>`);
    }
    return badges;
  }

  static _primary(r, progress) {
    if (progress && progress.phase !== 'failed') return '';
    return `<button class="luma-btn primary luma-btn--sm" data-act="install" data-id="${HtmlEscaper.escape(r.id)}">${r.installed ? 'Update' : 'Install'}</button>`;
  }

  static _secondary(r) {
    const id = HtmlEscaper.escape(r.id);
    const actions = [];
    if (r.installed && r.source === 'managed') actions.push(`<button class="luma-btn luma-btn--sm" data-act="uninstall" data-id="${id}">Uninstall</button>`);
    if (r.installed && r.source === 'manual') actions.push(`<button class="luma-btn luma-btn--sm" data-act="clear" data-id="${id}">Clear registration</button>`);
    if (r.installed) actions.push(`<button class="luma-btn luma-btn--sm" data-act="relocate" data-id="${id}">Relocate…</button>`);
    return actions;
  }

  static _meta(r) {
    const esc = HtmlEscaper.escape;
    const lines = [];
    if (r.installed && r.version) {
      lines.push(`<div class="runtime-meta-row"><span class="runtime-meta-label">Version</span><span class="runtime-meta-value">${esc(String(r.version).slice(0, 80))}</span></div>`);
    }
    if (r.binaryPath) {
      lines.push(`<div class="runtime-meta-row"><span class="runtime-meta-label">Path</span><span class="runtime-meta-value dim">${esc(r.binaryPath)}</span></div>`);
    }
    return lines.length ? `<div class="runtime-meta">${lines.join('')}</div>` : '';
  }
}
