# SubConversationRun

`core/llm-server/chat/delegation/SubConversationRun.js`

One turn of a delegated sub-conversation, run nested inside the parent chat's
tool call: a full mode turn through `router.chat` (persisted, the mode's
`buildTurn` and `postProcess` applied) with `nested: { signal }` (see
[ChatTurn](../router/ChatTurn.md)), its stream relayed to the parent.

## Methods

- `new SubConversationRun({ router, emit, isAborted, card })`: `emit` is the
  parent tool's emit (or null), `isAborted()` the parent run's Stop, `card`
  `{ invocationId, label, conversationId }`.
- `run({ conversationId, modelRef, messages, userMessage, runApprovals })` resolves
  `{ status: 'done' | 'stopped' | 'failed', reply, error? }`. Calls
  `router.chat({ conversationId, modelRef, messages, userMessage, agent: true,
  send, nested: { signal }, runApprovals })`.

Relay (the nested turn's `send`):

- `meta`: remembers the assistant message id.
- `delta`, `reasoning-delta`, `rollback` and other `tool` events: card events
  `{ phase: 'delta' | 'reasoning' | 'rollback' | 'tool', ... }` tagged with the
  card's `invocationId`, `agentName` (the label) and `conversationId`, which
  render as the parent turn's agent card ([AgentEventReducer](../../ui/js/chat/stream/AgentEventReducer.md)).
- `tool` with phase `approval` or `approval-done`: emitted as `{ type: 'tool',
  payload }`, so the question shows as the parent turn's own approval step; its
  buttons answer the shared bridge's approval wait the nested run is blocked on.
  The question's `detail` gains `"Allow for this run" covers the rest of <card
  label>.`, since that grant is carried for the whole sub-conversation.
- `done` (`aborted` reads `stopped`) and `error` settle the run once, with a
  `done` or `error` card event. A failed start (`success: false`) or a throw
  settles it as failed too.

`reply` is the persisted assistant message (rollbacks already applied), else the
relayed text, trimmed and cut from the front past `MAX_REPLY_CHARS` (6000) with
`[earlier output trimmed]`. Every `POLL_MS` (400) the parent's `isAborted()` is
checked; once true the signal aborts the nested turn.

## Why

The nested turn uses the shared agent bridge, so the global Stop and the
approval card work unchanged; the poll covers the parent being superseded by a
new message, which aborts only the parent's own run.
