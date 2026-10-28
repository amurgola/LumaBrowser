# RunProgress

`core/llm-server/chat/bridge/turn/RunProgress.js`

Where every live agent run is in its step budget, for whoever shows it outside
the chat: the desktop activity island says "Step 7 of 24, 42 s"
([RunPresence](../../../../../extensions/desktop-integration/features/agent-run/RunPresence.md)).
Owned by [AgentChatBridge](../../AgentChatBridge.md) (`runProgress`,
`onRunProgress`); [AgentEventRelay](AgentEventRelay.md) reports each
`iteration` event of the loop and [BridgeRun](../BridgeRun.md) the end of the
run, however it ended.

## Methods

- `new RunProgress({ now? })`.
- `report({ conversationId, iteration, maxIterations })` -> the progress object
  listeners got: `{ conversationId, iteration, maxIterations, startedAt
  (the first report's time), elapsedMs, done: false }`.
- `end(conversationId)` -> false when never reported; listeners get the same
  object with `done: true`.
- `live`: the running runs with their `elapsedMs`.
- `subscribe(listener)` -> unsubscribe; a throwing listener is ignored.
