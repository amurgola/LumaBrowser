# GameControlArgs

`core/games/GameControlArgs.js`

Reads and clamps the arguments of game-mode input and wait calls, so odd model
values become safe defaults.

## Methods

- `keySequence(keys)` an array as given, else the string split on whitespace.
- `press(args)` `{ mode: 'scan'|'vk', holdMs 10..10000 (60), gapMs 0..5000 (80) }`.
- `holdMs(args)` `args.ms` 10..10000 (500).
- `move(args)` `{ dx, dy }` rounded and clamped to +-10000, `durationMs` 0..5000 (200).
- `waitForChange(args)` `{ timeoutMs 0..60000 (3000), minDistance >= 1 (8), intervalMs 20..2000 (100) }`.
- `waitForStill(args)` `{ stableMs 50..30000 (500), timeoutMs stableMs..120000 (5000), maxDistance >= 0 (3), intervalMs 20..2000 (100) }`.
- `calibrate(args)` `{ dx (200), settleMs 50..3000 (300) }`.
- `clamp(value, lo, hi)`; statics `MAX_HOLD_MS`, `MAX_DELTA`, `MAX_SEQUENCE`.
