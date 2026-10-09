# PipeToShell

`core/shell/shellClassifier/PipeToShell.js`

Judges a pipe into a shell or interpreter, which runs whatever the upstream command printed.

## Methods

- `PipeToShell.assess(command, name, previous)` returns `{ tier, reason }` or `null`:
  - `null` unless `command.joinedBy === 'pipe'` and `name` is a sink (posix shells, fish, iex, Invoke-Expression,
    powershell, pwsh, cmd, python, python3, perl, ruby, node, php).
  - `null` when the sink runs a script file instead of stdin: an interpreter with a file argument and no `-`, `-c`,
    `-e`, `--eval` or `-r`; a posix shell with a non-flag argument other than `-`/`-s`; PowerShell with `-File`.
  - `forbidden` ("Piping a download straight into a shell runs code nobody has read.") when the previous command is a
    fetcher (curl, wget, Invoke-WebRequest, iwr, Invoke-RestMethod, irm, fetch, http, https, aria2c).
  - otherwise `mass-destructive` ("Piping into <name> runs whatever the upstream command printed.").
