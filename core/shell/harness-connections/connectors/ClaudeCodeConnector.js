const ConnectionPlan = require('../changes/ConnectionPlan');
const JsoncDocument = require('../documents/JsoncDocument');
const KeyPath = require('../documents/KeyPath');
const HarnessConnector = require('./HarnessConnector');

class ClaudeCodeConnector extends HarnessConnector {
  static MODEL_DISCOVERY = '1';

  constructor() {
    super({
      id: 'claude-code',
      name: 'Claude Code',
      executable: 'claude',
      format: JsoncDocument,
      staleReason: 'LumaBrowser settings are missing or have changed.',
    });
  }

  configFiles(paths) {
    return [paths.claudeSettings, paths.claudeUser];
  }

  plan({ paths, endpoints, model }) {
    const plan = new ConnectionPlan();
    const settings = plan.file(paths.claudeSettings, JsoncDocument);
    for (const [name, value] of Object.entries(ClaudeCodeConnector._gatewayEnv(endpoints))) settings.set(['env', name], value);
    if (model) settings.set(['model'], model);
    plan.file(paths.claudeUser, JsoncDocument).set(['mcpServers', HarnessConnector.MCP_NAME], ClaudeCodeConnector._mcpServer(endpoints));
    return plan;
  }

  legacyPriors(restore, paths) {
    const priors = Object.entries(restore.env || {})
      .map(([name, value]) => HarnessConnector._prior(paths.claudeSettings, ['env', name], value));
    if (restore.setModel) priors.push(HarnessConnector._prior(paths.claudeSettings, ['model'], restore.model));
    return priors;
  }

  _isConnected(data, endpoints) {
    const env = KeyPath.lookup(data, ['env']).value || {};
    return env.ANTHROPIC_BASE_URL === endpoints.anthropicBaseUrl
      && env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY === ClaudeCodeConnector.MODEL_DISCOVERY;
  }

  _recognises(entry, value, data, endpoints) {
    if (super._recognises(entry, value)) return true;
    return HarnessConnector._isAt(entry, ['model'])
      && typeof value === 'string'
      && KeyPath.lookup(data, ['env', 'ANTHROPIC_BASE_URL']).value === endpoints.anthropicBaseUrl;
  }

  static _gatewayEnv(endpoints) {
    return {
      ANTHROPIC_BASE_URL: endpoints.anthropicBaseUrl,
      ANTHROPIC_AUTH_TOKEN: HarnessConnector.LOCAL_TOKEN,
      CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: ClaudeCodeConnector.MODEL_DISCOVERY,
    };
  }

  static _mcpServer(endpoints) {
    return { command: endpoints.mcp.command, args: endpoints.mcp.args, env: HarnessConnector._mcpEnv(endpoints) };
  }
}

module.exports = ClaudeCodeConnector;
