# RunResult

`core/shell/command-runner/RunResult.js`

The object every `CommandRunner.run` resolves with:
`{ exitCode, signal, timedOut, aborted, detached, pid, logPath, startedAt, output,
outputBytes, capturedBytes, spillPath, durationMs, shell, syntax, error }`.

## Methods (all static)

- `failed(message, shell)` nothing ran; `shell` is a descriptor or the requested
  kind name (`syntax` then empty).
- `finished({ exitCode, signal, timedOut, aborted, pid, startedAt, out, shell, error })`
  a non-numeric exit code becomes null; `logPath` and `spillPath` are the spill file.
- `detached({ pid, startedAt, logPath, snap, shell })` `detached: true`, no exit code,
  `spillPath` is the log file.
