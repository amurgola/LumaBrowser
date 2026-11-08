import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import AddonRow from './AddonRow.js';

export default class DrafterDownloads {
  static DOWNLOAD = 'drafter-download';

  static CANCEL = 'drafter-cancel';

  constructor(ctx) {
    this._ctx = ctx;
    this._ctl = null;
    this._active = null;
    this._off = null;
  }

  attach(ctl) {
    this._ctl = ctl;
  }

  get busy() {
    return !!this._active;
  }

  onAction(row, act, btn) {
    if (act === DrafterDownloads.CANCEL) { this._cancel(); return true; }
    if (act !== DrafterDownloads.DOWNLOAD) return false;
    const data = (btn && btn.dataset) || {};
    const key = row && row.mlKey != null ? row.mlKey : data.key;
    if (data.drafterId && data.modelPath) this.start(key, data.drafterId, data.modelPath);
    return true;
  }

  static progressHtml(active) {
    const esc = HtmlEscaper.escape;
    return AddonRow.progressHtml(active)
      + `<div class="model-drafter-actions"><button class="luma-btn luma-btn--sm danger" type="button" data-ml-act="${DrafterDownloads.CANCEL}" data-key="${esc(active.key)}">Cancel</button></div>`;
  }

  async start(key, id, modelPath) {
    const api = this._ctx.api;
    if (this._active || !api || !api.downloadDrafter) return;
    this._active = { key, id, phase: 'Starting…', received: 0, total: 0, indeterminate: true, label: '' };
    this._paint(DrafterDownloads.progressHtml(this._active));
    this._off = typeof api.onModelEvent === 'function' ? api.onModelEvent((event) => this._onEvent(event)) : null;
    let res;
    try {
      res = await api.downloadDrafter({ id, modelPath });
    } catch (err) {
      res = { success: false, error: err.message };
    }
    this._unsubscribe();
    this._finish(res);
  }

  _cancel() {
    const api = this._ctx.api;
    if (!this._active || !api || !api.cancelModelDownload) return;
    this._active.phase = 'Canceling…';
    this._paint(DrafterDownloads.progressHtml(this._active));
    try { api.cancelModelDownload(); } catch (_) {}
  }

  _onEvent(event) {
    const a = this._active;
    if (!a || !event) return;
    const p = event.payload || {};
    if (event.type === 'start') {
      a.label = p.file ? `${p.label || 'drafter'}: ${p.file}` : (p.label || '');
      a.phase = 'Downloading…';
    } else if (event.type === 'download') {
      Object.assign(a, { phase: 'Downloading…', received: p.received || 0, total: p.total || 0, indeterminate: !(p.total > 0) });
      if (p.bytesPerSec) a.label = `${ByteFormatter.bytes(p.bytesPerSec)}/s`;
    } else if (event.type === 'verify') {
      Object.assign(a, { phase: 'Verifying…', received: p.read || 0, total: p.total || 0, indeterminate: !(p.total > 0) });
    } else if (event.type === 'resume') {
      a.phase = 'Resuming…';
    } else {
      return;
    }
    this._paint(DrafterDownloads.progressHtml(a));
  }

  _finish(res) {
    const a = this._active;
    this._active = null;
    if (!a) return;
    if (res && res.success) {
      this._paint('', a.key);
      this._ctx.refreshLibrary();
      return;
    }
    const stopped = res && (res.canceled || res.paused);
    const phase = stopped
      ? 'Canceled: progress is saved, downloading again resumes.'
      : `Failed: ${(res && res.error) || 'unknown error'}`;
    this._paint(AddonRow.progressHtml({ ...a, phase, indeterminate: false, received: 0, total: 0, label: '' }), a.key);
  }

  _paint(html, key = this._active && this._active.key) {
    if (this._ctl && key != null) this._ctl.patchRow(key, { dlHtml: html });
  }

  _unsubscribe() {
    if (!this._off) return;
    try { this._off(); } catch (_) {}
    this._off = null;
  }
}
