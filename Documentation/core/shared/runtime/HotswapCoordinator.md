# HotswapCoordinator

`core/shared/runtime/HotswapCoordinator.js`

Single-occupancy enforcement for the singularity pools of the
[placement layout](PlacementLayout.md).

## Methods

- `HotswapCoordinator.shared` the process-wide instance every service registers with.
- `new HotswapCoordinator({ sleep })` (`sleep` injectable for tests).
- `configure(pools, { vramWaitMs, cardFreeReader })` replaces all pools.
  `pools` is `[{ id, card, members: serverId[] }]`, normally
  `PlacementLayout.hotswapPools(layout)`. Pools with fewer than 2 members or a
  non-integer card are ignored; a missing id becomes `pool_<card>`. A pool id
  that survives keeps its resident. `vramWaitMs` (default 12000) bounds the
  post-eviction VRAM wait; `cardFreeReader(card) -> { free, total } | null`
  replaces the live probe.
- `register(serverId, { stop, getState })` ignored without `stop`; `getState`
  defaults to `() => 'idle'`.
- `acquire(serverId)` resolves the pool's card after stopping every other live
  member of the same pool (state not `idle`/`stopped`; an unreadable state counts
  as live) and, if anything was stopped, waiting for the card's VRAM
  ([VramReleaseWaiter](placement/VramReleaseWaiter.md)). Resolves `null` for a
  server in no pool. Serialised per pool; a throwing `stop` does not wedge it.
- `release(serverId)` clears the resident pointer if that server holds it.
- `sharePool(a, b)` true when both are in one pool (never co-resident).
- `isEnabled()` true when any pool is configured.
- `snapshot()` returns `{ enabled, pools: [{ id, card, members, resident }], servers }`.

## Why

A singularity holds models that share one GPU but cannot be co-resident.
This deliberately inverts VramCoordinator's "never evict" rule, but only inside
a configured pool and only on that pool's card. Pools on different cards swap
independently, each with its own promise chain and resident pointer.

Swaps are fast when RAM is large: the model file stays in the OS page cache,
so a reload is a PCIe upload rather than a disk read. This class does not
manage the cache. Evicting the LLM drops its KV cache, so the next chat turn
re-processes the prompt; image models reload cleanly.
