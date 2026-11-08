# ServingNotes

`core/llm-server/server/launch/ServingNotes.js`

The plan notes for the optional serving features of a launch.

## Methods

- `ServingNotes.build(state)` returns, in order and only when they apply: slots
  (`--parallel`, or requested but unsupported); context retention; the RAM prompt
  cache (size, off with its reason, or unsupported); tensor parallelism (on, or
  requested but off with the gate's reason or because the model does not fully
  fit); a KV precision forced to f16; family tuning with skipped flags; the family
  drafter (on, off by setting, unsupported, or missing on disk); a measured VRAM
  basis; distributed inference (on with the split and idle remote devices,
  unsupported, or skipped because the model fits locally or runs expert offload);
  MoE expert offload (fill, all experts in RAM with or without the MoE GPU cache and why the cache is off, or why offload is off or not needed);
  and the load-mode fallback when both spellings are rejected.
- On an over-RAM pool the all-experts note ends with the RAM tier ([MoeRamTierPlan](MoeRamTierPlan.md)): the
  bytes locked in RAM (`--moe-ram-mib`), that the most used experts go first once the profile has data, the
  part of the tier registered with the GPU for DMA uploads (`--moe-ram-register-mib`, named as a per-card share
  on a multi-card launch), or
  why there is no tier (a mainline or luma-b4 build, the Setup opt-out), plus the profile file the runtime keeps
  to seed its GPU cache at the next start when one is named.
- The all-experts note says where the experts live. A pool that fits RAM "stays in system RAM"; one that
  exceeds it (DeepSeek-V4.1-Flash: 289 GB of experts against 190 GB, 2026-11-02) loads memory-mapped, so the
  note says the OS page cache keeps the recently used experts and the rest stream from the SSD, and that decode
  follows the hit rate of that cache and the GPU cache in front of it. Host tables over `LAZY_TABLE_BYTES`
  (4 GiB, llama.cpp's `--lazy-mode auto` threshold) get a sentence of their own: DeepSeek's 203 GB Engram table
  is read row by row as tokens need it, never loaded whole, so it costs disk space, not RAM.

## Why

These features are opt-in or conditional, so the user needs to know whether each
one actually happened. A request that a gate refused always produces a note
naming the gate.

## Drafter repo hint

When a family publishes a drafter (`profile.speculative`) and none sits beside the
weights, the OFF note points at the Setup row's download when
[DrafterCatalog](../../models/DrafterCatalog.md)`.forFamily` has an entry
(Qwen3.8: `z-lab/Qwen3.8-27B-DFlash2-GGUF`). The ON note no longer promises the
same output: the main model still picks every token, but batch-size dependent
kernels mean a greedy run can diverge from a plain decode after a few hundred tokens.
