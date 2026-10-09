class McpTransportFactory {
  static WIN_SHELL_LAUNCHERS = new Set(['npx', 'npm', 'npm.cmd', 'npx.cmd', 'uvx', 'uv', 'yarn', 'pnpm', 'bunx', 'bun', 'deno']);

  build(config) {
    if (config.transport === 'stdio') return McpTransportFactory._stdio(config);
    const url = new URL(config.url);
    const requestInit = McpTransportFactory.requestInit(config.headers);
    if (config.transport === 'sse') return McpTransportFactory._sse(url, requestInit);
    return McpTransportFactory._streamableHttp(url, requestInit);
  }

  static stdioOptions(config, platform = process.platform, env = process.env) {
    let command = config.command;
    let args = Array.isArray(config.args) ? config.args.slice() : [];
    if (platform === 'win32' && McpTransportFactory.WIN_SHELL_LAUNCHERS.has(command.toLowerCase())) {
      args = ['/c', command, ...args];
      command = env.COMSPEC || 'cmd.exe';
    }
    return { command, args, cwd: config.cwd || undefined, env: { ...env, ...(config.env || {}) }, stderr: 'pipe' };
  }

  static requestInit(headers) {
    return headers && Object.keys(headers).length ? { headers: { ...headers } } : undefined;
  }

  static _stdio(config) {
    const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
    return new StdioClientTransport(McpTransportFactory.stdioOptions(config));
  }

  static _sse(url, requestInit) {
    const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
    return new SSEClientTransport(url, { requestInit });
  }

  static _streamableHttp(url, requestInit) {
    const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
    return new StreamableHTTPClientTransport(url, { requestInit });
  }
}

module.exports = McpTransportFactory;
