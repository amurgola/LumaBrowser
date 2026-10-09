# CpuProfileSummary

`core/diagnostics/CpuProfileSummary.js`

Summaries of a V8 `.cpuprofile`.

## Methods

- `CpuProfileSummary.busy(profile)` `{ sampledMs, idleMs, busyMs }` from the
  sample deltas, `(idle)` samples counting as idle; null without a profile.
- `CpuProfileSummary.topFunctions(profile, limit = 20)` `[{ name, url, line, selfMs }]`
  by sampled self time. Nodes for the same function (name, file name, 1-based
  line) are merged; unnamed functions are `(anonymous)`; `(idle)`, `(program)`
  and `(root)` are dropped. `[]` without a profile.
