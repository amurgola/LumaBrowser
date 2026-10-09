const AiChatRunRequest = require('./AiChatRunRequest');

class AiChatMcpHandler {
  static RUN_TOOL = 'ai_chat_run';

  constructor(runner) {
    this._runner = runner;
  }

  async handle(toolName, args) {
    if (toolName !== AiChatMcpHandler.RUN_TOOL) throw new Error(`Unknown ai-chat tool: ${toolName}`);
    const result = await this._runner.run(AiChatRunRequest.toRunOptions(args, AiChatRunRequest.MCP_TIMEOUT_MS));
    return AiChatMcpHandler._textResult(result);
  }

  static _textResult(result) {
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
}

module.exports = AiChatMcpHandler;
