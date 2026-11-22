# ChildReaper

`core/shared/runtime/server/ChildReaper.js`

Kills a child process and resolves only once it has really exited.

## Methods

- `ChildReaper.reap(child, { escalateMs = 5000, ceilingMs = 10000, tree = false })`
  sends SIGTERM, escalates to SIGKILL after `escalateMs` if the child is still
  alive, and resolves on the child's `exit` event or at `ceilingMs`, whichever
  comes first. Resolves at once for a null child. Kill errors are ignored.
- `ChildReaper.killNow(child, { tree = false })` sends SIGKILL, ignoring errors.
- `tree: true` on Windows ends the child's whole process tree
  (`ChildProcessRegistry.killTree`, `taskkill /T /F`) in place of each signal.
  Elsewhere it changes nothing. `platform` and `killTree` are test seams.
- `ChildReaper.ESCALATE_MS` (5000), `ChildReaper.CEILING_MS` (10000).

## Why

Supervisors spawn a replacement as soon as a stop resolves, so the old process
must have released its VRAM. An sd-server wedged in a CUDA kernel ignores
SIGTERM, hence the escalation; the ceiling keeps a process that never reports
exit from hanging a restart forever.

`tree` exists for a launcher whose helpers hold the resources. Basalt's
`basalt serve` cannot replace itself on Windows, so it starts a Python server
that starts the engine; ending the launcher alone left the engine running with
the model in VRAM, one more copy for every model switch and idle unload
(2026-11-22). On Linux the launcher replaces itself with the server, which ends
the engine when it is signalled, so the signal path is kept there.

TtsServerService's graceful worker shutdown (postMessage, then kill after 3 s)
is a different protocol and does not use this class.
