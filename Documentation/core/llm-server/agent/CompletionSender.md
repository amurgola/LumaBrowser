# CompletionSender

`core/llm-server/agent/CompletionSender.js`

Sends the agent loop's completions on the `ai-chat.navigator` slot.

## Methods

- `new CompletionSender(llm, { label, clock })`.
- `send(messages)`: `temperature 0.2`, `timeout min(300000, clock.remainingMs())`, `label`.
- `sendFirst(messages)`: `send`, and when it fails with an error containing
  `500`, `econnrefused`, `failed` or `not configured`, waits 3 s and sends once
  more (the server may not be up yet). A context overflow
  ([ContextOverflow](ContextOverflow.md)) is never retried this way: its error
  also reads "Chat request failed", and the same messages only fail again
  after the wait; overflow recovery answers it instead.
- `summarize(promptMessages)`: the compaction call, `timeout min(120000,
  max(1000, remaining))`, `purpose: 'compact'` so the LLM trace can tell it
  apart. Returns the text or null.
- `CompletionSender.SLOT_ID` (`'ai-chat.navigator'`).
