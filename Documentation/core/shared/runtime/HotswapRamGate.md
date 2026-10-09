# HotswapRamGate

`core/shared/runtime/HotswapRamGate.js`

Decides whether system RAM can hold a hotswap pool.

## Methods

- `HotswapRamGate.evaluate({ ramTotalBytes, poolBytes, inFlightCopy = true })`
  returns `{ poolBytes, largest, reserveBytes, requiredBytes, viable }`, where
  the input `poolBytes` is an array of model sizes and the output `poolBytes` is
  their sum. `requiredBytes = sum + (inFlightCopy ? 2 x largest : 0) + reserve`;
  `viable` is `ramTotalBytes >= requiredBytes` (inclusive). Missing or falsy
  sizes count as 0; a missing RAM total counts as 0, so it fails closed.
- `HotswapRamGate.ramReserveBytes(ramTotalBytes)` returns
  `max(16 GB, floor(15% of total))`.
- `HotswapRamGate.RESERVE_FLOOR_BYTES` (16 GB), `HotswapRamGate.RESERVE_FRACTION`
  (0.15), `HotswapRamGate.GB`.

## Why

Hotswap keeps several models parked in RAM and pages one at a time onto a fast
GPU. It is only viable when RAM holds the whole pool, plus an in-flight copy of
the largest member (during a swap the outgoing copy is still resident while the
incoming one is staged), plus a reserve for the OS.

`inFlightCopy: false` is for a cpu-moe LLM: its weights are RAM-resident either
way, and a swap only re-uploads the small resident share, so the `2 x largest`
term does not apply. It is one named boolean, not a flag bag, because it is the
only reasoned divergence.

Approximate model sizes are fine: the gate only has to get the order of
magnitude right (disable on a 32 GB box, enable on a 192 GB one).

The formula used to be computed separately in PlacementService and autoPlanner,
with one copy commented "mirrored from" the other. RamPinService also uses the
reserve.
