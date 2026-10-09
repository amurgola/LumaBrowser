class SseChannel {
  constructor(res) {
    this._res = res;
  }

  open() {
    if (this._res.headersSent) return;
    this._res.setHeader('Content-Type', 'text/event-stream');
    this._res.setHeader('Cache-Control', 'no-cache, no-transform');
    this._res.setHeader('Connection', 'keep-alive');
    if (typeof this._res.flushHeaders === 'function') this._res.flushHeaders();
  }

  data(payload) {
    this._write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  event(type, payload) {
    this._write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
  }

  done() {
    this._write('data: [DONE]\n\n');
  }

  _write(text) {
    this.open();
    try {
      this._res.write(text);
    } catch (_) {}
  }
}

module.exports = SseChannel;
