# TranslatedChatCompletion

`core/llm-server/server/relay/TranslatedChatCompletion.js`

Base class for one non-streaming request on a translated API. Subclasses:
[MessagesCompletion](../anthropic/MessagesCompletion.md),
[ResponsesCompletion](../responses/ResponsesCompletion.md).

## Methods

- `run({ res, upstream, body, log, context })` (static, builds the subclass it
  is called on) posts `body` through [UpstreamChatRequest](UpstreamChatRequest.md)
  and answers `res.json(this._translate(parsed))`. Failures go to `_sendError`:
  - upstream status >= 400: same status, upstream's message, logged as
    `<LOG_LABEL> upstream failed: <message>`;
  - 2xx with an unparseable body: 502 with the raw body;
  - unreachable or bad URL: 502 `Could not reach the local model server: ...`, logged;
  - upstream response stream error: 502 `upstream connection failed`.
  Nothing is sent once headers have gone out.
- `_translate(completion)` and `_sendError(status, message)` are abstract.
- Statics `UPSTREAM_GATEWAY_STATUS` (502) and `LOG_LABEL` (overridden per API).

## Why

The fetch-parse-fail flow is identical for every dialect; only the reply and
error shapes differ.
