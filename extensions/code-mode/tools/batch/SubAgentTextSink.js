class SubAgentTextSink {
  constructor() {
    this._text = '';
    this._error = null;
    this.hooks = {
      onDelta: (t) => { if (t) this._text += t; },
      onReasoningDelta: () => {},
      onToolEvent: () => {},
      onArtifact: () => {},
      onArtifactStream: () => {},
      onUsage: () => {},
      onToolTrace: () => {},
      onContentRollback: (chars) => this._rollback(chars),
      onDone: () => {},
      onError: (err) => { this._error = (err && err.message) || String(err) || 'sub-agent run failed'; },
    };
  }

  text() {
    return this._text;
  }

  error() {
    return this._error;
  }

  setError(message) {
    this._error = this._error || message;
  }

  _rollback(chars) {
    if (!chars || !this._text) return;
    this._text = this._text.length > chars ? this._text.slice(0, -chars) : '';
  }
}

module.exports = SubAgentTextSink;
