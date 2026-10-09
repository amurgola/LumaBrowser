# OomRescue

`core/llm-server/server/launcher/OomRescue.js`

One-shot OOM rescue for a failed start.

## Methods

- `new OomRescue({ placement, log })`.
- `attempt(ctx, failure)` returns null unless `failure.kind === 'oom'`, the plan
  used a measured fit (`plan.measuredVramBytes != null`) and no peers are
  borrowed. Then: `ensureStopped()`, overrides without `measuredVramBytes`,
  `placement.placeForRescue(ctx, plan.headerEstimatedBytes)`, replan, copy the
  auth key, the new `cudaDevice` and the failed launch's `healthTimeoutMs`, add
  `OomRescue.NOTE`, start, return `{ ..., oomRescue: true }`. A second failure propagates.

The rescue launch is not finalized again: no layout split, no ledger weighting
(legacy behaviour, kept).

## Why

An OOM under a measured number means the measurement went stale (another app
took VRAM, a driver changed overhead). The header estimate over-counts KV, so the
replan lands on a partial offload or wider spread that fits. Without a measured
override the plan was already conservative and an identical replan would waste a
multi-minute load.
