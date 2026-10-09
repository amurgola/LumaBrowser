class LlmRuntimesView {
  static invalidate(coreServices) {
    const llm = (coreServices && coreServices.llmServer) || global.__lumaLlmServerService;
    try {
      if (llm && typeof llm.invalidateRuntimesCache === 'function') llm.invalidateRuntimesCache();
    } catch (_) {
    }
  }
}

module.exports = LlmRuntimesView;
