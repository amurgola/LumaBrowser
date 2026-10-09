# VramBand

`core/llm-server/server/vram-watchdog/VramBand.js`

Classifies a card's free VRAM against the per-card reserve.

## Methods

- `VramBand.of(freeBytes, reserveBytes)`: `critical` below half the reserve,
  `low` below the reserve, else `normal`. A non-finite free value or a
  non-positive reserve reads `normal`.
- `VramBand.BANDS` `['normal', 'low', 'critical']`.

## Why

`low` means the planner's margin is gone; `critical` means generations can fail
or slow.
