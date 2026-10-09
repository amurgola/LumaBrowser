# GambitCompareFormat

`tools/gambit/GambitCompareFormat.js`

Number formatting for the gambit comparison.

## Methods

- `ms(value)`: `-`, `NNNms`, `N.Ns` under 90 s, else `NmSSs`.
- `pct(n)`: `NN.N%` or `-`.
- `pointDelta(a, b)`: signed percentage-point difference of two 0..1 scores (`+25.0`, `-25.0`, `0.0`), empty when
  either is missing.
- `sign(n)`: `+` for zero and up, else empty.
