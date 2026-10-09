# ChromeOverlay

`core/browser/ChromeOverlay.js`

Display-only WebContentsView layers stacked above the tab views so browser-chrome
popups (URL suggestions, bookmark menus, the notification log) render on top of
the page.

## Methods

- `new ChromeOverlay(mainWindow)` registers its IPC channels and warms the
  `popup` and `notif` layers.
- `show({ id = 'popup', html, x, y, bottom, width, maxHeight, estHeight })` shows or
  updates a layer. `y` anchors the top; `bottom` anchors the bottom edge and derives
  `y` from the height. Initial height is `min(maxHeight || 600, estHeight || 220)`.
  Content is sent on `overlay:content`, or queued until the layer's page loads.
- `measure(sender, { height })` resizes the layer whose webContents is `sender` to
  its reported height, clamped to `maxHeight`, keeping a bottom anchor fixed.
- `setActive({ id, activeIndex })` forwards `overlay:set-active` to a visible layer.
- `hide({ id })` hides a layer and zeroes its bounds.
- `raiseVisible()` re-appends every visible layer on top (call after tab views restack).
- `destroy()` removes and destroys every layer.
- `layers` is a public `Map<id, { id, view, visible, pending, ready, pendingContent }>`;
  main.js reads it for the view-stack debug dump.
- `ChromeOverlay.SURFACE_COLOR` (`#141b2c`) must equal `--surface-pop` in
  `overlay/overlay.html`.

IPC: `chrome-overlay:show`, `:set-active`, `:hide`, `:measure` route to the methods
above; `chrome-overlay:action` and `:hover` from a layer are forwarded to the main
window tagged with `layer` (the layer id) and `id` (the row's own id if the markup
carried one, else the layer id).

## Why

Tab pages are native WebContentsViews added to `mainWindow.contentView`, and native
views always paint above the window's DOM, so a DOM popup is hidden behind the
active page. No z-index fixes that, so popups live in their own views.

Per-pixel transparency of one WebContentsView over another is unsupported on
Windows (electron#45104 / #45105), so each layer is sized flush to its popup and its
background is the popup colour. A colour mismatch shows as a lighter fringe on
rounded corners and on first paint.

Layers are created at startup because creating a WebContentsView on first use
steals keyboard focus from the shell on Windows, which blurred the address bar on
its first click. Layers never want focus: any focus they get goes straight back to
the shell webContents.

Only the first `show` of a layer restacks it, so content updates do not pop a layer
above its peers.

## Dependencies

Loads `overlay/overlay.html` and `overlay/overlay-preload.js` relative to this file.
Those are renderer-side files and are not ported yet.
