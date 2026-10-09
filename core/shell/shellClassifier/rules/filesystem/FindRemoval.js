const FileOperation = require('./FileOperation');
const ShellCommandName = require('../../ShellCommandName');
const SystemPaths = require('../../SystemPaths');

class FindRemoval extends FileOperation {
  static EXEC_ACTIONS = new Set(['-exec', '-execdir', '-ok', '-okdir']);
  static DELETERS = new Set(['rm', 'unlink', 'rmdir', 'shred']);
  static PATH_OPTIONS = new Set(['-H', '-L', '-P']);

  constructor() {
    super({ verb: 'delete everything under', protectedKinds: [SystemPaths.ROOT] });
  }

  covers(command) {
    return command.name === 'find';
  }

  targets(command) {
    let start = 0;
    while (FindRemoval.PATH_OPTIONS.has(command.args[start])) start++;
    const words = command.args.slice(start);
    const end = words.findIndex((arg) => arg.startsWith('-') || arg === '(' || arg === '!');
    return end === -1 ? words : words.slice(0, end);
  }

  reachesTargets(command) {
    return this.sweepReason(command) !== null;
  }

  sweepReason(command) {
    if (command.has('-delete')) return 'find -delete removes every match.';
    return FindRemoval._execsDeleter(command) ? 'find -exec rm removes every match.' : null;
  }

  static _execsDeleter(command) {
    return command.args.some((arg, i) => FindRemoval.EXEC_ACTIONS.has(arg)
      && FindRemoval.DELETERS.has(ShellCommandName.base(command.args[i + 1] || '')));
  }
}

module.exports = FindRemoval;
