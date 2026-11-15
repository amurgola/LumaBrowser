# TabLayout

`core/browser/tab-view/TabLayout.js`

Places each window's active tab view over the content area that window's renderer reports. A tab a
remote viewer has sized (Tab Share) takes that size instead, on screen or lent a place behind the tab
on screen.

## Methods

- `new TabLayout(registry, hosts, emitter)` ([TabHosts](TabHosts.md) keeps each window's bounds).
- `currentBounds`: the main window's last reported bounds, CSS px relative to the window.
- `setBounds(bounds, hostId = 0)`: rounds, stores for that window, applies to its active
  tab; for the main window also emits `boundsChanged` (TabPreviewManager and On Demand
  reposition on it).
- `applyTo(entry)`: zero width or height hides the view (an overlay such as
  Settings has the window; some GPU paths paint a 0x0 rect as a 1px artifact);
  otherwise shows it only if active and sets its window's bounds. A sized tab
  is placed by the rules below.
- `setViewSize(entry, size)`: `{ width, height }` (rounded) sizes the tab's view
  for a remote viewer's window, null or an empty size fills the content area
  again. Kept on `entry.viewSize`.
- `refitBackground()`: places every background tab that is sized (or still lent
  a place) again. Runs on `setBounds` and, through
  [TabViewManager](../TabViewManager.md), on every tab switch.

## A view sized for a remote viewer (2026-11-15)

A Tab Share interact guest can size the shared tab to its own window (its Fit
button) so the site lays out for its screen. The window is never resized, only the tab's view.

- On screen (the tab is the window's active one) the view takes that size but
  never leaves the content area, where it would cover the window's own chrome;
  it sits centred in it. Page fullscreen overrides the size while it lasts.
- In the background the view is lent a place: made visible at the bottom of the
  window's stack, at the corner of what the tab on screen covers and never
  larger than it, so nobody sees it. Measured in the running app: Chromium
  resizes a page only while its view is visible. `setBounds` on a hidden view
  changes `getBounds()` and leaves `innerWidth` where it was.
  [TabPreviewManager](../TabPreviewManager.md) lends a place the same way for
  its captures.
- With nothing to hide behind (an overlay has the window, or no tab is active
  there) the view stays hidden at the size it had, and is placed when the
  content area comes back.
- A background tab whose size is cleared is lent the whole covered area once,
  so its page takes the host's size back, and is hidden again at the next
  re-layout.

So the page can shrink to a smaller guest window but never grows past the
host's content area; a larger guest window keeps bars on that axis.
