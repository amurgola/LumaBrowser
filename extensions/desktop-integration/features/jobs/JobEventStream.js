class JobEventStream {
  static HEARTBEAT_MS = 15000;

  constructor({ registry, heartbeatMs = JobEventStream.HEARTBEAT_MS, setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._registry = registry;
    this._clients = new Set();
    this._closed = false;
    this._ci = ci;
    this._off = registry.onChange((event) => this._broadcast('job', event.job));
    this._timer = si(() => this._heartbeat(), heartbeatMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  get size() {
    return this._clients.size;
  }

  handle(req, res) {
    if (this._closed) {
      res.status(404).json({ success: false, error: 'Feature disabled', feature: 'jobs' });
      return;
    }
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    if (req.socket && typeof req.socket.setTimeout === 'function') req.socket.setTimeout(0);
    JobEventStream._write(res, 'retry: 5000\n\n');
    JobEventStream._write(res, JobEventStream.frame('snapshot', { success: true, ...this._registry.list() }));
    this._clients.add(res);
    const drop = () => { this._clients.delete(res); };
    req.on('close', drop);
    res.on('close', drop);
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    try { this._off(); } catch (_) {}
    this._ci(this._timer);
    for (const res of this._clients) {
      JobEventStream._write(res, JobEventStream.frame('end', { reason: 'feature-stopped' }));
      try { res.end(); } catch (_) {}
    }
    this._clients.clear();
  }

  static frame(event, data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  _broadcast(event, data) {
    if (!this._clients.size) return;
    const text = JobEventStream.frame(event, data);
    for (const res of this._clients) JobEventStream._write(res, text);
  }

  _heartbeat() {
    for (const res of this._clients) JobEventStream._write(res, `: heartbeat ${Date.now()}\n\n`);
  }

  static _write(res, text) {
    try {
      if (!res.writableEnded && !res.destroyed) res.write(text);
    } catch (_) {}
  }
}

module.exports = JobEventStream;
