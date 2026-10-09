class CommentBlanker {
  static blank(src) {
    return new CommentBlanker(src).execute();
  }

  constructor(src) {
    this._src = src;
    this._out = src.split('');
    this._i = 0;
    this._state = null;
  }

  execute() {
    while (this._i < this._src.length) this._step(this._src[this._i], this._src[this._i + 1] || '');
    return this._out.join('');
  }

  _step(c, d) {
    if (this._state === null) return this._code(c, d);
    if (this._state === 'line') return this._lineComment(c);
    if (this._state === 'block') return this._blockComment(c, d);
    return this._string(c);
  }

  _code(c, d) {
    if (c === '"' || c === "'" || c === '`') { this._state = c; this._i++; return; }
    if (c === '/' && (d === '/' || d === '*')) {
      this._state = d === '/' ? 'line' : 'block';
      this._blankAt(this._i);
      this._blankAt(this._i + 1);
      this._i += 2;
      return;
    }
    this._i++;
  }

  _lineComment(c) {
    if (c === '\n') this._state = null;
    else this._blankAt(this._i);
    this._i++;
  }

  _blockComment(c, d) {
    if (c === '*' && d === '/') {
      this._blankAt(this._i);
      this._blankAt(this._i + 1);
      this._state = null;
      this._i += 2;
      return;
    }
    if (c !== '\n') this._blankAt(this._i);
    this._i++;
  }

  _string(c) {
    if (c === '\\') { this._i += 2; return; }
    if (c === this._state || (this._state !== '`' && c === '\n')) this._state = null;
    this._i++;
  }

  _blankAt(i) {
    this._out[i] = ' ';
  }
}

module.exports = CommentBlanker;
