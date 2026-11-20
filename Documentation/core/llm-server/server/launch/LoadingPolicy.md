# LoadingPolicy

`core/llm-server/server/launch/LoadingPolicy.js`

How one launch reads its weights and how big its host-RAM prompt cache is.

## Methods

- `LoadingPolicy.resolve(state)` returns `{ ramTotalBytes, moeNeedsMmap, ramPinned, useMmap, ramPinSlowsDecode, ramPinPoolCopyBytes, moeStageOff, loadModeArgs, loadModeFlag, promptCacheRam, slotSimilarityEnabled }`.
  - `useMmap` when hotswap asks (`overrides.useMmap`), when an expert pool exceeds
    `MOE_RAM_FIT_FRACTION` (70%) of RAM or RAM is unknown, or when a RAM pin is
    active and neither of its two bulk-read cases holds: a full GPU offload
    without cpu-moe whose weights + 1 GiB fit the pin's free RAM, or a MoE GPU
    cache launch (the GPU reads the expert pool from RAM) whose pool + 1 GiB
    fits it;
  - `ramPinPoolCopyBytes` is that pool when the second case applies (the pool
    is in RAM twice), else 0;
  - `ramPinSlowsDecode` when a pin forces a cache launch's pool to be mapped
    because RAM cannot hold it twice. Never set for hotswap or a pool over RAM;
  - `moeStageOff` on a LumaByte build with `flags.moeStage`, for a cache launch
    whose pool sits in RAM (`moeNeedsMmap` false): the argv then carries
    `--moe-stage-mib 0`;
  - otherwise the bulk read: `--load-mode none` where the build has it,
    `--no-mmap` where it does not, nothing (and a note) when both are rejected;
  - `promptCacheRam` from [PromptCacheRam](PromptCacheRam.md); `slotSimilarityEnabled`
    with more than one slot and the flag accepted.
- `MOE_RAM_FIT_FRACTION` (0.7), `PIN_TRANSIENT_SLACK_BYTES` (1 GiB).

## Why

- mmap makes the first GPU upload fault page by page on Windows; the bulk read is
  one pass at the cost of a transient heap copy.
- RAM pin: the weights are already in locked page cache, and the bulk read DMAs at
  full PCIe rate (9.7 s vs 15.3 s on 21.5 GB; ~5 s vs ~9 s swap reloads). Weights
  that stay on the CPU would become a permanent second copy beside the pinned one,
  and mmap serves them zero-copy, so mmap wins there.
- RAM pin over an expert pool the GPU reads: mapped pages upload at pageable
  speed. Qwen3.8-Flash-Next (104 GB) on an RTX 5090, 2026-11-18: 63 tok/s
  bulk-read against 35 mapped, prompt 1252 against 403 tok/s, the same on
  mainline b12359 and on luma-b7 with staging off. So the pool is read a second
  time when RAM has the room, and when it has not the plan flags the pin
  (`ramPinSlowsDecode`) and [LlmPinPlanCheck](../../rampin/LlmPinPlanCheck.md)
  refuses to pin such a model in the first place.
- Staging (`--moe-stage-mib`, luma-b5+): the runtime copies host expert uploads
  through pinned staging buffers, which pays for a pool over RAM whose pages
  fault in from disk (DeepSeek-V4.1-Flash: 1.6 to 2.3 tok/s without, 2.5 to
  2.8 with) and costs a pool that sits in RAM (Flash-Next: 36 tok/s staged
  against 63 bulk-read, 31 against 37 mapped). Up to luma-b7 the registered RAM
  tier needed staging on (with it off the runtime died with a CUDA "invalid
  argument" in the first decode); the tier only exists for an over-RAM pool,
  where staging stays on anyway.
- luma-b8 (patch 0012, 2026-11-18) fixes both in the runtime: it stages only
  memory-mapped experts, so a bulk-read pool uploads directly whatever the flag
  says (33 to 34 tok/s on luma-b7 against 53 to 56 on luma-b8, default staging,
  same session), and unstaged uploads are cut at the edges of the registered
  tier, so the crash is gone (45 to 46 tok/s with the tier registered and
  staging off). The flag is still passed: it covers luma-b5 to b7 and the
  mapped pool that sits in RAM, which the runtime cannot tell from one on disk.
- Hotswap: mmap file pages outlive the process as standby pages, so the next swap
  reads RAM instead of disk.
- MoE pools that fit RAM keep the bulk read (DeepSeek-V4-Flash: 5.2 vs 7.3 tok/s
  cold under mmap); a pool that does not fit needs evictable pages.
