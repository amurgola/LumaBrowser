# CommandRunner

`core/shell/CommandRunner.js`

Runs one shell command for the coding agent. The agent's file tools already
refuse to leave the project root; a command gets the same treatment on the other
three axes that can go wrong:

- TIME: every run has a timeout (default 2 min, clamped to 1 s - 10 min).
- SIZE: output is capped in memory (2 MiB) and spilled whole to a temp file past
  the cap ([OutputCapture](command-runner/OutputCapture.md)), so a runaway log can
  neither flood the transcript nor exhaust RAM.
- LIFETIME: timeout and abort kill the whole process tree
  ([ProcessTreeKiller](command-runner/ProcessTreeKiller.md)), so a watcher started
  by mistake does not outlive the turn. Every child is also tracked by
  [ChildProcessRegistry](ChildProcessRegistry.md), so force quit kills it.

The shell is decided once per kind and named in the result
([ShellResolver](command-runner/ShellResolver.md)), so the tool can tell the model
which syntax applies. Whether a command may run at all is decided upstream (the
chat approval gate and its shell classifier); this class only bounds the run.

## Methods

- `new CommandRunner({ defaultTimeoutMs, maxTimeoutMs, maxCaptureBytes, spillDir = os.tmpdir(), spawn, spawnSync, platform })`;
  the last three are injectable for tests.
- `resolveShell(kind = 'auto')` `{ name, file, syntax, argsFor(cmd) }` for
  `auto | powershell | bash | sh`.
- `run({ command, cwd, timeoutMs, shell = 'auto', env, onOutput, signal, detachAfterMs, conversationId })`
  never rejects; resolves the [RunResult](command-runner/RunResult.md):
  `{ exitCode, signal, timedOut, aborted, detached, pid, logPath, startedAt, output,
  outputBytes, capturedBytes, spillPath, durationMs, shell, syntax, error }`.
  - An empty command or a relative `cwd` is refused without spawning.
  - `env` is merged over `process.env` with `CI=1`; `onOutput` gets live merged
    stdout+stderr; `signal` (an AbortSignal) kills the tree.
  - A `cwd` that is a container path ([ContainerPath](ContainerPath.md)) runs
    through `docker exec` in the container's own shell, with the deadline enforced
    on the container side ([ContainerShell](ContainerShell.md)).
  - `detachAfterMs` (below the timeout): a command still running then is handed to
    [DetachedProcesses](DetachedProcesses.md) under `conversationId` and the run
    resolves `detached: true` with its pid and log file; it is no longer killed by
    the timeout or abort. See [CommandRun](command-runner/CommandRun.md).
- `CommandRunner.psScript(cmd)` the PowerShell script text ([LocalShells](command-runner/LocalShells.md)).
- Statics: `DEFAULT_TIMEOUT_MS`, `MAX_TIMEOUT_MS`, `MIN_TIMEOUT_MS`, `DEFAULT_MAX_CAPTURE_BYTES`.
