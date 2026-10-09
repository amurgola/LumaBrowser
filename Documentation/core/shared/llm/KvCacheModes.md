# KvCacheModes

`core/shared/llm/KvCacheModes.js`

The KV cache precisions the app offers, each an id plus the (K, V) cache types
it expands to.

## Methods

- `KvCacheModes.MODES` is the full table, in preference order (best quality
  first). Each mode is `{ id, k, v, short, label, help, offered? }`.
- `KvCacheModes.MODE_IDS` lists every id the app honours (settings validation,
  stored fit rows).
- `KvCacheModes.OFFERED_MODES` / `KvCacheModes.OFFERED_MODE_IDS` are the modes
  put in front of people (the fit ladder, the Setup dropdown): every mode whose
  `offered` is not `false`.
- `KvCacheModes.mode(id)` returns the mode for an id (trimmed), or `null`.
- `KvCacheModes.pair(id)` returns `{ k, v }` for `--cache-type-k` /
  `--cache-type-v`. Unknown or missing ids fall back to `f16/f16`.
- `KvCacheModes.idFor(k, v)` returns the id of the mode producing that pair
  (missing types count as `f16`), or `null` if no mode does.
- `KvCacheModes.shortLabel(id)` returns the compact column label, `'f16 KV'`
  for unknown ids.

## Why one table

K and V are not always the same precision, but every consumer used to assume
they were: the fit tester set `cacheTypeK = cacheTypeV = kv`, the launcher did
the same from the persisted default, and the Setup tab hardcoded one column per
precision. Adding an asymmetric option to one of them alone would desync
measured rows from the launches they describe, so the list, the pair expansion
and the labels live here.

Ids are storage keys. They appear in persisted fit-test rows (`row.kv`), the
Defaults setting and measured-VRAM lookups, so they must stay stable. `f16` and
`q8_0` predate this table and keep their names.

Unknown ids fall back to f16 because it is the runtime's own default and the
only safe guess for a stored setting that predates or outlives a mode.

## Why asymmetric, and why no 4-bit keys

Keys and values do not degrade alike. Keys are what the query is scored
against, so an error there changes where attention looks and can retrieve the
wrong token entirely. Values are only read after the position is chosen, so an
error blurs what is recalled rather than redirecting the lookup. That is why
`q8q4` quantizes V harder than K, and why no mode quantizes K to 4 bits.

## Why q8q4 is not offered

On paper it is the best VRAM trade, and a widely shared Qwen3.8 write-up
recommends it for full 262k context. Measured on llama.cpp CUDA 13 with
Qwen3.8-27B (head dim 256) on a 5090 + 3090:

| KV | Prompt eval |
|---|---|
| f16 | 1263 tok/s, steady |
| q8_0 | 1214 tok/s, steady |
| q8_0 / q4_0 | 206 tok/s at 2k, 111 at 4k, 48 at 10k, 26 at 20k; a 32k prompt never finished in 15 minutes |

`-b 2048 -ub 256` does not rescue it. The shape says there is no fused
flash-attention kernel for a 4-bit V cache at this head size, so every chunk
pays a dequantize that grows with the cache. The mode stays in the table
because the pair machinery is exercised by it, a future build may close the
kernel gap, and the next person to read that write-up should find this
measurement instead of repeating it. A value set by hand keeps working.
