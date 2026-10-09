# PanelResizer

`ui/shell/layout/PanelResizer.js`

Inner-edge drag handles for the right dock, bottom dock, AI activity and AI chat panels. One delegated mousedown serves every `[data-resize]` handle, so panels injected later work.

## Methods

- `install()`.
- `PanelResizer.PANELS`.
- `PanelResizer.nextSize(cfg, startSize, delta)` (clamped, inverted for inner-edge handles).

## Globals

None beyond `localStorage` (via PanelSizeStore).
