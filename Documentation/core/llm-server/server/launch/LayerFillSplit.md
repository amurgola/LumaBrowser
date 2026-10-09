# LayerFillSplit

`core/llm-server/server/launch/LayerFillSplit.js`

The fill-order `--tensor-split` for a plain multi-GPU layer split: fastest card first.

## Methods

- `LayerFillSplit.compute({ perGpu, gguf, contextSize, cacheTypeK, cacheTypeV, kvOnHost, swaFull, modelBytes, extraBytes = 0, flashAttnSupported, layersOnGpu })`
  returns `{ ratio, perDevice: [{ index, name, layers, bytes, budgetBytes }] }` or `null`
  (incomplete input, fewer than two cards, or the layers do not pack).
  - card budget = `(total - max(1 GiB reserve, already-resident bytes) - fixed overhead) x CARD_SAFETY (0.95)`,
    less `extraBytes` (projector, draft branch) on device 0, llama.cpp's main GPU;
  - layer cost = `modelBytes / blocks` + [KvCacheSizer](KvCacheSizer.md)`.atLayer`;
  - packs the last `layersOnGpu` blocks contiguously in device order; a device with
    faster cards after it takes layers only while those cannot hold the rest.
- `LayerFillSplit.describe(layerFill)`: `<name> takes N layers ≈ X of Y budget, ...` for notes.

## Why

llama.cpp's default splits by card size, so a 32 + 24 GB pair lands about 57/43
whatever the model needs. Decode in a layer split is a pipeline, each card's time
its share of layers over its own bandwidth, so the fast card should hold all it
can (observed: 19.7 GB / 16.6 GB with a third of the 5090 empty). Ranking is by
published bandwidth when every card is known, else capacity. 0.95 because Windows
pages into shared memory before a card is literally full (31.9 of 32.6 GB did).
One byte of tolerance absorbs summation-order ULPs on the last layer.
