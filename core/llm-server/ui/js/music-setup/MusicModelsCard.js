import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';
import Dialogs from '../dialogs/Dialogs.js';

export default class MusicModelsCard {
  constructor(panel) {
    this._panel = panel;
  }

  paint() {
    const body = Dom.byId('musicModelsBody');
    const view = this._panel.view;
    if (!body || !view) return;
    const models = (view.models && view.models.models) || [];
    const runtime = this._panel.runtimeRow();
    const serverMissing = !(runtime && runtime.installed);
    this._paintPill(models.filter((m) => m.installed).length, serverMissing);
    body.className = '';
    const rows = models.map((m) => this._rowHtml(m, serverMissing)).join('') || '<span class="luma-muted">No music models in the catalog.</span>';
    body.innerHTML = serverMissing
      ? `<div class="music-gate-note">Install the SGLang-Omni server above first. Music models can only run through it.</div>
         <div class="music-gated">${rows}</div>`
      : rows;
    this._wire(body);
  }

  patchDownloadRow() {
    const el = Dom.byId('musicDlProgress');
    const dl = this._panel.activeDl;
    if (!el || !dl) return;
    el.textContent = MusicModelsCard.progressText(dl);
  }

  static progressText(dl) {
    const pct = dl.total ? Math.round((dl.received / dl.total) * 100) : 0;
    return `${ByteFormatter.bytes(dl.received)} / ${ByteFormatter.bytes(dl.total)} (${pct}%)`;
  }

  _paintPill(installedCount, serverMissing) {
    const pill = Dom.byId('musicModelsPill');
    if (!pill) return;
    pill.className = 'luma-badge ' + (installedCount ? 'ok' : 'accent');
    pill.textContent = serverMissing ? 'Server needed' : installedCount ? `${installedCount} installed` : 'None installed';
  }

  _rowHtml(m, serverMissing) {
    const esc = HtmlEscaper.escape;
    const activeDl = this._panel.activeDl;
    const dl = activeDl && activeDl.modelId === m.id ? activeDl : null;
    return `
        <div class="kv-row" style="align-items:start">
          <span><strong>${esc(m.label)}</strong><br><span class="luma-muted">${esc(m.blurb || '')}</span>
            ${m.licenseNote ? `<br><span class="luma-muted">${esc(m.licenseNote)}</span>` : ''}
            ${dl && dl.error ? `<br><span class="plan-error-advice">${esc(dl.error)}</span>` : ''}
          </span>
          <span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">${this._action(m, dl, serverMissing)}</span>
        </div>`;
  }

  _action(m, dl, serverMissing) {
    const id = HtmlEscaper.escape(m.id);
    if (dl && !dl.error) {
      return `<span class="luma-muted" id="musicDlProgress">${MusicModelsCard.progressText(dl)}</span>
                  <button class="luma-btn luma-btn--sm" data-cancel="${id}">Cancel</button>`;
    }
    if (m.installed) {
      return `<span class="luma-badge ok">Installed</span>
                  <button class="luma-btn luma-btn--sm danger" data-delete="${id}">Delete</button>`;
    }
    return `<button class="luma-btn primary luma-btn--sm" data-download="${id}" ${this._panel.activeDl || serverMissing ? 'disabled' : ''}>Download (${ByteFormatter.bytes(m.sizeBytes)})</button>`;
  }

  _wire(body) {
    const api = this._panel.api();
    body.querySelectorAll('[data-download]').forEach((b) => b.addEventListener('click', () => { api.downloadModel(b.dataset.download); }));
    body.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', () => api.cancelDownload()));
    body.querySelectorAll('[data-delete]').forEach((b) => b.addEventListener('click', async () => {
      if (!await Dialogs.confirm('Delete this model snapshot from disk?')) return;
      await api.deleteModel(b.dataset.delete);
      this._panel.refreshAll();
    }));
  }
}
