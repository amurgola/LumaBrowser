class TomlScanner {
  static BARE_KEY = /[A-Za-z0-9_-]+/y;
  static SCALAR = /[^\s,\]}#]+/y;
  static LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
  static TIME_AFTER_SPACE = / \d{2}:/y;

  static scan(text) {
    return new TomlScanner(text)._statements();
  }

  constructor(text) {
    this._text = text;
    this._at = 0;
    this._table = [];
    this._inArrayTable = false;
  }

  _statements() {
    const statements = [];
    while (this._at < this._text.length) {
      const start = this._at;
      this._skipSpaces();
      if (this._atLineEndOrComment()) this._finishLine();
      else statements.push(this._peek() === '[' ? this._header(start) : this._pair(start));
    }
    return statements;
  }

  _header(start) {
    const kind = this._text.startsWith('[[', this._at) ? 'array-table' : 'table';
    const bracket = kind === 'array-table' ? 2 : 1;
    this._at += bracket;
    const path = this._key();
    this._at += bracket;
    this._table = path;
    this._inArrayTable = kind === 'array-table';
    this._finishLine();
    return { kind, path, start, end: this._at };
  }

  _pair(start) {
    const key = this._key();
    this._expect('=');
    this._skipSpaces();
    const valueStart = this._at;
    this._skipValue();
    const valueEnd = this._at;
    this._finishLine();
    return { kind: 'pair', path: [...this._table, ...key], inArrayTable: this._inArrayTable, start, end: this._at, valueStart, valueEnd };
  }

  _key() {
    const parts = [];
    for (;;) {
      this._skipSpaces();
      parts.push(this._keyPart());
      this._skipSpaces();
      if (this._peek() !== '.') return parts;
      this._at += 1;
    }
  }

  _keyPart() {
    const quote = this._peek();
    if (quote === '"' || quote === "'") {
      const start = this._at;
      this._skipString(quote);
      return TomlScanner._decodeQuotedKey(this._text.slice(start, this._at));
    }
    return this._match(TomlScanner.BARE_KEY, 'a key');
  }

  _skipValue() {
    const c = this._peek();
    if (c === '"' || c === "'") return this._skipString(c);
    if (c === '[') return this._skipCollection(']', false);
    if (c === '{') return this._skipCollection('}', true);
    return this._skipScalar();
  }

  _skipScalar() {
    const token = this._match(TomlScanner.SCALAR, 'a value');
    TomlScanner.TIME_AFTER_SPACE.lastIndex = this._at;
    if (TomlScanner.LOCAL_DATE.test(token) && TomlScanner.TIME_AFTER_SPACE.test(this._text)) {
      this._at += 1;
      this._match(TomlScanner.SCALAR, 'a time');
    }
  }

  _skipString(quote) {
    const triple = quote.repeat(3);
    if (this._text.startsWith(triple, this._at)) return this._skipMultilineString(quote, triple);
    this._at += 1;
    while (this._peek() !== quote) this._advanceInString(quote);
    this._at += 1;
  }

  _skipMultilineString(quote, triple) {
    this._at += 3;
    while (!this._text.startsWith(triple, this._at)) this._advanceInString(quote);
    this._at += 3;
    for (let extra = 0; extra < 2 && this._peek() === quote; extra += 1) this._at += 1;
  }

  _advanceInString(quote) {
    this._ensureNotAtEnd();
    this._at += quote === '"' && this._peek() === '\\' ? 2 : 1;
  }

  _skipCollection(close, keyed) {
    this._at += 1;
    for (;;) {
      this._skipGap();
      if (this._peek() === close) {
        this._at += 1;
        return;
      }
      if (keyed) {
        this._key();
        this._expect('=');
        this._skipGap();
      }
      this._skipValue();
      this._skipGap();
      if (this._peek() === ',') this._at += 1;
    }
  }

  _skipGap() {
    for (;;) {
      this._ensureNotAtEnd();
      const c = this._peek();
      if (c === '#') this._skipComment();
      else if (c === ' ' || c === '\t' || c === '\r' || c === '\n') this._at += 1;
      else return;
    }
  }

  _skipSpaces() {
    while (this._peek() === ' ' || this._peek() === '\t') this._at += 1;
  }

  _skipComment() {
    while (this._at < this._text.length && this._peek() !== '\n') this._at += 1;
  }

  _finishLine() {
    this._skipComment();
    if (this._at < this._text.length) this._at += 1;
  }

  _atLineEndOrComment() {
    const c = this._peek();
    return c === undefined || c === '\n' || c === '\r' || c === '#';
  }

  _expect(char) {
    this._skipSpaces();
    if (this._peek() !== char) throw new Error(`TOML scan: expected "${char}" at offset ${this._at}`);
    this._at += 1;
  }

  _match(pattern, what) {
    pattern.lastIndex = this._at;
    const found = pattern.exec(this._text);
    if (!found) throw new Error(`TOML scan: expected ${what} at offset ${this._at}`);
    this._at = pattern.lastIndex;
    return found[0];
  }

  _ensureNotAtEnd() {
    if (this._at >= this._text.length) throw new Error('TOML scan: unexpected end of file');
  }

  _peek() {
    return this._text[this._at];
  }

  static _decodeQuotedKey(raw) {
    if (raw.startsWith("'")) return raw.slice(1, -1);
    const jsonSafe = raw.replace(/\\(U[0-9A-Fa-f]{8}|e|.)/g, (escape, code) => {
      if (code === 'e') return '\\u001b';
      if (code.length === 9) return JSON.stringify(String.fromCodePoint(parseInt(code.slice(1), 16))).slice(1, -1);
      return escape;
    });
    return JSON.parse(jsonSafe);
  }
}

module.exports = TomlScanner;
