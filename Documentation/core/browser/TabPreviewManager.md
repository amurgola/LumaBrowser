# TabPreviewManager

`core/browser/TabPreviewManager.js`

Parks a live tab's WebContentsView over a rectangle reserved by another tab's
renderer, so a page can be watched and driven inline inside a DOM surface. The
motivating case is the chat agent's browser work tab shown live in its tool card.

## Methods

- `new TabPreviewManager(mainWindow, tabViewManager, { db })` listens to the
  TabViewManager's `tabSwitched`, `boundsChanged`, `tabClosed` and registers IPC.
- `mode()` `'live' | 'off'` from setting `core.chat.tabPreview` (default live);
  `isEnabled()`; `setEnabled(enabled)` persists and, when turning off, detaches at once.
- `attach({ tabId, hostTabId })` begins a preview. Refused for unknown tabs,
  self-preview, silent tabs, or when the setting is off. Attaching a different tab
  detaches the current one. Nothing paints until the host reports a rect.
- `setRect({ x, y, width, height, visible })` positions it, in the host view's CSS px.
- `detach()` unparks, restores the user's zoom, and emits `detached`.
- `focus()` switches to the previewed tab (promotes it to the strip).
- `previewedTabId()`; `preview` (public state, including the fitted `zoom`).
- `captureFrame({ maxWidth = 640, quality = 70 })` a JPEG data URL frame, or null
  when nothing painted.
- `reapply()` re-asserts position and z-order (after anything restacks the content view).
- `destroy()` detaches and removes IPC.
- Events: `attached`, `detached`, `raised` (main.js re-raises ChromeOverlay layers on it).

IPC: `tab-preview:rect`, `:detach`, `:focus` are accepted only from the current
host's webContents, so another renderer cannot move the preview. `tab-preview:get-enabled`
and `:set-enabled` are global. Frames go to the host on `tab-preview:frame`.

## Why

Tab pages are native views that always paint above the window DOM, so an iframe or
canvas can never show a real tab. ChromeOverlay adds new views on top; this borrows
an existing tab view and positions it.

Two rules drive every decision:

1. `setBounds` resizes the page, it does not crop it. A rect not fully inside the
   content area is not shown at all (see TabPreviewGeometry).
2. Z-order is child order. A tab switch re-appends the active view last and buries
   the preview, so it re-raises on every switch. Plain rect updates do not restack,
   so scrolling does not thrash the view tree.

The preview only paints while its host is the active tab, and never while the
previewed tab is itself active (TabViewManager owns its bounds then).

Fit zoom: the card is about 600px wide, so at 100% a site lays out for a narrow
viewport. The page is zoomed out to a desktop-ish width, then measured and zoomed
further if it nearly fits, with a floor so infinite-scroll pages stop. A fit runs
once per size and again after `did-stop-loading`. The user's stored zoom is never
changed and is restored on detach or promotion.

Still frames every 1.5 s give the card a last-known image when the live view
cannot paint. `capturePage` needs a painting view, so no capture happens while the
preview is hidden, and a slow capture that outlives a detach is discarded.

Drag regions need no handling: TabViewManager neutralizes `-webkit-app-region` in
every tab document.

## Capturing a preview that is not on screen (2026-11-14)

`captureFrame` used to answer null for a preview that was hidden: the card scrolled out of view, another tab in front, or a preview never shown at all (ISSUES.md entry 1). The run's last frame comes from `captureFrame` (TabPreviewSession.end), so such a finished card stayed an empty box.

Measured in the running app before choosing a fix: `capturePage` on a hidden view gives an empty image at any size, with or without `stayHidden`; a visible view placed outside the window also gives an empty image, because it is never painted (an earlier probe that seemed to work had flashed the view on screen first). A visible view inside the window at the bottom of the view stack, covered by the active tab's view, paints and is captured in about 70 ms.

So a preview that is not on screen (`_isOffScreen`: not painted over its card, and not the user's active tab) is lent a place underneath for the capture (`_lendPlaceUnderneath`): re-added at stack index 0, placed at the content area's corner at the size it last had over its card (`lastSize`, else `CAPTURE_SIZE` 1024x640, never larger than the content area), made visible. `_firstPaintedImage` asks every `CAPTURE_POLL_MS` (50) for up to `CAPTURE_WAIT_MS` (1000) until an image is not empty. `_takeBackLentPlace` then hides it again, unless it was painted over its card or became the active tab while the capture ran. With no content area to hide under, nothing is lent and the answer is null as before. A preview on screen is captured in the same tick, untouched. The frame ticker still runs only while the preview is shown; only this one capture reaches a hidden view.

Both places that hide a background view again (`_takeBackLentPlace`, `_unpaint`) go through `_park(entry)`. A tab a remote viewer has sized (`entry.viewSize`, Tab Share) is not hidden there: it goes back to the layout (`TabViewManager.layoutTab`), which keeps it at that size behind the active tab ([TabLayout](tab-view/TabLayout.md)).

Constructor seams for tests: `{ captureWaitMs, capturePollMs }`.
