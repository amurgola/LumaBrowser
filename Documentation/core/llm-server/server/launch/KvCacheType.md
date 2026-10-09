# KvCacheType

`core/llm-server/server/launch/KvCacheType.js`

The KV-cache element types the launch planner accepts and their bytes per element.

## Methods

- `KvCacheType.normalize(value)` returns `'f16'`, `'q8_0'` or `'q4_0'` (trimmed,
  lowercased), else `null` (the binary's f16 default).
- `KvCacheType.elementBytes(type)`: q8_0 1.0625 (34-byte block of 32), q4_0
  0.5625 (18-byte block of 32), anything else 2.
- `KvCacheType.isQuantized(type)`: a truthy type other than `'f16'`.
- `TYPES`, `ELEMENT_BYTES`, `F16_ELEMENT_BYTES`.

## Why

Unknown types price as f16, the runtime default, so an estimate never
under-counts. q4_0 exists for the V cache only in practice: keys decide where
attention looks, so the asymmetric K=q8_0 / V=q4_0 mode is the only 4-bit one
(see [KvCacheModes](../../../shared/llm/KvCacheModes.md)).
