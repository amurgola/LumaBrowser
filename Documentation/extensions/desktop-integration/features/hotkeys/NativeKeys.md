# NativeKeys

`extensions/desktop-integration/features/hotkeys/NativeKeys.js`

The Windows calls [SelectionClipboard](SelectionClipboard.md) needs, on the
koffi bindings desktop control already ships (`core/desktop/win32/Win32Api`,
`Win32Input`, `Win32Windows`). `GetAsyncKeyState` and
`GetClipboardSequenceNumber` are not in the shared table, so they are bound on
first use through the same koffi instance (no new native module).

- `supported`: true on Windows only.
- `heldModifiers()`: Shift, Ctrl, Alt, left and right Win held right now.
- `clipboardSequence()`: the clipboard sequence number.
- `foregroundWindow()`, `focusWindow(hwnd)`, `windowTitle(hwnd)`.
- `mouseDown()`: the left button is down (GetAsyncKeyState, any app).
- `windowAtCursor()` -> `{ hwnd, className, pid }` of the top-level window under
  the pointer (GetCursorPos, then `Win32Windows.rootWindowAt`), or null.
- `releaseKeys(vks)`: key-up events (extended for Win).
- `sendCombo('copy' | 'paste')`: Ctrl+C or Ctrl+V as one SendInput batch
  (downs, then ups in reverse). SendInput errors (UIPI, secure desktop) throw.
