class ShellToken {
  static WORD = 'word';
  static CONTROL = 'control';
  static REDIRECT = 'redirect';

  static word(text, raw, quoted, start, end) {
    return { kind: ShellToken.WORD, text, raw, quoted, span: { start, end } };
  }

  static control(op, start, end) {
    return { kind: ShellToken.CONTROL, op, span: { start, end } };
  }

  static redirect(op, fd, start, end) {
    return { kind: ShellToken.REDIRECT, op, fd, span: { start, end } };
  }

  static is(token, kind) {
    return !!token && token.kind === kind;
  }
}

module.exports = ShellToken;
