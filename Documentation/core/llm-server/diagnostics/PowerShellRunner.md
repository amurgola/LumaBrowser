# PowerShellRunner

`core/llm-server/diagnostics/PowerShellRunner.js`

Runs a PowerShell script against the first PowerShell host present on the
machine.

## Methods

- `PowerShellRunner.run(script, timeoutMs?)` tries `CANDIDATES` in order
  (`pwsh.exe`, `powershell.exe`, the System32 path, the SysWOW64 path) with
  `-NoProfile -NonInteractive -Command`. A missing host falls through to the
  next; a real script error is returned at once so it is not masked by quietly
  trying every shell. With no host at all:
  `{ ok: false, reason: <last missing reason> }`.
- `PowerShellRunner.quote(text)` doubles single quotes, for interpolating into
  a single-quoted PowerShell string.
- `PowerShellRunner.failureMessage(result, fallback)` prefers the trimmed
  stderr a script wrote, then `result.reason`, then `fallback`.
