# CatalogDecodeEstimator

`core/llm-server/server/decode/CatalogDecodeEstimator.js`

A first-guess decode speed for a catalog row before its GGUF exists locally.

## Methods

- `CatalogDecodeEstimator.estimate(variant, hw)` returns
  `{ at8k, at32k, atFull, fullTokens, source, confidence: 'low', speculative: 'excluded' }`
  or `null`. Never throws.
  - `variant`: `{ approxBytes, paramsB?, activeParamsB?, maxContext? }`;
    `fullTokens` is `maxContext` (default 32768, never below 8192).
  - `hw`: a [HwBudget](../../models/HwBudget.md) result (`usableVramBytes`,
    `usableRamBytes`, `gpus`, `ramBandwidthGbps`, `gpuName`).
  - `null` when there is no size, or when nothing lands on a GPU and the weights
    exceed usable RAM (it does not run at all).
- `CatalogDecodeEstimator.coarseHistoryBytesPerToken(paramsB)` is the rough f16
  KV bytes per token (`paramsB / 7 x 2 GiB / 32768`, 7B when unknown).

## How it places

Streamed bytes are the file size times `activeParamsB / paramsB` for a MoE
headline. Placement uses stored bytes: cards are tried fastest first (as the
fill-order split does), each taking up to its budget minus 1 GiB and an 8K KV;
the rest goes to system RAM at the reported bandwidth (or the RAM floor). With
1.5 GiB or less of usable VRAM nothing is placed on a GPU. Any RAM share uses
the CPU step cost.

## Why

Before download there is no header, only file size, parameter count and a MoE
active-parameter headline, so the same formula runs over those coarse facts. The
exact [PlanDecodeEstimator](PlanDecodeEstimator.md) result replaces it once the
file is scanned.
