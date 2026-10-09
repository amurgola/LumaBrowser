const ShellSyntax = require('./ShellSyntax');

class CmdSyntax extends ShellSyntax {
  constructor() {
    super('cmd', {
      escapeChar: '^',
      controlOperators: ['&&', '||', '|', '&', ';', '\n'],
      redirectOperators: ['>>', '>&', '<&', '>', '<'],
      ioNumber: /^\d$/,
    });
  }
}

module.exports = CmdSyntax;
