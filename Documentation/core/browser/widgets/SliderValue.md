# SliderValue

`core/browser/widgets/SliderValue.js`

Decides where a requested slider value lands.

## Methods

- `SliderValue.snap(value, { min = 0, max = 100, step = 1 })` clamps to `[min, max]` and snaps to the
  step grid anchored at `min`, then clamps again. A zero or missing step only clamps. The result is
  rounded to the step's decimal places (max 10) to remove float noise such as `0.1 + 0.2`.
