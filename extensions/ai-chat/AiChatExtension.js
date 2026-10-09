const AiChatPreferences = require('./AiChatPreferences');
const AiChatAgentFactory = require('./AiChatAgentFactory');
const AiChatMcpHandler = require('./AiChatMcpHandler');
const mcpTools = require('./mcp-tools');

class AiChatExtension {
  constructor() {
    this._runner = null;
  }

  async activate(context) {
    this._registerPreferenceHandlers(context.ipc, new AiChatPreferences(context.db.getRawDb()));
    this._runner = AiChatAgentFactory.create(context);
    this._wireMcpHandler();
    return this._buildApi();
  }

  async deactivate() {
    this._runner = null;
  }

  _registerPreferenceHandlers(ipc, preferences) {
    ipc.handle('getPreferences', async () => preferences.get());
    ipc.handle('savePreferences', async (_event, values) => preferences.save(values));
  }

  _wireMcpHandler() {
    const handler = new AiChatMcpHandler(this._runner);
    mcpTools.handler = (toolName, args) => handler.handle(toolName, args);
  }

  _buildApi() {
    return { run: (options) => this._runner.run(options) };
  }
}

module.exports = AiChatExtension;
