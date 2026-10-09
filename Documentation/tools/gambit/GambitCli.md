# GambitCli

`tools/gambit/GambitCli.js`

The `run-gambit` command (thin entry `scripts/run-gambit.js`). The gambit grades browser navigation, artifacts and
live modules, which are Electron services, so it boots the real app through the e2e launcher on a temp data dir
seeded from the user's settings.db, calls the same `llmDiagAPI` the LLM tab's button calls, and prints the report.

## Methods

- `execute(argv)` resolves the exit code:
  1. parse ([GambitArgs](GambitArgs.md)); a bad argument writes the error and returns 2;
  2. `--help` prints `USAGE`; `--list` prints [GambitSuiteLister](GambitSuiteLister.md) over the suite; both 0;
  3. launch (failure: `ERROR: could not launch the app: ...`, 2);
  4. `--model`: finds the scanned model whose first weight path or name contains the text and calls
     `setDefaults({ modelPath })`, else lists the `available:` paths and returns 2; `--ctx`: `setDefaults({ contextSize })`;
  5. exposes `__gambitTick`, subscribes `onGambitEvent` (events also kept in `window.__gambitLog`) and prints
     [GambitProgressFormatter](GambitProgressFormatter.md) lines to stderr, so `--json` stdout stays clean;
  6. announces a filtered run and each experiment, then `runGambit(null, filter, opts)` raced against `--timeout`;
  7. `--out` writes `getGambitRaw().raw` as JSON; prints the report as JSON (`--json`) or
     `GambitReportFormatter.format`; returns 0 when `overall >= 0.7`, else 1. Any throw returns 2.
  The app is closed unless `--keep-open`.
- `GambitCli.runPayload(opts)`: the `{ timeoutMs, filter, nativeHistory, nativeTools, agentEffort, parallel,
  promptExperiments }` sent into the page (`filter` null without `--group`/`--task`).
