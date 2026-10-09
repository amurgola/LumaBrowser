# ThinkingText

`core/llm-server/ui/js/chat/turns/ThinkingText.js`

The reasoning pane's summary: a running token estimate so a long think never
looks frozen while collapsed.

## Methods

- `ThinkingText.summary(text, streaming)`: "Thinking…", "Thinking… 1.2k tokens",
  "Thought for 340 tokens".
- `ThinkingText.approxTokens(text)` (4 characters per token, rounded),
  `ThinkingText.tokens(n)`.
