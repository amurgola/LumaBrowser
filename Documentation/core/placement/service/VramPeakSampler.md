# VramPeakSampler

`core/placement/service/VramPeakSampler.js`

Polls live GPU and process memory during a placement test and reports each
server's true peak.

## Methods

- `new VramPeakSampler({ servers, gpu, vram, rss })`; `rss.rssBytesSync(pid)`.
- `start()` takes a first reading (the per-card baseline), then reads VRAM every
  `VRAM_INTERVAL_MS` (350) and RSS every `RAM_INTERVAL_MS` (1500). Returns `this`.
- `stop()` clears both timers, takes a last reading and returns
  `{ perProcessAvailable, servers: { [item]: { peakBytes, peakRamBytes, cardPeakBytes } }, devices }`:
  - `peakBytes`, `peakRamBytes` the max over the pids each server ever had (null
    when never seen);
  - `cardPeakBytes` the highest whole-card used VRAM while the server was live
    (`ready` or `starting`) and the only ledger claim on that card, else null;
  - `devices` `[{ index, name, totalBytes, peakUsedBytes, baselineUsedBytes }]`
    sorted by index (a card first seen after the first reading has baseline 0);
  - `perProcessAvailable` true once any process reported VRAM.
- `VramPeakSampler.occupantsPerCard(ledger)` claims per card.

## Why

nvidia-smi's per-process VRAM is `[N/A]` under Windows WDDM, so the card total
is the robust measure. Attributing it only to a sole occupant is also the only
correct reading in a singularity, where models swap on one card and only the
last survives to the end of the run. It over-counts by the compositor, the
safe direction for a fit estimate. RSS reads spawn `tasklist` or `ps`, hence
the slower cadence.
