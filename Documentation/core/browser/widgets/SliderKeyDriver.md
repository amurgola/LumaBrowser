# SliderKeyDriver

`core/browser/widgets/SliderKeyDriver.js`

Moves an ARIA slider to a target with trusted keys.

## Methods

- `new SliderKeyDriver(wc, info, target).execute()` returns `{ moved, now, presses, step }`. Focuses the
  slider, then: Home/End for targets at the extremes; one arrow toward the target to learn the step
  (no movement means `moved: false`); for trips over 20 steps one PageUp/PageDown to learn the page
  step and as many pages as fit; then arrows in batches of up to 25, re-reading `aria-valuenow` between
  batches and stopping within half a step. Right/Left per ARIA APG on both orientations. At most 300
  presses and 40 batches.
