const SseLineReader = require('../../../llm-service/providers/SseLineReader');
const UpstreamChatRequest = require('./UpstreamChatRequest');

class TranslatedChatStream {
  static DATA_PREFIX = 'data:';

  static DONE_MARKER = '[DONE]';

  static run({ res, upstream, body, log, context = null }) {
    return new this({ res, upstream, body, log, context }).execute();
  }

  constructor({ res, upstream, body, log, context = null }) {
    this._res = res;
    this._upstream = upstream;
    this._body = body;
    this._log = log;
    this._context = context;
    this._translator = this._createTranslator((type, payload) => this._write(type, payload));
  }

  execute() {
    this._openEventStream();
    const request = UpstreamChatRequest.open(this._upstream, this._body, {
      onResponse: (response) => this._relay(response),
      onError: (error) => this._onUnreachable(error),
    });
    this._abortWhenClientLeaves(request);
  }

  static parseLine(line) {
    if (!line.startsWith(TranslatedChatStream.DATA_PREFIX)) return null;
    const data = line.slice(TranslatedChatStream.DATA_PREFIX.length).trim();
    if (!data || data === TranslatedChatStream.DONE_MARKER) return null;
    return UpstreamChatRequest.parseJson(data);
  }

  _createTranslator(emit) {
    throw new Error(`${this.constructor.name} must implement _createTranslator(emit)`);
  }

  _openEventStream() {
    this._res.status(200);
    this._res.setHeader('Content-Type', 'text/event-stream');
    this._res.setHeader('Cache-Control', 'no-cache, no-transform');
    this._res.setHeader('Connection', 'keep-alive');
    this._res.setHeader('X-Accel-Buffering', 'no');
    if (typeof this._res.flushHeaders === 'function') this._res.flushHeaders();
  }

  _relay(response) {
    response.setEncoding('utf8');
    if (UpstreamChatRequest.isFailure(response)) return this._relayFailure(response);
    const finish = () => this._finish();
    return SseLineReader.read(response, (lines) => this._onLines(lines)).then(finish, finish);
  }

  _relayFailure(response) {
    UpstreamChatRequest.collect(response, (raw) => {
      this._translator.error(UpstreamChatRequest.errorText(raw, response.statusCode));
      this._endResponse();
    });
  }

  _onLines(lines) {
    for (const line of lines) this._onChunk(TranslatedChatStream.parseLine(line));
    return false;
  }

  _onChunk(chunk) {
    if (!chunk) return;
    if (chunk.error) this._translator.error(String(chunk.error.message || chunk.error));
    else this._translator.chunk(chunk);
  }

  _finish() {
    this._translator.end();
    this._endResponse();
  }

  _onUnreachable(error) {
    const message = UpstreamChatRequest.unreachableMessage(error);
    this._log(message);
    this._translator.error(message);
    this._endResponse();
  }

  _write(type, payload) {
    try { this._res.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`); } catch (_) {}
  }

  _endResponse() {
    try { this._res.end(); } catch (_) {}
  }

  _abortWhenClientLeaves(request) {
    this._res.on('close', () => {
      if (!this._res.writableFinished && request) request.destroy();
    });
  }
}

module.exports = TranslatedChatStream;
