# TurnPrompt

`core/llm-server/chat/bridge/prompt/TurnPrompt.js`

Splits a turn's wire messages into the task and the history before it.

## Methods

- `TurnPrompt.from(messages, { nativeHistory = false })`: the last user
  message is the task; earlier user/assistant messages with content are the
  history.
- `prompt`: the task text. `priorTurns`: `[{ role, content }]` with
  `nativeHistory`, else null.
- `body()`: the flattened `User: ...` / `Assistant: ...` transcript, a blank
  line and `User: <task>`, or the bare task (native history or none).
