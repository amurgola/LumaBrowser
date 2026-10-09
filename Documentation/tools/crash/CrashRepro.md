# CrashRepro

`tools/crash/CrashRepro.js`

Relaunches the dev app in a loop until it dies on its own (`npm run crash:repro`). Each launch runs
`electron . --dev` with `LUMA_AUTO_QUIT_MS=<hold>` (honoured by [CrashTracer](../../core/diagnostics/CrashTracer.md)),
so a healthy run quits through the normal path. A run is clean when the process exits 0 and its crash-trace log
ends with `END ... clean=true`; anything else (non-zero exit, no END line, a hang) is a reproduction whose console
output, crash-trace log and Crashpad minidumps are copied into `<out>/run-NN/`. `summary.json` lands in `<out>`.
Thin entry: `scripts/crash-repro.js`.

Without `LUMA_DATA_DIR` it runs against the REAL user profile on purpose (the persisted tabs, logins and settings
are what reproduce) and refuses to start while any `electron.exe` / `LumaBrowser.exe` runs, because the
single-instance lock would make every launch exit at once. With `LUMA_DATA_DIR` set the profile, and with it the
instance lock, is isolated, so the guard is skipped.

Process safety: crash-repro only ever stops what it spawned. A hung launch is stopped by PID with its own process
tree ([ProcessTreeKiller](ProcessTreeKiller.md)); the instance guard only reads the process list.

## Methods

- `new CrashRepro({ root, electronPath, env, platform, log, error, write, instanceCheck, makeLaunch, sleep })`.
- `execute(argv)`: resolves the exit code: 0 all clean (also `--help`, `--dry-run`), 1 reproduced, 2 refused.
- Constant: `INTERACT_SCRIPT` (`scripts/crash-repro-interact.ps1`).

Flags are in [CrashReproOptions](CrashReproOptions.md). One launch is [CrashReproLaunch](CrashReproLaunch.md).
