const ShellRule = require('../ShellRule');
const ShellWords = require('../ShellWords');
const ReadOnlyVerdict = require('./readOnly/ReadOnlyVerdict');
const ToolchainCatalog = require('./readOnly/ToolchainCatalog');
const PowerShellCmdletCatalog = require('./readOnly/PowerShellCmdletCatalog');
const CmdBuiltinCatalog = require('./readOnly/CmdBuiltinCatalog');
const PosixUtilityCatalog = require('./readOnly/PosixUtilityCatalog');

class ReadOnlyRule extends ShellRule {
  static TOOLCHAINS = new ToolchainCatalog();
  static POWERSHELL = new PowerShellCmdletCatalog();
  static CMD = new CmdBuiltinCatalog();
  static POSIX = new PosixUtilityCatalog();

  static CATALOGS_BY_DIALECT = Object.freeze({
    powershell: Object.freeze([ReadOnlyRule.TOOLCHAINS, ReadOnlyRule.POWERSHELL, ReadOnlyRule.CMD, ReadOnlyRule.POSIX]),
    cmd: Object.freeze([ReadOnlyRule.TOOLCHAINS, ReadOnlyRule.CMD, ReadOnlyRule.POWERSHELL, ReadOnlyRule.POSIX]),
    posix: Object.freeze([ReadOnlyRule.TOOLCHAINS, ReadOnlyRule.POSIX]),
  });

  assess({ name, args, dialect }) {
    return ShellRule.readonly(ReadOnlyRule.isReadOnly(name, args, dialect));
  }

  static isReadOnly(name, args, dialect) {
    return ReadOnlyRule.explain(name, args, dialect).readOnly;
  }

  static explain(name, args, dialect) {
    const command = ShellWords.lower(name);
    const words = Array.isArray(args) ? args : [];
    for (const catalog of ReadOnlyRule._catalogsFor(dialect)) {
      const verdict = catalog.judge(command, words);
      if (verdict) return verdict;
    }
    return ReadOnlyVerdict.refuses(`${command || 'An empty command'} is not a known read-only command.`);
  }

  static _catalogsFor(dialect) {
    const known = Object.prototype.hasOwnProperty.call(ReadOnlyRule.CATALOGS_BY_DIALECT, dialect);
    return known ? ReadOnlyRule.CATALOGS_BY_DIALECT[dialect] : ReadOnlyRule.CATALOGS_BY_DIALECT.posix;
  }
}

module.exports = ReadOnlyRule;
