# GpuLayerAssignment

`core/llm-server/server/decode/GpuLayerAssignment.js`

Maps each offloaded block to the GPU that holds it, for the decode estimate.

## Methods

- `GpuLayerAssignment.assign({ firstGpuLayer, blocks, perGpu, layerFill, cpuMoeSplit })`
  returns `owner[block]`: a device index for blocks `[firstGpuLayer, blocks)`,
  `-1` for blocks left on the CPU. Run lengths come from, in order:
  1. `layerFill.perDevice[i].layers` when it has one entry per GPU;
  2. `cpuMoeSplit`, a `"a,b,..."` tensor-split string, when it has one part per
     GPU and sums to the offloaded count;
  3. otherwise llama.cpp's default, proportional to each card's `totalBytes`
     with the remainder dealt round-robin from the first card.

  Planned counts that do not sum to the offloaded block count fall back to 3.

## Why

llama.cpp turns a split ratio into contiguous runs of layers per device, and a
layer's weights and KV live where the layer lives, so the decode estimate must
know which domain pays for which block.
