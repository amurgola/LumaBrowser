const ShellRule = require('../ShellRule');
const HostCommand = require('./HostCommand');
const DiskWipeTools = require('./filesystem/DiskWipeTools');
const PowerShellRemoval = require('./filesystem/PowerShellRemoval');
const CmdRemoval = require('./filesystem/CmdRemoval');
const PosixRemoval = require('./filesystem/PosixRemoval');
const FindRemoval = require('./filesystem/FindRemoval');
const MirrorSync = require('./filesystem/MirrorSync');
const PosixPermissionRewrite = require('./filesystem/PosixPermissionRewrite');
const WindowsPermissionRewrite = require('./filesystem/WindowsPermissionRewrite');

class FilesystemRule extends ShellRule {
  static OPERATIONS = Object.freeze([
    new PowerShellRemoval(), new CmdRemoval(), new PosixRemoval(), new FindRemoval(), new MirrorSync(),
    new PosixPermissionRewrite(), new WindowsPermissionRewrite(),
  ]);

  assess(input) {
    const command = new HostCommand(input);
    return ShellRule.forbidden(DiskWipeTools.reasonFor(command)) || FilesystemRule._operationVerdict(command);
  }

  static operationFor(command) {
    return FilesystemRule.OPERATIONS.find((operation) => operation.covers(command)) || null;
  }

  static _operationVerdict(command) {
    const operation = FilesystemRule.operationFor(command);
    return operation ? operation.judge(command) : null;
  }
}

module.exports = FilesystemRule;
