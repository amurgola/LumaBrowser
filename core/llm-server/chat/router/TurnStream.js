const LaunchErrorHints = require('./LaunchErrorHints');

class TurnStream {
  static NUMERIC_DIAGNOSTICS = ['offFormatCalls', 'lengthCutCompletions', 'missingArgCalls', 'overflowRecoveries'];

  constructor({ chatStore, send, conversationId, assistantMessageId, contextWindow, onSettled, react }) {
    this._store = chatStore;
    this._send = send;
    this._convId = conversationId;
    this._asstId = assistantMessageId;
    this._ctxWindow = contextWindow;
    this._onSettled = onSettled;
    this._react = react;
    this._content = '';
    this._reasoning = '';
    this._usage = null;
    this.finished = false;
    this.hooks = this._buildHooks();
  }

  fail(err) {
    const message = (err && err.message) || 'chat failed';
    const hints = LaunchErrorHints.of(err);
    this._finalize({ error: message }, 'error', { message, ...hints });
    return { message, hints };
  }

  abort(handle) {
    const alreadyFinished = this.finished;
    this._finalize({ error: 'aborted' }, 'done', {
      aborted: true,
      conversationId: this._convId,
      assistantMessageId: this._asstId,
    });
    try { if (handle && handle.abort) handle.abort(); } catch (_) {}
    if (!alreadyFinished) this._react(this._content, true);
  }

  _finalize(patch, type, payload) {
    if (this.finished) return;
    this.finished = true;
    this._onSettled();
    try {
      this._store.updateMessage(this._asstId, {
        content: this._content,
        reasoning: this._reasoning || null,
        tokensIn: (this._usage && (this._usage.prompt_tokens ?? this._usage.input_tokens)) || null,
        tokensOut: (this._usage && (this._usage.completion_tokens ?? this._usage.output_tokens)) || null,
        ...patch,
      });
    } catch (_) {}
    this._send(type, payload);
  }

  _buildHooks() {
    const live = (fn) => (payload) => { if (!this.finished) fn(payload); };
    return {
      onDelta: (text) => this._append('_content', 'delta', text),
      onReasoningDelta: (text) => this._append('_reasoning', 'reasoning-delta', text),
      onUsage: (u) => { if (u) this._usage = u; },
      onStatus: live((payload) => this._send('status', payload)),
      onDone: (summary) => this._done(summary),
      onError: (err) => {
        const message = (err && err.message) || String(err) || 'chat failed';
        this._finalize({ error: message }, 'error', { message, ...LaunchErrorHints.of(err) });
      },
      onToolEvent: live((payload) => this._send('tool', payload)),
      onArtifact: live((artifact) => this._send('artifact', artifact)),
      onArtifactStream: live((payload) => this._send('artifact-stream', payload)),
      onAgentEvent: live((payload) => this._agentEvent(payload)),
      onContentRollback: (chars) => this._rollback(chars),
      onToolTrace: (trace) => this._persistToolTrace(trace),
    };
  }

  _append(field, eventType, text) {
    if (this.finished || !text) return;
    this[field] += text;
    this._send(eventType, { text });
  }

  _done(summary) {
    this._usage = (summary && summary.usage) || this._usage;
    const alreadyFinished = this.finished;
    this._finalize({}, 'done', this._donePayload(summary));
    if (!alreadyFinished) this._react(this._content, false);
  }

  _donePayload(summary) {
    const s = summary || {};
    const payload = {
      finishReason: s.finishReason || 'stop',
      usage: this._usage || undefined,
      timings: s.timings || undefined,
      contextWindow: this._ctxWindow || undefined,
      conversationId: this._convId,
      assistantMessageId: this._asstId,
      iterations: typeof s.iterations === 'number' ? s.iterations : undefined,
      turnTimings: s.turnTimings || undefined,
      stopReason: s.stopReason || undefined,
      offFormatShapes: s.offFormatShapes || undefined,
      toolLoop: s.toolLoop || undefined,
    };
    for (const key of TurnStream.NUMERIC_DIAGNOSTICS) payload[key] = s[key] !== undefined ? s[key] : undefined;
    return payload;
  }

  _agentEvent(payload) {
    if (payload && typeof payload.type === 'string') {
      this._send(payload.type, payload.payload !== undefined ? payload.payload : payload);
    } else {
      this._send('agent', payload);
    }
  }

  _rollback(chars) {
    if (this.finished || !chars) return;
    const n = Math.min(chars, this._content.length);
    this._content = n >= this._content.length ? '' : this._content.slice(0, -n);
    this._send('rollback', { chars: n });
  }

  _persistToolTrace({ tools, artifacts }) {
    try {
      this._store.updateMessage(this._asstId, { toolCalls: { tools: tools || [], artifacts: artifacts || [] } });
    } catch (_) {}
  }
}

module.exports = TurnStream;
