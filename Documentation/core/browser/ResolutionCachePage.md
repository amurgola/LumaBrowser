# ResolutionCachePage

`core/browser/ResolutionCachePage.js`

In-page script sources for the resolution cache, which replays earlier LLM or
vision answers for a repeated element description without asking a model.

## Methods

- `ResolutionCachePage.captureAtPointScript(x, y)`: the interactive element under
  a viewport point (a vision answer), walking up to an interactive ancestor or
  the outermost `cursor:pointer` box. Refuses iframes, canvases and video
  (the point matters there, not the element), the body, and page-sized
  containers. Returns `{ success, href, selector, tag, role, text, rect }`.
- `ResolutionCachePage.captureForSelectorScript(selector)`: the element an LLM
  selector names, with a sturdier selector rebuilt from it (keeping the original
  only when it is unique and nothing better is).
- `ResolutionCachePage.validateScript(selector, { tag, text }, { pointCheck = true })`:
  `{ success: true, ok: true, exact, x, y, bbox, target }`, or
  `{ success: true, ok: false, hard, reason }`. Hard misses (no match, invalid,
  ambiguous, text or tag changed) mean the entry is wrong; soft ones (not
  visible, off screen, covered) may be transient. `pointCheck` scrolls the
  element into view and requires its centre to hit it. `exact` says the
  selector's first match is the validated element.
- `ResolutionCachePage.PAGE_HELPERS_SRC`: shared helpers (`robustSelector`,
  `textOf`, `similar`, ...), including SelectorKit's `isHashedToken`.
- `ResolutionCachePage.UNCACHEABLE_TAGS`.

## Behaviour

Robust selectors prefer, in order: a stable id, test attributes (`data-testid`,
`data-test`, `data-qa`, `data-cy`, ...), `aria-label`, `name`, `placeholder`,
`title`, a short `href`, stable classes; else a short path anchored on the
nearest unique ancestor. Hashed classes and counters are skipped. Text matching
is loose (`Cart (3)` matches `Cart (4)`, small edits pass), because a selector
that drifted onto a different element is worse than a miss.
