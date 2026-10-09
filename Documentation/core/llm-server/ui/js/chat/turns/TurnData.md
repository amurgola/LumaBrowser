# TurnData

`core/llm-server/ui/js/chat/turns/TurnData.js`

Reads a message's optional parts the same way for the live turn (on the message)
and a reloaded row (the persisted `toolCalls` trace).

## Methods

- `TurnData.tools(m)`, `TurnData.artifacts(m)`, `TurnData.imageArtifacts(m)`,
  `TurnData.agentRuns(m)`.
- `TurnData.hasReasoning(text)`: fence-only reasoning counts as none.
