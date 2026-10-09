# GgufCompanionPicker

`core/llm-server/models/GgufCompanionPicker.js`

Picks which companion GGUF to download beside chosen weights.

## Methods

- `GgufCompanionPicker.bestMmproj(list)` picks from
  `[{ precision, approxBytes, ... }]`: F16/FP16 first, then BF16, then
  F32/FP32, then anything else; ties go to the largest. `null` for an empty list.
- `GgufCompanionPicker.bestMtp(list, { quant })` picks from
  `[{ quant, approxBytes, ... }]`: an exact (case-insensitive) match with the
  weights' quant first, then the highest bit width, then the largest. `null`
  for an empty list.

Neither reorders the input list.

## Why

A vision model is text-only without a projector. Projectors are small, so full
precision wins over size.

Repos with a detached MTP head ship one today (unsloth ships a single Q4_0 for
20-odd quants), so ordering only matters if that changes. A head quantized like
the weights is the pairing its publisher tested. Otherwise the highest
precision wins: heads are ~1.4 GB against 16-30 GB of weights, so draft
acceptance is worth far more than the bytes.
