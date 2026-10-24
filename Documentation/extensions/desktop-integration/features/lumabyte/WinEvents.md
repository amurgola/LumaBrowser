# WinEvents

`extensions/desktop-integration/features/lumabyte/WinEvents.js`

What keeps Lumabyte attached, on desktop control's koffi instance:

- `watchLocation(pid, cb(hwnd))`: an out-of-context `SetWinEventHook` on
  `EVENT_OBJECT_LOCATIONCHANGE` for one process (callbacks arrive through the
  main thread's message loop; no DLL is injected), passing only top-level
  window moves and resizes (`OBJID_WINDOW`, child 0). Fires every frame of a
  drag. -> `stop()` (unhooks and unregisters the koffi callback).
- `watchSystem(cb(event, hwnd))`: the foreground changing and windows starting
  or ending a minimize, for every process. -> `stop()`.
- `placeAbove(own, target)`: `SetWindowPos` without activating, right after the
  window directly above `target` (`GetWindow(GW_HWNDPREV)`), or on top of the
  normal band when that window is topmost (inserting after a topmost window
  would make ours topmost). Nothing when ours is already there.
- `dispose()` stops every hook; `supported`.
