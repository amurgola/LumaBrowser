# HardwareText

`core/llm-server/ui/js/setup/HardwareText.js`

The one hardware line every onboarding screen shows.

## Methods

- `HardwareText.hardwareLine(hw)`: each GPU with its own memory, then RAM:
  `'RTX 5090 (32 GB) + RTX 3090 (24 GB), 93 GB RAM'`. Without `gpus` it uses
  `gpuName`/`vramTotalBytes`, else "No dedicated graphics card"; `''` for no
  hardware info. Earlier screens summed cards under one name.
- `HardwareText.shortGpuName(raw)` drops NVIDIA/GeForce, AMD/Radeon and Intel
  prefixes and (TM)/(R) marks.

## Globals

None.
