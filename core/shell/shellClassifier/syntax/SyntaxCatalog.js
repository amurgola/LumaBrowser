const ShellDialect = require('../ShellDialect');
const PosixSyntax = require('./PosixSyntax');
const PowerShellSyntax = require('./PowerShellSyntax');
const CmdSyntax = require('./CmdSyntax');

class SyntaxCatalog {
  static _byDialect = Object.freeze({
    [ShellDialect.POSIX]: Object.freeze(new PosixSyntax()),
    [ShellDialect.POWERSHELL]: Object.freeze(new PowerShellSyntax()),
    [ShellDialect.CMD]: Object.freeze(new CmdSyntax()),
  });

  static forDialect(dialect) {
    return SyntaxCatalog._byDialect[ShellDialect.normalize(dialect)];
  }
}

module.exports = SyntaxCatalog;
