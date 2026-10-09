# DownloadRateMeter

`core/shared/download/DownloadRateMeter.js`

Smoothed transfer rate and ETA for the current download session.

## Methods

- `new DownloadRateMeter(startBytes)` seeds the meter with bytes already on disk.
- `meter.sample(received, total)` returns `{ bytesPerSec, etaMs }`.
  `bytesPerSec` is 0 until the first real sample; `etaMs` is `null` when the
  total is unknown, nothing remains, or there is no rate yet.
- `DownloadRateMeter.PROGRESS_THROTTLE_MS` (250) is the progress callback
  cadence both download paths use. `EMA_ALPHA` (0.3) and `MIN_SAMPLE_MS` (100)
  tune the smoothing.

## Why

Seeding with the resumed byte count keeps a resumed download from reporting an
absurd first rate (those bytes arrived in an earlier session). An exponential
moving average is used because a session average lags badly after a slow
start and a raw instantaneous rate jitters too much to read. Ticks closer than
100 ms are folded into the next sample instead of dividing by a near-zero
interval.
