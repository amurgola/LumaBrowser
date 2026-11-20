# ContextRungBuilder

`core/llm-server/context/ContextRungBuilder.js`

Builds one context rung at one KV mode.

## Methods

- `new ContextRungBuilder(estimator)` over a [RungEstimator](RungEstimator.md).
- `build({ model, runtime, diagnostics, settingsDb?, fitRows, tokens, kv })` returns
  `{ tokens, label, source, state, kv, tokensPerSec, tokensPerSecSource, vramBytes, tip }`:
  1. a measured ok row ([FitRows](FitRows.md)`.okRow`): `source: 'fit', state: 'ok'`,
     its `tokensPerSec` (`tokensPerSecSource: 'measured'` when present) and `vramBytes`,
     while today's Start decision (`estimate` with `{ settingsDb, measured: { vramBytes,
     fullOffload } }` from the row) still fully offloads it; when that decision is
     `partial` or `no`, the rung takes that state and the predicted speed
     (`tokensPerSecSource: 'predicted'`) and keeps the measured `vramBytes`;
  2. else any measured row (a failure): `source: 'fit', state: 'no'`, nulls;
  3. else the estimate: `source: 'estimate'`, the estimate's state and
     `vramBytes`, and its predicted speed (`tokensPerSecSource: 'predicted'`).
  The tip is [RungTip](RungTip.md)`.for`, given today's estimate as `est` for a
  measured ok row.

## Why

A measured failure is stronger than a guess. A consumer must never show a
predicted figure as if it were measured, so the source travels with the number.
A measured rung is still judged against the VRAM free right now: the matrix used to
show it as fitting whatever was free, so it read "fits" where Start split the model
over two cards or left layers on the CPU, and the recorded speed belongs to a launch
that no longer happens.
