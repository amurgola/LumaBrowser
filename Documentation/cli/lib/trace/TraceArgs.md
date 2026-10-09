# TraceArgs

`cli/lib/trace/TraceArgs.js`

Arguments and usage text of `luma trace`.

## Methods (static)

- `TraceArgs.parse(argv)` returns `{ id, turn, call, json, help }`: the first non-flag word is the id
  (or `last`); `--turn N`, `--call N`, `--json`, `-h/--help`; `--calls` is accepted and ignored.
- `TraceArgs.usage()`: the five command lines and how to turn tracing on.
