# MessagesStream

`core/llm-server/server/anthropic/MessagesStream.js`

Runs one streaming Messages request: relays llama-server's chat-completions SSE
as the Anthropic Messages event stream.

## Methods

- `MessagesStream.run({ res, upstream, body, log })` (inherited from
  [TranslatedChatStream](../relay/TranslatedChatStream.md)) answers 200
  `text/event-stream` at once and writes each
  [MessagesStreamTranslator](MessagesStreamTranslator.md) event as
  `event: <type>\ndata: <json>\n\n`; a chunk carrying `error`, an upstream HTTP
  error or an unreachable upstream each become an `error` event, and the client
  closing early destroys the upstream request.
- `MessagesStream.parseLine(line)` (inherited) returns the parsed `data:`
  payload, or `null` for non-data lines, blanks, `[DONE]` and unparseable JSON.
- `_createTranslator(emit)` builds the MessagesStreamTranslator for the loaded model id.

## Why

The relay is shared with the Responses route; only the translator is Anthropic's.
The status is committed before upstream answers, so every later failure has to
travel as an SSE `error` event.
