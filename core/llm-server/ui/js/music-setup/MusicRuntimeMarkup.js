import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class MusicRuntimeMarkup {
  static STATUS_PILLS = { ready: ['ok', 'Running'], starting: ['accent', 'Starting…'], error: ['danger', 'Error'] };

  static pill(state, installed) {
    return MusicRuntimeMarkup.STATUS_PILLS[state] || ['accent', installed ? 'Installed' : 'Not installed'];
  }

  static isStaleBuild(row) {
    const want = row.pythonPackage || {};
    const have = (row.manifest && row.manifest.package) || {};
    const wantRef = want.sourceArchive && want.sourceArchive.ref;
    const refStale = !!(wantRef && have.sourceRef !== wantRef);
    const revStale = want.envRevision != null && (have.envRevision || 1) !== want.envRevision;
    return !!(row.installed && row.source === 'managed' && (refStale || revStale));
  }

  static html(row, progress, running) {
    const esc = HtmlEscaper.escape;
    const installing = !!progress && progress.phase !== 'failed';
    const stale = MusicRuntimeMarkup.isStaleBuild(row);
    return `
      <div class="kv-row"><span class="kv-key">Runtime</span><span class="kv-val">${esc(row.name)}${row.version ? ` <span class="luma-muted">v${esc(row.version)}</span>` : ''}</span></div>
      <div class="kv-row"><span class="kv-key">Status</span><span class="kv-val">${row.installed ? `Installed${row.manifest && row.manifest.mode === 'wsl' ? ' (inside WSL2)' : ''}` : 'Not installed'}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${MusicRuntimeMarkup._pills(row).join(' ')}</div>
      <p class="luma-muted">${esc(row.description || '')}</p>
      ${row.requirementNote ? `<p class="luma-muted">${esc(row.requirementNote)}</p>` : ''}
      ${stale && !installing ? MusicRuntimeMarkup._staleHtml() : ''}
      ${MusicRuntimeMarkup._progress(progress)}
      <div class="plan-action-row">${MusicRuntimeMarkup._buttons(row, installing, running, stale).join(' ')}</div>
    `;
  }

  static _hwPill(ok, labelOk, labelBad, note) {
    return `<span class="luma-badge ${ok ? 'ok' : 'danger'}" ${note ? `title="${HtmlEscaper.escape(note)}"` : ''}>${ok ? labelOk : labelBad}</span>`;
  }

  static _pills(row) {
    const pills = [MusicRuntimeMarkup._hwPill(row.hardware && row.hardware.ready, 'Hardware ready', 'Hardware not ready', row.hardware && row.hardware.note)];
    if (row.wsl) {
      pills.push(MusicRuntimeMarkup._hwPill(row.wsl.wsl2, `WSL2 (${HtmlEscaper.escape(row.wsl.distro || '')})`, 'WSL2 missing', row.wsl.note));
      pills.push(MusicRuntimeMarkup._hwPill(row.wsl.nvidiaDriverOk, 'GPU visible in WSL', 'GPU not visible in WSL', row.wsl.note));
    }
    return pills;
  }

  static _progress(p) {
    if (!p) return '';
    if (p.phase === 'download') {
      const received = p.received || 0;
      const total = p.total || 0;
      return `<div class="luma-muted">Downloading installer… ${ByteFormatter.bytes(received)}${total ? ` / ${ByteFormatter.bytes(total)}` : ''}</div>`;
    }
    if (p.phase === 'failed') {
      return `<div class="plan-error"><div class="plan-error-title">Install failed</div><div class="plan-error-advice">${HtmlEscaper.escape(p.error || '')}</div></div>`;
    }
    if (p.phase === 'installing' || p.phase === 'extracted') {
      return `<div class="luma-muted">Installing Python environment… this pulls several GB of CUDA wheels and can take a while.<br><code id="musicInstallLine">${HtmlEscaper.escape(p.label || '')}</code></div>`;
    }
    return '<div class="luma-muted">Preparing install…</div>';
  }

  static _staleHtml() {
    return '<div class="plan-error"><div class="plan-error-title">Rebuild needed</div>'
      + '<div class="plan-error-advice">This environment was built with an older setup recipe and is missing pieces the current server needs (MiniMax-Music3 support, build tools). Click Reinstall to rebuild it.</div></div>';
  }

  static _buttons(row, installing, running, stale) {
    const cancel = '<button class="luma-btn luma-btn--sm" id="musicCancelInstallBtn">Cancel</button>';
    const buttons = [];
    if (!row.installed) {
      buttons.push(`<button class="luma-btn primary luma-btn--sm" id="musicInstallBtn" ${row.assetSupported && !installing ? '' : 'disabled'}>Install SGLang-Omni</button>`);
      if (installing) buttons.push(cancel);
    } else {
      buttons.push(MusicRuntimeMarkup._installedPrimary(row, installing, running, stale));
      if (installing) buttons.push(cancel);
      buttons.push(`<button class="luma-btn luma-btn--sm" id="musicCheckUpdatesBtn" ${installing ? 'disabled' : ''}>Check for updates</button>`);
      buttons.push(`<button class="luma-btn luma-btn--sm danger" id="musicUninstallBtn" ${installing || running ? 'disabled' : ''}>Uninstall</button>`);
    }
    if (running) buttons.push('<button class="luma-btn luma-btn--sm danger" id="musicStopBtn">Stop server</button>');
    return buttons;
  }

  static _installedPrimary(row, installing, running, stale) {
    const update = row.update;
    if (update && update.available) {
      return `<button class="luma-btn primary luma-btn--sm" id="musicInstallBtn" ${installing ? 'disabled' : ''}>Update to ${HtmlEscaper.escape(update.latest)}</button>`;
    }
    return `<button class="luma-btn ${stale ? 'primary ' : ''}luma-btn--sm" id="musicInstallBtn" ${installing || running ? 'disabled' : ''}>Reinstall</button>`;
  }
}
