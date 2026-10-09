const FileOperation = require('./FileOperation');

class WindowsPermissionRewrite extends FileOperation {
  static NAMES = new Set(['takeown', 'icacls']);
  static ICACLS_CHANGES = ['/grant', '/deny', '/remove', '/setowner', '/reset', '/restore', '/setintegritylevel', '/inheritance'];

  constructor() {
    super({ verb: 'rewrite access on' });
  }

  covers(command) {
    return WindowsPermissionRewrite.NAMES.has(command.name);
  }

  targets(command) {
    return command.args.filter((arg) => !arg.startsWith('/'));
  }

  reachesTargets(command) {
    if (command.name === 'takeown') return true;
    return command.lowered.some((arg) => WindowsPermissionRewrite.ICACLS_CHANGES.some((change) => arg.startsWith(change)));
  }

  sweepReason(command) {
    if (!this.reachesTargets(command) || !command.has('/t')) return null;
    return `${command.display} /T rewrites permissions on a whole tree.`;
  }
}

module.exports = WindowsPermissionRewrite;
