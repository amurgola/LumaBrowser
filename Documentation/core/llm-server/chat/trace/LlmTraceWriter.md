# LlmTraceWriter

`core/llm-server/chat/trace/LlmTraceWriter.js`

Appends [LlmTrace](../LlmTrace.md) lines to per-conversation `.jsonl` files
without ever blocking a turn.

## Methods

- `new LlmTraceWriter()`; LlmTrace holds one shared instance.
- `directory()`: the override, else `<appBaseDir>/traces` via
  [AppOwnedDir](../AppOwnedDir.md) (`null` under jest).
- `setDirectory(dir)`: override the directory and mark the pointer file as
  written so tests never touch the home directory. `null` restores the default.
- `fileFor(conversationId)`: `<dir>/<safe id>.jsonl`, or `_side.jsonl` with no
  id ([FileNameSegment](../FileNameSegment.md)); `null` without a directory.
- `append(conversationId, record)`: serialise with
  [LlmTraceRecord](LlmTraceRecord.md), then async mkdir, stat, rotate if past
  `ROTATE_BYTES` (50 MB), append. Never throws.
- `deleteFor(conversationId)`: remove `<id>.jsonl` and `<id>.1.jsonl`; does
  nothing for an empty id, so the side file survives.
- `wipeAll()`: remove the directory.
- `POINTER_FILE`: `~/.lumabrowser/traces.json`, `{ dir }`, written once per
  process on first append so `luma trace` can find the files.

## Why

Any failure (unwritable dir, full disk) is logged once per process as
`[llm-trace] disabled after write failure: ...` and otherwise ignored; tracing
is a diagnostic and must never cost the user a turn.
