const FileOperation = require('./FileOperation');

class CmdRemoval extends FileOperation {
  static NAMES = new Set(['del', 'erase', 'rd', 'rmdir']);
  static DIRECTORY_NAMES = new Set(['rd', 'rmdir']);

  constructor() {
    super({ verb: 'delete' });
  }

  covers(command) {
    return (command.dialect === 'cmd' || command.dialect === 'powershell') && CmdRemoval.NAMES.has(command.name);
  }

  targets(command) {
    return command.args.filter((arg) => !CmdRemoval._isSwitch(arg));
  }

  reachesTargets(command) {
    return CmdRemoval._switches(command).includes('/s') || CmdRemoval.DIRECTORY_NAMES.has(command.name);
  }

  sweepReason(command) {
    const switches = CmdRemoval._switches(command);
    const quietTree = switches.includes('/q') && CmdRemoval.DIRECTORY_NAMES.has(command.name);
    if (!switches.includes('/s') && !quietTree && !FileOperation.hasWildcard(this.targets(command))) return null;
    return `${command.display} /s or a wildcard deletes many files at once.`;
  }

  static _isSwitch(arg) {
    return /^\/[a-z]$/i.test(arg);
  }

  static _switches(command) {
    return command.lowered.filter(CmdRemoval._isSwitch);
  }
}

module.exports = CmdRemoval;
