# SlotPlan

`core/llm-server/server/launch/SlotPlan.js`

The serving-slot settings of one launch.

## Methods

- `SlotPlan.resolve({ overrides, flags, files, vision })` returns `{ requestedConcurrent, parallelEnabled, maxConcurrent, cacheReuseRequested, cacheReuseEnabled, cacheReuseOffReason }`.
  `requestedConcurrent` is the floored `overrides.maxConcurrent` (1 when below 1
  or junk); `maxConcurrent` is what the server decodes with (1 without
  `--parallel` support).
  - `cacheReuseOffReason` is null unless context retention was requested and
    would not run: `'runtime'` (the build does not accept `--cache-reuse`),
    `'architecture'` (`files.gguf.architecture` is in
    `UNSHIFTABLE_ARCHITECTURES`) or `'projector'`
    (`vision.effectiveMmprojPath` is set). The flag is emitted only when the
    reason is null. A header that could not be read leaves it on.
- `CACHE_REUSE_MIN_CHUNK` (256).
- `UNSHIFTABLE_ARCHITECTURES`: `qwen2vl`, `paddleocr`, `qwen3vl`, `qwen3vlmoe`,
  `qwen35`, `qwen35moe`, `clef`, `qwen4exp`, `qwen3tts`, `step35`, `deepseek4`,
  `deepseek41`.

## Why

`maxConcurrent`, not the request, is what the LLM queue gate mirrors, so callers
never fire more requests than the server has slots. `--cache-reuse 256` reuses KV
chunks after a prompt diverges and re-converges (history compaction, an edited
turn); 256 is big enough that shifting beats recomputing and small enough to
catch paragraph-sized survivals. It is opt-in because KV shifting is not
implemented for every architecture.

llama-server switches `--cache-reuse` off at load, with only a log warning, when
`llama_memory_can_shift` is false or a vision projector is loaded. The plan used
to say "Context retention: ON" all the same (found 2026-11-18 on Qwen3.8, arch
`qwen35`, whose IMROPE positions carry several rotary axes per token). The
architecture list mirrors llama.cpp b11721: the unconditional MROPE / IMROPE
cases of `llama_model_rope_type`, `step35` (per-layer rotary sizes) and the
DeepSeek V4 compressed cache. Architectures that pick MROPE from a header value
(`glm4`, `bailingmoe3`) are not listed. Only chunk reuse after an edit earlier in
the history is lost: exact-prefix reuse, context checkpoints and `--cache-ram`
do not shift positions. If llama.cpp learns to shift these, drop them from the
list. [LaunchPlanner](../LaunchPlanner.md) resolves the projector before the
slots for this reason.
