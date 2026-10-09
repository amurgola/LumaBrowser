const LlmTraceRecord = require('./LlmTraceRecord');

class LlmCallRecorder {
  static MAX_ACCUMULATED_CHARS = LlmTraceRecord.MAX_TEXT_CHARS * 2;

  constructor({ tag, model, requestBody, onRecord }) {
    this._tag = tag || {};
    this._model = model;
    this._requestBody = requestBody;
    this._onRecord = onRecord;
    this._startedAt = Date.now();
    this._firstTokenAt = null;
    this._text = '';
    this._reasoning = '';
    this._usage = null;
    this._timings = null;
    this._finished = false;
  }

  wrap(hooks = {}) {
    return {
      ...hooks,
      onDelta: (t) => { this._appendText(t); return LlmCallRecorder._call(hooks.onDelta, t); },
      onReasoningDelta: (t) => { this._appendReasoning(t); return LlmCallRecorder._call(hooks.onReasoningDelta, t); },
      onUsage: (u) => { if (u) this._usage = u; return LlmCallRecorder._call(hooks.onUsage, u); },
      onTimings: (tm) => { if (tm) this._timings = tm; return LlmCallRecorder._call(hooks.onTimings, tm); },
      onDone: (summary) => { this._finishDone(summary || {}); return LlmCallRecorder._call(hooks.onDone, summary); },
      onError: (err) => { this._finishError(err); return LlmCallRecorder._call(hooks.onError, err); },
    };
  }

  _appendText(chunk) {
    this._markFirstToken();
    if (chunk && this._text.length < LlmCallRecorder.MAX_ACCUMULATED_CHARS) this._text += chunk;
  }

  _appendReasoning(chunk) {
    this._markFirstToken();
    if (chunk && this._reasoning.length < LlmCallRecorder.MAX_ACCUMULATED_CHARS) this._reasoning += chunk;
  }

  _markFirstToken() {
    if (!this._firstTokenAt) this._firstTokenAt = Date.now();
  }

  _finishDone(summary) {
    if (summary.usage) this._usage = summary.usage;
    if (summary.timings) this._timings = summary.timings;
    this._finish({
      text: this._text,
      reasoning: this._reasoning || undefined,
      toolCalls: Array.isArray(summary.toolCalls) && summary.toolCalls.length ? summary.toolCalls : undefined,
      finishReason: summary.finishReason || null,
      stopReason: summary.stopReason || null,
    });
  }

  _finishError(err) {
    this._finish({ text: this._text, reasoning: this._reasoning || undefined, error: (err && err.message) || String(err) });
  }

  _finish(response) {
    if (this._finished) return;
    this._finished = true;
    this._onRecord(this._tag.conversationId, this._buildRecord(response));
  }

  _buildRecord(response) {
    return {
      ts: new Date(this._startedAt).toISOString(),
      turnId: this._tag.turnId || null,
      callType: this._tag.callType || 'chat',
      model: this._model,
      request: this._requestSummary(),
      requestBody: this._requestBody,
      response,
      usage: LlmCallRecorder._normalizeUsage(this._usage),
      timings: this._timings || null,
      timing: { ttftMs: this._firstTokenAt ? this._firstTokenAt - this._startedAt : null, totalMs: Date.now() - this._startedAt },
    };
  }

  _requestSummary() {
    const body = this._requestBody || {};
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const { messages: _messages, tools: _tools, ...params } = body;
    return {
      messagesCount: messages.length,
      systemChars: LlmCallRecorder._systemChars(messages),
      tools: Array.isArray(body.tools) ? body.tools.map((t) => LlmCallRecorder._toolName(t)) : [],
      params,
    };
  }

  static _systemChars(messages) {
    const system = messages.find((m) => m && m.role === 'system');
    if (!system) return 0;
    return typeof system.content === 'string' ? system.content.length : JSON.stringify(system.content || '').length;
  }

  static _toolName(tool) {
    return (tool && tool.function && tool.function.name) || (tool && tool.name) || '?';
  }

  static _normalizeUsage(usage) {
    if (!usage) return null;
    return {
      promptTokens: LlmCallRecorder._firstDefined(usage.prompt_tokens, usage.promptTokens),
      completionTokens: LlmCallRecorder._firstDefined(usage.completion_tokens, usage.completionTokens),
    };
  }

  static _firstDefined(a, b) {
    if (a != null) return a;
    return b != null ? b : null;
  }

  static _call(fn, ...args) {
    return typeof fn === 'function' ? fn(...args) : undefined;
  }
}

module.exports = LlmCallRecorder;
