# VramFootprint

`core/llm-server/server/fit-test/VramFootprint.js`

Measures one loaded model's VRAM and RAM peak for the fit test.

## Methods

- `new VramFootprint({ nvidiaSmi, processMemory, sleep })` (defaults `NvidiaSmi`,
  `ProcessMemory`, `CancellableDelay.sleep`).
- `captureBaseline()` the MAX summed free VRAM over 4 samples 350 ms apart (null
  when no card reports).
- `track(pid)` the process to attribute.
- `sample()` reads per-process VRAM (`queryComputeApps()[pid]`), process RSS and
  summed free VRAM in parallel, keeping the peak VRAM, peak RAM and lowest free.
- `startSampling(intervalMs)`, `stopSampling()` sample on an interval.
- `resolve()` `{ vramBytes, vramApprox }`: the per-process peak when above 0
  (exact); else baseline minus lowest free when positive (approximate); else nulls.
- `ramBytes()` the RSS peak, or null if never read.

## Why

Per-process usage is exact but nvidia-smi reports it as `[N/A]` on consumer
GeForce cards in WDDM mode, the hardware most users have. The whole-card free
VRAM is always available, and with the chat server stopped and one model on an
idle card, the drop from the baseline tracks this model's footprint. The
baseline is a max because the previous combo's VRAM may still be draining.
