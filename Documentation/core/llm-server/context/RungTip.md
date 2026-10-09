# RungTip

`core/llm-server/context/RungTip.js`

The hover text for one context rung.

## Methods

- `RungTip.for({ tokens, source, state, kv, tokensPerSec, vramBytes, est? })`:
  - measured ok: `Measured: loaded at 8,192 ctx (f16 KV): 6.52 GB VRAM, 42.5 tok/s.`
  - measured failure: `Measured: failed to load at ... Re-run the fit test after changing runtime or hardware.`
  - estimated ok: `Estimated full GPU offload at ... : <need> needed (<room> usable VRAM). [Predicted ~N tok/s at this depth without speculative decoding.] Run the fit test to confirm.`
  - partial: `Estimated partial offload at ... : 12/36 layers on GPU, 24 on CPU. Mixed GPU/CPU, slower than a full offload.`
  - no: `Estimated: won't fit on GPU at ... : not even one layer plus its KV cache (~X) fits the VRAM budget. Runs CPU-bound.`
  - unknown: `Can't estimate at ... : no usable runtime for this model on this host.`
  The KV text is the mode's `short` label, else `<kv> KV`. Sizes use
  [ByteLadder](../server/ByteLadder.md), speeds `DecodeFormula.describeTps`
  with `about ` shortened to `~`.

## Why

Bug H6: the Setup tab composed this from its own KV maths and disagreed with
Start. The tip is written next to the planner call that produced the state, so
there is one place that can be wrong. A prediction is a bandwidth calculation
without speculative decoding, so the word "Predicted" stays next to the number.
