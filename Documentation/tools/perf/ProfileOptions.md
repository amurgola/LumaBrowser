# ProfileOptions

`tools/perf/ProfileOptions.js`

Command-line options of [PerformanceProfiler](PerformanceProfiler.md): `<label> [--first-run] [--no-adblock]`.
The label names the output folder, so it must match `^[a-zA-Z0-9_-]+$` (else `Label must be alphanumeric`).

## Methods

- `ProfileOptions.parse(argv)` -> `{ label, firstRun, noAdblock }`; label defaults to `run`.
- Constants: `DEFAULT_LABEL`, `LABEL_PATTERN`.
