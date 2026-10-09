# DraftBranchCost

`core/llm-server/server/launch/DraftBranchCost.js`

Prices the VRAM a speculative draft branch adds to a launch.

## Methods

- `DraftBranchCost.bytes({ modelBytes, kvPerLayer, draftKvPerLayer?, drafterBytes = 0, mtp = false, mtpHeadBytes = 0 })`:
  - `mtp`: `mtpHeadBytes + MTP_BRANCH_FIXED` (head bytes are 0 when grafted, since
    they are already in the weights);
  - otherwise draft weights (`drafterBytes`, or `max(WEIGHT_FLOOR, 6% of modelBytes)`)
    + one block of draft KV (`draftKvPerLayer` when given, else `kvPerLayer`) +
    `SCRATCH` (256 MiB).
- `MTP_BRANCH_FIXED` (2.2 GiB), `WEIGHT_FRACTION` (0.06), `WEIGHT_FLOOR` (1.5 GiB),
  `SCRATCH`, `GIB`.

## Why

The MTP branch was measured on Qwen3.8-27B-UD-Q6_K_M (5090, CUDA 13, FA on):
3100 / 3303 / 3187 MiB at 8k / 32k / 65k. It is flat in context and about 2 GB
more than the head's own bytes; the older "one KV layer + 256 MB" model
under-charged, and on Windows an over-committed card spills into shared memory
and decodes at RAM speed. The DFlash path keeps the older formula because its
constants were measured against that drafter, which really keeps a per-token cache.
