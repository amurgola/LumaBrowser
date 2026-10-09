# ContextRungBuilder

`core/llm-server/context/ContextRungBuilder.js`

Builds one context rung at one KV mode.

## Methods

- `new ContextRungBuilder(estimator)` over a [RungEstimator](RungEstimator.md).
- `build({ model, runtime, diagnostics, fitRows, tokens, kv })` returns
  `{ tokens, label, source, state, kv, tokensPerSec, tokensPerSecSource, vramBytes, tip }`:
  1. a measured ok row ([FitRows](FitRows.md)`.okRow`): `source: 'fit', state: 'ok'`,
     its `tokensPerSec` (`tokensPerSecSource: 'measured'` when present) and `vramBytes`;
  2. else any measured row (a failure): `source: 'fit', state: 'no'`, nulls;
  3. else the estimate: `source: 'estimate'`, the estimate's state and
     `vramBytes`, and its predicted speed (`tokensPerSecSource: 'predicted'`).
  The tip is [RungTip](RungTip.md)`.for`.

## Why

A measured failure is stronger than a guess. A consumer must never show a
predicted figure as if it were measured, so the source travels with the number.
