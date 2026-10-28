# KWinWindows

`extensions/desktop-integration/shared/KWinWindows.js`

Which window the user activates on a KDE Wayland session, for the shortcut
hint's window pick, and each window's frame for the overlay and the actions.

## Methods

- `KWinWindows.forSession({ scripting?, ...options })` /
  `KWinWindows.shared(options)`: a watcher over the shared
  [KWinScripting](KWinScripting.md) link, null off KDE Wayland.
- `watch(onEvent)`: starts a `journalctl --user -f -o cat _COMM=kwin_wayland`
  tail, then loads the script; `onEvent(info)` per activation with
  `{ id, caption, pid, cls, desktop, initial, x, y, width, height }` (null when
  no window is active), the window active right now first, marked `initial`
  (the tail may attach after that line; losing it is harmless). Returns a stop
  function; `stop()` kills the tail and releases the script. `watching`.
- `frameOf(id)`: the last frame reported for a window (logical pixels) or
  null; `titleOf(id)`: its caption.
- `KWinWindows.script(tag)`: the KWin script, printing one tagged JSON line
  per `workspace.windowActivated` and once for `workspace.activeWindow`.
- `KWinWindows.parse(line, tag)`: the info, null for "no window", undefined
  for an unrelated line.

## Why

No Wayland client may learn what is under the pointer or another window's
geometry, so the Windows hit test cannot be ported. KWin can tell: a click on
a window activates it, the script reports the activation with the frame, and
KWin's `print` lands in the user journal within a second. The watcher runs
only while the hint is up.
