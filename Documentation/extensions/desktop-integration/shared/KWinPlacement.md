# KWinPlacement

`extensions/desktop-integration/shared/KWinPlacement.js`

Puts the activity island where the overlay wants it on a KDE Wayland session,
through KWin's scripting interface on the session bus.

## Methods

- `KWinPlacement.forSession({ platform, env, ...options })`: a placer on a
  Linux Wayland session (`WAYLAND_DISPLAY` or `XDG_SESSION_TYPE`), null
  elsewhere (on X11 the overlay's own `setBounds` is honoured).
- `new KWinPlacement({ scripting, pid?, log?, setTimeout? })`: `scripting` is a
  [KWinScripting](KWinScripting.md) link (`forSession` makes or takes one).
- `move({ caption, x, y })`: runs the script through the link now and once
  more after `RETRY_MS` (250 ms) for a window still being mapped. Resolves
  true when KWin ran it; false when the link is down, said once in the log.
- `KWinPlacement.script({ caption, pid, x, y })`: the KWin script: every
  window with that caption and this process id gets its frame geometry set to
  `x, y` at its current size, KWin's keep-above flag, and a raise (Wayland
  offers clients no always-on-top; a picked window that KWin activates would
  otherwise cover the ring and the island that frame it). The geometry is a plain object; `Qt.rect` does
  not exist in KWin's engine.

[ActivityOverlay](ActivityOverlay.md) calls it right after the island shows
(`ISLAND_CAPTION`) and whenever the ring's bounds change (`RING_CAPTION`, a
framed window), with the bounds it computed.

## Why

A Wayland client cannot place its own top-level windows: KWin centres new
ones, and Electron cannot even read the position back. KWin's scripting can
move any window, the mechanism the kdotool utility relies on, so the island
lands at the top centre with no KWin setting changed. Other compositors have
no equivalent, and there the island stays where the compositor puts it.
