class ShellSyntax {
  static BLANKS = ' \t\r';
  static NEWLINE = '\n';

  static DEFAULTS = Object.freeze({
    escapeChar: null,
    singleQuotes: '',
    doubleQuotes: '"',
    doubledQuotes: false,
    ansiCQuotes: false,
    hereStrings: false,
    dollarParen: false,
    bracedVariables: false,
    processSubstitution: false,
    backquoteSubstitution: false,
    callOperator: false,
    assignments: false,
    backgroundOperator: null,
    controlOperators: ['\n'],
    redirectOperators: [],
    reservedWords: [],
    ioNumber: /^\d$/,
  });

  constructor(dialect, spec) {
    Object.assign(this, ShellSyntax.DEFAULTS, spec, { dialect });
    this.operators = ShellSyntax._longestFirst(this.controlOperators, this.redirectOperators);
    this._wordEnders = new Set([...ShellSyntax.BLANKS, ShellSyntax.NEWLINE, ...this.operators.map((operator) => operator.op[0])]);
    this._reserved = new Set(this.reservedWords);
  }

  isBlank(ch) {
    return ch !== '' && ShellSyntax.BLANKS.includes(ch);
  }

  endsWord(ch) {
    return this._wordEnders.has(ch);
  }

  isSingleQuote(ch) {
    return ch !== '' && this.singleQuotes.includes(ch);
  }

  isDoubleQuote(ch) {
    return ch !== '' && this.doubleQuotes.includes(ch);
  }

  escapesInDoubleQuotes(next) {
    return false;
  }

  isReservedWord(word) {
    return this._reserved.has(word);
  }

  defaultFd(op) {
    if (op.startsWith('&')) return 'all';
    return op.startsWith('<') ? 0 : 1;
  }

  static _longestFirst(controls, redirects) {
    const tagged = [
      ...controls.map((op) => ({ op, kind: 'control' })),
      ...redirects.map((op) => ({ op, kind: 'redirect' })),
    ];
    return tagged.sort((a, b) => b.op.length - a.op.length);
  }
}

module.exports = ShellSyntax;
