# Aggregator

`core/llm-server/eval/Aggregator.js`

Rolls scored eval tasks up into per-variant stats and diffs two variants task by task.

## Methods

- `Aggregator.aggregate(results)` returns `{ n, mean, passRate, worstDecile, worstDecileN, byCategory }`
  for an array of `{ taskId, category, score, passed }`. `byCategory[c]` is `{ n, mean }`.
  An empty array yields zeros, never NaN.
- `Aggregator.diffVariants(baseline, candidate)` takes two `{ variantId, results }` and returns
  `{ baseline, candidate, delta: { mean, worstDecile, passRate }, regressions, improvements }`.
  Rows are `{ taskId, delta, baseline, candidate }`; regressions are sorted worst first,
  improvements best first. Tasks the baseline never ran are ignored.
- `Aggregator.formatDiff(diff)` renders a four-line console summary (first 5 regressions listed).
- `Aggregator.mean(values)` is the arithmetic mean, 0 for an empty list.
- Constants: `WORST_FRACTION` (0.1), `DELTA_EPSILON` (1e-9), `REGRESSIONS_SHOWN` (5).

## Why the worst decile

A prompt change that lifts the average while quietly tanking a few tasks is a regression in
disguise. So the mean of the bottom 10% of scores (always at least one task) and the per-task
regression list are first-class outputs, not afterthoughts.
