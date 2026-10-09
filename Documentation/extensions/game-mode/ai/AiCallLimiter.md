# AiCallLimiter

`extensions/game-mode/ai/AiCallLimiter.js`

Per-game load bound: 2 calls in flight, 6 queued, an immediate refusal beyond, so a game loop firing per frame fails fast instead of piling onto a one-slot server.

## Methods

- `new AiCallLimiter({ maxInFlight, maxQueued })`; `acquire(id)` resolves true or false; `release(id)` hands the slot on; `load` the per-game Map (empty when idle).
