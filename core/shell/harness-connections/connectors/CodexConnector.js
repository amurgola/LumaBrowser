const ConnectionPlan = require('../changes/ConnectionPlan');
const ConfigValue = require('../documents/ConfigValue');
const KeyPath = require('../documents/KeyPath');
const TomlDocument = require('../documents/TomlDocument');
const HarnessConnector = require('./HarnessConnector');

class CodexConnector extends HarnessConnector {
  static PROVIDER_ID = 'lumabrowser';

  static WIRE_API = 'responses';

  static STREAM_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

  constructor() {
    super({
      id: 'codex',
      name: 'Codex',
      executable: 'codex',
      format: TomlDocument,
      staleReason: 'LumaBrowser provider is missing, outdated or no longer selected.',
    });
  }

  configFiles(paths) {
    return [paths.codexConfig];
  }

  plan({ paths, endpoints, model }) {
    const plan = new ConnectionPlan();
    const config = plan.file(paths.codexConfig, TomlDocument);
    config.set(['model_provider'], CodexConnector.PROVIDER_ID);
    if (model) config.set(['model'], model);
    config.set(['model_providers', CodexConnector.PROVIDER_ID], CodexConnector._provider(endpoints));
    config.set(['mcp_servers', HarnessConnector.MCP_NAME], CodexConnector._mcpServer(endpoints));
    return plan;
  }

  legacyPriors(restore, paths) {
    const priors = [HarnessConnector._prior(paths.codexConfig, ['model_provider'], restore.provider)];
    if (restore.setModel) priors.push(HarnessConnector._prior(paths.codexConfig, ['model'], restore.model));
    return priors;
  }

  _isConnected(data, endpoints) {
    const provider = KeyPath.lookup(data, ['model_providers', CodexConnector.PROVIDER_ID]).value;
    return data.model_provider === CodexConnector.PROVIDER_ID
      && CodexConnector._targetsUs(provider, endpoints)
      && provider.wire_api === CodexConnector.WIRE_API;
  }

  _recognises(entry, value, data, endpoints) {
    if (super._recognises(entry, value)) return true;
    if (HarnessConnector._isAt(entry, ['model'])) return data.model_provider === CodexConnector.PROVIDER_ID;
    if (HarnessConnector._isAt(entry, ['model_providers', CodexConnector.PROVIDER_ID])) {
      return CodexConnector._targetsUs(value, endpoints);
    }
    return false;
  }

  static _targetsUs(provider, endpoints) {
    return ConfigValue.isTable(provider) && provider.base_url === endpoints.openaiBaseUrl;
  }

  static _provider(endpoints) {
    return {
      name: 'LumaBrowser',
      base_url: endpoints.openaiBaseUrl,
      wire_api: CodexConnector.WIRE_API,
      stream_idle_timeout_ms: CodexConnector.STREAM_IDLE_TIMEOUT_MS,
    };
  }

  static _mcpServer(endpoints) {
    const env = HarnessConnector._mcpEnv(endpoints);
    const server = { command: endpoints.mcp.command, args: endpoints.mcp.args };
    return Object.keys(env).length ? { ...server, env } : server;
  }
}

module.exports = CodexConnector;
