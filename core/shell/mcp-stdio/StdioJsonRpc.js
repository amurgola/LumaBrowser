const readline = require('readline');

class StdioJsonRpc {
  static PARSE_ERROR = -32700;
  static INVALID_REQUEST = -32600;
  static METHOD_NOT_FOUND = -32601;
  static INTERNAL_ERROR = -32603;

  constructor({ input, output, handleRequest, onClose }) {
    this._input = input;
    this._output = output;
    this._handleRequest = handleRequest;
    this._onClose = onClose || (() => {});
    this._reader = null;
    this._pending = new Set();
  }

  get isOpen() {
    return this._reader !== null;
  }

  open() {
    this._reader = readline.createInterface({ input: this._input, crlfDelay: Infinity });
    this._reader.on('line', (line) => this._track(this.handleLine(line)));
    this._reader.on('close', () => this._drainThenClose());
  }

  close() {
    if (!this._reader) return;
    this._reader.close();
    this._reader = null;
  }

  async handleLine(line) {
    if (!line.trim()) return;
    const message = this._parse(line);
    if (message === undefined) return;
    const { id, method, params } = message;
    if (typeof method !== 'string' || id === undefined || id === null) return;
    await this._answer(id, method, params || {});
  }

  _parse(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch (_) {
      this._sendError(null, StdioJsonRpc.PARSE_ERROR, 'Parse error');
      return undefined;
    }
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      this._sendError(null, StdioJsonRpc.INVALID_REQUEST, 'Invalid Request');
      return undefined;
    }
    return message;
  }

  async _answer(id, method, params) {
    try {
      const result = await this._handleRequest(method, params);
      if (result === undefined) {
        this._sendError(id, StdioJsonRpc.METHOD_NOT_FOUND, `Method not found: ${method}`);
        return;
      }
      this._send({ jsonrpc: '2.0', id, result });
    } catch (error) {
      this._sendError(id, StdioJsonRpc.INTERNAL_ERROR, error.message || 'Internal error');
    }
  }

  _track(handling) {
    const tracked = handling
      .catch((error) => console.error('MCP message handling failed:', error))
      .finally(() => this._pending.delete(tracked));
    this._pending.add(tracked);
  }

  async _drainThenClose() {
    this._reader = null;
    while (this._pending.size > 0) await Promise.all(this._pending);
    this._onClose();
  }

  _send(message) {
    this._output.write(`${JSON.stringify(message)}\n`);
  }

  _sendError(id, code, message) {
    this._send({ jsonrpc: '2.0', id, error: { code, message } });
  }
}

module.exports = StdioJsonRpc;
