class AiChatRunRequest {
  static DEFAULT_MAX_ITERATIONS = 15;
  static MCP_TIMEOUT_MS = 300000;
  static REST_TIMEOUT_MS = 120000;

  static isValidPrompt(prompt) {
    return Boolean(prompt) && typeof prompt === 'string';
  }

  static toRunOptions(input, defaultTimeoutMs) {
    const source = input || {};
    return {
      prompt: source.prompt,
      tabId: source.tabId != null ? Number(source.tabId) : undefined,
      autoCloseTab: source.autoCloseTab !== undefined ? !!source.autoCloseTab : true,
      includeScreenshot: !!source.includeScreenshot,
      maxIterations: source.maxIterations ? Number(source.maxIterations) : AiChatRunRequest.DEFAULT_MAX_ITERATIONS,
      timeout: source.timeout ? Number(source.timeout) : defaultTimeoutMs,
      tools: Array.isArray(source.tools) ? source.tools : undefined,
      systemPromptAppend: source.systemPromptAppend || undefined,
    };
  }
}

module.exports = AiChatRunRequest;
