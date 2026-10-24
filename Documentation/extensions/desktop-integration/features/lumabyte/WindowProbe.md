# WindowProbe

`extensions/desktop-integration/features/lumabyte/WindowProbe.js`

The Windows questions Lumabyte asks, on desktop control's koffi bindings, each
guarded (a vanished window reads as gone): `foreground()`, `alive(hwnd)`,
`visible(hwnd)`, `minimized(hwnd)`, `cloaked(hwnd)` (another virtual desktop), `rootOwner(hwnd)`
(the app window that owns a dialog), `rect(hwnd)` (physical), `frame(hwnd)`
(DIP), `workArea(frame)`, `title(hwnd)`, `app(hwnd)` -> `{ pid, exe, name,
className }`. `supported` is false off Windows. `WindowProbe.displayName(exe)`:
`notepad.exe` -> `Notepad`.
