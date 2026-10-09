const AgentLoopText = require('./AgentLoopText');

class ToolCallGuard {
  constructor(options) {
    this._allowedTools = options.allowedTools || null;
  }

  check(call) {
    if (this._allowedTools && !this._allowedTools.includes(call.tool)) {
      return { tool: null, text: AgentLoopText.notAllowed(call.tool, this._allowedTools) };
    }
    return null;
  }
}

module.exports = ToolCallGuard;
