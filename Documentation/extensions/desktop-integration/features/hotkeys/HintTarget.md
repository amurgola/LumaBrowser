# HintTarget

`extensions/desktop-integration/features/hotkeys/HintTarget.js`

The window the shortcut hint ([ChordHint](ChordHint.md)) is aimed at. While the
hint is up, a click on a window frames it: the ring wraps that window instead of
the monitor and the actions work on it ([HotkeyActions](HotkeyActions.md):
Screen region captures it whole, Read aloud with nothing selected reads its
text). The click still reaches the app as usual (with the modifiers held).

Polled from the hint's own timer: the left button's press edge
(`keys.mouseDown()`), then the top-level window under the pointer
(`keys.windowAtCursor()`). A button already down when the hint showed does not
count. The desktop and the taskbar (`SHELL_CLASSES`: `Progman`, `WorkerW`,
`Shell_TrayWnd`, `Shell_SecondaryTrayWnd`) go back to the whole monitor; windows
of Luma's own process (the island) are ignored.

## Methods

- `new HintTarget({ keys, ownPid? })`: `keys` is [NativeKeys](NativeKeys.md).
- `begin()` (the hint showed), `end()` (it hid).
- `poll()` -> the newly framed hwnd (0 = the monitor) when a click changed it,
  else null.
- `framed`: the current hwnd or 0. `supported`: `keys` has the two calls.
