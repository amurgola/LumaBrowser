class ExtensionGlobals {
  static imageRouter() {
    return global.__lumaImageRouter || null;
  }

  static imageServerService() {
    return global.__lumaImageServerService || null;
  }

  static llmServerService() {
    return global.__lumaLlmServerService || null;
  }

  static chatRouter() {
    return global.__lumaChatRouter || null;
  }
}

module.exports = ExtensionGlobals;
