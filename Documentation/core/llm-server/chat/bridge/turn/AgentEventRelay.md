# AgentEventRelay

`core/llm-server/chat/bridge/turn/AgentEventRelay.js`

Turns AgentRunner's loop events into the chat's.

## Methods

- `new AgentEventRelay({ hooks, mirror, trace, images, artifactStore,
  artifacts, conversationId, assistantMessageId })`; `handle(evt)` (bound).
  - `final-retracted`: retracts the iteration's streamed text.
  - `tool`: retracts, then (not for the malformed re-prompt) opens a trace
    entry (with the loop's `callId`) and emits `run` `{ tool, params, callId?,
    batchSize?, batchIndex? }` (the batch fields only for a real batch).
  - `tool-result`: closes the trace entry (by `callId`, else FIFO); a
    screenshot is queued for the next completion and saved as a `Screenshot`
    image artifact; emits `done` `{ tool, success, error, summary, artifact,
    callId? }`.
  - `compacting` / `compacted`: `onStatus` with `midTurn: true`.
  - `final`: a `cancel` card when the iteration had been suppressed as a call.
