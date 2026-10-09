# PlacementSlotInfo

`core/placement/service/PlacementSlotInfo.js`

Where each managed model actually loaded and in what mode.

## Methods

- `new PlacementSlotInfo({ servers, gpu, vram })`.
- `build()` -> `{ llm, imageGenerate, imageEdit, imageVideo, music, grounding }`,
  each `{ modelId, state, devices, deviceNames, offloadToCpu, vaeTiling }`.
  `devices` is the ledger claim's card list; `deviceNames` the matching CUDA
  card names (null for an unknown index). For non-LLM items `modelId`,
  `offloadToCpu` and `vaeTiling` come from the live launch plan. The LLM uses
  its file label, the ledger's `offloadToCpu`, and `vaeTiling: false`. A failing
  ledger or probe reads as empty.

## Why

The test's timing alone cannot say why a slot was slow; a RAM-offloaded slot,
or one pinned to a slow card while the flagship sits idle, shows up here.
