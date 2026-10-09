# PageScroller

`core/browser/tab-manager/PageScroller.js`

scroll by selector, absolute jump or relative amount, with the settled position.

## Methods

- `PageScroller.scroll(page, { selector, direction = 'down', amount = 600 })` -> `data: { scrollX, scrollY, pageHeight, evidence? }`
  or `data: { scrolledTo, evidence? }` for a selector. Positions are the settled ones.
- `PageScroller.script(options)`: `top` and `bottom` are absolute `scrollTo` jumps; `left` and `right`
  are purely horizontal; anything else scrolls vertically (`up` negative).

## Why

Smooth scrolling means the script's own numbers are pre-scroll, so the after-snapshot replaces them. `top`/`bottom` once fell through to a relative scroll down (bug H17).
