# PartialOffloadSizer

`core/llm-server/server/launch/PartialOffloadSizer.js`

Sizes a partial GPU/CPU layer split (`-ngl N`) from the parsed GGUF header.

## Methods

- `PartialOffloadSizer.size({ gguf, modelBytes, mmprojBytes, contextSize, cacheTypeK, cacheTypeV, vramAvailableBytes, mtpEnabled, mtpHeadBytes = 0, drafterBytes = 0, flashAttnSupported, kvOnHost })`
  returns `{ ngl, layerCount, perLayerBytes, perLayerWeightBytes, kvPerLayerBytes, budgetBytes, mtpOverheadBytes, fixedOverheadBytes }`.
  - per layer = `modelBytes / blocks` + the average windowed KV per block (0 with `kvOnHost`);
  - budget = `(VRAM - fixed overhead - projector - draft branch) x SAFETY (0.9)`;
  - `ngl = floor(budget / per layer)`, at least 0, at most `blocks - 1`.

## Why

`-ngl N` puts N repeating blocks on the GPU; embeddings only move on a full
offload, which the full-offload path owns, so this never claims every layer and
the two estimators cannot disagree into an OOM. Spreading all weights over the
blocks over-counts slightly, the safe direction. The draft KV is one
full-attention block regardless of SWA, so it uses the undiscounted rate.
