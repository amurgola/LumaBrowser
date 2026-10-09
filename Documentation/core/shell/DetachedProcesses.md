# DetachedProcesses

`core/shell/DetachedProcesses.js`

The process-wide registry of shell commands the coding agent let run on.
`run_command` waits a bounded time (`detachAfterMs`); a command still running
then is not killed. The agent gets its pid and log path and carries on, and the
process lives here until it exits. Its output keeps flowing into the log file
through the runner's capture, so nothing is lost by detaching.

## Methods

All static; there is one registry per process.

- `DetachedProcesses.register({ child, command, cwd, logPath, startedAt,
  conversationId, inContainer, onExit, killTree, closeLog })` remembers a child
  and returns its view, or `null` when the child has no numeric pid. The child
  is also tracked by [ChildProcessRegistry](ChildProcessRegistry.md), so app
  quit kills what is still alive. `killTree(child)` is the runner's tree kill;
  `closeLog()` flushes and closes the capture on exit.
- `DetachedProcesses.status(pid)` returns the view, or `null` for an unknown pid.
  The view is `{ pid, command, cwd, logPath, startedAt, conversationId,
  inContainer, running, exitCode, signal, exitedAt, killed, durationMs }`.
- `DetachedProcesses.list()` returns every remembered view, running first, then newest first.
- `DetachedProcesses.tail(pid, bytes = 4096)` returns `{ text, totalBytes, logPath }`
  (see [LogTail](detached-processes/LogTail.md)), or `null` for an unknown pid.
- `DetachedProcesses.kill(pid)` kills the process tree, best effort, and returns
  `{ ok: true }`, or `{ ok: false, reason }` (`'unknown pid'`, `'already exited
  with code N'`).
- `DetachedProcesses.onExit(pid, listener)` adds an exit listener; it fires
  asynchronously when the process already exited. Returns `false` for an
  unknown pid or a non-function listener.
- `DetachedProcesses.reset()` forgets everything (tests).
- `DetachedProcesses.MAX_FINISHED` (50), `DetachedProcesses.DEFAULT_TAIL_BYTES` (4096).

## Why finished entries are kept

A pid the model remembers from a few steps ago should still answer, so the
newest 50 finished entries stay; older ones are dropped as new ones finish.
Every exit fires the entry's listeners once (code-mode uses one to queue an
agent notice). Never throws.

The per-child state and settle-once logic is
[DetachedProcess](detached-processes/DetachedProcess.md).
