# HotswapWiring

`core/placement/service/HotswapWiring.js`

Connects the managed servers to the [HotswapCoordinator](../../shared/runtime/HotswapCoordinator.md).

## Methods

- `new HotswapWiring({ servers, hotswap, settingsDb })`.
- `wire()` registers each item's runtime server under its coordinator id
  (`llm`, `image-generate`, `image-edit`, `image-video`, `music`, `grounding`)
  with `{ stop, getState }` (`getState` reads `idle` when the status throws;
  servers without `stop` are skipped), then `applyPools()`.
- `applyPools(layout?)` `hotswap.configure(PlacementLayout.hotswapPools(layout))`,
  the stored layout when none is given. Errors are ignored.

## Why

Eviction is gated by pool membership, so registering every server is free and
a server outside every singularity is never evicted. Eviction is a plain
`stop()`, which works on any GPU backend. Music matters most: sgl-omni has no
RAM tier, so a pool is its only way to reclaim a busy card.
