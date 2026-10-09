# ReasoningRelay

`core/llm-server/chat/bridge/turn/ReasoningRelay.js`

Forwards reasoning tokens with a paragraph break at each iteration seam.

## Methods

- `new ReasoningRelay(hooks)`; `onToken(token)` (bound); `beginIteration()`.
  The first token of an iteration after earlier reasoning is preceded by
  `\n\n`; never leading. Consumer throws are swallowed.
