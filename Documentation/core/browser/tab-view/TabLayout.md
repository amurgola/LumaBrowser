# TabLayout

`core/browser/tab-view/TabLayout.js`

Places each window's active tab view over the content area that window's renderer reports. A tab a
remote viewer has sized (Tab Share) takes that size instead, on screen or lent a place behind the tab
on screen. A silent tab is lent the same place, so the page an agent drives has a real viewport; while
the window sizes no page (minimised, in the tray, nothing on screen) its page is told the viewport instead.

## Methods

- `new TabLayout(registry, hosts, emitter)` ([TabHosts](TabHosts.md) keeps each window's bounds).
- `currentBounds`: the main window's last reported bounds, CSS px relative to the window.
- `setBounds(bounds, hostId = 0)`: rounds, stores for that window, applies to its active
  tab; for the main window also emits `boundsChanged` (TabPreviewManager and On Demand
  reposition on it).
- `applyTo(entry)`: zero width or height hides the view (an overlay such as
  Settings has the window; some GPU paths paint a 0x0 rect as a 1px artifact);
  otherwise shows it only if active and sets its window's bounds. A sized tab
  and a silent tab are placed by the rules below.
- `setViewSize(entry, size)`: `{ width, height }` (rounded) sizes the tab's view
  for a remote viewer's window, null or an empty size fills the content area
  again. Kept on `entry.viewSize`.
- `refitBackground()`: places every background tab that is sized, silent (or
  still lent a place) again. Runs on `setBounds` and, through
  [TabViewManager](../TabViewManager.md), on every tab switch.
- `stopTelling(entry)`: switches off the viewport a page was told (below), when
  something real sizes it again: the window, or the
  [CaptureStage](../tab-manager/CaptureStage.md) a screenshot lends the view
  to. Nothing happens for a page that was told nothing. The next placement
  tells the page again where it still needs telling.

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

## A silent tab

A silent tab is never activated, and a page whose view was never shown stays
0x0: `innerWidth` and `innerHeight` are 0, nothing is "in view" for
observe_page, scrolling does nothing, every click falls back to a synthetic
one, and the site sees a zero-size window. So `applyTo` lends a silent tab the
same place a sized background tab gets, with no size of its own: it takes
everything the tab on screen covers, from the bottom of the stack, and follows
the window through `refitBackground`. With nothing to hide behind it waits, as
above. A lent view already below the tab on screen stays where it is in the
stack, so several silent tabs do not trade places on every re-fit. [TabViewManager](../TabViewManager.md) calls `applyTo` for a silent tab
as it is created, before its first load.

### While the window sizes no page (2026-11-23)

A window that is minimised or hidden in the tray sizes no page, lent view or
not, and neither does a view with nothing to hide behind. Measured in the
running app, which spends its day in the tray: every silent tab opened then
was 0x0, so the Hub's read of a Slack conversation got one message, because
Slack draws only the rows in view. In those two cases the silent tab's page is
told its viewport with device emulation
(`webContents.enableDeviceEmulation`): the size it is lent, else the content
area the window last reported, else `UNSEEN_VIEWPORT` (1280x800). Measured on
a tall test page in the tray: `innerWidth` and `innerHeight` take the size,
scrolling works, and animation frames, resize and intersection observers keep
firing.

- Chromium drops the emulation with the page's renderer, so
  [TabViewManager](../TabViewManager.md) calls `applyTo` for a silent tab on
  every `tabNavigated`, and the new page is told again.
- A page with no renderer behind it is never asked (`_hasLivePage`: an address
  is committed and the renderer has not crashed). Electron 45 takes the whole
  app down otherwise; a tab that has not loaded anything yet did exactly that.
- Once the window is showing again, the next placement lends the view its real
  size and the emulation is switched off.
- A tab sized for a remote viewer is not told anything: it keeps the size
  it had.

### A hidden persisted tab

A persisted tab restored at start is hidden and was never shown, so its
page was 0x0 for as long as the app sat in the tray. Most mail and chat
apps still raise their notifications that way; Teams does not start at
all (measured 2026-11-23: about 250 elements of loading shell in the
persisted tab, the whole app within three seconds in a hidden tab with a
viewport), and Slack lists no conversations. So `_placeInBackground` tells
a hidden tab's page the content area too. It is not lent a place: a dozen
mail and chat apps would then paint behind the tab on screen. When the
user shows the tab, `_placeOnScreen` switches the emulation off and the
window sizes the page. As for a silent tab,
[TabViewManager](../TabViewManager.md) places it again on every
`tabNavigated`, which is also what first tells a tab restored at start.
`node tmp/hidden-tab-size-probe.js` (git-ignored) replays it: created
hidden in the tray 1402x862, the same after a navigation, the window's
own size once shown.

`node tmp/silent-size-probe.js` (git-ignored) replays this in an isolated copy
of the app: a silent tab on screen, in the tray, across navigations, after a
renderer crash and with the window back.
