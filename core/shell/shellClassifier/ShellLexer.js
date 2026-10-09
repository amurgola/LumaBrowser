const SyntaxCatalog = require('./syntax/SyntaxCatalog');
const SourceCursor = require('./syntax/SourceCursor');
const ShellScanner = require('./syntax/ShellScanner');
const WordReader = require('./syntax/WordReader');
const OperatorReader = require('./syntax/OperatorReader');
const ShellToken = require('./syntax/ShellToken');

class ShellLexer {
  static tokenize(source, options = {}) {
    return new ShellLexer(source, SyntaxCatalog.forDialect(options.dialect)).tokens();
  }

  constructor(source, syntax) {
    this._syntax = syntax;
    this._cursor = new SourceCursor(source);
    this._scanner = new ShellScanner(syntax);
    this._words = new WordReader(syntax, this._scanner);
    this._operators = new OperatorReader(syntax);
    this._tokens = [];
    this._atCommandStart = true;
  }

  tokens() {
    while (this._skipBlanks()) this._readToken();
    return this._tokens;
  }

  _skipBlanks() {
    this._cursor.takeWhile((ch) => this._syntax.isBlank(ch));
    return !this._cursor.atEnd;
  }

  _readToken() {
    const start = this._cursor.position;
    const operator = this._scanner.opensPiece(this._cursor) ? null : this._operators.read(this._cursor);
    if (operator) this._acceptOperator(operator, start);
    else this._acceptWord(this._words.read(this._cursor));
    if (this._cursor.position === start) this._cursor.take();
  }

  _acceptOperator(operator, start) {
    if (this._isCallOperator(operator)) return;
    const end = this._cursor.position;
    if (operator.kind === ShellToken.CONTROL) {
      this._tokens.push(ShellToken.control(operator.op, start, end));
      this._atCommandStart = true;
      return;
    }
    this._tokens.push(ShellToken.redirect(operator.op, this._syntax.defaultFd(operator.op), start, end));
    this._atCommandStart = false;
  }

  _isCallOperator(operator) {
    return this._syntax.callOperator && operator.op === '&' && this._atCommandStart;
  }

  _acceptWord(word) {
    if (!word) return;
    if (this._isIoNumber(word)) return this._acceptNumberedRedirect(word);
    if (this._isReservedWord(word)) {
      this._tokens.push(ShellToken.control(word.raw, word.span.start, word.span.end));
      return;
    }
    this._tokens.push(word);
    this._atCommandStart = false;
  }

  _isIoNumber(word) {
    return !word.quoted && this._syntax.ioNumber.test(word.raw) && this._operators.opensRedirect(this._cursor);
  }

  _acceptNumberedRedirect(word) {
    const operator = this._operators.readRedirect(this._cursor);
    const fd = word.raw === '*' ? 'all' : Number(word.raw);
    this._tokens.push(ShellToken.redirect(word.raw + operator.op, fd, word.span.start, this._cursor.position));
    this._atCommandStart = false;
  }

  _isReservedWord(word) {
    return this._atCommandStart && !word.quoted && this._syntax.isReservedWord(word.raw);
  }
}

module.exports = ShellLexer;
