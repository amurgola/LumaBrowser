# CrashTraceFormat

`core/diagnostics/CrashTraceFormat.js`

Formatting helpers for crash-trace lines.

## Methods

- `CrashTraceFormat.short(value, max = 160)` string form, cut at `max` with an ellipsis.
- `CrashTraceFormat.extra(value)` `''` for undefined, `' <string>'` for strings,
  otherwise `' <JSON>'` (falling back to `String(value)` for cyclic values).
- `CrashTraceFormat.webContentsTag(wc)` `wc#<id>(<type>)`, with `?` for anything
  a destroyed webContents refuses to report.
- `CrashTraceFormat.stackOf(skip = 1)` up to 8 indented stack frames; `skip` 1
  starts at the function that called `stackOf`, 2 at that function's caller
  (what the quit-path patches use, so the stack begins at whoever quit).
