# ThinkingText

`core/llm-server/ui/js/chat/turns/ThinkingText.js`

The reasoning pane's summary: how long the model has been thinking and a token
count, so a long think never looks frozen while collapsed.

## Methods

- `ThinkingText.summary(text, streaming, facts?)`: "Thinking…",
  "Thinking… 12s · 1.2k tokens", "Thought for 1m 05s · 73 tokens",
  "Thought for 340 tokens". `facts.elapsedMs` leads once it is a second or
  more (`MIN_ELAPSED_MS`); `facts.tokens`, the provider's reasoning token
  count when it reported one, replaces the estimate from the text.
- `ThinkingText.approxTokens(text)` (4 characters per token, rounded),
  `ThinkingText.tokens(n)`, `ThinkingText.elapsed(ms)`
  ([ToolCardText](ToolCardText.md)`.elapsed`, or `''` under a second).

## Why

"Thought for 1.2k tokens" told the user how much, not how long; every other
chat client leads with the seconds, which is what a person waiting feels.
The estimate stays because llama.cpp reports no split between reasoning and
answer tokens; Anthropic and OpenAI do, in `usage.completion_tokens_details`.
