# LocalSlotReclaimer

`core/llm-server/chat/router/LocalSlotReclaimer.js`

After a cancelled local turn, makes sure a possibly wedged llama-server slot cannot linger.

## Methods

- `new LocalSlotReclaimer({ llmServerService, isLocalTurnLive, graceMs = GRACE_MS })`.
- `reclaim()`: `runtimeServer.markDirty()`, then after `GRACE_MS` (4 s, unref'd) `ensureStopped()` unless a local turn is live, the server is no longer dirty, or it is not `ready`. No supervisor is a no-op.
- `cancelPending()`: a new turn takes over.

## Why

Aborting only tears the HTTP stream down; a runaway generation may never yield, pinning the slot and its VRAM. Dirty makes the next local turn restart clean; the delayed stop reclaims VRAM for a cancel the user walks away from.
