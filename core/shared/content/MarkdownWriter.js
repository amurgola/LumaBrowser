class MarkdownWriter {
  constructor({ inline = false } = {}) {
    this.inline = inline;
    this._buffer = '';
  }

  text(value) {
    let piece = String(value).replace(/\s+/g, ' ');
    if (this._endsWithSpaceOrLineStart()) piece = piece.replace(/^ /, '');
    this._buffer += piece;
  }

  lineBreak() {
    if (this.inline) return this.text(' ');
    this._trimTrailingSpaces();
    if (this._buffer && !this._buffer.endsWith('\n')) this._buffer += '\n';
    return undefined;
  }

  blockBreak() {
    if (this.inline) return this.text(' ');
    this._trimTrailingSpaces();
    if (!this._buffer || this._buffer.endsWith('\n\n')) return undefined;
    this._buffer += this._buffer.endsWith('\n') ? '\n' : '\n\n';
    return undefined;
  }

  block(markdown) {
    if (!markdown) return;
    if (this.inline) return this.text(markdown);
    this.blockBreak();
    this._buffer += markdown;
    this.blockBreak();
    return undefined;
  }

  toString() {
    return this.inline ? this._buffer.replace(/\s+/g, ' ') : this._buffer.trim();
  }

  _endsWithSpaceOrLineStart() {
    if (this.inline) return this._buffer.endsWith(' ');
    return this._buffer === '' || /[ \n]$/.test(this._buffer);
  }

  _trimTrailingSpaces() {
    this._buffer = this._buffer.replace(/ +$/, '');
  }
}

module.exports = MarkdownWriter;
