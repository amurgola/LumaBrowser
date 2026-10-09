class BridgeGlobals {
  static imageRouter() {
    return global.__lumaImageRouter || null;
  }

  static imageServerService() {
    return global.__lumaImageServerService || null;
  }

  static videoRouter() {
    return global.__lumaVideoRouter || null;
  }

  static musicRouter() {
    return global.__lumaMusicRouter || null;
  }

  static tabPreview() {
    return global.__lumaTabPreview || null;
  }

  static groundingAvailable() {
    const grounding = global.__lumaVisualGrounding;
    try { return !!(grounding && grounding.isAvailable()); } catch (_) { return false; }
  }
}

module.exports = BridgeGlobals;
