# TabLayout

`core/browser/tab-view/TabLayout.js`

Places the active tab's view over the content area the renderer reports.

## Methods

- `new TabLayout(registry, emitter)`.
- `currentBounds`: the last reported bounds, CSS px relative to the window.
- `setBounds(bounds)`: rounds, applies to the active tab, emits `boundsChanged`
  (TabPreviewManager and On Demand reposition on it).
- `applyTo(entry)`: zero width or height hides the view (an overlay such as
  Settings has the window; some GPU paths paint a 0x0 rect as a 1px artifact);
  otherwise shows it only if active and sets its bounds.
