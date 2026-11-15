class ParentRequests {
  constructor(port) {
    this._port = port;
    this._pending = new Map();
    this._seq = 0;
    port.on('message', (event) => this._onMessage(event && event.data));
  }

  send(method, params) {
    const id = ++this._seq;
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this._port.postMessage({ type: 'request', id, method, params });
    });
  }

  _onMessage(message) {
    if (!message || message.type !== 'reply') return;
    const waiting = this._pending.get(message.id);
    if (!waiting) return;
    this._pending.delete(message.id);
    if (message.error) waiting.reject(new Error(message.error));
    else waiting.resolve(message.result);
  }
}

module.exports = ParentRequests;
