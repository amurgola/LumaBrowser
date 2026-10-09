import SpeechText from './SpeechText.js';

export default class SpeakableChunker {
  static FENCE = '```';
  static MIN_CHUNK_CHARS = 24;
  static SENTENCE_END = /[.!?]+[\s"')\]]*\s+|\n\n+/g;

  constructor() {
    this.reset();
  }

  reset() {
    this._raw = '';
    this._carry = '';
    this._inFence = false;
  }

  push(text) {
    this._raw += text;
    return this._drain(false);
  }

  flush() {
    return this._drain(true);
  }

  _drain(flush) {
    this._carry += this._stripFences(this._takeRaw(flush));
    if (flush) this._inFence = false;
    const chunks = this._sentences(flush);
    return chunks.map((c) => SpeechText.clean(c)).filter(Boolean);
  }

  _takeRaw(flush) {
    let buf = this._raw;
    this._raw = '';
    const tail = flush ? null : /`{1,2}$/.exec(buf);
    if (tail) {
      this._raw = tail[0];
      buf = buf.slice(0, -tail[0].length);
    }
    return buf;
  }

  _stripFences(buf) {
    let out = '';
    let rest = buf;
    for (;;) {
      const fence = rest.indexOf(SpeakableChunker.FENCE);
      if (fence === -1) {
        if (!this._inFence) out += rest;
        return out;
      }
      if (!this._inFence) out += rest.slice(0, fence);
      this._inFence = !this._inFence;
      rest = rest.slice(fence + SpeakableChunker.FENCE.length);
    }
  }

  _sentences(flush) {
    const pending = this._carry;
    const chunks = [];
    const re = new RegExp(SpeakableChunker.SENTENCE_END.source, 'g');
    let consumed = 0;
    let m;
    while ((m = re.exec(pending)) !== null) {
      const end = m.index + m[0].length;
      if (pending.slice(consumed, end).trim().length >= SpeakableChunker.MIN_CHUNK_CHARS) {
        chunks.push(pending.slice(consumed, end));
        consumed = end;
      }
    }
    const rest = pending.slice(consumed);
    this._carry = flush ? '' : rest;
    if (flush && rest.trim()) chunks.push(rest);
    return chunks;
  }
}
