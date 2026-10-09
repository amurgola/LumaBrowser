# FilesystemRule

`core/shell/shellClassifier/rules/FilesystemRule.js`

[ShellRule](../ShellRule.md) for commands that destroy files, permissions or whole disks across POSIX, PowerShell and
cmd.exe.

## Methods

- `rule.assess({ name, args, dialect })`: builds a [HostCommand](HostCommand.md), then
  1. [DiskWipeTools](filesystem/DiskWipeTools.md): a disk, volume or boot wipe is forbidden;
  2. the first file operation profile that covers the command judges it ([FileOperation](filesystem/FileOperation.md)).
- `FilesystemRule.OPERATIONS`, in order: [PowerShellRemoval](filesystem/PowerShellRemoval.md),
  [CmdRemoval](filesystem/CmdRemoval.md), [PosixRemoval](filesystem/PosixRemoval.md),
  [FindRemoval](filesystem/FindRemoval.md), [MirrorSync](filesystem/MirrorSync.md),
  [PosixPermissionRewrite](filesystem/PosixPermissionRewrite.md),
  [WindowsPermissionRewrite](filesystem/WindowsPermissionRewrite.md). Dialect-specific profiles come first: in
  PowerShell `rm` is Remove-Item, and cmd's `rd` beats POSIX `rmdir`.
- `FilesystemRule.operationFor(command)`: the covering profile, or `null`.

## Why

Each profile answers the same questions (what it covers, where it lands, whether it reaches there, whether it sweeps),
and [SystemPaths](../SystemPaths.md) alone decides where is protected, so a forbidden reason always names the path and
what it holds. Wiping the host can never be approved; a recursive delete inside the project can be exactly what the
user asked for, so it always asks instead.
