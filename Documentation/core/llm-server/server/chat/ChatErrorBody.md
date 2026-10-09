# ChatErrorBody

`core/llm-server/server/chat/ChatErrorBody.js`

Reduces an inference server's HTTP error body to one reportable line, so a
failed chat request says why (rejected body, chat-template exception, context
overflow) instead of a bare "HTTP 500".

## Methods

- `ChatErrorBody.read(data)` resolves a string, `''` when nothing useful could
  be read. `data` may be the stream axios returns under `responseType:
  'stream'`, a parsed object or a string. JSON is searched for
  `error.message`, `error` or `message`; anything else is the raw text with
  whitespace collapsed. Never rejects.
- `MAX_READ` (4096 bytes read from a stream), `MAX_LINE` (600 characters
  returned), `READ_TIMEOUT_MS` (2000; a body that never arrives must not hang
  the error path).

## Reuse note

`core/llm-service/providers/StreamedErrorBody` also drains an error stream but
rewrites `error.response.data` in place, with no cap or timeout. They could share
a drain helper later.
