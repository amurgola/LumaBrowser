# KWinScripting

`extensions/desktop-integration/shared/KWinScripting.js`

KWin's scripting interface on the session bus, the one door a Wayland client
has into window management on KDE.

## Methods

- `KWinScripting.forSession({ platform, env, ...options })`: a link on a Linux
  Wayland session, null elsewhere. `KWinScripting.shared(options)`: one link
  per process, so [KWinPlacement](KWinPlacement.md) and
  [KWinWindows](KWinWindows.md) share the availability verdict.
- `new KWinScripting({ exec?, fsLike?, tmpDir?, pid?, env?, log? })`: seams.
- `load(text, name)`: writes the script to a temp file, `loadScript` and
  `run` on `org.kde.KWin /Scripting` with `qdbus6` (or `qdbus`), removes the
  file; resolves `{ id, stop() }` while the script runs, or null when KWin
  is unreachable (no qdbus tool on PATH, KWin not answering), which is logged
  once and remembered (`available` false; later calls return at once).
- `runOnce(text, name)`: load, run and release a script that finishes on its
  own; resolves whether it ran.
