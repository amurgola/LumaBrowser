# RelativeMovePlan

`core/games/RelativeMovePlan.js`

Splits a relative mouse move into per-tick deltas, so the camera turns smoothly
instead of snapping on one huge delta (which many games clamp or treat as a flick).

## Methods

- `RelativeMovePlan.tickCount(durationMs)` `max(1, round(durationMs / 10))`.
- `RelativeMovePlan.chunks(dx, dy, ticks)` one `{ dx, dy }` per tick, possibly
  zero. Cumulative rounding keeps each chunk within 1 px of even and makes the
  integer total exactly `(dx, dy)`.
- `RelativeMovePlan.TICK_MS` 10 (about 100 Hz, one delta per frame).
