# DraftBranchCost

`core/llm-server/server/launch/DraftBranchCost.js`

Prices the VRAM a speculative draft branch adds to a launch.

## Methods

- `DraftBranchCost.bytes({ modelBytes, kvPerLayer, draftKvPerLayer?, drafterBytes = 0, mtp = false, mtpHeadBytes = 0, draftN = 0, recurrentLayers = 0 })`:
  - `mtp`: `mtpHeadBytes + MTP_BRANCH_FIXED` (head bytes are 0 when grafted, since
    they are already in the weights);
  - otherwise draft weights (`drafterBytes`, or `max(WEIGHT_FLOOR, 6% of modelBytes)`)
    + one block of draft KV (`draftKvPerLayer` when given, else `kvPerLayer`) +
    `SCRATCH` (800 MiB) + `recurrentCheckpoints(draftN, recurrentLayers)`:
    `draftN * recurrentLayers * RECURRENT_STATE_PER_LAYER_TOKEN` (2.8 MiB), the
    recurrent-state copies a hybrid target keeps while it verifies a block.
- `MTP_BRANCH_FIXED` (2.2 GiB), `WEIGHT_FRACTION` (0.06), `WEIGHT_FLOOR` (1.5 GiB),
  `SCRATCH`, `GIB`.

## Why

The MTP branch was measured on Qwen3.8-27B-UD-Q6_K_M (5090, CUDA 13, FA on):
3100 / 3303 / 3187 MiB at 8k / 32k / 65k. It is flat in context and about 2 GB
more than the head's own bytes; the older "one KV layer + 256 MB" model
under-charged, and on Windows an over-committed card spills into shared memory
and decodes at RAM speed. The DFlash path keeps the older formula because its
constants were measured against that drafter, which really keeps a per-token cache.

## Drafter scratch (2026-11-20)

`SCRATCH` went from 256 to 800 MiB. A drafter file is a second model with a
context of its own: Qwen3.8-27B's DFlash2 drafter on a 5090 (b12600) held a
549 MiB compute buffer and about 300 MiB more for the second CUDA context.
The lower figure had been hidden by the host-resident input embeddings, which
the price counted as VRAM until the same day. `MTP_BRANCH_FIXED` was measured
as a difference between two loads and is unchanged.
