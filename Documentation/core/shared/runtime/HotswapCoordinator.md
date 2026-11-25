# HotswapCoordinator

`core/shared/runtime/HotswapCoordinator.js`

Single-occupancy enforcement for the singularity pools of the
[placement layout](PlacementLayout.md).

## Methods

- `HotswapCoordinator.shared` the process-wide instance every service registers with.
- `new HotswapCoordinator({ sleep })` (`sleep` injectable for tests).
- `configure(pools, { vramWaitMs, cardFreeReader })` replaces all layout pools.
  `pools` is `[{ id, card, members: serverId[] }]`, normally
  `PlacementLayout.hotswapPools(layout)`. Pools with fewer than 2 members or a
  non-integer card are ignored; a missing id becomes `pool_<card>`. A pool id
  that survives keeps its resident. `vramWaitMs` (default 12000) bounds the
  post-eviction VRAM wait; `cardFreeReader(card) -> { free, total } | null`
  replaces the live probe.
- `register(serverId, { stop, getState, suspend? })` ignored without `stop`;
  `getState` defaults to `() => 'idle'`. `suspend()` is optional: it resolves
  `{ suspended: true, freed: true }` when the server released its VRAM while
  staying alive, `{ suspended: true, freed: false }` when it held none between
  requests (nothing will come back, so no wait), and a falsy value,
  `{ suspended: false }` or a throw when it cannot; then `stop()` runs as before.
  A missing `freed` counts as `true`.
- `acquire(serverId)` resolves the pool's card after evicting every other live
  member of the same pool (state not `idle`/`stopped`; an unreadable state counts
  as live): `suspend()` first when the member has one, `stop()` otherwise. Then
  it waits for the card's VRAM ([VramReleaseWaiter](placement/VramReleaseWaiter.md))
  for as long as the evictions call for: the full `vramWaitMs` when any member
  was stopped, `SUSPEND_CONFIRM_MS` (2500, capped at `vramWaitMs`) when the only
  releases were suspends with `freed: true`, and no wait at all when every
  suspend held nothing or nothing was evicted. Resolves `null` for a server in no
  pool. Serialised per pool; a throwing `stop` or `suspend` does not wedge it.
- `reclaim(serverId)` the request paths' gate: on the pool's chain, when the
  server is `ready` and not the recorded resident (another member displaced it
  and it was suspended, so it never stopped), swaps it in as `acquire` does and
  resolves the card; otherwise resolves `null`. The check runs again inside the
  chain, so a burst of requests swaps once and a swap already queued is waited
  for. An unreadable state is not ready. Callers: `LLMServerService.reclaimCard`
  and `ImageServerService.reclaimCard`.
- `isPooled(serverId)` true when the server belongs to a pool (layout or round trip).
- `isDisplaced(serverId)` true when it is pooled and not the recorded resident.
- `swapOut(serverId, residentIds, card)` forms the one-round-trip pool
  `auto-swap` of `serverId` and `residentIds` on `card`, then `acquire(serverId)`
  (stops the live residents and waits for the card). The pool stays while the
  borrower (`serverId`) re-acquires; the first acquire by a resident evicts the
  borrower and ends the pool. Resolves `null`, forming nothing, when `card` is not
  an integer or any of them already belongs to a pool. `configure` keeps an
  open round trip unless the new layout pools one of its members (that pool then
  governs them): saving a layout mid swap used to drop it, and the chat model
  came back beside the image model it had made room for. Used by [ChatSwapOut](../../image-server/service/ChatSwapOut.md)
  through ImageSlotLaunch. The swap that ends a round trip stops the borrower
  instead of suspending it: once the pool is gone nothing would make a suspended
  borrower take the card back, and it would render beside the returned chat model.
- `release(serverId)` clears the resident pointer if that server holds it.
- `sharePool(a, b)` true when both are in one pool (never co-resident).
- `isEnabled()` true when any pool is configured.
- `snapshot()` returns `{ enabled, pools: [{ id, card, members, resident }], servers, suspended }`;
  `suspended` lists the members evicted by a suspend that are still alive and not resident.
- `configure` stops (in the background) any suspended member the new pools no
  longer include, for the same reason as the round trip end.

## Why

A singularity holds models that share one GPU but cannot be co-resident.
This deliberately inverts VramCoordinator's "never evict" rule, but only inside
a configured pool and only on that pool's card. Pools on different cards swap
independently, each with its own promise chain and resident pointer.

`swapOut` exists for a profile with no layout (ISSUES.md entry 12): on a 5090 +
3090 box the chat model filled both cards, the H3 image model was offloaded onto
the 3090 beside it and sd.cpp ran out of compute room. The round-trip pool gives
that one pairing singularity behaviour (image in, chat back) without writing a
layout, and ends so a later model that fits beside the chat model is not swapped.

Swaps are fast when RAM is large: the model file stays in the OS page cache,
so a reload is a PCIe upload rather than a disk read. This class does not
manage the cache. Evicting the LLM by a stop drops its KV cache, so the next
chat turn re-processes the prompt; image models reload cleanly.

Suspend skips the reload altogether. Two engines can release VRAM without
ending: Basalt sleeps (`POST /v1/sleep`, declared through its launch plan, see
[LlmRuntimeServer](../../llm-server/server/LlmRuntimeServer.md)) and wakes on its
next request in about 2 s, and an sd-server launched with `--offload-to-cpu`
(every pooled image slot, see [ImageLaunchPlanner](../../image-server/server/ImageLaunchPlanner.md))
holds only 0.5 to 1.3 GB between renders, so it is asleep already
([ImageRuntimeServer](../../image-server/server/ImageRuntimeServer.md) `suspend`).
A suspended server stays `ready`, so nothing would call `acquire` for it again:
every request path calls `reclaim` first. That also covers an engine that slept
on its own idle timer: the image acquire that took the card recorded the image
as resident, so the next chat turn finds the LLM displaced and reclaims.

The confirmation wait after a `freed: true` suspend: VramReleaseWaiter compares
readings of the 1 s nvidia-smi stream against a baseline read before the
eviction and returns as soon as the card shows the release (a 4 GB rise or 60 %
free). The engine has already released when it answers, so the only lag left is
the sample interval; 2.5 s covers two fresh samples. The full 12 s budget stays
for stopped members, whose memory the WDDM driver frees a beat after the exit,
and for a small model whose release is under 4 GB on a busy card, which would
otherwise burn the whole budget after every suspend.
