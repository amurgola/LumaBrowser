const UserToolStore = require('./UserToolStore');
const ConfigStore = require('./ConfigStore');
const UserToolHost = require('./UserToolHost');
const ForgeService = require('./ForgeService');
const ForgeToolHandler = require('./ForgeToolHandler');
const MyToolsSetupActions = require('./MyToolsSetupActions');
const PublishedToolEnabler = require('./PublishedToolEnabler');
const ToolBundleFiles = require('./ToolBundleFiles');
const ChatRouterDeps = require('./ChatRouterDeps');
const ToolSandbox = require('./sandbox/ToolSandbox');
const CodeValidator = require('../../core/llm-server/validation/CodeValidator');
const LiveApi = require('../../core/llm-server/chat/LiveApi');
const SafeFetch = require('../../core/llm-server/chat/SafeFetch');
const AgentToolCatalog = require('../../core/llm-service/AgentToolCatalog');

class ToolForgeExtension {
  static REGISTER_RETRY_MS = 2000;
  static REGISTER_MAX_ATTEMPTS = 60;

  constructor() {
    this._sandbox = null;
    this._host = null;
    this._retryTimer = null;
  }

  async activate(context) {
    const rawDb = context.db.getRawDb();
    const parts = this._buildParts(rawDb, context.logger);
    ForgeToolHandler.shared.setService(parts.service);
    ToolForgeExtension._seedBuildersOff(rawDb);
    this._registerWhenReady(0);
    this._registerSetupTab(context, parts);
    if (context.logger && context.logger.info) context.logger.info('Tool Forge activated');
  }

  async deactivate() {
    if (this._retryTimer) clearTimeout(this._retryTimer);
    this._retryTimer = null;
    try { if (this._sandbox) this._sandbox.dispose(); } catch (_) {}
    ToolForgeExtension._unregisterUserTools();
    ForgeToolHandler.shared.setService(null);
    this._sandbox = null;
    this._host = null;
  }

  _buildParts(rawDb, logger) {
    const store = new UserToolStore(rawDb);
    const configStore = new ConfigStore(rawDb);
    const liveApi = new LiveApi({ getAgentDeps: () => ChatRouterDeps.agentDeps() });
    this._sandbox = new ToolSandbox({ getLiveApi: () => liveApi, safeFetch: SafeFetch.fetch, logger });
    this._host = new UserToolHost({ store, configStore, sandbox: this._sandbox, getAggregator: () => ChatRouterDeps.aggregator(), logger });
    const enabler = new PublishedToolEnabler({ rawDb, getChatStore: () => ChatRouterDeps.chatStore() });
    const service = new ForgeService({
      store,
      configStore,
      host: this._host,
      validator: CodeValidator,
      getExistingNames: () => ToolForgeExtension._catalogNames(),
      enableTool: (name, { conversationId } = {}) => enabler.enable(name, conversationId),
      logger,
    });
    return { store, configStore, service };
  }

  _registerWhenReady(attempt) {
    if (this._host.refresh()) return;
    if (attempt >= ToolForgeExtension.REGISTER_MAX_ATTEMPTS) return;
    this._retryTimer = setTimeout(() => this._registerWhenReady(attempt + 1), ToolForgeExtension.REGISTER_RETRY_MS);
  }

  _registerSetupTab(context, { store, configStore, service }) {
    if (!context.setupTab || typeof context.setupTab.onInvoke !== 'function') return;
    const files = new ToolBundleFiles({ service, store });
    const actions = new MyToolsSetupActions({ store, configStore, host: this._host, service, files });
    context.setupTab.onInvoke((action, payload) => actions.invoke(action, payload));
  }

  static _seedBuildersOff(rawDb) {
    try { AgentToolCatalog.seedDefaultOffAgentTools(rawDb, AgentToolCatalog.FORGE_TOOL_NAMES); } catch (_) {}
  }

  static _catalogNames() {
    const aggregator = ChatRouterDeps.aggregator();
    return aggregator ? AgentToolCatalog.getAllToolNames(aggregator) : [];
  }

  static _unregisterUserTools() {
    const aggregator = ChatRouterDeps.aggregator();
    if (!aggregator || typeof aggregator.unregisterExtension !== 'function') return;
    try { aggregator.unregisterExtension(UserToolHost.SOURCE_ID); } catch (_) {}
  }
}

module.exports = ToolForgeExtension;
