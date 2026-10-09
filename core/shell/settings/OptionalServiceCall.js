class OptionalServiceCall {
  static MAX_IDE_IDS = 64;

  static MESSAGES = {
    cliShim: { missing: 'The terminal launcher is not available in this build.', failed: 'launcher operation failed' },
    idePlugin: { missing: 'The JetBrains plugin is not available in this build.', failed: 'plugin operation failed' },
    vscodeExtension: { missing: 'The VS Code extension is not available in this build.', failed: 'extension operation failed' },
  };

  static async run(service, messages, fn) {
    if (!service) return { success: false, error: messages.missing };
    try {
      return { success: true, ...(await fn(service)) };
    } catch (e) {
      return { success: false, error: (e && e.message) || messages.failed };
    }
  }

  static ideIds(ids) {
    return Array.isArray(ids) ? ids.map(String).slice(0, OptionalServiceCall.MAX_IDE_IDS) : [];
  }
}

module.exports = OptionalServiceCall;
