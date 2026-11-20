import ImageModal from './ImageModal.js';
import LoraBaseNote from './LoraBaseNote.js';
import LoraCuratedList from './LoraCuratedList.js';
import LoraModalMarkup from './LoraModalMarkup.js';

export default class LoraModal extends ImageModal {
  static DEFAULT_WEIGHT = 1.0;

  constructor(panel) {
    super();
    this._panel = panel;
    this._library = [];
    this._attached = [];
  }

  api() {
    return this._panel.api();
  }

  async open(modelId) {
    if (this.isOpen()) return;
    this._readModel(modelId);
    this.show(LoraModalMarkup.html(this._label));
    this._bindElements();
    this._preset.checked = !!this._defaults.distilledPreset;
    await this.refreshLoras();
    if (this.isOpen()) await new LoraCuratedList(this, this.wrap.querySelector('.lora-curated')).render();
  }

  _readModel(modelId) {
    const model = this._panel.store.findModel(modelId);
    this.modelId = modelId;
    this._label = (model && (model.label || model.id)) || modelId;
    this._defaults = (model && model.defaults) || (model && model.manifest && model.manifest.defaults) || {};
    this._attached = (Array.isArray(this._defaults.loras) ? this._defaults.loras : [])
      .filter((lora) => lora && lora.name)
      .map((lora) => ({ name: lora.name, weight: LoraModal.weightOf(lora.weight), ...(lora.highNoise ? { highNoise: true } : {}) }));
    this.family = (model && model.family) || (model && model.manifest && model.manifest.family) || null;
  }

  _bindElements() {
    const q = (selector) => this.wrap.querySelector(selector);
    this._list = q('.lora-attached');
    this._add = q('#loraAdd');
    this._preset = q('#loraPreset');
    this._add.addEventListener('change', () => this._addPicked());
    this._list.addEventListener('click', (event) => this._onListClick(event));
    this._list.addEventListener('change', (event) => this._onWeightChange(event));
    q('[data-act="import-lora"]').addEventListener('click', () => this._importLora());
    q('[data-act="browse-civitai"]').addEventListener('click', () => this._browseCivitai());
    q('[data-act="save"]').addEventListener('click', () => this._save());
  }

  checkPreset() {
    this._preset.checked = true;
  }

  async attached() {
    this.close();
    await this._panel.refreshModels();
  }

  async refreshLoras(addName, weight) {
    let loras = [];
    try { const result = await this.api().listLoras(); loras = (result && result.success && result.loras) || []; } catch (_) { loras = []; }
    if (!this.isOpen()) return;
    this._library = loras;
    if (addName) this._attach(addName, weight);
    this._paint();
  }

  lorasWith(entries) {
    const names = new Set(entries.map((entry) => entry.name));
    return [...this._attached.filter((lora) => !names.has(lora.name)), ...entries];
  }

  static weightOf(value) {
    const weight = parseFloat(value);
    return (Number.isFinite(weight) && weight > 0) ? weight : LoraModal.DEFAULT_WEIGHT;
  }

  _attach(name, weight) {
    this._attached = this.lorasWith([{ name, weight: LoraModal.weightOf(weight) }]);
  }

  _paint() {
    this._list.innerHTML = LoraModalMarkup.attachedHtml(this._attached.map((lora) => this._rowView(lora)));
    this._add.innerHTML = LoraModalMarkup.addOptionsHtml(this._addGroups());
  }

  _rowView(lora) {
    const row = this._library.find((entry) => entry.name === lora.name) || null;
    return {
      title: (row && row.label) || lora.name,
      weight: lora.weight,
      highNoise: !!lora.highNoise,
      note: LoraModal._noteOf(row, this.family),
    };
  }

  static _noteOf(row, family) {
    if (!row) return { text: 'This LoRA is no longer in the library; it will be skipped until its file is back.', warn: true };
    const base = LoraBaseNote.describe(row, family);
    const trigger = row.trigger ? `Trigger words: ${row.trigger}` : '';
    return { text: [base.text, trigger].filter(Boolean).join(' '), warn: base.warn };
  }

  _addGroups() {
    const free = this._library.filter((row) => !this._attached.some((lora) => lora.name === row.name));
    if (!this.family) return [{ label: '', loras: free }];
    const fits = (row) => (row.families || []).includes(this.family);
    const unknown = (row) => !(row.families || []).length;
    return [
      { label: 'For this model', loras: free.filter(fits) },
      { label: 'Base not detected', loras: free.filter(unknown) },
      { label: 'Other architectures', loras: free.filter((row) => !fits(row) && !unknown(row)) },
    ];
  }

  _addPicked() {
    const name = this._add.value;
    if (!name) return;
    this._attach(name);
    this._paint();
  }

  _onListClick(event) {
    const button = event.target.closest && event.target.closest('[data-act="remove-lora"]');
    if (!button) return;
    this._attached.splice(LoraModal._indexOf(button), 1);
    this._paint();
  }

  _onWeightChange(event) {
    const input = event.target.closest && event.target.closest('input.lora-weight');
    const lora = input && this._attached[LoraModal._indexOf(input)];
    if (lora) lora.weight = LoraModal.weightOf(input.value);
  }

  static _indexOf(element) {
    return Number(element.closest('.lora-row').dataset.loraIndex);
  }

  async _importLora() {
    this.setError('');
    try {
      const result = await this.api().importLora();
      if (result && result.success && !result.canceled) await this.refreshLoras(result.name);
      else if (result && !result.success) this.setError(result.error || 'Import failed.');
    } catch (err) { this.setError(err.message); }
  }

  _browseCivitai() {
    this.setError('');
    this._panel.civitaiModal.open({
      type: 'LORA',
      family: this.family,
      onClose: (installedNames) => this._attachInstalled(installedNames),
    });
  }

  async _attachInstalled(names) {
    if (!this.isOpen()) return;
    await this.refreshLoras();
    if (!this.isOpen()) return;
    for (const name of names || []) if (this._library.some((row) => row.name === name)) this._attach(name);
    this._paint();
  }

  async _save() {
    this.setError('');
    const loras = this._attached.map((lora) => ({ ...lora }));
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
