# GpuOverhead

`core/llm-server/server/launch/GpuOverhead.js`

The fixed VRAM costs every llama.cpp GPU launch pays besides weights and KV.

## Methods

- `GpuOverhead.fixed(flashAttnSupported)`: `FIXED` (512 MiB) with flash
  attention, `FIXED_NO_FLASH_ATTN` (1 GiB) without.
- `PER_CARD_RESERVE` = [CudaDevicePicker](../../../shared/runtime/CudaDevicePicker.md)`.PER_CARD_RESERVE_BYTES` (1 GiB).
- `NO_HEADER_FACTOR` (1.2): weights x 1.2 when the header could not be read.

## Why

The reserve covers compositor, driver and the KV tail per card, and is the same
number the budget card and the CUDA pin use, so it is imported rather than
re-declared. The fixed cost exists the moment one layer is offloaded (CUDA
context, cuBLAS workspaces, graph scratch); flash attention keeps it near-constant
with context, while without it the score matrix grows, covered by a flat bump.
