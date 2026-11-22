# BasaltCard

`extensions/basalt-runtime/BasaltCard.js`

Picks the NVIDIA Blackwell card Basalt runs on.

## Methods

- `BasaltCard.pick(devices)`: from diagnostics-style CUDA devices
  (`{ name, memoryTotalMB, computeCapability }`, nvidia-smi order) the
  Blackwell card with the most VRAM, the lowest index among equals, as
  `{ index, name, vramBytes, computeCapability }`; null when there is none.
- `BasaltCard.isBlackwell(device)`: compute capability major 12; a device with
  no compute capability (an old diagnostics snapshot) falls back to
  [BasaltCatalog](BasaltCatalog.md)`.BLACKWELL_NAME_PATTERN`.
- `NO_CARD_REASON`: the refusal text the installer and planner use.

## Why

Basalt's main card must be sm_120 and `--gpu` takes nvidia-smi's numbering,
which is the diagnostics device order, so the position is the index to pass.
On this PC that picks the RTX 5090 and never the RTX 3090. A B200 (compute
10.0) is not sm_120 and is refused.
