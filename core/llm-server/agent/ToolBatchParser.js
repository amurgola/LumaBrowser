class ToolBatchParser {
  static parse(browserTools, content, maxParallel) {
    const calls = ToolBatchParser._allCalls(browserTools, content).filter((call) => call && typeof call === 'object');
    return maxParallel > 1 ? calls : calls.slice(0, 1);
  }

  static _allCalls(browserTools, content) {
    if (typeof browserTools.parseToolCalls === 'function') return browserTools.parseToolCalls(content) || [];
    const one = browserTools.parseToolCall(content);
    return one ? [one] : [];
  }
}

module.exports = ToolBatchParser;
