# GambitCli

`tools/gambit/GambitCli.js`

The `run-gambit` command (thin entry `scripts/run-gambit.js`). The gambit grades browser navigation, artifacts and
live modules, which are Electron services, so it boots the real app through the e2e launcher on a temp data dir
seeded from the user's settings.db, calls the same Model Testing actions the add-on's Setup tab calls
(`llmDiagAPI.setup.invoke('model-testing', ...)`, see [ModelTestingActions](../../extensions/model-testing/ModelTestingActions.md)),
and prints the report.

## Methods

- `execute(argv)` resolves the exit code:
  1. parse ([GambitArgs](GambitArgs.md)); a bad argument writes the error and returns 2;
  2. `--help` prints `USAGE`; `--list` prints [GambitSuiteLister](GambitSuiteLister.md) over the suite; both 0;
  3. launch (failure: `ERROR: could not launch the app: ...`, 2);
  4. `--model`: finds the downloaded model whose path or label contains the text in the add-on's `state`
     (`testing model: <path>`), else lists the `available:` paths and returns 2; without it the run tests the
     default model; `--ctx`: `setDefaults({ contextSize })`;
  5. exposes `__gambitTick` and polls the add-on's `status` every second from the page, printing
     [GambitProgressFormatter](GambitProgressFormatter.md) lines to stderr, so `--json` stdout stays clean;
  6. announces a filtered run and each experiment, then invokes `run { modelPath, suiteIds: ['compatibility-gambit'], options }`
     raced against `--timeout`, and flushes the progress lines the last poll missed from the result's `outcomes`;
  7. `--out` writes the `raw { suiteId }` reply (`{ modelPath, ranAt, suiteId, report }`) as JSON; prints the
     report as JSON (`--json`) or `GambitReportFormatter.format`; returns 0 when `overall >= 0.7`, else 1.
     A refused run or any throw returns 2.
  The app is closed unless `--keep-open`.
- `GambitCli.runOptions(opts)`: the `{ filter, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments }`
  the gambit suite reads from the run (`filter` null without `--group`/`--task`).
- `EXTENSION_ID` `model-testing`, `POLL_MS` 1000.
