# PlacementLayout

`core/shared/runtime/PlacementLayout.js`

The schema of the unified model-placement layout (version 2) and its read-only
queries. Persistence is [PlacementStore](placement/PlacementStore.md);
item-to-device resolution is [PlacementResolver](placement/PlacementResolver.md).

## Shape

```
{ version: 2,
  resources: [{ id, kind: 'ram'|'gpu'|'gpu-group', devices: (int | 'r:<peer>:<idx>')[] }],
  singularities: [{ id, members: itemKey[], resource }],
  items: { llm, imageGenerate, imageEdit, imageVideo, music, grounding: null | { resource, split, vramCapBytes? },
           llmContext: { enabled, location: 'vram'|'ram' } },
  autoStart, autoStopMs }
```

## Methods

- Constants: `LAYOUT_KEY` (`core.placement.layout`), `RAM_ID` (`ram`),
  `ITEM_KEYS`, `SERVER_TO_ITEM`, `ITEM_TO_SERVER`, `DEFAULT_AUTO_STOP_MS`
  (15 min), `OFFLOAD_RESIDENT_BYTES` (8 GB).
- `gpuResourceId(card)` -> `g<card>`.
- `emptyLayout()` everything automatic, RAM lane only.
- `addSingularity(layout, card, members, id)` adds `g<card>` once and a
  singularity, in place; returns the layout.
- `singularityLayout(card, members = ['llm','imageGenerate'], id = 'auto-setup')`.
- `normalizeLayout(raw)` tolerant coercion: RAM lane exactly once and first;
  unknown resource kinds become `gpu` (`ram` for id `ram`); a `gpu-group` with
  fewer than 2 devices becomes `gpu`; local devices become integers, remote refs
  stay strings; singularity members must be known items, each claimed by the
  first singularity listing it; a split needs 2+ positive parts; `vramCapBytes`
  is kept (rounded) only without a split; `autoStopMs` floors, default 15 min.
- `resourceById(layout, id)`, `singularityFor(layout, itemKey)`,
  `effectiveResourceId(layout, itemKey)` (singularity resource wins),
  `orderedDevices(layout, resId)` (`[]` for RAM, null when unknown),
  `placedItems(layout)`.
- `hotswapPools(layout)` -> `[{ id, card, members: serverId[] }]` for each
  singularity with 2+ servers on a resource with a local card (the first local
  device). RAM, all-remote and dangling resources gate nothing.
- `remoteRefsFor(layout, serverId)` -> `[{ peerId, index, ref }]` in layout order.

## Why

One canvas replaced the old auto, manual and hotswap modes. Resources are
physical targets, singularities are swap pools, items say where each model
lands. Keeping the schema, its defaults and its queries in one class means
VramCoordinator and HotswapCoordinator agree on placement. `singularityLayout`
is built on `emptyLayout` so Automatic Setup never restates defaults (a key
added to `ITEM_KEYS` would otherwise be missed and coerced away).
