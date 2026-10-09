# RunArtifacts

`tools/crash/RunArtifacts.js`

What one crash-repro launch left behind. The crash-trace log is `<userData>/crash-trace/run-<time>-<pid>.log`
(written by [CrashTracer](../../core/diagnostics/CrashTracer.md)); minidumps are `<userData>/Crashpad/reports/*.dmp`.
Files count when modified no earlier than one second (`CLOCK_SLACK_MS`) before the launch.

Verdicts: `HUNG` when the watchdog fired; `clean` when the exit code is 0 and a line matches ` END .*clean=true`;
`CRASH` otherwise.

## Methods

- `new RunArtifacts({ traceDir, reportsDir })`; `findTraceLog(pid, sinceMs)` (newest match or null), `dumpsSince(sinceMs)`.
- Statics: `readLines(file)`, `lastEvent(lines)` (last non-heartbeat line or `(none)`), `hasEnd(lines)`, `verdict({ code, hung, lines })`.
