# ShellWrapper

`core/shell/shellClassifier/ShellWrapper.js`

Recognizes commands that run another command line and returns what they run.

## Methods

- `ShellWrapper.unwrap(name, args, dialect)` (`name` already reduced by [ShellCommandName](ShellCommandName.md))
  returns one of:
  - `{ command, dialect?, elevated? }`: an inner line to classify, in `dialect` when given.
  - `{ command: '', opaque: true, tier, reason }`: the inner code cannot be seen; the classifier uses `tier`.
  - `null`: not a wrapper.
- `ShellWrapper.opaque(tier = 'normal', reason = null)` builds the opaque shape.

## Coverage

| Wrapper | Result |
| --- | --- |
| `bash sh zsh dash ksh -c/-lc/-ec/-xc/-ic <line>` | the line, posix; bare shell: opaque normal "An interactive shell cannot be inspected."; script file: opaque normal |
| `fish -c <line>` | the line, posix; else opaque |
| `cmd /c /k /r ...` | the rest, cmd; else opaque |
| `powershell`/`pwsh -c/-com/-command ...` | the rest, powershell; `-e/-ec/-enc/-encodedcommand`: opaque mass-destructive; `-f/-file`: opaque; a leading non-flag: all args |
| `Invoke-Expression`/`iex` | first non-flag word; a `$variable` or `(...)`: opaque mass-destructive |
| `Invoke-Command`/`icm` | `-ScriptBlock`/`-sc` value or first non-flag word |
| `Start-Process`/`saps` | `-FilePath` (or first word) plus `-ArgumentList`; `-Verb RunAs` marks it elevated |
| `start` (not posix) | the rest after `/flags` and a quoted title |
| `eval exec call command builtin` | all args inline; `source` and `.`: opaque |
| privilege wrappers ([PrivilegeWrapper](PrivilegeWrapper.md)) | the inner words, elevated |
| pass-throughs ([PassthroughArgs](PassthroughArgs.md)) | the stripped words (`wsl` switches to posix); none left: opaque, except a bare `env` is not a wrapper |
