const FileOperation = require('./FileOperation');
const ShellWords = require('../../ShellWords');

class PosixRemoval extends FileOperation {
  static NAMES = new Set(['rm', 'rmdir', 'unlink', 'shred', 'truncate']);

  constructor() {
    super({ verb: 'delete' });
  }

  covers(command) {
    return PosixRemoval.NAMES.has(command.name);
  }

  targets(command) {
    return ShellWords.nonFlags(command.args);
  }

  reachesTargets(command) {
    return command.name === 'rm' && (PosixRemoval._recursive(command) || PosixRemoval._forced(command));
  }

  unconditionalReason(command) {
    if (command.name !== 'rm' || !command.has('--no-preserve-root')) return null;
    return 'rm --no-preserve-root exists only to wipe the root filesystem.';
  }

  sweepReason(command) {
    if (command.name === 'shred') return `${command.display} destroys file contents beyond recovery.`;
    if (!PosixRemoval._recursive(command) && !FileOperation.hasWildcard(this.targets(command))) return null;
    return `${command.display} -r or a wildcard deletes many files at once.`;
  }

  static _recursive(command) {
    return command.hasShortFlag('r') || command.hasShortFlag('R') || command.has('--recursive');
  }

  static _forced(command) {
    return command.hasShortFlag('f') || command.has('--force');
  }
}

module.exports = PosixRemoval;
