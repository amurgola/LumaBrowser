# LayerFillSplit

`core/llm-server/server/launch/LayerFillSplit.js`

The fill-order `--tensor-split` for a plain multi-GPU layer split: the fastest card takes
all it can. On cards of different speeds it can also name the device order, slowest first.

## Methods

- `LayerFillSplit.compute({ perGpu, gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, swaFull, modelBytes, extraBytes = 0, perCardExtraBytes = 0, flashAttnSupported, layersOnGpu, slowFirst = false })`
  returns `{ ratio, perDevice: [{ index, name, layers, bytes, budgetBytes }] }` (plus
  `order` and `mainDevice` with a slowest-first order) or `null` (incomplete input, fewer
  than two cards, or the layers do not pack).
  - `slowFirst` (the runtime can name its device order, `RuntimeFlags.deviceOrder`): when
    the cards differ in speed and none is a borrowed RPC peer device, the result carries
    `order` (perGpu indices, slowest first, ties in device order) and `mainDevice` (the
    fastest card, last in `order`). Equal cards, or a peer device, keep device order and
    add neither field.
  - `perDevice` is always in perGpu order; `ratio` is in the order llama.cpp walks the
    devices (`order` when present). On a full offload the ratio's last non-empty entry is
    one higher than that card's layer count.
  - card budget = `(GpuOverhead.cardRoom(card) - fixed overhead) x CARD_SAFETY (0.95)`: read live, total less
    what already occupies the card less the GPU headroom; cached, `total - max(headroom, already-resident bytes)`,
    less `extraBytes` (projector, draft branch) on the main card (`mainDevice`, else device 0), less
    `perCardExtraBytes` (an expert offload's staged expert tensor and prompt activations,
    [MoeExpertPlan](MoeExpertPlan.md)`.perCardHoldBytes`) on every card;
  - layer cost = `modelBytes / blocks` + [KvCacheSizer](KvCacheSizer.md)`.atLayer`;
  - packs the last `layersOnGpu` blocks contiguously along the device order; a device with
    faster cards after it takes layers only while those cannot hold the rest.
- `LayerFillSplit.budgetTotal(perGpu, flashAttnSupported, perCardExtraBytes = 0)`: the sum of those
  card budgets, what a split can place; the expert plan caps a two-card cache at it.
- `LayerFillSplit.describe(layerFill)`: `<name> takes N layers ≈ X of Y budget, ...` for notes.

## Why

llama.cpp's default splits by card size, so a 32 + 24 GB pair lands about 57/43
whatever the model needs. Decode in a layer split is a pipeline, each card's time
its share of layers over its own bandwidth, so the fast card should hold all it
can (observed: 19.7 GB / 16.6 GB with a third of the 5090 empty). Ranking is by
published bandwidth when every card is known, else capacity. 0.95 because Windows
pages into shared memory before a card is literally full (31.9 of 32.6 GB did).
One byte of tolerance absorbs summation-order ULPs on the last layer.

Slowest first because llama.cpp puts the output layer on the last device and a draft
model shares that layer. With the fast card first the drafter became a two-card
context: on a 5090 + 3090 its scratch buffer on the 5090 grew from 549 MiB to 2.1 GiB,
which used up what the split had moved off, leaving 1.38 GiB free against a 2 GiB
headroom at 63 tok/s; slowest first measured 68 to 72 tok/s with 2.4 to 2.7 GiB free
(2026-11-18, Qwen3.8-27B Q6, DFlash drafter). Without a drafter both orders decode the
same (about 40 tok/s). The extra ratio unit exists because llama.cpp spreads the ratio
over the offloaded layers plus the output layer; a full offload's block counts leave that
layer out, and without the unit the first card got one block more than planned (62,3
put 63 blocks on it).
