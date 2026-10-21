# PanelResizer

`ui/shell/layout/PanelResizer.js`

Inner-edge drag handles for the right dock, bottom dock, AI activity and AI chat panels. One delegated mousedown serves every `[data-resize]` handle, so panels injected later work.

## Methods

- `install()`.
- `PanelResizer.PANELS`.
- `PanelResizer.nextSize(cfg, startSize, delta)` (clamped, inverted for inner-edge handles).

During a drag the mousemove deltas are coalesced to one CSS custom property write per
animation frame (the last delta wins; mouseup flushes it), since the property restyles
the whole document and a mouse can report far faster than the display refreshes.

## Globals

None beyond `localStorage` (via PanelSizeStore).
