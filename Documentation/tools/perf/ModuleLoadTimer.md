# ModuleLoadTimer

`tools/perf/ModuleLoadTimer.js`

Times every `require()` during a profiled startup by wrapping `Module._load`. Each load records
`{ request, parent (filename), durationMs, selfMs }`, where self time is the total minus the nested loads it
triggered; loads of 1 ms or less are not kept.

## Methods

- `new ModuleLoadTimer({ target, now })` (defaults: `Module`, `performance.now`); `install()` (returns this),
  `uninstall()`, `sortedLoads()` (slowest self time first).
