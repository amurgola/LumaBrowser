# VramReleaseWaiter

`core/shared/runtime/placement/VramReleaseWaiter.js`

Waits until a card's VRAM is reclaimed after an eviction.

## Methods

- `new VramReleaseWaiter({ readCardFree, sleep })`; `readCardFree(card)`
  defaults to the live CUDA probe.
- `read(card)` returns `{ free, total }` or null (null card, reader throws or
  cannot read).
- `wait(card, baselineFree, maxWaitMs)`:
  - returns at once when `maxWaitMs <= 0` or the card is null;
  - with no baseline, sleeps `min(1500, maxWaitMs)`;
  - otherwise polls every 400 ms until free VRAM is at least
    `baselineFree + 4 GB` or at least 60% of the card, then sleeps 350 ms more;
    an unreadable poll sleeps `min(1500, remaining)` and returns; gives up at
    `maxWaitMs`.
- `VramReleaseWaiter.readCardFree(card)` the default live reader.
- Constants `POLL_INTERVAL_MS` 400, `MIN_RISE_BYTES` 4 GB, `FREE_FRACTION` 0.6,
  `SETTLE_MS` 350, `BLIND_WAIT_MS` 1500.

## Why

The evicted child has exited, but the WDDM driver frees its VRAM a beat later;
loading the next model in that gap was a roughly 50% OOM. Image models are at
least 8 GB, so a 4 GB rise means a real reclaim.
