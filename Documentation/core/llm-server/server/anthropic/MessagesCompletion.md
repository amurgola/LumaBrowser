# MessagesCompletion

`core/llm-server/server/anthropic/MessagesCompletion.js`

Runs one non-streaming Messages request against the local llama-server.

## Methods

- `MessagesCompletion.run({ res, upstream, body, log })` (inherited from
  [TranslatedChatCompletion](../relay/TranslatedChatCompletion.md)) posts `body`
  upstream and answers with [MessagesResponseTranslator](MessagesResponseTranslator.md)`.translate`.
  Failures answer in the Anthropic shape with type `api_error`:
  - upstream status >= 400: same status, upstream's message, logged as
    `messages upstream failed: <message>`;
  - 2xx with an unparseable body: 502 with the raw body;
  - unreachable or bad URL: 502 `Could not reach the local model server: ...`, logged;
  - upstream response stream error: 502 `upstream connection failed`.

Nothing is sent once headers have gone out.

## Why

The fetch-and-fail flow is shared with the Responses route; this class only
supplies the Messages reply (`_translate`) and error shape (`_sendError`).
