# CrashReproOptions

`tools/crash/CrashReproOptions.js`

Parses the crash-repro command line into `{ runs, holdMs, pauseMs, stopOnCrash, interact, drive, dryRun, help,
outDir, apiPort, exitGraceMs }`.

| Flag | Default | Meaning |
|---|---|---|
| `--runs N` | 30 | launches to attempt |
| `--hold MS` | 25000 | how long after `ready` the app stays up before the auto-quit |
| `--continue` | off | keep going after the first reproduction |
| `--out DIR` | `test-data/crash-repro/<iso time>` | where run folders go |
| `--interact` | off | synthetic Win32 input through `scripts/crash-repro-interact.ps1` (win32 only) |
| `--pause MS` | 2000 | pause between launches |
| `--drive` | off | tab churn over the REST gateway (`LUMA_API_PORT`, default 3000) |
| `--dry-run` | off | print the plan, launch nothing |
| `--help`, `-h` | | usage |

A value flag followed by nothing or by another flag reads as `true`, as in legacy.

## Methods

- `CrashReproOptions.parse(argv, { root, env, now })`.
- Constants: `USAGE`, `DEFAULT_RUNS`, `DEFAULT_HOLD_MS`, `DEFAULT_PAUSE_MS`, `EXIT_GRACE_MS` (30000), `DEFAULT_API_PORT`.
