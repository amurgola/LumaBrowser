# AnswerStream

`ide/webview/ui/AnswerStream.js`

The live turn's answer and reasoning. Text from the last fence or tool-call marker (```` ``` ````, `<tool_call`,
`<function`) on is held back until the bridge confirms it as prose (the turn moves on) or retracts it (`rollback`).

## Methods

- `new AnswerStream({ newAnswer, newReasoning })`: block factories.
- `reset()`, `pushAnswer(text)`, `rollback(chars)` (held text first, then painted text),
  `appendReasoning(text)` (returns the reasoning length), `sealAnswer()` (held text lands as prose first),
  `sealReasoning()`.
