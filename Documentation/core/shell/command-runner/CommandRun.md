# CommandRun

`core/shell/command-runner/CommandRun.js`

One spawned command from start to its single result.

## Methods

- `new CommandRun({ child, shell, command, cwd, timeoutMs, detachAfterMs, signal, conversationId, inContainer, capture, killer })`.
- `start()` resolves exactly once with a [RunResult](RunResult.md):
  - stdout and stderr go into the [OutputCapture](OutputCapture.md);
  - the timeout sets `timedOut` and kills the tree; an abort (already aborted
    signals included) sets `aborted` and kills the tree;
  - `close` finishes at once; `exit` finishes after `STDIO_DRAIN_GRACE_MS` (500),
    because a grandchild left behind (a daemon, a GUI app) can hold the pipes open
    forever; `error` finishes with `<shell> failed: <message>`;
  - `detachAfterMs` (only when below the timeout and the child has a pid) stops
    waiting: the log file opens with everything so far, the child is registered
    with [DetachedProcesses](../DetachedProcesses.md) (`killTree` and `closeLog`
    wired back here), and the run resolves `detached: true`. From then on the
    timeout and abort no longer reach it; every further byte lands in the log.
