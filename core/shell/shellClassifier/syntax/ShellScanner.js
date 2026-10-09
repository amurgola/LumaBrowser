const AnsiCString = require('./AnsiCString');

class ShellScanner {
  static MAX_NESTING = 128;

  constructor(syntax) {
    this._syntax = syntax;
    this._nesting = 0;
    this._pieces = this._piecesFor(syntax);
  }

  opensPiece(cursor) {
    return this._pieces.some((piece) => piece.opens(cursor));
  }

  readPiece(cursor) {
    const piece = this._pieces.find((candidate) => candidate.opens(cursor));
    return piece ? piece.read(cursor) : null;
  }

  skipBalanced(cursor, closer) {
    if (this._nesting >= ShellScanner.MAX_NESTING) {
      cursor.skipToEnd();
      return false;
    }
    this._nesting++;
    try {
      return this._skipUntil(cursor, closer);
    } finally {
      this._nesting--;
    }
  }

  skipBackquoted(cursor) {
    while (!cursor.atEnd) {
      const ch = cursor.take();
      if (ch === '`') return true;
      if (ch === '\\') cursor.take();
    }
    return false;
  }

  _piecesFor(syntax) {
    const pieces = [
      { enabled: syntax.escapeChar !== null, opens: (c) => c.peek() === syntax.escapeChar, read: (c) => this._readEscape(c) },
      { enabled: syntax.ansiCQuotes, opens: (c) => AnsiCString.opensAt(c), read: (c) => ShellScanner._quoted(AnsiCString.read(c)) },
      { enabled: syntax.hereStrings, opens: (c) => this._opensHereString(c), read: (c) => this._readHereString(c) },
      { enabled: syntax.singleQuotes !== '', opens: (c) => syntax.isSingleQuote(c.peek()), read: (c) => this._readSingleQuoted(c) },
      { enabled: syntax.doubleQuotes !== '', opens: (c) => syntax.isDoubleQuote(c.peek()), read: (c) => this._readDoubleQuoted(c) },
      { enabled: syntax.dollarParen, opens: (c) => c.startsWith('$('), read: (c) => this._readSubstitution(c) },
      { enabled: syntax.bracedVariables, opens: (c) => c.startsWith('${'), read: (c) => this._readBracedVariable(c) },
      { enabled: syntax.processSubstitution, opens: (c) => c.startsWith('<(') || c.startsWith('>('), read: (c) => this._readSubstitution(c) },
      { enabled: syntax.backquoteSubstitution, opens: (c) => c.peek() === '`', read: (c) => this._readBackquoted(c) },
    ];
    return pieces.filter((piece) => piece.enabled);
  }

  _skipUntil(cursor, closer) {
    while (!cursor.atEnd) {
      if (cursor.peek() === closer) {
        cursor.take();
        return true;
      }
      this._skipOne(cursor);
    }
    return false;
  }

  _skipOne(cursor) {
    if (this.readPiece(cursor) !== null) return;
    if (cursor.take() === '(') this.skipBalanced(cursor, ')');
  }

  _readEscape(cursor) {
    cursor.take();
    if (ShellScanner._takeLineBreak(cursor)) return ShellScanner._plain('');
    return ShellScanner._plain(cursor.take());
  }

  _readSingleQuoted(cursor) {
    return this._readQuoted(cursor, (ch) => this._syntax.isSingleQuote(ch), () => cursor.take());
  }

  _readDoubleQuoted(cursor) {
    return this._readQuoted(cursor, (ch) => this._syntax.isDoubleQuote(ch), () => this._readInsideDoubleQuotes(cursor));
  }

  _readQuoted(cursor, isQuote, readInside) {
    cursor.take();
    let text = '';
    while (!cursor.atEnd) {
      if (!isQuote(cursor.peek())) {
        text += readInside();
        continue;
      }
      cursor.take();
      if (!this._syntax.doubledQuotes || !isQuote(cursor.peek())) return ShellScanner._quoted(text);
      text += cursor.take();
    }
    return ShellScanner._quoted(text);
  }

  _readInsideDoubleQuotes(cursor) {
    const syntax = this._syntax;
    if (cursor.peek() === syntax.escapeChar && syntax.escapesInDoubleQuotes(cursor.peek(1))) return this._readEscape(cursor).text;
    if (syntax.dollarParen && cursor.startsWith('$(')) return this._readSubstitution(cursor).text;
    if (syntax.backquoteSubstitution && cursor.peek() === '`') return this._readBackquoted(cursor).text;
    return cursor.take();
  }

  _readSubstitution(cursor) {
    const start = cursor.position;
    cursor.take(2);
    this.skipBalanced(cursor, ')');
    return ShellScanner._plain(cursor.sliceFrom(start));
  }

  _readBracedVariable(cursor) {
    const start = cursor.position;
    cursor.take(2);
    while (!cursor.atEnd && cursor.peek() !== '}') {
      if (cursor.peek() === this._syntax.escapeChar) cursor.take();
      cursor.take();
    }
    cursor.take();
    return ShellScanner._plain(cursor.sliceFrom(start));
  }

  _readBackquoted(cursor) {
    const start = cursor.position;
    cursor.take();
    this.skipBackquoted(cursor);
    return ShellScanner._plain(cursor.sliceFrom(start));
  }

  _opensHereString(cursor) {
    if (cursor.peek() !== '@' || !this._quoteFamily(cursor.peek(1))) return false;
    const line = cursor.restOfLine();
    const hasNewline = cursor.position + line.length < cursor.text.length;
    return hasNewline && line.slice(2).trim() === '';
  }

  _readHereString(cursor) {
    const isQuote = this._quoteFamily(cursor.peek(1));
    cursor.take(cursor.restOfLine().length + 1);
    const start = cursor.position;
    let atLineStart = true;
    while (!cursor.atEnd) {
      if (atLineStart && isQuote(cursor.peek()) && cursor.peek(1) === '@') return ShellScanner._closeHereString(cursor, start);
      atLineStart = cursor.take() === '\n';
    }
    return ShellScanner._quoted(cursor.sliceFrom(start));
  }

  _quoteFamily(ch) {
    if (this._syntax.isSingleQuote(ch)) return (other) => this._syntax.isSingleQuote(other);
    if (this._syntax.isDoubleQuote(ch)) return (other) => this._syntax.isDoubleQuote(other);
    return null;
  }

  static _closeHereString(cursor, start) {
    const body = cursor.sliceFrom(start).replace(/\r?\n$/, '');
    cursor.take(2);
    return ShellScanner._quoted(body);
  }

  static _takeLineBreak(cursor) {
    if (cursor.startsWith('\r\n')) return cursor.take(2) && true;
    if (cursor.peek() === '\n') return cursor.take() && true;
    return false;
  }

  static _plain(text) {
    return { text, quoted: false };
  }

  static _quoted(text) {
    return { text, quoted: true };
  }
}

module.exports = ShellScanner;
