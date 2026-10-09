# MessagesTokenCount

`core/llm-server/server/anthropic/MessagesTokenCount.js`

Rough input-token estimate for `POST /v1/messages/count_tokens`.

## Methods

- `MessagesTokenCount.estimate(body)` sums the character length of `system`,
  each message's `content` and each tool (strings by length, anything else as
  JSON) and divides by [TokenEstimator](../../../shared/text/TokenEstimator.md)`.CHARS_PER_TOKEN`,
  rounding up.

## Why

Claude Code only uses count_tokens for context accounting, so the app-wide
ratio is enough and keeps budgets consistent with the rest of the app.
