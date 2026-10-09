# ByteLadder

`core/llm-server/server/ByteLadder.js`

Formats a byte count for main-process text (launch plan notes) with the same
ladder and rounding as the renderer's `LumaFmt.bytes`.

## Methods

- `ByteLadder.format(bytes, { zero }?)` returns `'<value> <unit>'` over
  `B, KB, MB, GB, TB, PB` (1024 steps): 0 decimals at 100 or more or in bytes,
  1 decimal at 10 or more, otherwise 2. Non-positive or invalid input returns
  `zero`, which defaults to `'n/a'`.
- `ByteLadder.UNITS`, `ByteLadder.DEFAULT_ZERO`.

## Why

The legacy repo once had six byte formatters with three roundings ("3072.0 MB" on one surface, "3.00 GB" on another). Legacy main-process planners required the renderer file `core/llm-server/ui/js/format.js`, so this class carries the identical rules for the main process.
