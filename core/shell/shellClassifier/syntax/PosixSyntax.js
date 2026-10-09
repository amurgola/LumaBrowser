const ShellSyntax = require('./ShellSyntax');

class PosixSyntax extends ShellSyntax {
  static DOUBLE_QUOTE_ESCAPABLE = '$`"\\\n';

  static RESERVED_WORDS = ['if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'while', 'until', 'esac', '!', '{', '}'];

  constructor() {
    super('posix', {
      escapeChar: '\\',
      singleQuotes: "'",
      ansiCQuotes: true,
      dollarParen: true,
      processSubstitution: true,
      backquoteSubstitution: true,
      assignments: true,
      backgroundOperator: '&',
      controlOperators: ['&&', '||', '|&', '|', ';', '&', '\n', '(', ')'],
      redirectOperators: ['&>>', '&>', '<<<', '<<-', '<<', '<>', '<&', '<', '>>', '>|', '>&', '>'],
      reservedWords: PosixSyntax.RESERVED_WORDS,
      ioNumber: /^\d+$/,
    });
  }

  escapesInDoubleQuotes(next) {
    return next !== '' && PosixSyntax.DOUBLE_QUOTE_ESCAPABLE.includes(next);
  }
}

module.exports = PosixSyntax;
