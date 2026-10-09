import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ImageModal from './ImageModal.js';
import LoraBaseNote from './LoraBaseNote.js';
import LoraCuratedList from './LoraCuratedList.js';
import LoraModalMarkup from './LoraModalMarkup.js';

export default class LoraModal extends ImageModal {
  constructor(panel) {
    super();
    this._panel = panel;
    this._library = [];
  }

  api() {
    return this._panel.api();
  }

  async open(modelId) {
    if (this.isOpen()) return;
    this._readModel(modelId);
    this.show(LoraModalMarkup.html(this._label, this._hasPair));
    this._bindElements();
    this._select.addEventListener('change', () => this._paintBaseNote());
    await this.refreshLoras();
    if (this._current && typeof this._current.weight === 'number') this._weight.value = this._current.weight;
    this._preset.checked = !!this._defaults.distilledPreset;
    await new LoraCuratedList(this, this.wrap.querySelector('.lora-curated')).render();
    this.wrap.querySelector('[data-act="import-lora"]').addEventListener('click', () => this._importLora());
    this.wrap.querySelector('[data-act="save"]').addEventListener('click', () => this._save());
  }

  _readModel(modelId) {
    const model = this._panel.store.findModel(modelId);
    this.modelId = modelId;
    this._label = (model && (model.label || model.id)) || modelId;
    this._defaults = (model && model.defaults) || (model && model.manifest && model.manifest.defaults) || {};
    this._current = (Array.isArray(this._defaults.loras) && this._defaults.loras[0]) || null;
    this._hasPair = Array.isArray(this._defaults.loras) && this._defaults.loras.length > 1;
    this.family = (model && model.family) || (model && model.manifest && model.manifest.family) || null;
  }

  _bindElements() {
    this._select = this.wrap.querySelector('#loraSel');
    this._weight = this.wrap.querySelector('#loraWeight');
    this._preset = this.wrap.querySelector('#loraPreset');
    this._baseNote = this.wrap.querySelector('.lora-base-note');
  }

  checkPreset() {
    this._preset.checked = true;
  }

  async attached() {
    this.close();
    await this._panel.refreshModels();
  }

  async refreshLoras(selectName) {
    let loras = [];
    try { const result = await this.api().listLoras(); loras = (result && result.success && result.loras) || []; } catch (_) { loras = []; }
    this._library = loras;
    const want = selectName || (this._current && this._current.name) || '';
    this._select.innerHTML = '<option value="">None</option>' + loras.map((l) => LoraModal._optionHtml(l, want)).join('');
    this._paintBaseNote();
  }

  static _optionHtml(l, selectedName) {
    const esc = HtmlEscaper.escape;
    return `<option value="${esc(l.name)}"${l.name === selectedName ? ' selected' : ''}>${esc(l.name)} · ${ByteFormatter.bytes(l.bytes || 0)}${l.base && l.base.label ? ' · ' + esc(l.base.label) : ''}</option>`;
  }

  _paintBaseNote() {
    if (!this._baseNote) return;
    const row = this._library.find((l) => l.name === this._select.value) || null;
    const { text, warn } = LoraBaseNote.describe(row, this.family);
    this._baseNote.hidden = !text;
    this._baseNote.textContent = text;
    this._baseNote.classList.toggle('bad', warn);
  }

  async _importLora() {
    this.setError('');
    try {
      const result = await this.api().importLora();
      if (result && result.success && !result.canceled) await this.refreshLoras(result.name);
      else if (result && !result.success) this.setError(result.error || 'Import failed.');
    } catch (err) { this.setError(err.message); }
  }

  async _save() {
    this.setError('');
    const name = this._select.value || '';
    const weight = parseFloat(this._weight.value);
    const loras = name ? [{ name, weight: (Number.isFinite(weight) && weight > 0) ? weight : 1.0 }] : [];
    const button = this.wrap.querySelector('[data-act="save"]');
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const result = await this.api().setModelLoras({ id: this.modelId, loras, distilledPreset: !!this._preset.checked });
      if (result && result.success === false) { this.setError(result.error || 'Save failed.'); ImageModal.resetButton(button, 'Save'); return; }
      await this.attached();
    } catch (err) { this.setError(err.message); ImageModal.resetButton(button, 'Save'); }
  }
}
