# LinuxKeys

`extensions/desktop-integration/features/hotkeys/LinuxKeys.js`

The selection actions' keyboard and clipboard parts on Linux, with the
[NativeKeys](NativeKeys.md) interface. The session decides the path (`session`:
`wayland` when `WAYLAND_DISPLAY` is set or `XDG_SESSION_TYPE` is `wayland`, else
`x11` with a `DISPLAY`, else null and unsupported):

- **X11** ([X11Api](X11Api.md)): held modifiers from the key map, the focused
  window (`foregroundWindow`, `focusWindow`), Ctrl+C / Ctrl+V and key-ups (both
  sides of a modifier) injected with XTEST. X has no clipboard change counter,
  so `clipboardSequence()` is the clipboard text; when Ctrl+C leaves it
  unchanged, SelectionClipboard asks `readPrimary()`. `unavailableReason()`
  names a missing libX11 or libXtst.
- **Wayland**: no app may inject keys into another, so `copyMode` is `primary`:
  the selection is the primary selection (`clipboard.readText('selection')`,
  the highlighted text, no keystroke). Pasting runs `wtype -M ctrl v -m ctrl`
  (wlroots desktops) or `ydotool key 29:1 47:1 47:0 29:0` (needs `ydotoold`),
  whichever is on `PATH` first (`WAYLAND_TOOLS`, `TOOL_TIMEOUT_MS` 2000);
  without either `canPaste()` is false and `noPasteReason` says what to install.
  No key map, so `heldModifiers()` is empty and no window is tracked.

The primary selection can be stale: it holds the last highlighted text even
after the highlight is gone in some apps.
