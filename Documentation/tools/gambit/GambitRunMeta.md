# GambitRunMeta

`tools/gambit/GambitRunMeta.js`

The comparison's opening block: one line per run (`modelName`, `ctx=`, placement, `ranAt`) and the warnings that
say the two runs did not measure the same configuration.

## Methods

- `GambitRunMeta.lines(A, B)`: the baseline and candidate lines, then a placement WARNING (different `gpus` or
  `splitMode`) or NOTE (either run lacks `placement`), a WARNING per run with `contextChangedDuringRun`, and a
  WARNING when `modelPath` or `contextSize` differ.
- `GambitRunMeta.context(meta)`: for example `16384 (asked 32768) x2 slots`.
- `GambitRunMeta.placement(meta)`: `gpus=2 split=row` or `placement=?`.
