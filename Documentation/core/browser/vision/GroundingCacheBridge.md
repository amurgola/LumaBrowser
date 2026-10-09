# GroundingCacheBridge

`core/browser/vision/GroundingCacheBridge.js`

Visual grounding's use of the [ResolutionCache](../ResolutionCache.md), under the
action kind `locate` (which shares entries with `click`).

## Methods

- `new GroundingCacheBridge(resolutionCache, tabManager)`; a null cache makes every
  lookup a miss and every remember a no-op.
- `replay(tabId, description)`: a validated hit or null; lookup errors are logged
  and treated as misses.
- `noteHit(hit)`, `noteFailedClick(hit, click)` (a hard miss with the click's error).
- `GroundingCacheBridge.dataFor(hit)` -> `{ x, y, bbox, target, selector, resolvedBy: 'cache' }`.
- `remember(tabId, description, x, y)`: captures the element at the point and stores
  it as a `vision` answer. Best effort: a failed capture only means the next call
  asks the model.
