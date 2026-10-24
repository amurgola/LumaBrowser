# Attachment

`extensions/desktop-integration/features/lumabyte/Attachment.js`

One window Lumabyte is attached to, with its dock and panel windows (made by
[LumabyteWindows](LumabyteWindows.md), placed by
[AttachPlacement](AttachPlacement.md)).

- `sync(fg)`: on every move of the window, every foreground change and the
  slow poll. The window gone calls `onGone` (the feature detaches); minimized,
  hidden or cloaked hides both; otherwise both follow the frame (re-placed only
  when it changed), show (`showInactive`, never stealing focus) and, when the
  foreground changed, the window moved or one of ours appeared, are re-stacked
  directly above the window (`windows.placeAbove`; the panel is left alone
  while it is the window being typed in).
- `openPanel({ focus })` (created on first open), `closePanel()` (and gives the
  app the focus back), `togglePanel()`, `ensureDock()`.
- `setBusy(busy)` repaints the dock; `emit(event)` sends to the panel page.
- `owns(webContents)`, `ownHandles()`, `dispose()` (aborts a running turn).
