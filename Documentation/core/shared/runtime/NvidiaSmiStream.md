# NvidiaSmiStream

`core/shared/runtime/NvidiaSmiStream.js`

One long-lived nvidia-smi query loop shared by every VRAM reader: the
[VramWatchdog](../../llm-server/server/VramWatchdog.md), placement through
[CudaDeviceProbe](CudaDeviceProbe.md), the fit test's
[VramFootprint](../../llm-server/server/fit-test/VramFootprint.md) and
diagnostics. The child (`nvidia-smi --query-gpu=... -lms <interval>`, see
[NvidiaSmi](NvidiaSmi.md)) prints a block of card rows per interval; the newest
block is the cached snapshot. Nothing here blocks the main process.

## Methods

- `NvidiaSmiStream.shared` the module-level instance every consumer uses.
  `new NvidiaSmiStream(options)` builds a private one; every option is a test
  seam: `spawn(cmd, args, opts)`, `query(args)` (an `NvidiaSmi.query` result),
  `findOnDisk()`, `smiPath()`, `setSmiPath(p)`, `onPathChange(fn)`, `now()`,
  `log`, `intervalMs` (1000), `backoff { baseMs, maxMs, factor }`, `platform`.
- `start()` spawns the loop once; idempotent; false on macOS or when already
  running. The child is unref'd. Subscribes to `NvidiaSmi.onPathChange`, so a
  path published by diagnostics restarts the loop on the new binary.
- `stop()` kills the child, cancels every timer, unsubscribes. The last
  snapshot survives for late readers. `LLMServerService.shutdown` calls it.
- `snapshot()` synchronous, never spawns:
  `{ rows, at, ageMs, source, outcome, available, degraded, stale }`. `rows` are
  `{ index, busId, name, totalBytes, freeBytes, at }` sorted by nvidia-smi's own
  `index`, and may be the last good rows while degraded. `source` is `stream` or
  `oneshot`. `outcome` is an [NvidiaSmiOutcome](nvidia-smi/NvidiaSmiOutcome.md)
  record `{ kind, reason, at }`. `available` is false only when the binary is
  confirmed missing. `degraded` means the last read was not ok. `stale` means not
  ok, or older than three intervals (at least 5 s).
- `refresh({ maxAgeMs = 2000 })` the snapshot, refreshed by a one-shot query
  when it is older than `maxAgeMs` or not good. Concurrent callers share one
  query. Works without `start()`: that is the fallback when the loop is
  unavailable.
- `whenReady(timeoutMs = 3000)` resolves with the snapshot once a reading exists
  (a block or a one-shot), the binary is confirmed missing, or the bound
  elapsed; it starts a one-shot so the loop's first block is not waited for
  alone. A loop that is not running answers at once. `stop()` settles every
  waiter. Launch paths await `CudaDeviceProbe.whenReady` before reading live
  cards, so a launch right after boot never places as if there were no GPUs.
- `computeApps({ force })` the `{ pid: bytes }` list, queried only when a card's
  used bytes moved since the last list ([ComputeAppsGate](nvidia-smi/ComputeAppsGate.md))
  or when forced. Never asked while the binary is missing.
- `cachedComputeApps()` synchronous: the last list at once, with a background
  refresh when the cards moved.
- `isRunning()`, `isStreaming()` (a child is alive), `getState()` for
  diagnostics: `{ running, streaming, intervalMs, outcome, available, degraded,
  stale, at, source, cards, spawns, blocks, nextRestartMs, appsAt }`.
- `NvidiaSmiStream.supported(platform)` false on `darwin`.
- Statics: `DEFAULT_INTERVAL_MS` 1000, `BLOCK_SETTLE_MS` 250, `STALE_INTERVALS`
  3, `MIN_STALE_MS` 5000, `MISSING_RETRY_MS` 5 min, `DEFAULT_MAX_AGE_MS` 2000,
  `DEFAULT_READY_MS` 3000.

## How a reading flows

1. stdout chunks go through a [NvidiaSmiBlockReader](nvidia-smi/NvidiaSmiBlockReader.md),
   which keys rows by `index`, so a malformed line drops only its own card. A
   block publishes when every known card reported, when a card repeats (the next
   loop iteration began), or 250 ms after the last data.
2. A complete block replaces the card map; a short block merges into it, so the
   neighbours of a dropped card keep their last reading. The same index on a
   different `pci.bus_id` means the cards were re-enumerated and the map is
   replaced.
3. A child that exits (any code), errors, or goes quiet for the stale window is
   dropped and restarted after a [RestartBackoff](nvidia-smi/RestartBackoff.md)
   delay: 1 s doubling to 60 s, reset by the first block. Its late events are
   ignored by generation. The outcome becomes `exit` or `timeout`; the rows stay.
4. `ENOENT` is checked against `NvidiaSmi.findOnDisk()`. A binary found there is
   published with `setSmiPath` and the loop restarts at once. Nothing found is
   `missing`: `available` false, retried every five minutes.
5. One-shot queries (`refresh`, `computeApps`) classify the same way, including
   the on-disk relocation and retry.

## Why

The watchdog used to spawn nvidia-smi every five seconds, placement reads
called `execFileSync` on the main process, and every failure (a hung binary
included) read as an empty row list, so three hiccups disabled the watchdog for
the rest of the session. One loop costs one process for the app's lifetime,
readers never block, and failures are states that heal by themselves.
