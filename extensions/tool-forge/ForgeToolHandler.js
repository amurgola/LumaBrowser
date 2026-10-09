const McpEnvelope = require('./McpEnvelope');

class ForgeToolHandler {
  static shared = new ForgeToolHandler();

  constructor() {
    this._service = null;
  }

  setService(service) {
    this._service = service;
  }

  async handle(toolName, args, opts) {
    if (!this._service) return ForgeToolHandler._reply({ success: false, error: 'Tool Forge is not ready yet.' });
    try {
      return ForgeToolHandler._reply(await this._dispatch(toolName, args || {}, (opts && opts.chat) || {}));
    } catch (error) {
      return ForgeToolHandler._reply({ success: false, error: (error && error.message) || String(error) });
    }
  }

  _dispatch(toolName, args, chat) {
    if (toolName === 'create_tool') return this._service.createTool(args);
    if (toolName === 'test_tool') return this._service.testTool(args);
    if (toolName === 'publish_tool') return this._service.publishTool(args, { conversationId: chat.conversationId || null });
    throw new Error(`Unknown tool-forge tool: ${toolName}`);
  }

  static _reply(result) {
    return McpEnvelope.wrap(result, !result.success);
  }
}

module.exports = ForgeToolHandler;
