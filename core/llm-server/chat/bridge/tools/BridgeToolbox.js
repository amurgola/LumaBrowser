const BrowserTools = require('../../../../llm-service/BrowserTools');

class BridgeToolbox {
  constructor({ parser, guard }) {
    this._parser = parser;
    this._guard = guard;
    this.TOOL_DEFINITIONS = BrowserTools.TOOL_DEFINITIONS;
  }

  getToolPrompt(toolNames) {
    return BrowserTools.getToolPrompt(toolNames);
  }

  parseToolCall(content) {
    return this._parser.parseToolCall(content);
  }

  parseToolCalls(content) {
    return this._parser.parseToolCalls(content);
  }

  executeTool(name, params, browserService) {
    return this._guard.execute(name, params, browserService);
  }
}

module.exports = BridgeToolbox;
