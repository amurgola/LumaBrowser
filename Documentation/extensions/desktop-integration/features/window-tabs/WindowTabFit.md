# WindowTabFit

`extensions/desktop-integration/features/window-tabs/WindowTabFit.js`

Sizes a window tab's window to the tab's picture area while a remote viewer has
sized the tab (Tab Share's interact guests), so the app fills the guest's screen
instead of sitting letterboxed in it, and puts the window back the way it was
when that ends.

The tab itself is sized by the browser
([TabViewManager.setTabViewSize](../../../../core/browser/TabViewManager.md));
the page then reports its picture area with every `state` call and
[WindowTabsFeature](WindowTabsFeature.md) passes it here.

## Methods

- `new WindowTabFit({ win, probe })`: `win` is
  [Win32Windows](../../../../core/desktop/win32/Win32Windows.md) (`placement`,
  `resizeFrame`, `restorePlacement`) or null off Windows; `probe` a
  [WindowProbe](../lumabyte/WindowProbe.md) (`alive`, `minimized`, `rect` in
  physical pixels, `frame` in DIP).
- `sync(hwnd, stage)`: `stage` is the picture area `{ width, height }` in DIP
  while a guest has sized the tab, null when none has. With a stage the window's
  visible frame becomes that size in its monitor's physical pixels (the scale is
  read off the window's own rect); with null the window is released. Returns
  whether the window was resized or put back.
- `release(hwnd)`: back to the placement saved before the first resize (a
  window that is gone is only forgotten); `releaseAll()`.

## Rules

- The placement (show state and restored position) is saved once, before the
  first resize, so a maximized window comes back maximized.
- A size is applied once. The app's own limits may clamp it, and a window the
  person then resizes by hand is left alone until the picture area changes
  (`SAME_PX`, 2, absorbs the pixel of jitter in the scale).
- A minimized or gone window, a picture area under `MIN_STAGE` (120, a page
  with no layout yet) and a missing window layer change nothing.
- A throwing window layer is contained: the call answers false.
