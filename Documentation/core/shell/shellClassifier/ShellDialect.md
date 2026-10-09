# ShellDialect

`core/shell/shellClassifier/ShellDialect.js`

Names the three dialects the classifier understands, normalizes aliases, and guesses a dialect for an unlabelled line.

## Methods

- `ShellDialect.POSIX`, `POWERSHELL`, `CMD`, `ALL`.
- `ShellDialect.normalize(dialect)`: `pwsh`, `ps`, `powershell` (any case) are powershell; `cmd`, `cmd.exe`, `bat` are
  cmd; anything else, including empty, is posix.
- `ShellDialect.guess(input, platform = process.platform)`, in order: PowerShell signals (Verb-Noun cmdlets,
  `$env:`, `$_`, `-Recurse`, `-Force`, ...), cmd signals (`%VAR%`, `del /x`-style switches), POSIX signals (`./`,
  `sudo`, `$(`, `| bash`, `2>&1`, ...), a Windows path (PowerShell), else the platform shell (PowerShell on win32).

## Why

The approval gate sees the command string before the runner picks a shell, so it must guess. The heuristics are cheap
and biased toward PowerShell on Windows because that is what the Windows runner spawns. The classifier's auto mode
classifies in the guessed dialect and lets the others only escalate, so a wrong guess errs toward asking.
