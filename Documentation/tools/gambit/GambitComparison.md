# GambitComparison

`tools/gambit/GambitComparison.js`

Diffs two `run-gambit --out` files (thin entry `scripts/gambit-compare.js <baseline.json> <candidate.json>`). The
report prints scores but not cost, so an A/B that trades accuracy for wall time reads as a clean win; this adds
wall time, iterations, tool calls and decode rate, overall, per group and per task.

## Methods

- `new GambitComparison().execute(A, B)` returns the lines in print order:
  1. a blank line, the [GambitRunMeta](GambitRunMeta.md) lines, a blank line;
  2. only tasks both runs ran are compared; when the task sets differ, a `comparing N shared tasks` note says the
     suite-level figures are not comparable;
  3. OVERALL: score, worst decile, health, wall time, iterations, tool calls, `ms / iter` (a mean, printed with its
     caveat), `decode tok/s` (mean of per-task rates, only when either run has timings), slowest turn;
  4. BY GROUP: score (when both reports have the group), time and iterations;
  5. SCORE MOVERS (tasks whose score moved, worst first), skipped when none;
  6. SLOWEST DELTAS: the six largest time increases.

Costs come from [GambitTaskCost](GambitTaskCost.md); numbers from [GambitCompareFormat](GambitCompareFormat.md).
