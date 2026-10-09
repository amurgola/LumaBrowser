import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class LoraCuratedList {
  constructor(modal, host) {
    this._modal = modal;
    this._host = host;
    this._entries = [];
  }

  static buttonLabel(entry) {
    if (entry.pair) return entry.installed ? 'Attach pair' : 'Download & attach';
    return entry.installed ? 'In library' : 'Download';
  }

  async render() {
    const api = this._modal.api();
    if (!this._modal.family || !api.loraCatalog) return;
    this._entries = await this._load(api);
    if (!this._entries.length) { this._host.innerHTML = ''; return; }
    this._host.innerHTML = this._entries.map(LoraCuratedList._rowHtml).join('');
    this._host.querySelectorAll('[data-act="dl-curated"]').forEach((btn) => btn.addEventListener('click', () => this._onClick(btn)));
  }

  async _load(api) {
    try {
      const result = await api.loraCatalog();
      return ((result && result.success && result.loras) || []).filter((l) => l.family === this._modal.family);
    } catch (_) { return []; }
  }

  static _rowHtml(l) {
    const esc = HtmlEscaper.escape;
    return `
        <div class="defaults-row" title="${esc(l.blurb || '')}">
          <label>${esc(l.label)} · ${ByteFormatter.bytes(l.approxBytes || 0)}</label>
          <button class="luma-btn luma-btn--sm" data-act="dl-curated" data-lora-id="${esc(l.id)}"${(l.installed && !l.pair) ? ' disabled' : ''}>${LoraCuratedList.buttonLabel(l)}</button>
        </div>`;
  }

  async _onClick(btn) {
    this._modal.setError('');
    const entry = this._entries.find((l) => l.id === btn.dataset.loraId);
    const reset = () => { btn.disabled = false; btn.textContent = LoraCuratedList.buttonLabel(entry || {}); };
    btn.disabled = true;
    btn.textContent = entry && entry.installed ? 'Attaching…' : 'Downloading…';
    try {
      if (!entry) { reset(); return; }
      if (!entry.installed && !(await this._download(entry, reset))) return;
      if (entry.pair) { await this._attachPair(btn, entry, reset); return; }
      await this._modal.refreshLoras(entry.name);
      this._modal.checkPreset();
      await this.render();
    } catch (err) {
      this._modal.setError(err.message);
      reset();
    }
  }

  async _download(entry, reset) {
    const result = await this._modal.api().downloadLora({ id: entry.id });
    if (result && result.success) return true;
    if (result && !result.canceled) this._modal.setError(result.error || 'Download failed.');
    reset();
    return false;
  }

  async _attachPair(btn, entry, reset) {
    btn.textContent = 'Attaching…';
    const weight = (typeof entry.weight === 'number' && entry.weight > 0) ? entry.weight : 1.0;
    const loras = (entry.attach || []).map((a) => ({ name: a.name, weight, ...(a.highNoise ? { highNoise: true } : {}) }));
    const result = await this._modal.api().setModelLoras({
      id: this._modal.modelId, loras, distilledPreset: true, preset: entry.preset || null,
    });
    if (result && result.success === false) { this._modal.setError(result.error || 'Attach failed.'); reset(); return; }
    await this._modal.attached();
  }
}
