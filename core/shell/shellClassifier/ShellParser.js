const SyntaxCatalog = require('./syntax/SyntaxCatalog');
const SimpleCommandBuilder = require('./syntax/SimpleCommandBuilder');
const ShellToken = require('./syntax/ShellToken');
const ShellLexer = require('./ShellLexer');

class ShellParser {
  static JOINS = Object.freeze({ '|': 'pipe', '|&': 'pipe', '&&': 'and', '||': 'or', ';': 'seq', '&': 'seq', '\n': 'seq' });
  static SEQUENCE = 'seq';

  static CLOSERS = Object.freeze([')', '}', 'done', 'fi', 'esac']);

  static parseLine(source, options = {}) {
    return ShellParser.parseTokens(ShellLexer.tokenize(source, options), options);
  }

  static parseTokens(tokens, options = {}) {
    return new ShellParser(SyntaxCatalog.forDialect(options.dialect))._parse(tokens);
  }

  constructor(syntax) {
    this._syntax = syntax;
    this._builder = new SimpleCommandBuilder(syntax);
    this._commands = [];
    this._segment = [];
    this._join = null;
  }

  _parse(tokens) {
    for (const token of tokens) {
      if (ShellToken.is(token, ShellToken.CONTROL)) this._endSegment(token);
      else this._segment.push(token);
    }
    this._endSegment(null);
    return this._commands;
  }

  _endSegment(control) {
    if (this._segment.length > 0) this._emitCommand();
    if (control) this._noteSeparator(control.op);
  }

  _emitCommand() {
    const joinedBy = this._join || (this._commands.length > 0 ? ShellParser.SEQUENCE : null);
    this._commands.push(this._builder.build(this._segment, joinedBy));
    this._segment = [];
    this._join = null;
  }

  _noteSeparator(op) {
    if (ShellParser.CLOSERS.includes(op)) {
      this._join = null;
      return;
    }
    const join = ShellParser.JOINS[op];
    if (!join || this._join) return;
    this._join = join;
    this._markBackground(op);
  }

  _markBackground(op) {
    const previous = this._commands[this._commands.length - 1];
    if (previous && op === this._syntax.backgroundOperator) previous.background = true;
  }
}

module.exports = ShellParser;
