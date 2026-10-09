# LlmKvBreakdown

`core/placement/service/LlmKvBreakdown.js`

The running LLM's KV-cache bytes at its launched context.

## Methods

- `LlmKvBreakdown.fromStatus(status)` -> `{ totalKvBytes, contextSize }` from
  `status.plan` (`gguf`, `contextSize`, `cacheTypeK`, `cacheTypeV`, `swaFull`)
  via [KvCacheSizer](../../llm-server/server/launch/KvCacheSizer.md)`.total`.
  Null without a plan, a GGUF with blocks, a positive context, or a positive total.

## Why

Lets a measured LLM peak split into weights plus a per-1K-token KV rate.
