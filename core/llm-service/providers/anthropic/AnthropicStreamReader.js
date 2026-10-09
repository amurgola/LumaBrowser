const SseLineReader = require('../SseLineReader');
const AnthropicResponseMapper = require('./AnthropicResponseMapper');

class AnthropicStreamReader {
  constructor(handlers = {}, model = null) {
    this._handlers = handlers;
    this.id = null;
    this.model = model;
    this.content = '';
    this.reasoning = '';
    this.finishReason = 'stop';
    this.usage = null;
    this.error = null;
    this._inputUsage = null;
  }

  read(stream) {
    return SseLineReader.read(stream, (lines) => this._processLines(lines));
  }

  _processLines(lines) {
    for (const line of lines) {
      const frame = AnthropicStreamReader._parseDataLine(line);
      if (frame) this._handleFrameSafely(frame);
    }
    return false;
  }

  _handleFrameSafely(frame) {
    try {
      this._handleFrame(frame);
    } catch (_) {}
  }

  static _parseDataLine(rawLine) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) return null;
    const payload = line.substring(5).trim();
    if (!payload) return null;
    try {
      return JSON.parse(payload);
    } catch (_) {
      return null;
    }
  }

  _handleFrame(frame) {
    if (frame.type === 'error') this._onError(frame.error || {});
    else if (frame.type === 'message_start' && frame.message) this._onMessageStart(frame.message);
    else if (frame.type === 'content_block_delta') this._onDelta(frame.delta || {}, frame);
    else if (frame.type === 'message_delta') this._onMessageDelta(frame);
  }

  _onError(err) {
    if (!err.message) this.error = 'Anthropic stream error';
    else this.error = err.type ? `${err.type}: ${err.message}` : err.message;
  }

  _onMessageStart(message) {
    this.id = message.id;
    this.model = message.model || this.model;
    if (!message.usage) return;
    this._inputUsage = message.usage;
    this.usage = AnthropicResponseMapper.usageFrom(this._inputUsage, null);
  }

  _onDelta(delta, frame) {
    if (delta.type === 'text_delta' && delta.text) {
      this.content += delta.text;
      this._notify('onDelta', delta.text, frame);
    } else if (delta.type === 'thinking_delta' && delta.thinking) {
      this.reasoning += delta.thinking;
      this._notify('onReasoning', delta.thinking, frame);
    }
  }

  _onMessageDelta(frame) {
    if (frame.delta?.stop_reason) this.finishReason = AnthropicResponseMapper.mapStopReason(frame.delta.stop_reason);
    if (!frame.usage) return;
    this.usage = AnthropicResponseMapper.usageFrom(this._inputUsage, frame.usage);
    this._notify('onUsage', this.usage);
  }

  _notify(handlerName, ...args) {
    const handler = this._handlers[handlerName];
    if (typeof handler === 'function') handler(...args);
  }
}

module.exports = AnthropicStreamReader;
