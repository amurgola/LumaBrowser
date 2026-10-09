# LoadingPolicy

`core/llm-server/server/launch/LoadingPolicy.js`

How one launch reads its weights and how big its host-RAM prompt cache is.

## Methods

- `LoadingPolicy.resolve(state)` returns `{ ramTotalBytes, moeNeedsMmap, ramPinned, useMmap, loadModeArgs, loadModeFlag, promptCacheRam, slotSimilarityEnabled }`.
  - `useMmap` when hotswap asks (`overrides.useMmap`), when an expert pool exceeds
    `MOE_RAM_FIT_FRACTION` (70%) of RAM or RAM is unknown, or when a RAM pin is
    active but the launch is not a full GPU offload without cpu-moe whose weights
    + 1 GiB fit the pin's free RAM;
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
- Hotswap: mmap file pages outlive the process as standby pages, so the next swap
  reads RAM instead of disk.
- MoE pools that fit RAM keep the bulk read (DeepSeek-V4-Flash: 5.2 vs 7.3 tok/s
  cold under mmap); a pool that does not fit needs evictable pages.
