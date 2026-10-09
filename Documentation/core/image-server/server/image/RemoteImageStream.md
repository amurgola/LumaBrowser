# RemoteImageStream

`core/image-server/server/image/RemoteImageStream.js`

One remote image request's NDJSON event stream from a Network Sharing host,
re-emitted to the caller's callbacks with exactly one terminal callback.

## Methods

- `new RemoteImageStream(callbacks)` takes the request's `onMeta`, `onStatus`,
  `onProgress`, `onPreview`, `onDone`, `onError`.
- `onResponse(res)`: a 2xx response's stream is split into lines (CRLF or LF,
  across chunk boundaries); `meta`, `status`, `progress` and `preview` pass their
  payload through, `done` and `error` are terminal. A non-2xx drains up to 4 KB
  of body and fails `remote image server HTTP <status>: <first 300 chars>`.
- `fail(message)` reports one `onError` unless already finished or aborted.
- `abort()`, `isAborted()`: after an abort nothing is emitted.

## Why

An unterminated final line is still flushed on end, because it is often the
`done` event (the SSE readers once dropped exactly that frame). A stream that
ends without a result fails `remote image stream ended without a result`.
Unparseable lines are skipped, and throwing consumer callbacks are swallowed so
the stream's own bookkeeping holds.
