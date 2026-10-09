# DetachedProcess

`core/shell/detached-processes/DetachedProcess.js`

One command in [DetachedProcesses](../DetachedProcesses.md): identity, exit
state and exit listeners.

## Methods

- `new DetachedProcess({ child, command, cwd, logPath, startedAt, conversationId, inContainer, onExit, killTree, closeLog })`.
- `DetachedProcess.isRegistrable(child)` is true when the child has a numeric pid.
- `watch(onSettled)` listens for `exit` and `error`, and settles at once when
  the child's `exitCode` or `signalCode` is already set. Settling happens once:
  it records the exit, calls `closeLog`, drops the child, calls
  `onSettled(entry)` (the registry's retention) and then every listener.
- `running`, `view()`.
- `kill()` uses `killTree(child)` or `child.kill('SIGKILL')`, best effort.
- `addExitListener(listener)`.

Errors from `closeLog`, kills and listeners are swallowed.
