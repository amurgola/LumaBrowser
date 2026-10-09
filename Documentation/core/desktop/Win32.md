# Win32

`core/desktop/Win32.js`

The Windows surface desktop control and game mode use, as one object. It is
what DesktopService holds as `win` (tests inject a fake with the same shape),
and GameController reaches it as `desktop.win`. Every method routes to a part
under `core/desktop/win32/`; the class holds no logic.

## Members (all static)

- `load()` the raw koffi function table ([Win32Api](win32/Win32Api.md)); DesktopService
  calls `GetCursorPos`, `SetCursorPos`, `GetForegroundWindow`, `WindowFromPoint` on it directly.
- Windows ([Win32Windows](win32/Win32Windows.md)): `listTopLevelWindows()`,
  `windowText(hwnd)`, `className(hwnd)`, `processIdOf(hwnd)`, `windowRect(hwnd)`,
  `focusWindow(hwnd)`, `virtualScreen()`.
- Processes ([Win32Process](win32/Win32Process.md)): `processImagePath(pid)`, `isElevated(pid)`.
- Capture ([Win32Capture](win32/Win32Capture.md)): `captureBGRA({ hwnd?, rect })`, `isBlank(bgra)`.
- Input ([Win32Input](win32/Win32Input.md)): `mouseInput(flags, mouseData?)`,
  `keyInput({ vk, scan, flags })`, `keyInputScan({ scan, up, extended })`,
  `relativeMoveInput(dx, dy)`, `sendInputs(inputs)`; constants `MOUSEEVENTF`,
  `KEYEVENTF`, `INPUT_SIZE`, `KEYEVENTF_SCANCODE`, `MOUSEEVENTF_MOVE`.
- `scanCodeFor(vk)` ([Win32ScanCodes](win32/Win32ScanCodes.md)).
- `inputDesktopName()` ([Win32InputDesktop](win32/Win32InputDesktop.md)).

## Coordinates

Electron's main process is per-monitor DPI aware (v2), so window rects, system
metrics and `SetCursorPos` all speak physical pixels, and a screenshot of a
window at native size maps 1:1 onto them.
