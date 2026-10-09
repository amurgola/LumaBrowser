# ResponsesStream

`core/network-sharing/host/llm/ResponsesStream.js`

Writes one shared turn in the OpenAI Responses API wire format: typed
`response.*` SSE events (`event:` line plus data with `type` and an increasing
`sequence_number`), with no `[DONE]` sentinel.

## Methods

- `new ResponsesStream(res, { model, temperature })`: mints `resp_<hex>` and `msg_<hex>`.
- `event(type, payload)`, `started()` (`response.created`, `response.in_progress`).
- `delta(text)`: the first call adds `response.output_item.added` and
  `response.content_part.added`; each writes `response.output_text.delta`.
- `completed(text, usage)`: the `.done` events (when an item was opened) and `response.completed`.
- `incomplete(text, usage)`, `failed(text, usage, message)` (error `{ code: 'server_error', message }`).
- `response(status, text, usage)`: the response object; `output` and
  `output_text` are filled only when `completed`. `incompleteResponse(text, usage)` adds the cancel reason.
- `ResponsesStream.mapUsage(usage)`: `{ input_tokens, output_tokens, total_tokens }` or null.

## Why

`output_text` is an SDK convenience, not wire format, but harmless and it helps naive clients.
