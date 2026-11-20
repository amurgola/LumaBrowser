import SlotModelOptions from '../../../core/llm-server/ui/js/models/SlotModelOptions.js';

export default class RunnerModelPicker {
  static SLOT_ID = 'ext-test-harness.runner';

  constructor(select) {
    this._select = select;
  }

  bind() {
    if (this._select) this._select.addEventListener('change', () => this.save());
  }

  async populate() {
    const api = window.llmSlotAPI;
    if (!this._select || !api) return;
    SlotModelOptions.fill(this._select, [], null);
    try {
      const [models, slotConfig] = await Promise.all([
        api.getAllAvailableModels(),
        api.getSlotConfig(RunnerModelPicker.SLOT_ID),
      ]);
      SlotModelOptions.fill(this._select, models, slotConfig);
    } catch (err) {
      console.error('test-harness: failed to populate models:', err);
    }
  }

  async save() {
    const api = window.llmSlotAPI;
    if (!api) return;
    const picked = SlotModelOptions.parse(this._select.value);
    try {
      if (picked) await api.setSlotConfig(RunnerModelPicker.SLOT_ID, picked.provider, picked.model);
      else await api.clearSlotConfig(RunnerModelPicker.SLOT_ID);
    } catch (err) {
      console.error('test-harness: failed to save model slot:', err);
    }
  }
}
