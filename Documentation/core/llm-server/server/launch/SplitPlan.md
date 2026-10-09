# SplitPlan

`core/llm-server/server/launch/SplitPlan.js`

Who owns `--tensor-split` for one launch and with what ratio.

## Methods

- `SplitPlan.resolve(state)` returns `{ emitTensorSplit, tensorSplitRatio, rpcSplitRatio, layerFill }`.
  - `emitTensorSplit`: the [TensorParallelGate](TensorParallelGate.md) passed and the model fully offloads;
    `tensorSplitRatio` from [TensorParallelRatio](TensorParallelRatio.md);
  - `rpcSplitRatio`: [RpcSplitRatio](RpcSplitRatio.md) over the local card count and the estimate, when RPC is on;
  - `layerFill`: [LayerFillSplit](LayerFillSplit.md) when no tensor split, no RPC,
    no MoE fill with GPU expert layers, no manual split, `--tensor-split`
    accepted, 2+ cards, `ngl > 0` and a header; it packs every block on a full
    offload, else the partial split's layers, with the projector and draft branch
    charged to device 0.

## Why

Each split owner keeps its own ratio. The fill split is deliberately not gated on
the single-card fit: that flag sizes against a card's total memory, so it said
"fits the 5090 alone" for a 31.5 GB launch on a card whose desktop held 2.6 GB;
the launcher's pin, sizing against real room, refused and handed over both cards,
and nobody owned the split (observed 2026-09-19: 13.6 GB on the 3090 with 12.8 GB
idle on the 5090). Two visible cards mean the pin did not happen, so the packer
decides, and emits `N,0` when the fast card holds everything.
