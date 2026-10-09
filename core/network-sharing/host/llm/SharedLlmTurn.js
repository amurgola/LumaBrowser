const LiveTurnRegistry = require('./LiveTurnRegistry');
const TurnUsageMeter = require('./TurnUsageMeter');
const RouteReply = require('../routes/RouteReply');

class SharedLlmTurn {
  constructor(service, turns) {
    this._service = service;
    this._turns = turns;
  }

  async run(req, res) {
    this._setupSharedVariablesFromParameters(req, res);
    const refusal = await this._validate();
    if (refusal) return RouteReply.send(res, refusal);
    this._open();
    this._watchDisconnect();
    this._registerTurn();
    this._beforeDispatch();
    return this._dispatch();
  }

  async _validate() {
    throw new Error(`${this.constructor.name} must implement _validate()`);
  }

  _open() {
    throw new Error(`${this.constructor.name} must implement _open()`);
  }

  _beforeDispatch() {}

  async _startProxy() {
    throw new Error(`${this.constructor.name} must implement _startProxy()`);
  }

  _completedBody() {
    throw new Error(`${this.constructor.name} must implement _completedBody()`);
  }

  _cancelledBody() {
    throw new Error(`${this.constructor.name} must implement _cancelledBody()`);
  }

  _errorBody(message) {
    throw new Error(`${this.constructor.name} must implement _errorBody(message)`);
  }

  _streamCompleted(summary) {
    throw new Error(`${this.constructor.name} must implement _streamCompleted(summary)`);
  }

  _streamCancelled() {
    throw new Error(`${this.constructor.name} must implement _streamCancelled()`);
  }

  _streamFailed(message) {
    throw new Error(`${this.constructor.name} must implement _streamFailed(message)`);
  }

  _setupSharedVariablesFromParameters(req, res) {
    this._req = req;
    this._res = res;
    this._body = req.body || {};
    this._meter = new TurnUsageMeter(this._service, req.sharingToken);
    this._handle = null;
    this._ended = false;
    this._cancelled = false;
    this._unregister = () => {};
  }

  _watchDisconnect() {
    this._res.on('close', () => {
      this._cancel({ socketGone: true });
      this._meter.bank();
    });
  }

  _registerTurn() {
    this._unregister = this._turns.register(LiveTurnRegistry.turnIdOf(this._req), this._req.sharingToken, () => this._cancel());
  }

  async _dispatch() {
    try {
      this._handle = await this._startProxy();
      if (this._cancelled) this._abortHandle();
    } catch (err) {
      this._fail(err);
    }
  }

  _complete(summary) {
    if (summary && summary.usage) this._meter.setUsage(summary.usage);
    this._meter.bank();
    if (this._wantStream) {
      this._streamCompleted(summary);
      this._endOnce();
    } else if (!this._res.headersSent) {
      this._res.json(this._completedBody(summary));
      this._markEnded();
    }
  }

  _fail(err) {
    const message = (err && err.message) || String(err) || 'completion failed';
    this._meter.bank();
    if (!this._res.headersSent) {
      this._res.status(502).json(this._errorBody(message));
      this._markEnded();
      return;
    }
    if (this._wantStream) this._streamFailed(message);
    this._endOnce();
    console.warn(`[sharing] ${this._warnLabel()}:`, message);
  }

  _warnLabel() {
    return 'LLM proxy error';
  }

  _cancel({ socketGone = false } = {}) {
    if (this._ended || this._cancelled) return;
    this._cancelled = true;
    this._unregister();
    this._abortHandle();
    this._meter.bank();
    if (socketGone) {
      this._ended = true;
      return;
    }
    if (!this._res.headersSent) {
      this._res.json(this._cancelledBody());
      this._ended = true;
      return;
    }
    if (this._wantStream) this._streamCancelled();
    this._endOnce();
  }

  _abortHandle() {
    if (!this._handle || !this._handle.abort) return;
    try {
      this._handle.abort();
    } catch (_) {}
  }

  _markEnded() {
    this._ended = true;
    this._unregister();
  }

  _endOnce() {
    this._unregister();
    if (this._ended) return;
    this._ended = true;
    try {
      this._res.end();
    } catch (_) {}
  }
}

module.exports = SharedLlmTurn;
