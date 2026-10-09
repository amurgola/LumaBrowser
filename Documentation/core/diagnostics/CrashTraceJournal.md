# CrashTraceJournal

`core/diagnostics/CrashTraceJournal.js`

The crash-trace run log file. Each line is written with `fs.writeSync` and
prefixed with its offset from the run start (`+   1234ms ...`), so it reaches
disk before a native crash can lose it.

## Methods

- `CrashTraceJournal.open(file, start)` opens for append; returns null when the
  file cannot be opened (the tracer then stays off).
- `write(line)` appends one line; a no-op once closed; write errors are swallowed.
- `close()` closes the file once.
- `file` the path; `closed` whether it has been closed.
