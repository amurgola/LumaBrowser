# RamPinAdvice

`core/llm-server/models/auto-plan/RamPinAdvice.js`

Decides whether [AutoPlanner](../AutoPlanner.md) recommends locking the pooled
models in system RAM (mlock / VirtualLock).

## Methods

- `RamPinAdvice.advise({ placement, llmPick, image, ramTotal })` returns
  `{ recommended: true, reason: 'singularity', bytes }` when the placement is a
  singularity and [HotswapRamGate](../../../shared/runtime/HotswapRamGate.md)
  passes for `[llm weights, image bytes]` (no in-flight copy for a cpu-moe pick);
  else `{ recommended: false, reason: 'ram-gate' | placement.kind, bytes: 0 }`.

## Why

Only a singularity swaps, and a swap is then a memory copy instead of a disk
read. A pool created for music never went through the placement's RAM gate (a
single-card box gets one whatever its RAM), so the gate is re-applied to the
bytes the pin would lock: a 48 GB card beside 16 GB of RAM was once told to lock ~46 GB.
