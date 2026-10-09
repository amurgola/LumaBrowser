# RuntimeLogRing

`core/shared/runtime/server/RuntimeLogRing.js`

The bounded log of a supervised child's output lines.

## Methods

- `new RuntimeLogRing(limit = 400)`.
- `capture(stream, chunk, now = Date.now())` splits a chunk on `\r?\n`, stores
  each non-empty line as `{ ts, stream, line }`, drops the oldest past the
  limit, and returns the new entries (the supervisor emits one `log` event each).
- `entries` the live array; `snapshot()` a copy; `clear()` empties it.
- `errorTail(processNoun, limit = 15)` the last stderr lines under a
  `--- <noun> output (tail) ---` header, or `''` when there are none.
- `RuntimeLogRing.LIMIT` (400), `RuntimeLogRing.ERROR_TAIL_LINES` (15).

## Why

The status card shows the ring, and a failed start appends the stderr tail to
its error because the generic "exited before becoming healthy" says nothing;
the tail names the real cause (unknown flag, CUDA OOM, bad GGUF).
