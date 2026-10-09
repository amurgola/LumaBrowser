# CrashReproLaunch

`tools/crash/CrashReproLaunch.js`

One crash-repro launch. Spawns `electron . --dev --enable-logging=file --log-file=<run>/chromium.log` in the
project root with `LUMA_AUTO_QUIT_MS=<hold>`, writes its stdout and stderr to `<run>/console.log` and echoes the
interesting lines (`ECHO_PATTERN`: crash-trace, restored tabs, process-gone, FATAL, uncaught) as `    | ...`.
Starts the optional [TabChurnDriver](TabChurnDriver.md) and [InteractionDriver](InteractionDriver.md). When the
app has not exited `exitGraceMs` after the hold, the watchdog stops the child's process tree by PID
([ProcessTreeKiller](ProcessTreeKiller.md)) and the run is `HUNG`. Then [RunArtifacts](RunArtifacts.md) finds the
trace log and minidumps, which are copied into the run folder.

## Methods

- `new CrashReproLaunch({ electronPath, root, options, artifacts, interaction, tabDriver, env, platform, spawnImpl, killer, stdout })`.
- `execute(index)`: resolves `{ index, pid, code, signal, durationMs, verdict, runDir, traceLog, ended, dumps, lastEvent }`.
- `CrashReproLaunch.command(electronPath, runDir)`: `{ file, args }` of the launch.
- Constants: `ECHO_PATTERN`, `DRIVE_STOP_BEFORE_QUIT_MS` (1500), `WATCHDOG_SETTLE_MS` (3000).
