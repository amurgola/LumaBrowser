# KvSettings

`core/llm-server/server/launch/KvSettings.js`

The context length and KV-cache placement and precision one launch runs with.

## Methods

- `new KvSettings({ overrides, gguf, family })` exposes `requestedContextSize`
  (floored `overrides.contextSize`, else `DEFAULT_CONTEXT`), `contextSize`
  (clamped to `gguf.contextLength`), `cacheTypeK`/`cacheTypeV`
  ([KvCacheType](KvCacheType.md)`.normalize`), `forceFlashAttn`, `kvOnHost`
  (`overrides.noKvOffload`) and `kvQuantForcedF16`.
- `forceF16()` sets both types to `'f16'` (tensor-parallel mode calls it).
- `DEFAULT_CONTEXT` (4096).

## Why

Running past the trained context needs RoPE scaling the planner does not
configure, so the context is clamped; the request is kept because the router
compares it, not the clamped value. A family marked `kvQuantUnsafe` (Qwen3.8 Flash
Next: q8_0 KV corrupts output) has a quantized request overridden before anything
is priced, so fit-test rows measure what the plan will run.
