const FileOperation = require('./FileOperation');
const ShellWords = require('../../ShellWords');
const SystemPaths = require('../../SystemPaths');

class MirrorSync extends FileOperation {
  static TOOLS = Object.freeze({
    rsync: {
      deletes: (command) => command.hasPrefix('--delete'),
      destination: (command) => ShellWords.nonFlags(command.args).slice(-1),
      reason: 'rsync --delete removes files at the destination.',
    },
    robocopy: {
      deletes: (command) => command.has('/mir', '/purge'),
      destination: (command) => command.args.filter((arg) => !arg.startsWith('/')).slice(1, 2),
      reason: 'robocopy /MIR or /PURGE deletes files at the destination.',
    },
  });

  constructor() {
    super({ verb: 'mirror over', protectedKinds: [SystemPaths.ROOT, SystemPaths.HOME] });
  }

  covers(command) {
    return Object.hasOwn(MirrorSync.TOOLS, command.name);
  }

  targets(command) {
    return MirrorSync.TOOLS[command.name].destination(command);
  }

  reachesTargets(command) {
    return MirrorSync.TOOLS[command.name].deletes(command);
  }

  sweepReason(command) {
    const tool = MirrorSync.TOOLS[command.name];
    return tool.deletes(command) ? tool.reason : null;
  }
}

module.exports = MirrorSync;
