# VramWatchdog

`core/llm-server/server/VramWatchdog.js`

Watches free VRAM on the cards a resident model sits on and warns the LLM tab
when something else eats the reserve the launch planner held back. Optionally
unloads an idle server after a critical dwell.

## Methods

- `new VramWatchdog(options)`, every option optional:
  - `sample()` rows `{ index, name?, totalBytes, freeBytes }` (default
    `NvidiaSmi.queryGpus()`); rows without positive `totalBytes` are dropped;
  - `ledger()` the claims ledger (default `VramCoordinator.shared.snapshot()`);
  - `reserveBytes` a number, or `(card) => bytes` called with
    `{ index, name, totalBytes }` (default `CudaDevicePicker.PER_CARD_RESERVE_BYTES`, 1 GiB);
  - `isLoaded()` (default true), `isIdle()` (default false), `unloadEnabled()`
    (default false), `unload(reason, info)`, `emit(type, payload)`, `now()`, `log`;
  - `intervalMs` 5000, `confirmSamples` 2, `dwellMs` 30000, `ownLoadGraceMs` 15000.
- `start()` true when polling began: refused while running, unavailable or not
  loaded. Samples at once, then every interval (timer unref'd).
- `stop()` stops polling and resets every card's pressure state.
- `tick()` one sample; never rejects; a tick already in flight makes it a no-op.
- `dismiss(card)` silences the card's current band until the band changes and
  emits `vram-pressure`; false for a normal or unknown card.
- `getState()` `{ available, running, intervalMs, lastSampleAt, unloads, cards }`,
  cards sorted by index as [WatchedCard](vram-watchdog/WatchedCard.md) views.
- `isRunning()`.
- Statics: `DEFAULT_INTERVAL_MS`, `DEFAULT_CONFIRM_SAMPLES`, `DEFAULT_DWELL_MS`,
  `DEFAULT_OWN_LOAD_GRACE_MS`, `UNAVAILABLE_AFTER_EMPTY` (3).

## Events

- `vram-pressure` `{ card, name, totalBytes, freeBytes, reserveBytes, band, since, dismissed, ownLoad, prevBand }`
  on every committed band change and on dismiss.
- `vram-unload` the card view plus `reason: 'vram-pressure'`, just before `unload` runs.

## How a sample works

1. Only cards in the ledger are watched ([LedgerCards](vram-watchdog/LedgerCards.md));
   an empty ledger watches every card.
2. Our own load is not pressure: while a claim on the card is still loading,
   and for the grace after a claim lands or a new claim stamp appears, the card
   is `ownLoad` and its samples neither escalate nor emit.
3. The band ([VramBand](vram-watchdog/VramBand.md)) commits only after
   `confirmSamples` agreeing samples, in both directions, so one spike never
   flaps the banner.
4. Early unload, when enabled: once per critical episode, after the dwell, and
   only while the server is idle. A failing unload is logged and swallowed.

Three empty samples in a row (no NVIDIA card) mark the watchdog unavailable and
stop it for good.

## Why

The planner sizes a model against free VRAM once, at start. A browser tab with
WebGL, a game or another app can then eat the headroom the KV cache and
compositor rely on, and the first sign used to be a stalled generation.
