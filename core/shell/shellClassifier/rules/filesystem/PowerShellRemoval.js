const FileOperation = require('./FileOperation');
const PowerShellArgs = require('../../PowerShellArgs');

class PowerShellRemoval extends FileOperation {
  static NAMES = new Set(['remove-item', 'ri', 'rm', 'del', 'erase', 'rd', 'rmdir', 'clear-content', 'clc']);
  static DIRECTORY_ALIASES = new Set(['rd', 'rmdir']);
  static CMD_STYLE_ALIASES = new Set(['del', 'erase', 'rd', 'rmdir']);

  constructor() {
    super({ verb: 'delete' });
  }

  covers(command) {
    if (command.dialect !== 'powershell' || !PowerShellRemoval.NAMES.has(command.name)) return false;
    return !(PowerShellRemoval.CMD_STYLE_ALIASES.has(command.name) && command.args.some((arg) => /^\/[a-z]$/i.test(arg)));
  }

  targets(command) {
    const named = PowerShellArgs.param(command.args, ['Path', 'LiteralPath']);
    const fromParam = typeof named === 'string' ? PowerShellArgs.splitList(named) : [];
    return fromParam.concat(PowerShellArgs.positionals(command.args).flatMap(PowerShellArgs.splitList));
  }

  reachesTargets(command) {
    return PowerShellRemoval._recursive(command)
      || PowerShellArgs.switchOn(command.args, 'Force')
      || PowerShellRemoval.DIRECTORY_ALIASES.has(command.name);
  }

  sweepReason(command) {
    if (!PowerShellRemoval._recursive(command) && !FileOperation.hasWildcard(this.targets(command))) return null;
    return `${command.display} with -Recurse or a wildcard deletes many files at once.`;
  }

  static _recursive(command) {
    return PowerShellArgs.switchOn(command.args, 'Recurse');
  }
}

module.exports = PowerShellRemoval;
