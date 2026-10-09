const RepetitionMonitor = require('../../../llm-service/RepetitionMonitor');
const NativeToolCallAccumulator = require('../../chat/NativeToolCallAccumulator');
const TimingsUsage = require('./TimingsUsage');

class OpenAiChatStream {
  static DONE_SENTINEL = '[DONE]';
  static REPETITION = 'repetition';
  static STUCK_IN_REASONING_NOTICE = '_The model got stuck repeating itself, so generation was stopped. '
    + 'Try resending, or turn off “thinking” for this model._';

  constructor(callbacks, stopRequest) {
    this._callbacks = callbacks || {};
    this._stopRequest = stopRequest || (() => {});
    this._contentMonitor = new RepetitionMonitor();
    this._reasoningMonitor = new RepetitionMonitor();
    this._toolCalls = new NativeToolCallAccumulator();
    this._aborted = false;
    this._doneFired = false;
    this._sawContent = false;
    this._stopReason = null;
    this._finishReason = null;
    this._usage = null;
    this._timings = null;
  }

  get aborted() {
    return this._aborted;
  }

  abort() {
    this._aborted = true;
    this._safeStopRequest();
  }

  handleLines(lines) {
    for (const line of lines) {
      if (this._aborted) return true;
      if (this._handleLine(line.replace(/\r$/, ''))) return true;
    }
    return this._aborted;
  }

  end() {
    if (!this._aborted) this._fireDone();
  }

  fail(error) {
    if (this._aborted) return;
    OpenAiChatStream._call(this._callbacks.onError, error);
  }

  summary() {
    return {
      finishReason: this._finishReason,
      stopReason: this._stopReason,
      usage: this._usage || TimingsUsage.fromTimings(this._timings),
      timings: this._timings,
      toolCalls: this._toolCalls.finalize(),
    };
  }

  _handleLine(line) {
    if (!line || !line.startsWith('data:')) return false;
    const payload = line.slice(5).trimStart();
    if (payload === OpenAiChatStream.DONE_SENTINEL) {
      this._fireDone();
      return false;
    }
    const frame = OpenAiChatStream._parse(payload);
    return frame ? this._handleFrame(frame) : false;
  }

  _handleFrame(frame) {
    this._recordMeters(frame);
    const choice = frame.choices && frame.choices[0];
    if (!choice) return false;
    if (choice.finish_reason) this._finishReason = choice.finish_reason;
    return this._emitContent(choice, frame)
      || this._emitReasoning(choice, frame)
      || this._collectToolCalls(choice);
  }

  _recordMeters(frame) {
    if (frame.usage) this._usage = frame.usage;
    if (frame.timings) this._timings = frame.timings;
  }

  _emitContent(choice, frame) {
    const delta = choice.delta && choice.delta.content;
    if (!OpenAiChatStream._isText(delta)) return false;
    this._sawContent = true;
    OpenAiChatStream._call(this._callbacks.onDelta, delta, frame);
    return this._contentMonitor.push(delta) && this._stopForRepetition('content');
  }

  _emitReasoning(choice, frame) {
    const delta = choice.delta && choice.delta.reasoning_content;
    if (!OpenAiChatStream._isText(delta)) return false;
    OpenAiChatStream._call(this._callbacks.onReasoningDelta, delta, frame);
    return this._reasoningMonitor.push(delta) && this._stopForRepetition('reasoning');
  }

  _collectToolCalls(choice) {
    const fragments = (choice.delta && choice.delta.tool_calls) || (choice.message && choice.message.tool_calls);
    if (!Array.isArray(fragments)) return false;
    this._toolCalls.add(fragments);
    if (!OpenAiChatStream._opensSlot(fragments) || !this._toolCalls.isLooping()) return false;
    return this._stopForRepetition('tool-calls');
  }

  _stopForRepetition(where) {
    if (this._aborted) return true;
    this._aborted = true;
    this._stopReason = OpenAiChatStream.REPETITION;
    this._finishReason = this._finishReason || OpenAiChatStream.REPETITION;
    this._safeStopRequest();
    if (where === 'reasoning' && !this._sawContent) {
      OpenAiChatStream._call(this._callbacks.onDelta, OpenAiChatStream.STUCK_IN_REASONING_NOTICE, null);
    }
    this._fireDone();
    return true;
  }

  _fireDone() {
    if (this._doneFired) return;
    this._doneFired = true;
    OpenAiChatStream._call(this._callbacks.onDone, this.summary());
  }

  _safeStopRequest() {
    try { this._stopRequest(); } catch (_) {}
  }

  static _opensSlot(fragments) {
    return fragments.some((fragment) => fragment && fragment.function
      && typeof fragment.function.name === 'string' && fragment.function.name);
  }

  static _parse(payload) {
    try { return JSON.parse(payload); } catch (_) { return null; }
  }

  static _isText(value) {
    return typeof value === 'string' && value.length > 0;
  }

  static _call(callback, ...args) {
    if (typeof callback !== 'function') return;
    try { callback(...args); } catch (_) {}
  }
}

module.exports = OpenAiChatStream;
