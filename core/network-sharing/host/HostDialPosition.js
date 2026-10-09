class HostDialPosition {
  static of(llmServerService) {
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
