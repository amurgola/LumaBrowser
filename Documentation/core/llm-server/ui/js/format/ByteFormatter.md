# ByteFormatter

`core/llm-server/ui/js/format/ByteFormatter.js`

The renderer's byte ladder and gigabyte card label.

## Methods

- `ByteFormatter.bytes(value, { zero }?)` prints B through PB: 0 decimals at
  >= 100 or in bytes, 1 decimal at >= 10, else 2 (`1536` -> `1.50 KB`,
  `3 GiB` -> `3.00 GB`, past PB the ladder stops: `1024 PB`). Non-positive or
  invalid input returns `zero` (default `'n/a'`); each call site picks its own
  sentinel (`''`, `'0 B'`).
- `ByteFormatter.gb(value)` prints gigabytes with card-label precision: 0
  decimals at >= 10, else 1 (`12 GB`, `1.5 GB`). Junk counts as 0, never `NaN`.
- Constants: `UNITS`, `DEFAULT_ZERO`, `GIB`.

## One ladder across processes

The main process prints sizes with [ByteLadder](../../../server/ByteLadder.md).

## Globals

None.
