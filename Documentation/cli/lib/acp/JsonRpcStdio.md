# JsonRpcStdio

`cli/lib/acp/JsonRpcStdio.js`

JSON-RPC 2.0 over newline-delimited JSON on a pair of streams: the Agent Client
Protocol's stdio transport. Hand-written because the CLI package ships with zero
dependencies. Nothing but protocol lines may reach the output stream, so logging
belongs on stderr.

## Methods

- `new JsonRpcStdio({ input, output })`: `input` a readable stream of UTF-8 lines
  (stdin), `output` anything with `write(text)` (stdout).
- `handle(method, fn)`: registers `fn(params)` (sync or async); chains. A request
  is answered with the return value (`{}` for undefined); a notification (no id)
  gets nothing back. Throwing a `JsonRpcError` answers with that error; any other
  throw is `INTERNAL_ERROR` with the message. A failing notification handler emits
  `'handler-error' (method, error)` instead.
- `start()`: begins reading; `'close'` is emitted when the input ends, and every
  pending outbound request is rejected with `transport is closed`.
- `request(method, params)`: a request to the peer; resolves its result or rejects
  with a `JsonRpcError` carrying the peer's `code`, `message` and `data`.
- `notify(method, params)`.
- `closed`.
- `JsonRpcStdio.JsonRpcError`: `new JsonRpcError(code, message, data?)` with `toJSON()`.
- Codes: `PARSE_ERROR` (-32700), `INVALID_REQUEST` (-32600), `METHOD_NOT_FOUND` (-32601),
  `INVALID_PARAMS` (-32602), `INTERNAL_ERROR` (-32603).

## Behaviour

Incoming requests are dispatched as they arrive and answered when their handler
settles, so a long `session/prompt` never blocks the `session/cancel` that follows
it. Lines may end in CRLF; blank lines are skipped; a chunk may split a line. An
unparseable line is answered with a parse error (id null), an array or scalar with
an invalid request. A reply nobody waits for is ignored.
