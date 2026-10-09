# CudaDevicePicker

`core/shared/runtime/CudaDevicePicker.js`

The "most powerful card, only if free" placement policy over a list of CUDA
devices from [CudaDeviceProbe](CudaDeviceProbe.md).

## Methods

- `CudaDevicePicker.pick(devices, requiredBytes)` returns the chosen devices
  (empty only when `devices` is empty). Cards are ranked by free VRAM, then
  total VRAM, then index; unknown free VRAM sorts last.
  - With `requiredBytes > 0`: the first ranked card whose room fits the whole
    model; else the fewest ranked cards with room whose rooms sum to the need;
    else every card with room; else every card, ranked.
  - Without a size hint, one card: the first ranked card with at least
    `FREE_FRACTION` of its VRAM free; else the freest known card; else, when
    free VRAM is unknown everywhere, the card with most total VRAM.
- `CudaDevicePicker.cardRoomBytes(device, { reserveBytes })` returns free VRAM
  minus the reserve (default `PER_CARD_RESERVE_BYTES`), never negative. Unknown
  free VRAM is zero room.
- `CudaDevicePicker.PER_CARD_RESERVE_BYTES` (1 GiB, the launch planner's
  per-card reserve), `CudaDevicePicker.FREE_FRACTION` (0.8).

## Why

Ranking by free VRAM is the "only if free" part: a powerful card already
holding a model yields to an idle one. On an idle box the most powerful card is
also the freest, so it is chosen first.

Unknown free VRAM is zero room because a card that cannot be measured must not
attract a model. The server launcher and launch planner deliberately fall back
to total VRAM instead: they size a card the model will own after pinning, where
"free" would double-count the model being planned. That is a different question
and keeps a different answer rather than becoming a flag here.

VramCoordinator reuses `pick` on top of its reservation ledger (live free VRAM
debited by in-flight loads) so both paths share one policy.
