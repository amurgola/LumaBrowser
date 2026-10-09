# MeasuredFootprintRecorder

`core/placement/service/MeasuredFootprintRecorder.js`

Turns a [VramPeakSampler](VramPeakSampler.md) summary into the persisted
footprint per model.

## Methods

- `new MeasuredFootprintRecorder({ servers, measuredStore, slotInfo, vram, clock? })`;
  `clock()` returns the ISO `ranAt`.
- `record(summary)` writes, per item with a sample and a selected model,
  `{ kind, modelKey, peakVramBytes, peakRamBytes, vramApprox, ranAt }` keyed by
  model key, merges them into the store and returns them (`{}` without a summary).
  `peakVramBytes`, in order:
  1. the per-process peak (`vramApprox` = not `perProcessAvailable`);
  2. the sole-occupant card peak (`vramApprox: true`);
  3. post-hoc, over the slot's cards (else the ledger's): a card with at most
     one claim gives its absolute peak, a shared card its peak over baseline;
     the largest positive wins (`vramApprox: true`);
  4. the ledger reservation, unless it offloaded to RAM;
  5. else null.
  The LLM entry also gets `kvBytesPerKToken`, `weightsBytes` (peak minus KV,
  at least 0) and `measuredContextSize` from [LlmKvBreakdown](LlmKvBreakdown.md).

## Why

The weights figure is context-agnostic and the KV rate re-costs any context,
which sizes singularities. A card hosting only this model counts its whole
peak whether the model was cold or warm at baseline.
