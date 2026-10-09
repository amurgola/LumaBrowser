const FileOperation = require('./FileOperation');
const ShellWords = require('../../ShellWords');

class PosixPermissionRewrite extends FileOperation {
  static NAMES = new Set(['chmod', 'chown', 'chgrp']);

  constructor() {
    super({ verb: 'rewrite permissions on' });
  }

  covers(command) {
    return PosixPermissionRewrite.NAMES.has(command.name);
  }

  targets(command) {
    return ShellWords.nonFlags(command.args);
  }

  reachesTargets(command) {
    return command.hasShortFlag('R') || command.has('--recursive');
  }

  sweepReason(command) {
    return this.reachesTargets(command) ? `${command.display} -R rewrites permissions on a whole tree.` : null;
  }
}

module.exports = PosixPermissionRewrite;
