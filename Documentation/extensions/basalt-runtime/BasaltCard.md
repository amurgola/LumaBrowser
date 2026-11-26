# BasaltCard

`extensions/basalt-runtime/BasaltCard.js`

Picks the NVIDIA card a Basalt build runs a model on.

## Methods

- `BasaltCard.pick(devices, build)`: from diagnostics-style CUDA devices
  (`{ name, memoryTotalMB, computeCapability }`, nvidia-smi order) the card of
  the build's most preferred generation with the most VRAM, the lowest index
  among equals, as `{ index, name, vramBytes, computeCapability }`; null when
  the build takes none of them.
- `BasaltCard.generationRank(device, build)`: the position of the device's
  generation in the build's `mainCards` ([BasaltCatalog](BasaltCatalog.md); 0
  is the preferred one), or `NOT_A_MAIN_CARD` (-1). The compute capability
  decides; a device with none (an old diagnostics snapshot) falls back to the
  generation's product names.
- `BasaltCard.noCardReason(build)`: the refusal text the installer and planner
  use, naming the build and the generations it takes.

## Why

`--gpu` takes nvidia-smi's numbering, which is the diagnostics device order, so
the position is the index to pass. Which cards count is the build's own list:
upstream's build takes compute capability 12.x only, and the LumaByte build
(from `v0.5.7-luma.1`) also 8.9 and 8.6. The newest generation wins before
VRAM does, because an RTX 50 card reads prompts about fourteen times faster
than an RTX 3090 with the same pack (measured 2026-11-25): on this PC both
builds pick the RTX 5090, and on a host with two RTX 3090s the LumaByte build
picks the first. A B200 (compute 10.0) and an A100 (8.0) are refused: the
engine has no code for them.
