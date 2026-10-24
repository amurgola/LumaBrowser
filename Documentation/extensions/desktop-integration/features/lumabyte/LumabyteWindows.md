# LumabyteWindows

`extensions/desktop-integration/features/lumabyte/LumabyteWindows.js`

Creates an attachment's Electron windows: frameless, transparent, not
always-on-top (`placeAbove(win, hwnd)` stacks them directly above the attached
window through [WinEvents](WinEvents.md)), off the taskbar, sandboxed with
[ui/preload](ui/preload.md).

- `dock(att)`: 56 by 56, never focusable, loads [ui/dock](ui/dock.md).
- `panel(att)`: focusable (you type in it), loads [ui/panel](ui/panel.md).
  Links open in the default browser; navigation is blocked.
- `hwndOf(win)`, `sendPanel(win, event)`, `paintDock(win, { open, busy })`,
  `focusApp(hwnd)`.
