# GgufValueReader

`core/llm-server/GgufValueReader.js`

Decodes GGUF primitive values from a `GgufCursor`.

## Methods

- `new GgufValueReader(cursor, lengthsAre64Bit)`; GGUF v1 uses 32-bit lengths
  and counts, v2 and v3 use 64-bit.
- `uint32()`, `uint64()`, `length()` (u32 or u64 by version), `string()`.
- `scalar(type)` decodes one fixed-width value of a GGUF type id.
- `array(depth = 1)` resolves to the values of a small fixed-width array, or
  `undefined` when the array was skipped (string arrays, or more than
  `MAX_RETAINED_ARRAY` = 1024 elements). An array of arrays is walked level by
  level (`depth` counts levels, a plain array being 1) and kept only when every
  level was kept; nesting past `MAX_ARRAY_DEPTH` (4) throws, which the parser
  turns into a failed parse before the core keys or a missing tensor scan
  after them. The cursor's byte cap and deadline bound every level.
- `GgufValueReader.isFixedWidth(type)`.
- Constants: `TYPES`, `FIXED_SIZE`, `MAX_STRING_BYTES` (8 MB),
  `MAX_ARRAY_COUNT` (200 M), `MAX_RETAINED_ARRAY`, `MAX_ARRAY_DEPTH`.

## Why small arrays are kept

Newer architectures (gemma4) write per-layer hyper-parameters
(`attention.head_count_kv`, `attention.sliding_window_pattern`) as one-entry-
per-layer arrays in the middle of the header. Real models top out at a few
hundred blocks, so anything above 1024 entries is not a hyper-parameter and is
skipped in O(1).
