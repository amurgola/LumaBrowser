# GpuOverhead

`core/llm-server/server/launch/GpuOverhead.js`

The fixed VRAM costs every llama.cpp GPU launch pays besides weights and KV.

## Methods

- `GpuOverhead.fixed(flashAttnSupported)`: `FIXED` (512 MiB) with flash
  attention, `FIXED_NO_FLASH_ATTN` (1 GiB) without.
- `PER_CARD_RESERVE` (getter) = [CudaDevicePicker](../../../shared/runtime/CudaDevicePicker.md)`.PER_CARD_RESERVE_BYTES`,
  the user's [GpuHeadroom](../../../shared/runtime/GpuHeadroom.md) (default 1 GiB), read at call time.
- `GpuOverhead.cardRoom(card, { cachedResident = 0 })`: the bytes a launch may plan
  into on one card. With `card.occupiedBytes` (a live reading) it is
  `total - occupied - headroom`; without, `total - max(headroom, cachedResident)`.
  Never negative.
- `NO_HEADER_FACTOR` (1.2): weights x 1.2 when the header could not be read.

## Why

The reserve is free margin left on top of whatever already occupies a card (display,
other apps, other servers) when that is known from a live reading; from a cached
snapshot it has to stand in for that occupancy too, as it always did. It is the same
number the CUDA pin and the VRAM-pressure watchdog use, so it is imported rather than
re-declared. The fixed cost exists the moment one layer is offloaded (CUDA
context, cuBLAS workspaces, graph scratch); flash attention keeps it near-constant
with context, while without it the score matrix grows, covered by a flat bump.
