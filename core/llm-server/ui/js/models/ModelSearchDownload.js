import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class ModelSearchDownload {
  constructor(search) {
    this._search = search;
    this._canceled = false;
    this._companionLabel = '';
    this._partLabel = '';
  }

  async start() {
    const state = this._search.state;
    if (!state || !state.sel || state.downloading) return;
    const sel = state.sel;
    this._bindElements();
    this._begin(state);
    this._search.setModelEventOff(this._search.api().onModelEvent((event) => this._onModelEvent(event)));
    const result = await this._request(sel);
    this._finish(result);
  }

  _bindElements() {
    const host = this._search.overlay.querySelector('.ms-dl');
    this._go = host.querySelector('.ms-dl-go');
    this._progress = host.querySelector('.ms-dl-prog');
    this._bar = host.querySelector('.ms-dl-bar');
    this._fill = host.querySelector('.ms-dl-fill');
    this._sub = host.querySelector('.ms-dl-sub');
    this._message = host.querySelector('.ms-dl-msg');
    this._cancel = host.querySelector('.ms-dl-cancel');
  }

  _begin(state) {
    state.downloading = true;
    this._go.disabled = true;
    this._progress.hidden = false;
    this._message.textContent = '';
    this._cancel.addEventListener('click', () => this._onCancel());
  }

  _onCancel() {
    this._canceled = true;
    try { this._search.api().cancelModelDownload(); } catch (_) {}
    this._cancel.disabled = true;
    this._cancel.textContent = 'Canceling…';
  }

  _onModelEvent(event) {
    if (!event || !this._search.state) return;
    const payload = event.payload;
    if (event.type === 'resume') this._sub.textContent = 'Resuming…';
    else if (event.type === 'part' && payload) this._onPart(payload);
    else if (event.type === 'companion-start' && payload) this._onCompanion(payload);
    else if (event.type === 'download' && payload) this._onProgress(payload);
  }

  _onPart(payload) {
    this._partLabel = 'Part ' + payload.index + '/' + payload.count + ' · ';
    this._sub.textContent = this._partLabel + '…';
  }

  _onCompanion(payload) {
    this._companionLabel = payload.label || 'companion file';
    this._partLabel = '';
    this._sub.textContent = 'Downloading ' + this._companionLabel + '…';
  }

  _onProgress({ received, total }) {
    const fraction = total ? received / total : null;
    if (this._bar) this._bar.classList.toggle('indeterminate', fraction == null);
    if (fraction != null) this._fill.style.width = Math.max(0, Math.min(1, fraction)) * 100 + '%';
    const prefix = this._companionLabel
      ? this._companionLabel.charAt(0).toUpperCase() + this._companionLabel.slice(1) + ' · '
      : this._partLabel;
    this._sub.textContent = prefix + ByteFormatter.gb(received) + (total ? ' / ' + ByteFormatter.gb(total) : ' downloaded');
  }

  async _request(sel) {
    const args = sel.mlx
      ? { mlx: true, repoId: sel.repoId }
      : { url: sel.url, filename: sel.file, parts: sel.parts || undefined, totalBytes: sel.approxBytes };
    try {
      return await this._search.api().downloadModel(args);
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      this._search.setModelEventOff(null);
    }
  }

  _finish(result) {
    const state = this._search.state;
    if (!state) return;
    state.downloading = false;
    this._progress.hidden = true;
    if (this._canceled || (result && result.canceled)) {
      this._go.disabled = false;
      this._message.innerHTML = '<span class="ms-dim">Canceled: progress is saved, downloading again resumes.</span>';
      return;
    }
    if (!result || !result.success) {
      this._go.disabled = false;
      this._message.innerHTML = '<span class="ms-bad">Download failed'
        + HtmlEscaper.escapeKeepingApostrophes(result && result.error ? ': ' + result.error : '') + '</span>';
      return;
    }
    this._message.innerHTML = '<span class="ms-ok">✓ Downloaded to your models folder.</span>';
    this._go.textContent = 'Downloaded';
    try { window.dispatchEvent(new CustomEvent('luma-models-changed')); } catch (_) {}
  }
}
