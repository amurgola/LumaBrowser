# RunCommandTool

`extensions/code-mode/tools/project/RunCommandTool.js`

`run_command { command, cwd?, timeoutSeconds?, detach_after_seconds?, shell? }`
(a [CodeTool](../CodeTool.md), `mutating: true`, plus `projectRoot` for the
approval gate's write-boundary check: the project path, or null for a container
project).

## Methods

- `new RunCommandTool({ workspace, truncator, db })`; the description names the
  shell (`code.commandShell('auto')`, or "bash inside the Linux container").
- `RunCommandTool.detachAfterMs(params)`: absent -> 30 s, 0 or junk -> never
  detach, otherwise capped at 600 s.
- `handle(params, opts)`:
  1. `command is required` for an empty command.
  2. Safety gate, independent of the approval gate: when
     `CommandCallAssessor.isEnabled(db)`, `CommandCallAssessor.assess('run_command',
     params, { projectRoot: <workspace dir>, dialect })` (dialect `posix` in a
     container, else the resolved shell's syntax); a `deny` verdict returns
     `ApprovalGate.deniedCommandResult` and the command never spawns.
  3. `context.code.runCommand` with a [CommandOutputRelay](CommandOutputRelay.md)
     (live output, Stop), `detachAfterMs` and the conversation id
     (`opts.conversationId`, else the workspace's).
  4. A spawn failure -> `Command failed to run: ...`.
  5. Detached: registers `DetachedProcesses.onExit` -> `AgentNotices.enqueue(conversationId,
     CommandText.exitNotice(e))`, emits `command:detached`, returns `{ detached: true, pid,
     logPath, ... }` with the tail so far and how to follow it with check_process.
  6. Finished: tail-truncated output, spill path, `success` only for exit 0
     (not timed out or stopped), `error` naming the failure; a non-zero exit is
     a result to read, not a crash.
