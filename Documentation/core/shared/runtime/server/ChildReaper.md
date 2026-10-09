# ChildReaper

`core/shared/runtime/server/ChildReaper.js`

Kills a child process and resolves only once it has really exited.

## Methods

- `ChildReaper.reap(child, { escalateMs = 5000, ceilingMs = 10000 })` sends
  SIGTERM, escalates to SIGKILL after `escalateMs` if the child is still alive,
  and resolves on the child's `exit` event or at `ceilingMs`, whichever comes
  first. Resolves at once for a null child. Kill errors are ignored.
- `ChildReaper.killNow(child)` sends SIGKILL, ignoring errors.
- `ChildReaper.ESCALATE_MS` (5000), `ChildReaper.CEILING_MS` (10000).

## Why

Supervisors spawn a replacement as soon as a stop resolves, so the old process
must have released its VRAM. An sd-server wedged in a CUDA kernel ignores
SIGTERM, hence the escalation; the ceiling keeps a process that never reports
exit from hanging a restart forever.

TtsServerService's graceful worker shutdown (postMessage, then kill after 3 s)
is a different protocol and does not use this class.
