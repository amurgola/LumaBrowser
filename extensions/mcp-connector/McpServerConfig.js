class McpServerConfig {
  static TRANSPORTS = new Set(['stdio', 'http', 'sse']);

  static normalize(input = {}) {
    const transport = McpServerConfig.TRANSPORTS.has(input.transport) ? input.transport : 'stdio';
    const base = { name: String(input.name || '').trim(), transport, enabled: input.enabled !== false };
    const fields = transport === 'stdio' ? McpServerConfig._stdioFields(input) : McpServerConfig._remoteFields(input);
    return { ...base, ...fields };
  }

  static validate(config) {
    if (!config.name) throw new Error('Server name is required');
    if (config.transport === 'stdio') McpServerConfig._validateStdio(config);
    else McpServerConfig._validateRemote(config);
  }

  static tokenizeArgs(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((arg) => String(arg));
    const out = [];
    const pattern = /"([^"]*)"|(\S+)/g;
    let match;
    while ((match = pattern.exec(String(value)))) out.push(match[1] != null ? match[1] : match[2]);
    return out;
  }

  static _stdioFields(input) {
    return {
      command: String(input.command || '').trim(),
      args: McpServerConfig.tokenizeArgs(input.args),
      env: McpServerConfig._stringMap(input.env),
      cwd: input.cwd ? String(input.cwd) : null,
    };
  }

  static _remoteFields(input) {
    return { url: String(input.url || '').trim(), headers: McpServerConfig._stringMap(input.headers) };
  }

  static _validateStdio(config) {
    if (!config.command) throw new Error('A command is required for a stdio server');
  }

  static _validateRemote(config) {
    if (!config.url) throw new Error('A URL is required for an HTTP/SSE server');
    try { new URL(config.url); } catch (_) { throw new Error('The URL is not valid'); }
  }

  static _stringMap(value) {
    const out = {};
    if (!value || typeof value !== 'object') return out;
    for (const [key, entry] of Object.entries(value)) {
      if (key && entry != null) out[String(key)] = String(entry);
    }
    return out;
  }
}

module.exports = McpServerConfig;
