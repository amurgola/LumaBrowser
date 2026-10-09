class HostModelInventory {
  constructor({ llmServerService, imageServerService }) {
    this._llm = llmServerService || null;
    this._image = imageServerService || null;
  }

  async localLlmModels() {
    if (!this._llm || typeof this._llm.listInstalledChatModels !== 'function') return null;
    try {
      return await this._llm.listInstalledChatModels();
    } catch (_) {
      return null;
    }
  }

  localContextWindow() {
    try {
      const effective = this._llm && typeof this._llm.getEffectiveContext === 'function' ? this._llm.getEffectiveContext() : null;
      const perSlot = effective && Number(effective.ctxPerSlot);
      return Number.isFinite(perSlot) && perSlot > 0 ? Math.floor(perSlot) : null;
    } catch (_) {
      return null;
    }
  }

  async imageModels(kind) {
    if (!this._image || typeof this._image.listInstalledModels !== 'function') return null;
    try {
      const list = await this._image.listInstalledModels(kind);
      return (list || []).map((model) => ({ id: model.id, label: model.label, current: !!model.current }));
    } catch (_) {
      return null;
    }
  }

  async imageModelDenied(role, modelId) {
    if (!modelId) return null;
    const models = await this.imageModels(role === 'image-edit' ? 'edit' : 'generate');
    if (!models) return 'model selection is not supported on this host';
    return models.some((model) => model.id === modelId) ? null : 'model is not available';
  }
}

module.exports = HostModelInventory;
