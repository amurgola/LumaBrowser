# HitCover

`core/desktop/service/HitCover.js`

Decides whether what a UIA hit test found at a ref's click point covers the ref,
in which case the click is refused (`COVERED`) instead of landing on it.

## Methods

- `HitCover.coverOf(hit, w, refRect)` the covering hit or null. Accepted as the
  ref: relation `self`, `descendant` (a label inside a button), `ancestor`
  (frameworks whose leaves are not hit-testable answer with the container), or any
  element whose rectangle lies inside the ref's (runtime ids of virtualized
  elements are not always stable). Otherwise relation `other`, or a hit in another
  top-level window, is a cover.
- `HitCover.rectContains(outer, inner)` for `[x, y, w, h]` with 2 px of slack.
- `HitCover.message(ref, cover, w)` `Did not click ref <n>: something is covering
  it: "<name>" (<role>)[ in another window]. Close or move it, or observe again, then retry.`
