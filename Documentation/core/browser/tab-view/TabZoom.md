# TabZoom

`core/browser/tab-view/TabZoom.js`

Per-host page zoom, the way Chrome does it.

## Methods

- `new TabZoom({ db, registry, channel })`.
- `set(tabId, factor)` -> `{ success, zoomLevel }`: clamps to 0.3..3.0 (two decimals),
  applies it, stores it for the tab's host in the `zoomPerHost` setting (a factor
  of 1 removes the host), and applies it to every other non-internal live tab on
  that host.
- `get(tabId)`: the live factor (the page may have been zoomed with Ctrl+wheel).
- `by(tabId, step)`: `set(current + step)`.
- `applyStored(entry, url)`: on every committed navigation, applies the stored
  factor for the URL's host (1 when none). Internal and silent tabs are skipped.

Hosts come from `FaviconCache.hostOf` (lower-cased hostname).
