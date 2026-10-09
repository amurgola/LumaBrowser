# TranslatedChatStream

`core/llm-server/server/relay/TranslatedChatStream.js`

Base class for one streaming request on an API the Local API translates onto
llama-server's chat completions (Anthropic Messages, OpenAI Responses). Subclasses:
[MessagesStream](../anthropic/MessagesStream.md), [ResponsesStream](../responses/ResponsesStream.md).

## Methods

- `run({ res, upstream, body, log, context })` (static, builds the subclass it
  is called on) answers 200 `text/event-stream` at once (no-cache, keep-alive,
  `X-Accel-Buffering: no`, flushed), opens the upstream request through
  [UpstreamChatRequest](UpstreamChatRequest.md) and writes each translator event
  as `event: <type>\ndata: <json>\n\n`:
  - lines are read with [SseLineReader](../../../llm-service/providers/SseLineReader.md),
    so chunks split across writes and a final unterminated line both parse;
  - a chunk carrying `error` goes to `translator.error(message)`;
  - upstream end or stream error calls `translator.end()` and ends the response;
  - an upstream HTTP error calls `translator.error` with its message;
  - an unreachable upstream is logged and becomes `translator.error`;
  - the client closing early destroys the upstream request.
- `parseLine(line)` (static) returns the parsed `data:` payload, or `null` for
  non-data lines, blanks, `[DONE]` and unparseable JSON.
- `_createTranslator(emit)` (abstract) returns an object with `chunk(chunk)`,
  `end()` and `error(message)` that calls `emit(type, payload)`. `this._context`
  holds the `context` passed to `run`.

## Why

Both translated APIs relay the same upstream stream the same way and differ
only in the events they emit, so the relay lives once here. The status is
committed before upstream answers, so every later failure travels as an event.
Callers must call `Class.run(...)`, not a detached `run`, since `run` builds `this`.
