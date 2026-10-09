const JsonHttpClient = require('./mcp-stdio/JsonHttpClient');
const StdioJsonRpc = require('./mcp-stdio/StdioJsonRpc');
const AppLauncher = require('./mcp-stdio/AppLauncher');

class McpServer {
  static SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07'];
  static LIST_TIMEOUT_MS = 5000;
  static CALL_TIMEOUT_MS = 300000;
  static HEALTH_TIMEOUT_MS = 2000;

  constructor(apiBaseUrl, io = {}) {
    this.apiBase = apiBaseUrl || McpServer._defaultApiBase();
    this.healthUrl = `${this.apiBase}/health`;
    this.apiKey = process.env.LUMA_API_KEY || null;
    this.serverInfo = { name: 'luma-browser', version: '1.0.0' };
    this._rpc = new StdioJsonRpc({
      input: io.input || process.stdin,
      output: io.output || process.stdout,
      handleRequest: (method, params) => this.handleRequest(method, params),
      onClose: () => this.stop(),
    });
    this._launcher = new AppLauncher({ shellDir: __dirname, isRunning: () => this.isElectronRunning() });
  }

  async start() {
    await this._ensureAppRunning();
    this._rpc.open();
  }

  async stop() {
    this._rpc.close();
    this._launcher.stop();
  }

  async handleRequest(method, params) {
    switch (method) {
      case 'initialize': return this._initialize(params);
      case 'ping': return {};
      case 'tools/list': return this.listTools();
      case 'tools/call': return this.callTool(params.name, params.arguments);
      default: return undefined;
    }
  }

  async listTools() {
    try {
      const response = await JsonHttpClient.request('GET', `${this.apiBase}/mcp/tools`, {
        timeout: McpServer.LIST_TIMEOUT_MS,
        headers: this._authHeaders(),
      });
      if (!McpServer._isOk(response)) throw new Error(`Request failed with status code ${response.status}`);
      return { tools: (response.data && response.data.tools) || [] };
    } catch (error) {
      console.error('Failed to fetch tool list:', error.message);
      return { tools: [] };
    }
  }

  async callTool(name, args) {
    let errorMessage;
    try {
      const response = await JsonHttpClient.request('POST', `${this.apiBase}/mcp/call`, {
        body: { name, arguments: args },
        timeout: McpServer.CALL_TIMEOUT_MS,
        headers: this._authHeaders(),
      });
      if (McpServer._isOk(response)) return response.data;
      errorMessage = McpServer._errorFrom(response);
    } catch (error) {
      errorMessage = error.message || 'Tool call failed';
    }
    return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: errorMessage }, null, 2) }] };
  }

  async isElectronRunning() {
    try {
      return McpServer._isOk(await JsonHttpClient.request('GET', this.healthUrl, { timeout: McpServer.HEALTH_TIMEOUT_MS }));
    } catch (_) {
      return false;
    }
  }

  async _ensureAppRunning() {
    if (await this.isElectronRunning()) {
      console.error('Electron app is already running, using existing instance.');
      return;
    }
    await this._launcher.start();
  }

  _initialize(params) {
    const requested = params.protocolVersion;
    const supported = McpServer.SUPPORTED_PROTOCOL_VERSIONS;
    return {
      protocolVersion: supported.includes(requested) ? requested : supported[0],
      capabilities: { tools: {} },
      serverInfo: this.serverInfo,
    };
  }

  _authHeaders() {
    return this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {};
  }

  static _defaultApiBase() {
    const port = process.env.LUMA_API_PORT || '3000';
    const host = process.env.LUMA_API_HOST || '127.0.0.1';
    return `http://${host}:${port}/api`;
  }

  static _isOk(response) {
    return response.status >= 200 && response.status < 300;
  }

  static _errorFrom(response) {
    const data = response.data || {};
    const text = Array.isArray(data.content) && data.content[0] ? data.content[0].text : null;
    return text || data.error || `Request failed with status code ${response.status}`;
  }
}

module.exports = McpServer;
