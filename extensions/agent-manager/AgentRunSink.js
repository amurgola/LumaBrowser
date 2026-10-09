class AgentRunSink {
  constructor(emit) {
    this._emit = typeof emit === 'function' ? emit : () => {};
    this._text = '';
    this._error = null;
    this._artifacts = [];
    this.hooks = {
      onDelta: (t) => this._delta(t),
      onReasoningDelta: (t) => { if (t) this._emit({ phase: 'reasoning', text: t }); },
      onToolEvent: (p) => this._emit({ phase: 'tool', tool: p }),
      onArtifact: (a) => this._artifact(a),
      onArtifactStream: () => {},
      onUsage: () => {},
      onToolTrace: () => {},
      onContentRollback: (chars) => this._rollback(chars),
      onDone: () => {},
      onError: (err) => { this._error = (err && err.message) || String(err) || 'agent run failed'; },
    };
  }

  fail(message) {
    this._error = this._error || message;
  }

  result() {
    return { text: this._text, error: this._error, artifacts: this._artifacts };
  }

  _delta(t) {
    if (!t) return;
    this._text += t;
    this._emit({ phase: 'delta', text: t });
  }

  _artifact(a) {
    if (!a || !a.id) return;
    this._artifacts.push(a);
    this._emit({ phase: 'artifact', artifact: a });
  }

  _rollback(chars) {
    if (!chars || !this._text) return;
    this._text = this._text.length > chars ? this._text.slice(0, -chars) : '';
  }
}

module.exports = AgentRunSink;
