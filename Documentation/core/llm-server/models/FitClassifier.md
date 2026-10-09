# FitClassifier

`core/llm-server/models/FitClassifier.js`

The pre-download "will this run?" badge for a GGUF quant, with a predicted speed.

## Methods

- `FitClassifier.classify(variant, hw)` returns
  `{ tier, badge, label, predictedTps, predictedTpsDepth, speedLabel }`.
  - `variant`: `{ approxBytes, paramsB, activeParamsB?, maxContext? }`;
    `hw`: a [HwBudget](HwBudget.md) result.
  - With more than 1.5 GiB of usable VRAM, need = weights + KV at 8K + 1 GiB:
    `fits`/green (`Fits your GPU`) when need fits VRAM, `tight`/amber
    (`Tight fit, may need a smaller context`) within 10%, `spill`/orange
    (`Spills into system RAM, slower`) when the weights fit RAM, else
    `too-big`/red (`Too large for this machine`).
  - Otherwise the CPU path: `spill` (`Runs on CPU, slower`) up to 90% of RAM,
    `tight` (`Tight on RAM, may be unstable`) up to RAM, else `too-big`.
  - Speed: [CatalogDecodeEstimator](../server/decode/CatalogDecodeEstimator.md)`.estimate`
    at 8K for anything that runs; `speedLabel` is `about N tok/s predicted`, or `''`.
- `MIN_GPU_BYTES`, `TIGHT_FACTOR` (1.1), `CPU_COMFORT_FRACTION` (0.9),
  `SPEED_DEPTH` (8192), `TOO_BIG`.

## Why

The search list sorts fits-first and warns before a multi-GB download, like LM
Studio's badge. It is deliberately an estimate; the fit tester stays the accurate
tool. Within 10%, q8 KV or a little less context usually claws the miss back.
