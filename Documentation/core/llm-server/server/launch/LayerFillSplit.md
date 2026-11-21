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
  - card budget = `(GpuOverhead.cardRoom(card) - per-card overhead) x CARD_SAFETY (0.98)` (the overhead is
    the fixed part plus the context scratch, see "Per-card overhead" below): read live, total less
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
published bandwidth when every card is known, else capacity. The safety factor
is below 1 because Windows pages into shared memory before a card is literally
full (31.9 of 32.6 GB did); it was 0.95 until 2026-11-20, see "CARD_SAFETY 0.98".
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

## Per-card overhead (2026-11-20)

Every card running layers holds a CUDA context and a compute buffer beside
its layers, and the buffer grows with the context and is larger when the
layers are split. `_cardOverhead(input)` is
[GpuOverhead](GpuOverhead.md)`.fixed` plus
[ContextScratchCost](ContextScratchCost.md)`.bytes({ ...input, split: true })`;
each card's budget is `(room - overhead) x CARD_SAFETY` less the extras, where
only the fixed 512 MiB used to come off. Each `perDevice` entry carries
`overheadBytes` (0 on a card left empty), so `bytes + overheadBytes` is what
the card should show once loaded.

Measured on a 5090 + 3090 before the change, with 1 GiB of headroom: the
5090 loaded 1.3 GiB (Qwen3.8-27B, 128k), 0.05 GiB (Magidonia-24B, 64k) and
0.9 GiB (Gemma-4-31B, 64k) above planned layers plus 512 MiB, and ended
within 1.4 GiB of full. `budgetTotal` (the expert offload's capacity check)
still takes only the fixed part off: that launch holds its compute room back
on its own.

## CARD_SAFETY 0.98 (2026-11-20)

The share of a card's budget the packer may fill went from 0.95 to 0.98. The
5% had been covering what the per-card plan left out; with the overhead and
the whole draft branch priced, it only pushed layers to the slow card. Three
real splits at 128k on a 5090 + 3090 (1 GiB of headroom, upstream b12600),
planned against loaded on the 5090 and on the 3090:

| model | split | 5090 | 3090 | 5090 in use |
|---|---|---|---|---|
| Qwen3.8-27B Q6 | 58 + 7 layers | 28.11 planned, 27.62 loaded | 4.13, 3.92 | 29.4 of 31.8 GiB |
| Magidonia-24B Q8 | 31 + 9 layers | 27.46, 27.54 | 9.15, 8.76 | 29.3 |
| Gemma-4-31B Q6 | 52 + 8 layers | 28.11, 27.98 | 6.20, 5.57 | 29.7 |

Qwen3.8-27B decoded at 125.7 tok/s before any of the changes (59 + 6 layers,
the 5090 loading 1.45 GiB over its plan), 113.2 with the accurate budget at
0.95 (56 + 9) and 123.7 at 0.98 (58 + 7).
