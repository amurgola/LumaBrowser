const UpstreamChatRequest = require('./UpstreamChatRequest');

class TranslatedChatCompletion {
  static UPSTREAM_GATEWAY_STATUS = 502;

  static LOG_LABEL = 'chat';

  static run({ res, upstream, body, log, context = null }) {
    return new this({ res, upstream, body, log, context }).execute();
  }

  constructor({ res, upstream, body, log, context = null }) {
    this._res = res;
    this._upstream = upstream;
    this._body = body;
    this._log = log;
    this._context = context;
  }

  execute() {
    UpstreamChatRequest.open(this._upstream, this._body, {
      onResponse: (response) => this._read(response),
      onError: (error) => this._onUnreachable(error),
    });
  }

  _translate(completion) {
    throw new Error(`${this.constructor.name} must implement _translate(completion)`);
  }

  _sendError(status, message) {
    throw new Error(`${this.constructor.name} must implement _sendError(status, message)`);
  }

  _read(response) {
    UpstreamChatRequest.collect(response, (raw) => this._answer(response.statusCode, raw));
    response.on('error', () => this._fail(TranslatedChatCompletion.UPSTREAM_GATEWAY_STATUS, 'upstream connection failed'));
  }

  _answer(status, raw) {
    const parsed = UpstreamChatRequest.parseJson(raw);
    if (!status || status >= 400 || !parsed) return this._onUpstreamFailure(status, raw);
    return this._res.json(this._translate(parsed));
  }

  _onUpstreamFailure(status, raw) {
    const message = UpstreamChatRequest.errorText(raw, status);
    this._log(`${this.constructor.LOG_LABEL} upstream failed: ${message}`);
    return this._fail(status >= 400 ? status : TranslatedChatCompletion.UPSTREAM_GATEWAY_STATUS, message);
  }

  _onUnreachable(error) {
    const message = UpstreamChatRequest.unreachableMessage(error);
    this._log(message);
    this._fail(TranslatedChatCompletion.UPSTREAM_GATEWAY_STATUS, message);
  }

  _fail(status, message) {
    if (this._res.headersSent) return undefined;
    return this._sendError(status, message);
  }
}

module.exports = TranslatedChatCompletion;
