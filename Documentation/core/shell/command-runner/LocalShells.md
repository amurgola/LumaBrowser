# LocalShells

`core/shell/command-runner/LocalShells.js`

The local shells a command can run under, as `{ name, file, syntax, argsFor(cmd) }`.

## Methods (all static)

- `probeWindows(spawnSync)` PowerShell 7 (`pwsh.exe`) when it answers a version
  probe, else Windows PowerShell (`powershell.exe`); with nothing answering it still
  names `powershell.exe` (on every supported Windows) and lets a real failure surface.
- `probePosix(spawnSync)` bash when `bash -c "exit 0"` succeeds, else `/bin/sh`.
- `powershell(name, file)` runs the script as `-EncodedCommand` (UTF-16LE base64):
  `-Command` re-parses its argument after process-creation quoting, which strips
  the quotes a command line needs.
- `bash(file)` (`-lc`), `sh()` (`/bin/sh -c`).
- `psScript(cmd)` adds the `&` call operator when the command starts with a quoted
  path (PowerShell treats a leading string as an expression), and appends
  `if ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }` so a failing native command
  (npm test) is not reported as PowerShell's own success.
- `findGitBash(env?, exists?)` `<Program Files>/Git/bin/bash.exe` under
  `ProgramFiles`, `ProgramFiles(x86)` or `ProgramW6432`, or null.
