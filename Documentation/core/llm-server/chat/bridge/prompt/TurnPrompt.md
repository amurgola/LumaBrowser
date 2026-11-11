# TurnPrompt

`core/llm-server/chat/bridge/prompt/TurnPrompt.js`

Splits a turn's wire messages into the task and the history before it.

## Methods

- `TurnPrompt.from(messages, { nativeHistory = false, sentForms = null })`: the
  last user message is the task; earlier user/assistant messages with content
  are the history. With native history, `withSentForms(prior, rows)` replaces
  each prior user message whose text equals the next stored active user row's
  `content` by that row's durable form ([SentForm](SentForm.md): its own text
  plus any tool manuals it delivered), rows consumed in order. The per-reply
  blocks the turn was sent with (catalog, post-history prompt, clock, format
  reminder) are never replayed.
  [ToolCallReplay](ToolCallReplay.md)`.expand` then puts each earlier turn's
  tool calls back in front of its answer.
- `prompt`: the task text. `priorTurns`: `[{ role, content }]` with
  `nativeHistory`, else null.
- `body()`: the flattened `User: ...` / `Assistant: ...` transcript, a blank
  line and `User: <task>`, or the bare task (native history or none).
