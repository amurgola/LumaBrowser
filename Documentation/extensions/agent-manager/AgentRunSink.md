# AgentRunSink

`extensions/agent-manager/AgentRunSink.js`

The bridge hooks of one agent run.

## Methods

- `new AgentRunSink(emit)`; `hooks` is the full AgentChatBridge hook set:
  `onDelta` -> `{ phase: 'delta', text }` and accumulates; `onReasoningDelta`
  -> `reasoning`; `onToolEvent` -> `tool`; `onArtifact` collects AND emits
  `artifact` (ignores id-less ones); `onContentRollback` removes retracted tool
  JSON; `onError` records the message.
- `fail(message)` keeps an earlier hook error.
- `result()` -> `{ text, error, artifacts }`.
