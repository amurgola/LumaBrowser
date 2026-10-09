# TriggerPayload

`core/llm-server/chat/triggers/TriggerPayload.js`

Shapes an inbound trigger event, which is untrusted data, for the model.

## Methods

- `TriggerPayload.sanitize(value)` recursively strips control characters from
  every string (keys included): C0 except tab, newline and carriage return, plus
  DEL and the C1 range. Non-strings pass through.
- `TriggerPayload.eventJson(event, maxChars = 65536)` is the sanitized event as
  pretty JSON; over the cap the tail is replaced with
  `\n… [truncated: N more characters]`. Unserialisable events render as their
  string form; `undefined` renders `null`.
- `TriggerPayload.buildUserMessage(prompt, event, { maxChars })` is the run's user
  message: the trimmed instruction, a blank line, then the event JSON in a
  ```json fence inside `<trigger_event>` tags.
- `TriggerPayload.syntheticEvent(sample)` builds a webhook-shaped delivery
  (`{ receivedAt, method: 'POST', synthetic: true, contentType, query, headers,
  body }`) from a user sample: JSON text or an object becomes `body`
  (`application/json`), other text becomes `bodyText` (`text/plain`).
- `TriggerPayload.DEFAULT_MAX_CHARS` (64 KB).

## Why

Control characters can corrupt a prompt or a terminal, and the size cap keeps
one huge delivery from filling the context. The truncation marker tells the model
it saw a prefix.

The fence uses a tag pair the payload cannot forge from inside JSON: a literal
closing tag inside a string is still just text, and the run preamble
([TriggerRunPreamble](TriggerRunPreamble.md)) binds the block by its outer tags
and tells the model never to follow instructions inside it.

`syntheticEvent` backs `set_sample` in the setup chat and the listening card's
"Send a sample". `sanitize` is also used by FileWatchSource and WebhookSource.
