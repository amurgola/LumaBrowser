const SseLineReader = require('../SseLineReader');
const RepetitionMonitor = require('../../RepetitionMonitor');
const ToolCallAccumulator = require('./ToolCallAccumulator');

class OpenAiStreamReader {
  static DONE = '[DONE]';
  static REPETITION = 'repetition';
  static REPETITION_NOTICE = '_The model got stuck repeating itself, so generation was stopped. '
    + 'Try resending, or turn off “thinking” for this model._';

  constructor(handlers = {}, { model = null, repetitionGuard = true } = {}) {
    this._handlers = handlers;
    this.id = null;
    this.model = model;
    this.role = 'assistant';
    this.content = '';
    this.finishReason = 'stop';
    this.usage = null;
    this.stopReason = null;
    this._toolCalls = new ToolCallAccumulator();
    this._contentMonitor = repetitionGuard ? new RepetitionMonitor() : null;
    this._reasoningMonitor = repetitionGuard ? new RepetitionMonitor() : null;
  }

  async read(stream) {
    await SseLineReader.read(stream, (lines) => this._processLines(lines));
    if (this.stopReason === OpenAiStreamReader.REPETITION) this._reportRepetition();
  }

  finalizeToolCalls() {
    const toolCalls = this._toolCalls.finalize();
    for (const call of toolCalls) this._notify('onToolCall', call);
    return toolCalls;
  }

  _processLines(lines) {
    for (const rawLine of lines) {
      const payload = OpenAiStreamReader._dataPayload(rawLine);
      if (payload === null) continue;
      if (payload === OpenAiStreamReader.DONE) return true;
      if (this._handlePayloadSafely(payload)) return true;
    }
    return false;
  }

  static _dataPayload(rawLine) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) return null;
    const payload = line.substring(5).trim();
    return payload || null;
  }

  _handlePayloadSafely(payload) {
    try {
      return this._handleFrame(JSON.parse(payload));
    } catch (_) {
      return false;
    }
  }

  _handleFrame(frame) {
    if (frame.object === 'luma.event') return this._onLumaEvent(frame);
    const choice = frame.choices?.[0] || null;
    this._recordIdentity(frame, choice);
    if (this._onReasoning(choice)) return true;
    if (this._onContent(choice, frame)) return true;
    this._onToolCallDeltas(choice);
    if (choice?.finish_reason) this.finishReason = choice.finish_reason;
    this._onUsage(frame);
    return false;
  }

  _onLumaEvent(frame) {
    if (frame.event === 'status') this._notify('onStatus', frame.payload || {});
    return false;
  }

  _recordIdentity(frame, choice) {
    if (frame.id) this.id = frame.id;
    if (frame.model) this.model = frame.model;
    if (choice?.delta?.role) this.role = choice.delta.role;
  }

  _onReasoning(choice) {
    const delta = choice?.delta?.reasoning_content ?? choice?.delta?.reasoning ?? '';
    if (!delta) return false;
    this._notify('onReasoning', delta);
    return this._tripped(this._reasoningMonitor, delta);
  }

  _onContent(choice, frame) {
    const delta = choice?.delta?.content ?? choice?.text ?? '';
    if (!delta) return false;
    this.content += delta;
    this._notify('onDelta', delta, frame);
    return this._tripped(this._contentMonitor, delta);
  }

  _onToolCallDeltas(choice) {
    const deltas = choice?.delta?.tool_calls;
    if (!Array.isArray(deltas)) return;
    for (const delta of deltas) this._notify('onToolCallDelta', this._toolCalls.add(delta));
  }

  _onUsage(frame) {
    if (!frame.usage) return;
    this.usage = frame.usage;
    this._notify('onUsage', this.usage);
  }

  _tripped(monitor, delta) {
    if (!monitor || !monitor.push(delta)) return false;
    this.stopReason = OpenAiStreamReader.REPETITION;
    return true;
  }

  _reportRepetition() {
    this.finishReason = OpenAiStreamReader.REPETITION;
    if (this.content) return;
    this.content = OpenAiStreamReader.REPETITION_NOTICE;
    try { this._notify('onDelta', this.content, null); } catch (_) {}
  }

  _notify(handlerName, ...args) {
    const handler = this._handlers[handlerName];
    if (typeof handler === 'function') handler(...args);
  }
}

module.exports = OpenAiStreamReader;
