class JsonCommentStripper {
  static strip(source) {
    return new JsonCommentStripper(String(source == null ? '' : source)).execute();
  }

  constructor(source) {
    this._source = source;
    this._index = 0;
    this._output = '';
    this._quote = null;
    this._escaped = false;
  }

  execute() {
    while (this._index < this._source.length) {
      if (this._quote) this._copyStringCharacter();
      else this._copyCodeCharacter();
    }
    return this._output;
  }

  _copyStringCharacter() {
    const char = this._source[this._index];
    this._output += char;
    if (this._escaped) this._escaped = false;
    else if (char === '\\') this._escaped = true;
    else if (char === this._quote) this._quote = null;
    this._index += 1;
  }

  _copyCodeCharacter() {
    const char = this._source[this._index];
    const next = this._source[this._index + 1];
    if (char === '"' || char === '\'') return this._openString(char);
    if (char === '/' && next === '/') return this._skipLineComment();
    if (char === '/' && next === '*') return this._skipBlockComment();
    this._output += char;
    this._index += 1;
    return undefined;
  }

  _openString(quote) {
    this._quote = quote;
    this._output += quote;
    this._index += 1;
  }

  _skipLineComment() {
    while (this._index < this._source.length && this._source[this._index] !== '\n') this._index += 1;
  }

  _skipBlockComment() {
    this._index += 2;
    while (this._index < this._source.length && !this._atBlockCommentEnd()) this._index += 1;
    this._index += 2;
  }

  _atBlockCommentEnd() {
    return this._source[this._index] === '*' && this._source[this._index + 1] === '/';
  }
}

module.exports = JsonCommentStripper;
