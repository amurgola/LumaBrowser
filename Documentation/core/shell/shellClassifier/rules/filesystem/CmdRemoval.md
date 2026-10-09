# CmdRemoval

`core/shell/shellClassifier/rules/filesystem/CmdRemoval.js`

[FileOperation](FileOperation.md) for cmd.exe `del`, `erase`, `rd`, `rmdir` in cmd, or in PowerShell with cmd switches.

- Targets: every word that is not a single-letter `/x` switch.
- Reaches targets: `/s` or a directory removal.
- Sweeps: `/s`, `rd /q` or a wildcard.
