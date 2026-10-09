# CrashTraceRunLogs

`core/diagnostics/CrashTraceRunLogs.js`

The crash-trace folder's run logs (`run-*.log`): pruning, and the boot-time
review of the previous run.

## Methods

- `CrashTraceRunLogs.list(dir)` run log names, sorted (oldest first, since names start with the ISO time).
- `CrashTraceRunLogs.prune(dir, keep = 40)` deletes all but the newest `keep`.
- `CrashTraceRunLogs.reviewPrevious(dir, currentFile, crashDumpsDir)` looks at
  the newest log other than the current one:
  - none, or unreadable: null
  - has an ` END ` line: `{ file, abnormal: false }`
  - otherwise `{ file, abnormal: true, lastEvent, dumps }`, where `lastEvent` is
    the last non-heartbeat line and `dumps` the `.dmp` files under
    `<crashDumpsDir>/reports` modified up to 5 minutes before the log's last
    write. A summary (last event, last line, dumps or the "no minidump" note,
    and the last 80 lines) is written to `last-abnormal.txt` and its first
    lines to the console as `[crash-trace] ...`.

## Why no END means abnormal

A clean run passes through a quit path that writes `END`. A log without one
means the process died without any quit path: a native crash, an external kill,
or (rarely) a run still alive in another instance. A missing minidump points at
an external kill or power loss, because a native crash would have left one.
