export default class RunnerModelPicker {
  static SLOT_ID = 'ext-test-harness.runner';

  static DEFAULT_OPTION = '<option value="">Use active provider (default)</option>';

  constructor(select) {
    this._select = select;
  }

  bind() {
    if (this._select) this._select.addEventListener('change', () => this.save());
  }

  async populate() {
    const api = window.llmSlotAPI;
    if (!this._select || !api) return;
    this._select.innerHTML = RunnerModelPicker.DEFAULT_OPTION;
    try {
      const [models, slotConfig] = await Promise.all([
        api.getAllAvailableModels(),
        api.getSlotConfig(RunnerModelPicker.SLOT_ID),
      ]);
      for (const model of models || []) this._select.appendChild(RunnerModelPicker._option(model, slotConfig));
    } catch (err) {
      console.error('test-harness: failed to populate models:', err);
    }
  }

  async save() {
    const api = window.llmSlotAPI;
    if (!api) return;
    const value = this._select.value;
    try {
      if (value) {
        const [provider, model] = value.split('::');
        await api.setSlotConfig(RunnerModelPicker.SLOT_ID, provider, model);
      } else {
        await api.clearSlotConfig(RunnerModelPicker.SLOT_ID);
      }
    } catch (err) {
      console.error('test-harness: failed to save model slot:', err);
    }
  }

  static _option(model, slotConfig) {
    const option = document.createElement('option');
    option.value = `${model.providerId}::${model.modelId}`;
    option.textContent = model.label;
    if (model.providerId === (slotConfig?.provider || '') && model.modelId === (slotConfig?.model || '')) option.selected = true;
    return option;
  }
}
