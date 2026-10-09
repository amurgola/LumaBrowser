# AgentEventRelay

`core/llm-server/chat/bridge/turn/AgentEventRelay.js`

Turns AgentRunner's loop events into the chat's.

## Methods

- `new AgentEventRelay({ hooks, mirror, trace, images, artifactStore,
  artifacts, conversationId, assistantMessageId })`; `handle(evt)` (bound).
  - `final-retracted`: retracts the iteration's streamed text.
  - `tool`: retracts, then (not for the malformed re-prompt) opens a trace
    entry and emits `run`.
  - `tool-result`: closes the trace entry (FIFO); a screenshot is queued for
    the next completion and saved as a `Screenshot` image artifact; emits
    `done` `{ tool, success, error, summary, artifact }`.
  - `compacting` / `compacted`: `onStatus` with `midTurn: true`.
  - `final`: a `cancel` card when the iteration had been suppressed as a call.
