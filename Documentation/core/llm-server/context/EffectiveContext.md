# EffectiveContext

`core/llm-server/context/EffectiveContext.js`

The one per-slot context window every consumer reads: the composer's token
meter, the compaction trigger, the agent's page and tool budgets, the sharing
host's model inventory and code mode.

## Methods

- `EffectiveContext.resolve({ status, defaults })` returns
  `{ contextWindow, ctxPerSlot, slots, source }`:
  - `status` is the runtime server's `getStatus()`. In `ready` or `starting`
    with a plan whose `contextSize` is positive: `source: 'plan'`, the plan's
    `contextSize`, `maxConcurrent` slots and `ctxPerSlot` (derived as
    `floor(contextSize / slots)` when missing).
  - otherwise `source: 'defaults'`: the persisted `contextSize` (else
    `LaunchPlanner.DEFAULT_CONTEXT`, 4096) divided by the persisted
    `maxConcurrent`, never below 1.
- `EffectiveContext.clampSlots(n)` floors to an integer, at least 1.
- `EffectiveContext.LIVE_STATES` `['ready', 'starting']`.

## Why

Bug M4: the planner computes the authoritative `ctxPerSlot` (the request clamped
to the native max, divided by the slots the runtime honours), but nothing read
it; each consumer re-derived its own number from the unclamped defaults.
`getStatus()` keeps the last plan after a stop, hence the state gate.
