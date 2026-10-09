# PowerShellRemoval

`core/shell/shellClassifier/rules/filesystem/PowerShellRemoval.js`

[FileOperation](FileOperation.md) for PowerShell `Remove-Item`, `Clear-Content` and their aliases (`ri`, `rm`, `del`,
`erase`, `rd`, `rmdir`, `clc`), in the PowerShell dialect only.

- Not covered when a cmd alias carries cmd switches (`del /s`): [CmdRemoval](CmdRemoval.md) judges that.
- Targets: `-Path`/`-LiteralPath` and positionals, comma lists split
  ([PowerShellArgs](../../PowerShellArgs.md)).
- Reaches targets: `-Recurse`, `-Force` or a directory alias (`rd`, `rmdir`). `-Recurse:$false` is off.
- Sweeps: `-Recurse` (abbreviations too) or a wildcard target.
