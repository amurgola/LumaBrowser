# OverlayView

`core/browser/ui/overlay/OverlayView.js`

## Methods

- `new OverlayView(root, api, win)`, `attach()`.
- `render({ html })`: sets `#root`'s HTML (built by the shell renderer), applies
  [FaviconFallback](FaviconFallback.md), measures after two animation frames.
- `measure()`: body height (or `#root` scrollHeight) to `api.measure`.
- `setActive({ activeIndex })`: `bd-active` on the matching `[data-bd-index]`.
