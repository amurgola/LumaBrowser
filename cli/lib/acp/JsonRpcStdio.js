const { EventEmitter } = require('events');

class JsonRpcError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    if (data !== undefined) this.data = data;
  }

  toJSON() {
    return { code: this.code, message: this.message, ...(this.data !== undefined ? { data: this.data } : {}) };
  }
}

class JsonRpcStdio extends EventEmitter {
  static PARSE_ERROR = -32700;
  static INVALID_REQUEST = -32600;
  static METHOD_NOT_FOUND = -32601;
  static INVALID_PARAMS = -32602;
  static INTERNAL_ERROR = -32603;
  static MAX_LINE_BYTES = 64 * 1024 * 1024;

  constructor({ input, output }) {
    super();
    this._input = input;
    this._output = output;
    this._handlers = new Map();
    this._pending = new Map();
    this._nextId = 1;
    this._buffer = '';
    this._closed = false;
  }

  handle(method, fn) {
    this._handlers.set(method, fn);
    return this;
  }

  start() {
    this._input.setEncoding('utf8');
    this._input.on('data', (chunk) => this._onData(chunk));
    this._input.on('end', () => this._onClose());
    this._input.on('close', () => this._onClose());
    this._input.on('error', () => this._onClose());
    return this;
  }

  get closed() {
    return this._closed;
  }

  request(method, params) {
    if (this._closed) return Promise.reject(new Error('JSON-RPC transport is closed'));
    const id = this._nextId++;
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this._write({ jsonrpc: '2.0', id, method, params: params === undefined ? {} : params });
    });
  }

  notify(method, params) {
    this._write({ jsonrpc: '2.0', method, params: params === undefined ? {} : params });
  }

  _onData(chunk) {
    this._buffer += chunk;
    let at;
    while ((at = this._buffer.indexOf('\n')) !== -1) {
      const line = this._buffer.slice(0, at).replace(/\r$/, '');
      this._buffer = this._buffer.slice(at + 1);
      if (line.trim()) this._onLine(line);
    }
    if (this._buffer.length > JsonRpcStdio.MAX_LINE_BYTES) this._buffer = '';
  }

  _onLine(line) {
    let msg;
    try { msg = JSON.parse(line); } catch (_) {
      return this._respondError(null, new JsonRpcError(JsonRpcStdio.PARSE_ERROR, 'Parse error'));
    }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
      return this._respondError(null, new JsonRpcError(JsonRpcStdio.INVALID_REQUEST, 'Invalid request'));
    }
    if (typeof msg.method === 'string') return this._onIncoming(msg);
    if (msg.id !== undefined) return this._onResponse(msg);
    return undefined;
  }

  _onIncoming(msg) {
    const isRequest = msg.id !== undefined && msg.id !== null;
    const fn = this._handlers.get(msg.method);
    if (!fn) {
      if (isRequest) this._respondError(msg.id, new JsonRpcError(JsonRpcStdio.METHOD_NOT_FOUND, `Method not found: ${msg.method}`));
      return;
    }
    let outcome;
    try { outcome = Promise.resolve(fn(msg.params === undefined ? {} : msg.params)); } catch (e) { outcome = Promise.reject(e); }
    outcome.then(
      (result) => { if (isRequest) this._write({ jsonrpc: '2.0', id: msg.id, result: result === undefined ? {} : result }); },
      (e) => { if (isRequest) this._respondError(msg.id, JsonRpcStdio._asRpcError(e)); else this.emit('handler-error', msg.method, e); },
    );
  }

  _onResponse(msg) {
    const waiter = this._pending.get(msg.id);
    if (!waiter) return;
    this._pending.delete(msg.id);
    if (msg.error) {
      const err = msg.error || {};
      waiter.reject(new JsonRpcError(err.code, err.message || 'request failed', err.data));
    } else {
      waiter.resolve(msg.result);
    }
  }

  _onClose() {
    if (this._closed) return;
    this._closed = true;
    for (const [, waiter] of this._pending) waiter.reject(new Error('JSON-RPC transport is closed'));
    this._pending.clear();
    this.emit('close');
  }

  _respondError(id, error) {
    this._write({ jsonrpc: '2.0', id, error: error.toJSON() });
  }

  _write(msg) {
    if (this._closed) return;
    try { this._output.write(`${JSON.stringify(msg)}\n`); } catch (_) { this._onClose(); }
  }

  static _asRpcError(e) {
    if (e instanceof JsonRpcError) return e;
    return new JsonRpcError(JsonRpcStdio.INTERNAL_ERROR, (e && e.message) || String(e));
  }
}

JsonRpcStdio.JsonRpcError = JsonRpcError;

module.exports = JsonRpcStdio;
