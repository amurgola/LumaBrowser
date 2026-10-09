# AutoVramPlacement

`core/shared/runtime/vram/AutoVramPlacement.js`

The automatic first-come-first-serve placement policy of
[VramCoordinator](../VramCoordinator.md), applied to ledger-debited cards.

## Methods

- `AutoVramPlacement.place(devices, { requiredBytes, allowSplit })` returns
  `{ devices: index[], offloadToCpu }`. Room is free VRAM minus
  `CudaDevicePicker.PER_CARD_RESERVE_BYTES` (1 GB).
  - With a positive size and `allowSplit === false` (images): the roomiest card
    that fits; else offload onto the card with the most free VRAM.
  - Otherwise: [CudaDevicePicker](../CudaDevicePicker.md)`.pick` (one card, or
    the fewest that fit). With a size whose picked room falls short: offload
    onto the card with the most free VRAM (or keep the pick if none is known).
- `AutoVramPlacement.cudaDeviceFor(placed, cardCount)` null when every card is
  chosen without offload (the default spread, so the planner budgets the whole
  box), else the indexes joined by commas, or null for none.

## Why

sd.cpp cannot shard one model across cards, so image roles go straight from one
card to RAM; llama.cpp splits cleanly, so the LLM may take several. The offload
pin goes to the emptiest card because that is where the compute buffers fit.
