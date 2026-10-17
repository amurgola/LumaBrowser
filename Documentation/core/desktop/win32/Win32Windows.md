# Win32Windows

`core/desktop/win32/Win32Windows.js`

Top-level windows as desktop control sees them.

## Methods

- `Win32Windows.listTopLevelWindows({ includeOwned = false })` `[{ hwnd, title, className, pid, rect, minimized, owned? }]`
  for windows a person would call "a window": visible, not cloaked (a suspended
  UWP app or another virtual desktop), not a tool window, their own root owner,
  titled, and at least 40x30. `includeOwned` also keeps owned windows (the Run
  dialog, Save As, an app's settings box, a browser's "Restore pages" bubble, even
  when it is a tool window), marked `owned: true`. Unowned tool windows stay out.
- `rootWindowAt(x, y)` the top-level window under a screen point, unfiltered
  (taskbar and Start menu included): `WindowFromPoint` (the POINT packed by value,
  x in the low 32 bits) then `GetAncestor(GA_ROOT)`. `{ hwnd, title, className, pid }` or null.
- `windowText(hwnd)`, `className(hwnd)`, `processIdOf(hwnd)` (`{ pid, tid }`).
- `windowRect(hwnd)` the visible frame (DWM extended bounds, without the
  invisible resize border), else `GetWindowRect`, else null.
- `isCloaked(hwnd)`.
- `popupInfo(hwnd)` `{ rootOwner, toolWindow }`: the hwnd at the top of its owner
  chain (`GetAncestor(GA_ROOTOWNER)`, itself when unowned) and whether it has
  `WS_EX_TOOLWINDOW`. A browser's bubbles and menus are owned by its frame.
- `focusWindow(hwnd)` restores a minimized window and brings it to the
  foreground; returns whether it got there.
- `virtualScreen()` the bounding rect of all monitors.

## Why focusWindow works so hard

`SetForegroundWindow` is refused unless the caller owns the foreground. The
documented workaround is to attach to the foreground thread's input queue for
the call. When the foreground lock still wins (only the process that received
the last input may switch it), a bare Alt tap makes that us (the workaround
pywinauto and AutoHotkey use) and it tries again, three times in all.
