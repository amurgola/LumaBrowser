# InteractionDriver

`tools/crash/InteractionDriver.js`

`--interact` for crash-repro (Windows only): runs `powershell -NoProfile -ExecutionPolicy Bypass -File
scripts/crash-repro-interact.ps1 -ProcId <pid> -Seconds <n>` against the launched app, where `n` is the hold minus
4 s (at least 5). Its output goes to the run's console log as `[interact] ...` / `[interact:err] ...`. The script
moves the real mouse and types, so do not use it on a machine someone is working at (it idles when the app loses
the foreground). See [CrashScripts](CrashScripts.md).

## Methods

- `new InteractionDriver({ scriptPath, platform, spawnImpl })`; `start(pid, holdMs, write)` returns the child or null; `args(pid, holdMs)`.
