# MemoryBandwidth

`core/llm-server/MemoryBandwidth.js`

Resolves GPU and system RAM memory bandwidth in GB/s, with provenance.

## Methods

- `MemoryBandwidth.tableGpuBandwidth(name)` is the published peak for a GPU
  name substring match, or 0 when unrecognised.
- `MemoryBandwidth.resolveGpuBandwidth(device)` takes
  `{ name, totalBytes, bandwidthGbps }` and returns `{ gbps, source }` where
  source is `reported`, `table` or `floor`.
- `MemoryBandwidth.resolveRamBandwidth(memory, platform = process.platform)`
  takes `diagnostics.memory` (with the optional per-DIMM `modules` probe) and
  returns `{ gbps, source }` where source is `modules` or `floor`.
- Constants: `GPU_BANDWIDTH_GBPS`, `GPU_BANDWIDTH_FLOOR`,
  `INTEGRATED_GPU_FLOOR_GBPS`, `RAM_CHANNELS_MAX`, `RAM_FLOOR_GBPS`,
  `APPLE_UNIFIED_FLOOR_GBPS`.

## Why

Decode is memory-bandwidth bound: every token streams the active weights and
KV history through the bus once. Three consumers share these facts: the
`--tensor-split` ratio, the fill-order layer split (fastest card first) and
the analytic decode estimate.

GPU resolution order: a reported figure (no probe fills it yet; the slot is
for a future clock x bus-width probe), the published table (most specific
needle first, so `3090 ti` precedes `3090`), then a floor. Integrated GPUs get
50 GB/s; discrete cards get the low end of their class by VRAM size. Erring
slow is safe because ranking between models on one device depends only on
their demand.

RAM is channels x 8 bytes x MT/s, the slowest DIMM setting the clock. Channel
count is never probed, so two (one with a single DIMM) is assumed, which
under-estimates workstations, the safe direction. Without speeds a DDR-type
floor applies. Apple Silicon always reports the unified-memory base floor.
