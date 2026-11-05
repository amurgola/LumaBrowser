const fs = require('fs');
const path = require('path');
const ConnectionPlan = require('../changes/ConnectionPlan');
const ConfigValue = require('../documents/ConfigValue');
const JsoncDocument = require('../documents/JsoncDocument');
const KeyPath = require('../documents/KeyPath');
const HarnessConnector = require('./HarnessConnector');

class JetBrainsAirConnector extends HarnessConnector {
  static AGENT_NAME = 'LumaBrowser';
  static AIR_OPTION_PREFIX = 'air.';

  constructor() {
    super({
      id: 'jetbrains-air',
      name: 'JetBrains Air',
      executable: null,
      format: JsoncDocument,
      staleReason: 'LumaBrowser is not registered as an Air agent, or its command has changed.',
    });
  }

  configFiles(paths) {
    return [paths.jetbrainsAcp, paths.jetbrainsMcp];
  }

  detectInstalled(paths) {
    if (fs.existsSync(path.dirname(paths.jetbrainsAcp))) return true;
    return JetBrainsAirConnector._ideOptionDirs(paths.jetbrainsIdeConfigs)
      .some((dir) => JetBrainsAirConnector._listdir(dir).some((f) => f.startsWith(JetBrainsAirConnector.AIR_OPTION_PREFIX)));
  }

  plan({ paths, endpoints }) {
    if (!endpoints.acp) throw new Error('The luma command is not available in this build, so Air cannot start LumaBrowser as an agent.');
    const plan = new ConnectionPlan();
    plan.file(paths.jetbrainsAcp, JsoncDocument)
      .set(['agent_servers', JetBrainsAirConnector.AGENT_NAME], JetBrainsAirConnector._agentServer(endpoints));
    plan.file(paths.jetbrainsMcp, JsoncDocument)
      .set(['mcpServers', HarnessConnector.MCP_NAME], JetBrainsAirConnector._mcpServer(endpoints));
    return plan;
  }

  _isConnected(data, endpoints) {
    return JetBrainsAirConnector._targetsUs(KeyPath.lookup(data, ['agent_servers', JetBrainsAirConnector.AGENT_NAME]).value, endpoints);
  }

  _recognises(entry, value, data, endpoints) {
    if (super._recognises(entry, value)) return true;
    if (HarnessConnector._isAt(entry, ['agent_servers', JetBrainsAirConnector.AGENT_NAME])) return JetBrainsAirConnector._targetsUs(value, endpoints);
    return false;
  }

  static _targetsUs(server, endpoints) {
    if (!ConfigValue.isTable(server) || !endpoints.acp) return false;
    return server.command === endpoints.acp.command && ConfigValue.same(server.args, endpoints.acp.args);
  }

  static _agentServer(endpoints) {
    return {
      command: endpoints.acp.command,
      args: [...endpoints.acp.args],
      env: { ...(endpoints.acp.env || {}) },
      use_idea_mcp: false,
      use_custom_mcp: false,
    };
  }

  static _mcpServer(endpoints) {
    return { command: endpoints.mcp.command, args: [...endpoints.mcp.args], env: HarnessConnector._mcpEnv(endpoints) };
  }

  static _ideOptionDirs(root) {
    if (!root) return [];
    return JetBrainsAirConnector._listdir(root).map((ide) => path.join(root, ide, 'options'));
  }

  static _listdir(dir) {
    try { return fs.readdirSync(dir); } catch (_) { return []; }
  }
}

module.exports = JetBrainsAirConnector;
