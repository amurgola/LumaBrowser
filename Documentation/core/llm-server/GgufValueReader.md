# GgufValueReader

`core/llm-server/GgufValueReader.js`

Decodes GGUF primitive values from a `GgufCursor`.

## Methods

- `new GgufValueReader(cursor, lengthsAre64Bit)`; GGUF v1 uses 32-bit lengths
  and counts, v2 and v3 use 64-bit.
- `uint32()`, `uint64()`, `length()` (u32 or u64 by version), `string()`.
- `scalar(type)` decodes one fixed-width value of a GGUF type id.
- `array()` resolves to the values of a small fixed-width array, or
  `undefined` when the array was skipped (string arrays, or more than
  `MAX_RETAINED_ARRAY` = 1024 elements). Arrays of arrays throw.
- `GgufValueReader.isFixedWidth(type)`.
- Constants: `TYPES`, `FIXED_SIZE`, `MAX_STRING_BYTES` (8 MB),
  `MAX_ARRAY_COUNT` (200 M), `MAX_RETAINED_ARRAY`.

## Why small arrays are kept

Newer architectures (gemma4) write per-layer hyper-parameters
(`attention.head_count_kv`, `attention.sliding_window_pattern`) as one-entry-
per-layer arrays in the middle of the header. Real models top out at a few
hundred blocks, so anything above 1024 entries is not a hyper-parameter and is
skipped in O(1).
