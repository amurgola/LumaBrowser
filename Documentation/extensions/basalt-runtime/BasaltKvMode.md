# BasaltKvMode

`extensions/basalt-runtime/BasaltKvMode.js`

Maps the user's llama.cpp KV cache type onto the `--kv` value a pack takes.

## Methods

- `BasaltKvMode.resolve({ pack, cacheType, slots = 1 })` returns `{ kv, note }`.
  The bit width of `cacheType` (`f16`/`bf16`/`f32` 16, `q8*` 8,
  `q4*`/`q5*`/`iq4*` 4) picks the first of the pack's formats in `BY_WIDTH`
  (16: `fp16`; 8: `int8`, `fp8`; 4: `q4_0`, then the 8-bit ones); no width or
  no match is the pack's default. With more than one slot a pack's
  `kv.parallel` format wins, with a note. An unknown pack gets `kv: null` (no
  `--kv`, the engine's default).
- `BasaltKvMode.bytesPerPosition(pack, kv)`: the pack's figure, or null.

## Why

Each model has its own set: Qwen3.8-27B fp16/int8, Flash-Next
fp16/int8/q4_0/k8v4, DeepSeek fp8/fp16, Hy4-flash and Inkling 2 Mini fp16/fp8;
a value a model does not take stops the start. Mapping by width keeps the
user's one global KV setting meaningful on every pack.
