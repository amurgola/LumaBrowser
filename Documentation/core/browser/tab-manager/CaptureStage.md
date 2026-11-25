# CaptureStage

`core/browser/tab-manager/CaptureStage.js`

A window that is never shown, where a tab view is captured when its own window cannot do it.
[TabScreenshot](TabScreenshot.md) lends the view to it for the length of one screenshot.

## Methods

- `new CaptureStage({ BrowserWindow, waitMs, pollMs })`: `BrowserWindow` is loaded from Electron on first use
  when not given; `waitMs` (2000) and `pollMs` (50) are how long, and how often, a view on the stage is asked for
  its first painted frame.
- `isOnScreen(view)`: true while the window that holds the view is visible, not minimised, and shows the view.
  False for a view no window holds, and for a view on the stage.
- `lend(view, work)`: opens the stage at the view's size (`UNSIZED`, 1280x800, for a view that never had one),
  moves the view onto it at the corner, visible, runs `work()` and answers what it answers. In a `finally` the
  view goes back to the same place in its own window's stack, at the bounds and visibility it had, and the stage
  is destroyed. A view that had no window, or whose window closed meanwhile, only leaves the stage.
- `capture(webContents, clip)`: asks a view on the stage for a capture (`stayHidden`, so the page is painted
  without being told it became visible) until one is not empty; null when nothing was painted within `waitMs`.
  A capture that has not answered by then is given up on.

## Why

Measured in an isolated copy of the app on 2026-11-24 (Windows, Electron 45), with the main window in the tray
(minimise hides it, so it is both hidden and minimised and reports a 0x0 content area):

- a tab painted before the window went to the tray still captures, and the picture is current;
- a tab opened while the window is in the tray never gets a surface: `capturePage` answers an empty image, and
  `Page.captureScreenshot` over the debugger never answers. browser_screenshot failed with
  "pngSize: not a PNG buffer", and the element capture answered success with an empty picture;
- once such a view has been given a size somewhere else and put back, `capturePage` in the tray window never
  answers at all, so a capture there cannot be tried first and fallen back from;
- the same view added to a `show: false` window captures in about 30 ms.

So a window that is not showing is never asked. The view keeps its exact size on the stage (the stage window's
own content size came out 4 px wider than asked at 125% display scaling, which made the page lay out again).
The stage has its own title (`Luma capture`), since code that looks for the main window matches on the app's
name. A view its window keeps hidden (a tab behind the one on screen) answers an empty image too and takes the
same path.
