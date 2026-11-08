class TurnActivity {
  static STEPS_MAX = 12;

  constructor(emit, messageId) {
    this._emit = emit;
    this._messageId = messageId;
    this.status = null;
    this.label = '';
    this.steps = [];
    this.changes = [];
  }

  begin() {
    this.status = 'working';
    this._send();
  }

  step(label) {
    if (this.status !== 'working' || !label) return;
    this.label = String(label);
    if (!this.steps.includes(this.label) && this.steps.length < TurnActivity.STEPS_MAX) this.steps.push(this.label);
    this._send();
  }

  done(changes) {
    this.status = 'done';
    this.label = '';
    this.changes = Array.isArray(changes) ? changes : [];
    this._send();
    return { status: 'done', steps: this.steps.slice(), changes: this.changes.slice(), at: Date.now() };
  }

  stopped(text) {
    if (this.status !== 'working') return;
    this.status = 'stopped';
    this.label = text || 'Stopped.';
    this._send();
  }

  failed(text) {
    if (this.status !== 'working') return;
    this.status = 'failed';
    this.label = text || 'The world could not be updated for this reply.';
    this._send();
  }

  _send() {
    if (typeof this._emit !== 'function') return;
    try {
      this._emit('mode:activity', {
        messageId: this._messageId, status: this.status, label: this.label, steps: this.steps.slice(), changes: this.changes.slice(),
      });
    } catch (_) {}
  }
}

module.exports = TurnActivity;
