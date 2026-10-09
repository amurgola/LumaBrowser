# GambitReportFormatter

`core/llm-server/gambit/GambitReportFormatter.js`

Renders a [GambitReport](GambitReport.md) as the one-screen console summary
printed by the CLI runner (`scripts/run-gambit.js`).

## Methods

- `GambitReportFormatter.format(report)` returns the text: a title naming
  `meta.modelName` (else `meta.modelPath`, else `(unknown model)`), the runtime
  when known, one line per group (score, label padded to 26, `passed/n tasks
  passed` or the health detail), the OVERALL line with band and worst decile,
  coverage with each skip reason, then each failed task with up to four of its
  failed checks.
