# TraceCommand

`cli/lib/trace/TraceCommand.js`

`luma trace`: reads the per-conversation LLM trace files the app writes
([LlmTrace](../../../core/llm-server/chat/LlmTrace.md)). Files only; no app needed.

## Methods

- `TraceCommand.run(argv, { out?, err?, env? })` returns the exit code. `out` / `err` take one line
  each (default: the process streams).
  - `luma trace`: `Traces in <dir>` and one row per conversation (newest first), or a note that
    tracing is off by default;
  - `luma trace <id|last>`: `<id>: N call(s)`, a header, one row per call ([TraceTable](TraceTable.md));
  - `--turn N`: only the Nth turn (1-based, by first appearance of each `turnId`);
  - `--call N`: call N (1-based, numbered before the turn filter) as pretty JSON;
  - `--json`: the raw records, one per line;
  - `--help`: [TraceArgs](TraceArgs.md)`.usage()`.
  Exit 1 for no known trace folder, an unknown id, or an unknown call.
