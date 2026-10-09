# RefLocator

`core/desktop/service/RefLocator.js`

Finds where an observed UIA ref is on screen now.

## Methods

- `new RefLocator({ uia, observation, frames })`.
- `rectOf(ref, node)` `{ rect, scrolled }` from the sidecar's `locate` (which
  scrolls an offscreen element into view). A located `rect: null` throws
  `RefLocator.offscreenMessage(ref)`; a failed locate falls back to the observed rectangle.
- `pointOf(w, p, label)` the screen centre of `{ ref }` (needs an observation of
  `w` and the ref in it) or the mapped `{ x, y }` of the last screenshot; throws
  `<label> is required: ...` or `<label> needs ref ... or x/y ...` otherwise.
- `RefLocator.offscreenMessage(ref)`.
