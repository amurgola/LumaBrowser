# EditorCliRunner

`core/shell/ide-installers/EditorCliRunner.js`

Runs a VS Code family editor's CLI and resolves its exit code and output.

## Methods

- `EditorCliRunner.run(cliPath, args, { platform = process.platform, timeoutMs = 120000 })`
  resolves `{ code, output }` and never rejects. Spawn failures, child errors and
  timeouts resolve `code: -1` (a timeout also kills the child and appends
  `(timed out)`). Output from stdout and stderr is collected up to about 8000
  characters.
- `EditorCliRunner.lastMeaningfulLine(output)` returns the last non-blank line
  that is not Node deprecation noise, capped at 300 characters, or `''`.

## Why

The child runs without our `ELECTRON_RUN_AS_NODE`: the editor's launcher decides
for itself whether to run as Node, and the inherited flag would make it misread
its own argv. On Windows the `.cmd` launcher needs `cmd.exe`; arguments are
quoted by hand (double quotes stripped) and passed verbatim, because Node's
quoting and cmd's disagree about spaces in both paths.
