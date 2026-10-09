const { Transform } = require('stream');

class ModelIdRewriter {
  static MODEL_FIELD = /"model"\s*:\s*"(?:[^"\\]|\\.)*"/g;

  static create(modelId) {
    return new ModelIdRewriter(modelId).toTransform();
  }

  constructor(modelId) {
    this._replacement = `"model":${JSON.stringify(modelId)}`;
    this._carry = '';
  }

  toTransform() {
    return new Transform({
      transform: (chunk, _encoding, callback) => callback(null, this._rewriteCompleteLines(chunk)),
      flush: (callback) => callback(null, this._rewriteRemainder()),
    });
  }

  _rewriteCompleteLines(chunk) {
    const text = this._carry + chunk.toString('utf8');
    const lastNewline = text.lastIndexOf('\n');
    if (lastNewline === -1) {
      this._carry = text;
      return undefined;
    }
    this._carry = text.slice(lastNewline + 1);
    return this._rewrite(text.slice(0, lastNewline + 1));
  }

  _rewriteRemainder() {
    const out = this._rewrite(this._carry);
    this._carry = '';
    return out;
  }

  _rewrite(text) {
    return text.replace(ModelIdRewriter.MODEL_FIELD, this._replacement);
  }
}

module.exports = ModelIdRewriter;
