# CompactionGate

`core/llm-server/chat/router/CompactionGate.js`

Condenses an over-long conversation into one summary before a turn is dispatched, but only against a server already serving the turn's model.

## Methods

- `new CompactionGate({ llmServerService, db, contextWindow, compaction, complete })`.
- `maybeCompact(messages, modelRef, modeTurn, hooks = null, conversationId = null)`: returns the messages untouched when `SETTING` (`core.llmServer.chat.compaction`) is false, the mode says `compact: false`, there are fewer than 6 messages, `compaction.shouldCompact(messages, window)` (optional) says no, or the server is not ready. The window is `contextWindow.forRef(ref)`, else the local per-slot window, else 4096. Readiness: remote always; local needs a supervisor, a `ready` state (a `starting` one is polled every 500 ms for up to 20 s), not dirty, and the loaded model's stem equal to the ref's. Then `onStatus({ phase: 'compacting' })`, `compaction.compact(messages, { contextWindow, summarize })` where summarize is `complete({ messages, temperature: 0.2, modelRef, timeoutMs: 180000, trace: { conversationId, callType: 'compact' } })`, and on success `onStatus({ phase: 'compacted', removed, contextWindow })`. Never throws.

## Why

Compaction shipped off because its pre-dispatch round trip started a cold llama-server, timed out mid-load and left it dirty. Only a server already on this model has the warm prefix that makes the summary cheap.
