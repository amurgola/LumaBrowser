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
    offload, else the partial split's layers, with `slowFirst: flags.deviceOrder`
    (slowest card first on mixed cards), the projector, the draft branch and
    the per-pass attention masks ([MicroBatchPlan](MicroBatchPlan.md)`.maskBytes`;
    in a measured split of Inkling 2 Mini they stayed on the card holding the
    weights) charged to the main card and an expert offload's per-card hold-back
    ([MoeExpertPlan](MoeExpertPlan.md)`.perCardHoldBytes`: staged expert tensor plus prompt
    activations) charged to every card.

## Why

Each split owner keeps its own ratio. The fill split is deliberately not gated on
the single-card fit: that flag sizes against a card's total memory, so it said
"fits the 5090 alone" for a 31.5 GB launch on a card whose desktop held 2.6 GB;
the launcher's pin, sizing against real room, refused and handed over both cards,
and nobody owned the split (observed 2026-09-19: 13.6 GB on the 3090 with 12.8 GB
idle on the 5090). Two visible cards mean the pin did not happen, so the packer
decides, and emits `N,0` when the fast card holds everything.

## The draft branch on the main card (2026-11-20)

`_layerFill` charges the main card the whole draft branch
([FullOffloadCost](FullOffloadCost.md)`.draftBranchBytes`: the drafter file,
its cache, its scratch and context, and a hybrid target's recurrent
checkpoints, or the MTP branch) where it used to charge the drafter file
alone. Qwen3.8-27B at 128k on a 5090 + 3090 loaded 1.45 GiB above the 5090's
plan for that reason.
