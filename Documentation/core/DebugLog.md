# DebugLog

`core/DebugLog.js`

Dev-only ring buffer of recent console output, read by the chat menu's "Copy Logs" action.

## Methods

- `DebugLog.install(target = console)` wraps `log`, `warn` and `error` on the
  target so every call is recorded and then forwarded. Idempotent per target.
- `DebugLog.isInstalled(target = console)` reports whether the target is tapped.
- `DebugLog.dump()` returns a copy of the buffered lines, oldest first. Each
  line is `[level] args...`, non-strings JSON-encoded (falling back to `String()`).
- `DebugLog.clear()` empties the buffer.
- `DebugLog.MAX_LINES` (1000) and `DebugLog.MAX_LINE_CHARS` (2000) bound memory.

## Why dev-only

`main.js` calls `install()` only when running in dev. A packaged build never
monkey-patches the console and never retains log lines, because the buffer
would capture whatever is logged, which can include request detail. The IPC
handler that serves "Copy Logs" returns an empty list outside dev.

The buffer is bounded so a long session cannot grow it without limit, and
recording swallows its own errors so logging can never break a turn.
