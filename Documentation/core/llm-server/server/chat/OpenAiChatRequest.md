# OpenAiChatRequest

`core/llm-server/server/chat/OpenAiChatRequest.js`

Posts one streaming chat completion with axios and pipes the body, through
`core/llm-service/providers/SseLineReader`, into an
[OpenAiChatStream](OpenAiChatStream.md).

## Methods

- `new OpenAiChatRequest({ url, body, headers, signal, stream })`.
- `start()` posts with `responseType: 'stream'` and `timeout: 0` (generation
  is slow; the caller cancels instead). On a normal end it calls
  `stream.end()`; on failure `stream.fail(error)`. Nothing is reported once the
  stream is aborted.
- `static isDeadSocket(error)` is true for an error with no HTTP response whose
  code is `ECONNRESET`/`EPIPE` or whose message says "socket hang up".
- `DEAD_SOCKET_CODES`.

## Behaviour

- **One retry on a dead socket before any response.** Node pools the socket as
  the previous SSE response ends, while llama-server closes its side a few ms
  later. A request fired straight from a done handler (the terminal's follow-up
  suggestion, a queued follow-up) can take that socket and die before a byte
  arrives. Nothing was generated, so one identical retry is safe and never
  surfaced. A second failure, an HTTP error or a failure after the response
  started is reported.
- **HTTP errors are explained.** The body is still a stream, so it is read with
  [ChatErrorBody](ChatErrorBody.md) and the error becomes
  `Chat request failed: HTTP <status> <statusText> - <detail>`.
