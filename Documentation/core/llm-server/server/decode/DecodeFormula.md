# DecodeFormula

`core/llm-server/server/decode/DecodeFormula.js`

The analytic single-user decode formula and its constants, shared by
[PlanDecodeEstimator](PlanDecodeEstimator.md) and
[CatalogDecodeEstimator](CatalogDecodeEstimator.md).

## Methods

- `DecodeFormula.estimateTps({ domains, fixedMs, depth, parallel = false, syncMs = 0 })`
  returns tokens per second (rounded to a tenth) or `null` for a zero step:

  ```
  step ms = fixedMs + syncMs + combine over domains of
              weightBytesPerToken / (WEIGHT_STREAM_EFFICIENCY x bandwidth)
            + historyBytesPerToken(depth) / (HISTORY_READ_EFFICIENCY x bandwidth)
  ```

  `combine` is a sum for a layer pipeline and a maximum when `parallel` (tensor
  split). `historyBytesPerToken` may be a number or a function of depth. Domains
  without bandwidth are skipped.
- `DecodeFormula.tpsFromMs(ms)`, `DecodeFormula.describeTps(tps)` (`about 42 tok/s`,
  one decimal under 10, `''` for nothing).
- `DecodeFormula.bandwidthSourceOf(domains)`: `'table'` when no domain's
  bandwidth is a floor guess, `'floor'` when all are, else `'mixed'`.
- Constants: `WEIGHT_STREAM_EFFICIENCY` 0.85, `HISTORY_READ_EFFICIENCY` 0.5,
  `GPU_STEP_MS` 3, `CPU_STEP_MS` 15, `RPC_HOP_MS` 3, `TENSOR_SPLIT_LAYER_SYNC_MS` 0.25.

## Why

Decode is memory-bound: one token streams the executed weights through the
memory bus once, plus the KV history attention reads at the current depth. So
speed is byte accounting over bandwidth. The constants are the same on every
device; nothing is fitted per card, so an unknown device inherits a class-floor
bandwidth and errs slow. Calibration point: Qwen3.8-27B UD-Q6_K_M (21.5 GiB, 17
KV blocks, q8_0 KV) on one RTX 5090 measured 55.3 / 53.7 / 48.9 / 41.7 tok/s at
1K / 32K / 64K / 128K depth without speculation; these constants predict
55 / 51 / 48 / 42.

The CPU step cost covers thread fan-out and the CPU/GPU hand-off per layer
boundary; each borrowed RPC device adds a LAN round trip; a tensor split
synchronises every card after every layer.

This models plain autoregressive decode only: no speculative acceptance (MTP,
DFlash, n-gram), no prompt processing, no concurrent slots.
