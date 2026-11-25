class HostDialPosition {
  static of(llmServerService, modelRef = null) {
    return HostDialPosition._modelEffort(llmServerService, modelRef) || HostDialPosition._setupDefault(llmServerService);
  }

  static _modelEffort(llmServerService, modelRef) {
    try {
      const settings = modelRef && llmServerService && llmServerService.modelSettings;
      return settings ? (settings.resolve(modelRef).settings || {}).reasoningEffort || null : null;
    } catch (_) {
      return null;
    }
  }

  static _setupDefault(llmServerService) {
    try {
      const defaults = llmServerService && llmServerService.getDefaults ? llmServerService.getDefaults() : null;
      if (!defaults) return null;
      return defaults.noThink ? 'off' : (defaults.reasoningEffort || null);
    } catch (_) {
      return null;
    }
  }
}

module.exports = HostDialPosition;
