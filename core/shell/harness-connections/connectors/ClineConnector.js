const ConnectionPlan = require('../changes/ConnectionPlan');
const ConfigValue = require('../documents/ConfigValue');
const JsoncDocument = require('../documents/JsoncDocument');
const KeyPath = require('../documents/KeyPath');
const HarnessConnector = require('./HarnessConnector');

class ClineConnector extends HarnessConnector {
  static PROVIDER = 'openai-compatible';
  static PROTOCOL = 'openai-chat';
  static FILE_VERSION = 1;
  static CONTEXT_WINDOW = 32768;
  static MAX_TOKENS = 8192;
  static PROVIDER_KEYS = ['settings', 'tokenSource', 'updatedAt'];

  constructor() {
    super({
      id: 'cline',
      name: 'Cline',
      executable: 'cline',
      format: JsoncDocument,
      staleReason: 'LumaBrowser provider is missing or has changed.',
    });
  }

  configFiles(paths) {
    return [paths.clineProviderSettings, paths.clineModels, paths.clineMcp];
  }

  plan({ paths, endpoints, model, now }) {
    const plan = new ConnectionPlan();
    const providers = plan.file(paths.clineProviderSettings, JsoncDocument)
      .seed(['version'], ClineConnector.FILE_VERSION)
      .set(ClineConnector._providerKey('settings'), ClineConnector._settings(endpoints, model))
      .set(ClineConnector._providerKey('tokenSource'), 'manual')
      .seed(ClineConnector._providerKey('updatedAt'), now.toISOString());
    if (model) {
      providers.set(['lastUsedProvider'], ClineConnector.PROVIDER);
      plan.file(paths.clineModels, JsoncDocument)
        .seed(['version'], ClineConnector.FILE_VERSION)
        .set(ClineConnector._providerKey('models', model), ClineConnector._modelInfo(model));
    }
    plan.file(paths.clineMcp, JsoncDocument).set(['mcpServers', HarnessConnector.MCP_NAME], ClineConnector._mcpServer(endpoints));
    return plan;
  }

  legacyPriors(restore, paths) {
    const existing = ConfigValue.isTable(restore.existing) ? restore.existing : {};
    const priors = ClineConnector.PROVIDER_KEYS
      .map((key) => HarnessConnector._prior(paths.clineProviderSettings, ClineConnector._providerKey(key), existing[key]));
    if (restore.setModel) priors.push(HarnessConnector._prior(paths.clineProviderSettings, ['lastUsedProvider'], restore.provider));
    return priors;
  }

  _isConnected(data, endpoints) {
    const settings = KeyPath.lookup(data, ClineConnector._providerKey('settings')).value;
    return ConfigValue.isTable(settings) && settings.baseUrl === endpoints.openaiBaseUrl && settings.protocol === ClineConnector.PROTOCOL;
  }

  _recognises(entry, value, data, endpoints) {
    if (super._recognises(entry, value)) return true;
    if (!this._isConnected(data, endpoints)) return false;
    if (HarnessConnector._isAt(entry, ['lastUsedProvider'])) return value === ClineConnector.PROVIDER;
    return ClineConnector.PROVIDER_KEYS.some((key) => HarnessConnector._isAt(entry, ClineConnector._providerKey(key)));
  }

  static _providerKey(...rest) {
    return ['providers', ClineConnector.PROVIDER, ...rest];
  }

  static _settings(endpoints, model) {
    const settings = {
      provider: ClineConnector.PROVIDER,
      apiKey: HarnessConnector.LOCAL_TOKEN,
      baseUrl: endpoints.openaiBaseUrl,
      protocol: ClineConnector.PROTOCOL,
      client: ClineConnector.PROVIDER,
    };
    return model ? { ...settings, model } : settings;
  }

  static _modelInfo(model) {
    return {
      id: model,
      name: model,
      contextWindow: ClineConnector.CONTEXT_WINDOW,
      maxTokens: ClineConnector.MAX_TOKENS,
      supportsVision: false,
      supportsReasoning: false,
      capabilities: ['tools'],
    };
  }

  static _mcpServer(endpoints) {
    return { command: endpoints.mcp.command, args: endpoints.mcp.args, env: HarnessConnector._mcpEnv(endpoints), disabled: false };
  }
}

module.exports = ClineConnector;
