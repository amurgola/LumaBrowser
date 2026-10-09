export default class AnswerStream {
  static HOLD_MARKERS = ['```', '<tool_call', '<function'];

  constructor({ newAnswer, newReasoning }) {
    this._newAnswer = newAnswer;
    this._newReasoning = newReasoning;
    this.reset();
  }

  reset() {
    this._answer = null;
    this._reasoning = null;
    this._held = '';
  }

  pushAnswer(text) {
    this._held += text;
    const hold = this._lastHoldIndex();
    let out = '';
    if (hold === -1) { out = this._held; this._held = ''; }
    else if (hold > 0) { out = this._held.slice(0, hold); this._held = this._held.slice(hold); }
    if (out) this._appendToAnswer(out);
  }

  rollback(chars) {
    let n = Number(chars) || 0;
    const held = this._held.length;
    const drop = Math.min(n, held);
    this._held = drop >= held ? '' : this._held.slice(0, -drop);
    n -= drop;
    if (n > 0 && this._answer) this._answer.text = n >= this._answer.text.length ? '' : this._answer.text.slice(0, -n);
  }

  appendReasoning(text) {
    if (!this._reasoning) { this.sealAnswer(); this._reasoning = this._newReasoning(); }
    this._reasoning.text += text;
    return this._reasoning.chars;
  }

  sealAnswer() {
    const held = this._held;
    this._held = '';
    if (held) this._appendToAnswer(held);
    if (this._answer) { this._answer.seal(); this._answer = null; }
  }

  sealReasoning() {
    if (this._reasoning) { this._reasoning.seal(); this._reasoning = null; }
  }

  _appendToAnswer(text) {
    if (!this._answer) { this.sealReasoning(); this._answer = this._newAnswer(); }
    this._answer.text += text;
  }

  _lastHoldIndex() {
    let hold = -1;
    for (const m of AnswerStream.HOLD_MARKERS) {
      const i = this._held.lastIndexOf(m);
      if (i > hold) hold = i;
    }
    return hold;
  }
}
