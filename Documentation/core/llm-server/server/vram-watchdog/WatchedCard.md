# WatchedCard

`core/llm-server/server/vram-watchdog/WatchedCard.js`

One watched GPU's pressure state inside [VramWatchdog](../VramWatchdog.md).

## Methods

- `new WatchedCard(index, row)` name from the row, else `GPU <index>`.
- `updateFromRow(row)` refreshes name and total when present.
- `trackOwnLoad({ stamp, loading, now, graceMs })` a stamp newer than the last
  seen, or a loading claim, extends the grace to `now + graceMs`; returns
  whether the card is `ownLoad` (loading or inside the grace), clearing any
  pending band candidate if so.
- `sample(confirmSamples)` the band to commit once `confirmSamples` consecutive
  samples agree on a new band, else null; a sample matching the current band
  or a different candidate restarts the count.
- `commit(next, now)` sets band and `since`, returns the previous band. A
  dismissal survives only while the band stays the dismissed one; returning to
  `normal` ends the unload episode.
- `dismiss()` remembers the current non-normal band; false when normal.
- `unloadDue(now, dwellMs)` critical for at least `dwellMs` and not unloaded in
  this episode. `markUnloaded(now)`.
- `reset()` back to a clean `normal` card (stamps are kept).
- `view()` `{ card, name, totalBytes, freeBytes, reserveBytes, band, since, dismissed, ownLoad }`.
