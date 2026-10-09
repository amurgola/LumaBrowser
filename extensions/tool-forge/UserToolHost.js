const SandboxPolicy = require('./sandbox/SandboxPolicy');
const McpEnvelope = require('./McpEnvelope');
const ToolOutputTruncator = require('../../core/llm-server/chat/ToolOutputTruncator');

class UserToolHost {
  static SOURCE_ID = 'user-tools';

  constructor({ store, configStore, sandbox, getAggregator, logger } = {}) {
    this._store = store;
    this._config = configStore;
    this._sandbox = sandbox;
    this._getAggregator = getAggregator;
    this._logger = logger || console;
    this._truncator = new ToolOutputTruncator();
  }

  buildToolSet() {
    const tools = this._store.published().map(UserToolHost._definition);
    return { tools, handler: (toolName, args, opts) => this.handle(toolName, args, opts) };
  }

  refresh() {
    const aggregator = typeof this._getAggregator === 'function' ? this._getAggregator() : null;
    if (!aggregator || typeof aggregator.registerExtension !== 'function') return false;
    aggregator.registerExtension(UserToolHost.SOURCE_ID, this.buildToolSet());
    return true;
  }

  async handle(toolName, args) {
    const tool = this._store.get(toolName);
    if (!tool || tool.status !== 'published') {
      return McpEnvelope.wrap({ success: false, error: `Unknown user tool "${toolName}".` }, true);
    }
    const result = await this.run(tool, args || {});
    return McpEnvelope.wrap(result, !result.success);
  }

  async run(tool, args, overrides) {
    const config = { ...this._config.resolve(tool.name), ...(overrides || {}) };
    const missing = UserToolHost._missingRequired(tool, config);
    if (missing.length) return UserToolHost._missingConfigResult(missing);
    const exec = await this._sandbox.exec({ code: tool.code, args, config, allowedHosts: tool.allowedHosts || [] });
    return this._shape(exec, UserToolHost._secrets(tool, config));
  }

  _shape(exec, secrets) {
    if (!exec.ok) return { success: false, error: SandboxPolicy.redactSecrets(exec.error || 'Tool failed.', secrets) };
    const capped = SandboxPolicy.capText(JSON.stringify(exec.result));
    const truncated = this._truncator.truncate(capped.text);
    return {
      success: true,
      result: SandboxPolicy.redactSecrets(truncated.text, secrets),
      truncated: capped.truncated || truncated.truncated,
    };
  }

  static _definition(tool) {
    return {
      name: tool.name,
      description: tool.description || `User-created tool "${tool.name}".`,
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
    };
  }

  static _missingRequired(tool, config) {
    return (tool.configSlots || [])
      .filter((slot) => slot.required && (config[slot.key] == null || config[slot.key] === ''))
      .map((slot) => slot.key);
  }

  static _missingConfigResult(missing) {
    return {
      success: false,
      error: `This tool needs configuration before it can run. Missing: ${missing.join(', ')}. `
        + 'Ask the user to fill these in Setup → My Tools (they are the tool\'s declared config slots).',
      missingConfig: missing,
    };
  }

  static _secrets(tool, config) {
    return (tool.configSlots || [])
      .filter((slot) => slot.secret)
      .map((slot) => ({ key: slot.key, value: config[slot.key] }))
      .filter((secret) => secret.value);
  }
}

module.exports = UserToolHost;
