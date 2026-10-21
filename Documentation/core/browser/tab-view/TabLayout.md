# TabLayout

`core/browser/tab-view/TabLayout.js`

Places each window's active tab view over the content area that window's renderer reports.

## Methods

- `new TabLayout(registry, hosts, emitter)` ([TabHosts](TabHosts.md) keeps each window's bounds).
- `currentBounds`: the main window's last reported bounds, CSS px relative to the window.
- `setBounds(bounds, hostId = 0)`: rounds, stores for that window, applies to its active
  tab; for the main window also emits `boundsChanged` (TabPreviewManager and On Demand
  reposition on it).
- `applyTo(entry)`: zero width or height hides the view (an overlay such as
  Settings has the window; some GPU paths paint a 0x0 rect as a 1px artifact);
  otherwise shows it only if active and sets its window's bounds.
