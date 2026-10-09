class EvalEventCapture {
  constructor(onSettled) {
    this._onSettled = onSettled;
    this.text = '';
    this.doneInfo = null;
    this.error = null;
    this.assistantMessageId = null;
    this.compactions = 0;
    this.send = (type, payload = {}) => this._receive(type, payload);
  }

  fail(error) {
    if (!this.error) this.error = error;
  }

  _receive(type, payload) {
    if (type === 'meta') this.assistantMessageId = payload.assistantMessageId || this.assistantMessageId;
    else if (type === 'delta') this.text += payload.text || '';
    else if (type === 'rollback') this._rollback(payload);
    else if (type === 'status' && payload && payload.phase === 'compacted') this.compactions += 1;
    else if (type === 'error') this._error(payload);
    else if (type === 'done') this._done(payload);
  }

  _rollback(payload) {
    const n = Number(payload.chars) || 0;
    this.text = (n >= this.text.length) ? '' : this.text.slice(0, -n);
  }

  _error(payload) {
    this.fail(new Error((payload && payload.message) || 'chat failed'));
    this._onSettled();
  }

  _done(payload) {
    if (payload && payload.aborted) this.fail(new Error('aborted'));
    this.doneInfo = payload || {};
    this._onSettled();
  }
}

module.exports = EvalEventCapture;
