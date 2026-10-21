# VramWatchdog

`core/llm-server/server/VramWatchdog.js`

Watches free VRAM on the cards a resident model sits on and warns the LLM tab
when something else eats the reserve the launch planner held back. Optionally
unloads an idle server after a critical dwell. Readings come from the shared
[NvidiaSmiStream](../../shared/runtime/NvidiaSmiStream.md); the watchdog never
spawns a process of its own.

## Methods

- `new VramWatchdog(options)`, every option optional:
  - `sample()` a stream snapshot `{ rows, outcome }` or plain rows
    `{ index, name?, totalBytes, freeBytes }` (default: the stream's
    `refresh({ maxAgeMs: intervalMs })`); rows without positive `totalBytes`
    are dropped;
  - `stream` the NvidiaSmiStream (default `NvidiaSmiStream.shared`), started by
    `start()` only when `sample` is the default;
  - `ledger()` the claims ledger (default `VramCoordinator.shared.snapshot()`);
  - `reserveBytes` a number, or `(card) => bytes` called with
    `{ index, name, totalBytes }` (default `CudaDevicePicker.PER_CARD_RESERVE_BYTES`, 1 GiB);
  - `isLoaded()` (default true), `isIdle()` (default false), `unloadEnabled()`
    (default false), `unload(reason, info)`, `emit(type, payload)`, `now()`, `log`;
  - `intervalMs` 5000, `confirmSamples` 2, `dwellMs` 30000, `ownLoadGraceMs` 15000.
- `start()` true when polling began: refused while running or not loaded, never
  for lack of a card. Samples at once, then every interval (timer unref'd).
- `stop()` stops polling and resets every card's pressure state.
- `tick()` one sample; never rejects; a tick already in flight makes it a no-op.
- `dismiss(card)` silences the card's current band until the band changes and
  emits `vram-pressure`; false for a normal or unknown card.
- `getState()` `{ available, degraded, outcome: { kind, reason }, running,
  intervalMs, lastSampleAt, lastGoodAt, unloads, cards }`, cards sorted by index
  as [WatchedCard](vram-watchdog/WatchedCard.md) views.
- `isRunning()`.
- Statics: `DEFAULT_INTERVAL_MS`, `DEFAULT_CONFIRM_SAMPLES`, `DEFAULT_DWELL_MS`,
  `DEFAULT_OWN_LOAD_GRACE_MS`, `MISSING_RETRY_MAX_MS` (5 min).

## Events

- `vram-pressure` `{ card, name, totalBytes, freeBytes, reserveBytes, band, since, dismissed, ownLoad, prevBand }`
  on every committed band change and on dismiss.
- `vram-unload` the card view plus `reason: 'vram-pressure'`, just before `unload` runs.

## How a sample works

1. The reading is classified ([NvidiaSmiOutcome](../../shared/runtime/nvidia-smi/NvidiaSmiOutcome.md)).
   Anything but `ok` with at least one card row is a degraded sample: every
   card keeps its last committed band and reading, nothing is emitted, and the
   next good sample clears `degraded`. A throwing sampler is an `exit`-kind
   failure. Only a confirmed `missing` binary sets `available: false`; the
   watchdog keeps polling, doubling its delay from the interval up to
   `MISSING_RETRY_MAX_MS`, and comes back by itself when the binary appears.
2. Cards are keyed by the row's `index` (nvidia-smi's own), so a missing or
   malformed row never shifts a neighbour. Only cards in the ledger are watched
   ([LedgerCards](vram-watchdog/LedgerCards.md)); an empty ledger watches every card.
3. Our own load is not pressure: while a claim on the card is still loading,
   and for the grace after a claim lands or a new claim stamp appears, the card
   is `ownLoad` and its samples neither escalate nor emit.
4. The band ([VramBand](vram-watchdog/VramBand.md)) commits only after
   `confirmSamples` agreeing samples, in both directions, so one spike never
   flaps the banner.
5. Early unload, when enabled: once per critical episode, after the dwell, and
   only while the server is idle. A failing unload is logged and swallowed.

## Why

The planner sizes a model against free VRAM once, at start. A browser tab with
WebGL, a game or another app can then eat the headroom the KV cache and
compositor rely on, and the first sign used to be a stalled generation.

The watchdog used to spawn nvidia-smi every five seconds, read every failure as
"no cards", and after three empty samples refused to start again for the rest
of the session, so a hung nvidia-smi quietly disabled it. Now a bad reading is
a state it reports and recovers from.
