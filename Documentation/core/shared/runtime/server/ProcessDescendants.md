# ProcessDescendants

`core/shared/runtime/server/ProcessDescendants.js`

The processes a launcher child started under it, read while they are still
linked to it, so they can be ended even after the launcher itself is gone.
Basalt's launcher (`basalt.exe serve`) starts a Python server that starts the
engine; once the launcher exits, `taskkill /T` on it reaches nothing, and the
engine kept the model in VRAM after LumaBrowser quit (2026-11-25). Windows only;
elsewhere a child's helpers end with it.

## Methods

- `ProcessDescendants.list(rootPid, { platform, readProcesses })`: `[{ pid, name }]`
  of every process under `rootPid`, nearest first; `[]` off Windows, without a
  pid, or when the process table cannot be read. `readProcesses` (a test seam)
  defaults to `readWindowsProcesses`.
- `ProcessDescendants.descendantsOf(rows, rootPid)`: the walk over
  `Win32_Process` rows (`{ ProcessId, ParentProcessId, Name }`); a parent cycle
  from a reused pid is walked once, junk rows are skipped.
- `ProcessDescendants.killAll(descendants, { platform, killNamed })`: ends each
  with its own subtree through
  [ChildProcessRegistry](../../../shell/ChildProcessRegistry.md) `killTreeNamed`,
  so only a process still running under the recorded name is touched.
- `ProcessDescendants.readWindowsProcesses()`: `Get-CimInstance Win32_Process`
  through the diagnostics `PowerShellRunner` (15 s timeout).

[BaseRuntimeServer](../BaseRuntimeServer.md) reads them once a tree-killed
launcher serves and ends them on every way out.
