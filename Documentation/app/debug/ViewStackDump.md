# ViewStackDump

`app/debug/ViewStackDump.js`

Debug dump of the live native-view stack.

## Methods

- `new ViewStackDump({ win, tabViewManager, chromeOverlay, userDataDir, log?, fsImpl?, now? })`.
- `capture()` resolves `{ at, window, activeTabId, rendererBounds, views,
  shellDragRegions, suspects, file }`, logs it and writes
  `<userData>/view-stack-dump.json` (`file` null when the write fails).
  Each view: `z`, owner (`tab` with id, kind, silent, hidden, keepAlive,
  previewing, active; `overlay` with layer id and visibility; or `unknown`),
  bounds, visibility, URL and its drag regions.
- `identify(view)`.
- Suspects: a drag rect with size on any view other than the active tab or an
  unknown view (`z<i> <owner>[/hidden] declares drag rect WxH at page y=Y (window y~Y'): <url>`),
  and a visible view over the top 100 px that is neither the active tab nor a
  visible overlay layer (`z<i> <owner> is VISIBLE over the top chrome at y=<y>: <url>`).
- `ViewStackDump.probeDragRegions(webContents)`: the in-page probe (at most
  20000 elements, 20 rects), 2 s timeout; a script failure is `{ error, rects: [] }`.

## Why

A hidden view leaking a drag region over the chrome makes the top of the window
silently unclickable, which DOM inspection in the shell cannot see.
