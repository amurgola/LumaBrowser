const ShellSyntax = require('./ShellSyntax');

class PowerShellSyntax extends ShellSyntax {
  static SINGLE_QUOTES = "'‘’‚‛";
  static DOUBLE_QUOTES = '"“”„';

  constructor() {
    super('powershell', {
      escapeChar: '`',
      singleQuotes: PowerShellSyntax.SINGLE_QUOTES,
      doubleQuotes: PowerShellSyntax.DOUBLE_QUOTES,
      doubledQuotes: true,
      hereStrings: true,
      dollarParen: true,
      bracedVariables: true,
      callOperator: true,
      backgroundOperator: '&',
      controlOperators: ['&&', '||', '|', ';', '&', '\n', '(', ')', '{', '}'],
      redirectOperators: ['>>', '>&', '>', '<'],
      ioNumber: /^[1-6*]$/,
    });
  }

  escapesInDoubleQuotes(next) {
    return next !== '';
  }
}

module.exports = PowerShellSyntax;
