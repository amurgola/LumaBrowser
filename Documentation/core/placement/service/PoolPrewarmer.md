# PoolPrewarmer

`core/placement/service/PoolPrewarmer.js`

Reads every hotswap pool model file once so it sits in the OS page cache before
the first swap.

## Methods

- `new PoolPrewarmer({ poolModels, openStream? })`; `poolModels.files()` gives the
  paths ([PoolModels](PoolModels.md)); `openStream` defaults to `fs.createReadStream`.
- `async prewarm()` streams each file to its end in `CHUNK_BYTES` (8 MB) reads,
  discarding the data; a read or open error moves on. A call while one runs
  returns at once.
- `prewarmInBackground()` fire-and-forget form; errors are swallowed.

## Why

Loaders then read from RAM, not disk. The RAM gate guarantees ample free RAM,
so the clean file-backed pages stay resident across swaps. No driver or RAM
disk is involved.
