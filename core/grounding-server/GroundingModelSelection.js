const GroundingServerService = require('./GroundingServerService');

class GroundingModelSelection {
  static SLOT_ID = 'visual-grounding';
  static PICK_DIALOG = {
    title: 'Choose a grounding model (GGUF with an mmproj next to it)',
    filters: [{ name: 'GGUF', extensions: ['gguf'] }],
    properties: ['openFile'],
  };

  constructor({ groundingServerService, llmService = null, pickPath }) {
    this._svc = groundingServerService;
    this._llm = llmService;
    this._pickPath = pickPath;
  }

  async setModel(sel) {
    const result = await this._svc.setModel(sel || {});
    if (result.success) this._routeSlot(!!(sel && sel.modelPath));
    return result;
  }

  async pickModel() {
    const picked = await this._pickPath(GroundingModelSelection.PICK_DIALOG);
    if (picked.canceled) return { success: false, canceled: true };
    return this.setModel({ modelPath: picked.paths[0] });
  }

  async downloadRecommended(id, emit) {
    const result = await this._svc.downloadRecommended(id, (ev) => emit(ev.type, ev));
    if (result.success) this._routeSlot(true);
    return result;
  }

  _routeSlot(on) {
    if (!this._llm) return;
    const entry = this._svc.computeProviderEntry();
    if (on && entry) {
      this._llm.setSlotConfig(GroundingModelSelection.SLOT_ID, GroundingServerService.PROVIDER_ID, entry.selectedModel);
    } else if (this._ownsSlot()) {
      this._llm.clearSlotConfig(GroundingModelSelection.SLOT_ID);
    }
  }

  _ownsSlot() {
    const config = this._llm.getSlotConfig(GroundingModelSelection.SLOT_ID);
    return !!config && config.provider === GroundingServerService.PROVIDER_ID;
  }
}

module.exports = GroundingModelSelection;
