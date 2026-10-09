class ReasoningRelay {
  constructor(hooks) {
    this._hooks = hooks || {};
    this._iterationReasoned = false;
    this._sawReasoningBefore = false;
    this.onToken = (token) => this._forward(token);
  }

  beginIteration() {
    this._iterationReasoned = false;
  }

  _forward(token) {
    if (!token) return;
    if (this._hooks.onReasoningDelta) {
      try {
        if (!this._iterationReasoned && this._sawReasoningBefore) this._hooks.onReasoningDelta('\n\n');
        this._hooks.onReasoningDelta(token);
      } catch (_) {}
    }
    this._iterationReasoned = true;
    this._sawReasoningBefore = true;
  }
}

module.exports = ReasoningRelay;
