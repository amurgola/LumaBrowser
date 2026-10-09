# RuntimeTraceSummaryCommand

`tools/perf/RuntimeTraceSummaryCommand.js`

`node scripts/summarize-runtime-trace.js <capture-dir>`: re-runs
[RuntimeTraceSummary](../../core/diagnostics/RuntimeTraceSummary.md) over a RuntimeTracer capture (Ctrl+Shift+U in
the shell), prints `summary.md` and `Wrote <dir>/summary.json and summary.md`. Without a folder prints the usage to
stderr and returns 1.

## Methods

- `RuntimeTraceSummaryCommand.run(argv, { out, err })` -> exit code. Constant `USAGE`.
