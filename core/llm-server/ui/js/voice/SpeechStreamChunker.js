import SpeechText from './SpeechText.js';

export default class SpeechStreamChunker {
  static FENCE = '```';

  constructor() {
    this.reset();
  }

  reset() {
    this._prose = '';
    this._inFence = false;
  }

  push(text) {
    this._prose += this._stripFences(text);
    const { chunks, rest } = SpeechText.splitSentences(this._prose);
    this._prose = rest;
    return chunks;
  }

  flush() {
    const { chunks, rest } = SpeechText.splitSentences(this._prose);
    const tail = rest.trim() ? SpeechText.clean(rest) : '';
    if (tail) chunks.push(tail);
    this.reset();
    return chunks;
  }

  _stripFences(text) {
    let out = '';
    let buf = text;
    for (let at = buf.indexOf(SpeechStreamChunker.FENCE); at !== -1; at = buf.indexOf(SpeechStreamChunker.FENCE)) {
      if (!this._inFence) out += buf.slice(0, at);
      this._inFence = !this._inFence;
      buf = buf.slice(at + SpeechStreamChunker.FENCE.length);
    }
    return this._inFence ? out : out + buf;
  }
}
