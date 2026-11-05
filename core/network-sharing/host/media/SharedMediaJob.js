const RouteReply = require('../routes/RouteReply');

class SharedMediaJob {
  constructor(service) {
    this._service = service;
  }

  async run(req, res) {
    this._setupSharedVariablesFromParameters(req, res);
    const refusal = await this._refusal();
    if (refusal) return RouteReply.send(res, refusal);
    this._openStream();
    return this._generate();
  }

  _setupSharedVariablesFromParameters(req, res) {
    this._req = req;
    this._res = res;
    this._body = req.body || {};
    this._model = typeof this._body.model === 'string' && this._body.model.trim() ? this._body.model.trim() : null;
    this._delivered = 0;
    this._aborted = false;
    this._started = false;
    this._finished = false;
  }

  async _refusal() {
    throw new Error(`${this.constructor.name} must implement _refusal()`);
  }

  _generateOnRouter() {
    throw new Error(`${this.constructor.name} must implement _generateOnRouter()`);
  }

  _enqueue() {
    throw new Error(`${this.constructor.name} must implement _enqueue()`);
  }

  _countDelivered() {
    throw new Error(`${this.constructor.name} must implement _countDelivered()`);
  }

  _usageDelta() {
    throw new Error(`${this.constructor.name} must implement _usageDelta()`);
  }

  _defaultError() {
    return 'generation failed';
  }

  _openStream() {
    this._res.setHeader('Content-Type', 'application/x-ndjson');
    this._res.setHeader('Cache-Control', 'no-cache, no-transform');
    this._res.on('close', () => this._onClose());
  }

  _onClose() {
    if (this._finished) return;
    this._aborted = true;
    if (!this._started) return;
    try {
      this._router.abort();
    } catch (_) {}
  }

  async _generate() {
    try {
      await this._enqueue(() => this._runQueued());
    } catch (err) {
      this._send('error', { message: (err && err.message) || this._defaultError() });
    } finally {
      this._finished = true;
      this._service.recordUsage(this._req.sharingToken, this._usageDelta());
      try {
        this._res.end();
      } catch (_) {}
    }
  }

  _runQueued() {
    if (this._aborted) return Promise.resolve({ success: false, aborted: true });
    this._started = true;
    return this._generateOnRouter();
  }

  _send(type, payload) {
    if (type === 'done') this._delivered += this._countDelivered(payload);
    try {
      this._res.write(JSON.stringify({ type, payload }) + '\n');
    } catch (_) {}
  }

  static _refuse(status, error) {
    return { status, body: { error } };
  }
}

module.exports = SharedMediaJob;
