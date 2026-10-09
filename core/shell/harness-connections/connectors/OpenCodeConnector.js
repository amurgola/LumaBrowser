const ConnectionPlan = require('../changes/ConnectionPlan');
const ConfigValue = require('../documents/ConfigValue');
const JsoncDocument = require('../documents/JsoncDocument');
const KeyPath = require('../documents/KeyPath');
const HarnessConnector = require('./HarnessConnector');

class OpenCodeConnector extends HarnessConnector {
  static PROVIDER_ID = 'lumabrowser';
  static PROVIDER_NPM = '@ai-sdk/openai-compatible';

  constructor() {
    super({
      id: 'opencode',
      name: 'OpenCode',
      executable: 'opencode',
      format: JsoncDocument,
      staleReason: 'LumaBrowser provider is missing or has changed.',
    });
  }

  configFiles(paths) {
    return [paths.opencode];
  }

  plan({ paths, endpoints, model }) {
    const plan = new ConnectionPlan();
    const config = plan.file(paths.opencode, JsoncDocument)
      .set(['provider', OpenCodeConnector.PROVIDER_ID], OpenCodeConnector._provider(endpoints, model))
      .set(['mcp', HarnessConnector.MCP_NAME], OpenCodeConnector._mcpServer(endpoints));
    if (model) config.set(['model'], OpenCodeConnector._modelRef(model));
    return plan;
  }

  legacyPriors(restore, paths) {
    return restore.setModel ? [HarnessConnector._prior(paths.opencode, ['model'], restore.model)] : [];
  }

  _isConnected(data, endpoints) {
    return OpenCodeConnector._targetsUs(KeyPath.lookup(data, ['provider', OpenCodeConnector.PROVIDER_ID]).value, endpoints);
  }

  _recognises(entry, value, data, endpoints) {
    if (super._recognises(entry, value)) return true;
    if (HarnessConnector._isAt(entry, ['model'])) return typeof value === 'string' && value.startsWith(OpenCodeConnector._modelRef(''));
    if (HarnessConnector._isAt(entry, ['provider', OpenCodeConnector.PROVIDER_ID])) return OpenCodeConnector._targetsUs(value, endpoints);
    return false;
  }

  static _targetsUs(provider, endpoints) {
    return ConfigValue.isTable(provider)
      && provider.npm === OpenCodeConnector.PROVIDER_NPM
      && KeyPath.lookup(provider, ['options', 'baseURL']).value === endpoints.openaiBaseUrl;
  }

  static _modelRef(model) {
    return `${OpenCodeConnector.PROVIDER_ID}/${model}`;
  }

  static _provider(endpoints, model) {
    return {
      npm: OpenCodeConnector.PROVIDER_NPM,
      name: 'LumaBrowser',
      options: { baseURL: endpoints.openaiBaseUrl, apiKey: HarnessConnector.LOCAL_TOKEN },
      models: model ? { [model]: { name: model } } : {},
    };
  }

  static _mcpServer(endpoints) {
    return {
      type: 'local',
      command: [endpoints.mcp.command, ...endpoints.mcp.args],
      enabled: true,
      environment: HarnessConnector._mcpEnv(endpoints),
    };
  }
}

module.exports = OpenCodeConnector;
