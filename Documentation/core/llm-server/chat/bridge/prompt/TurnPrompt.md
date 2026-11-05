# TurnPrompt

`core/llm-server/chat/bridge/prompt/TurnPrompt.js`

Splits a turn's wire messages into the task and the history before it.

## Methods

- `TurnPrompt.from(messages, { nativeHistory = false, sentForms = null })`: the
  last user message is the task; earlier user/assistant messages with content
  are the history. With native history, `withSentForms(prior, rows)` replaces
  each prior user message whose text equals the next stored active user row's
  `content` by that row's `sentContent` (the catalog, delivered manuals and
  reminder the model actually saw), rows consumed in order, so the request is
  a byte-identical extension of what the server's KV cache already holds.
- `prompt`: the task text. `priorTurns`: `[{ role, content }]` with
  `nativeHistory`, else null.
- `body()`: the flattened `User: ...` / `Assistant: ...` transcript, a blank
  line and `User: <task>`, or the bare task (native history or none).
