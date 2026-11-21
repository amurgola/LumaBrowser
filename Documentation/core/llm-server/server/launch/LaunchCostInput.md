# LaunchCostInput

`core/llm-server/server/launch/LaunchCostInput.js`

Builds the [FullOffloadCost](FullOffloadCost.md) input for one launch from its
resolved stages.

## Methods

- `LaunchCostInput.build({ files, kv, flags, spec, vision, batch }, modelBytes, swaFull)`
  returns the `FullOffloadCost.bytes` input: the loaded projector, header,
  context, K/V types, MTP and drafter terms, flash attention, `kvOnHost`, the
  draft cache type and `microBatch` (`batch.microBatch` from
  [MicroBatchPlan](MicroBatchPlan.md); undefined while that stage is still
  choosing, which prices the default), for the given weight share.
- `LaunchCostInput.noHeader({ files, spec })` returns the `FullOffloadCost.noHeaderBytes` input.

## Why

The legacy planner priced a full offload four times (whole file for the MoE
decision, the resident share for the expert fill, and with and without
`--swa-full`), each time spelling out the same thirteen fields. One builder keeps
the four prices over the same terms.

## Draft length

`build` also forwards `draftN: spec.specDraftN` so the full-offload price includes
the recurrent checkpoints of the drafted block on a hybrid target.

## scratchHeldBack (2026-11-20)

`build(state, modelBytes, swaFull, { scratchHeldBack = false })` forwards the
flag to [FullOffloadCost](FullOffloadCost.md): an expert offload prices its
resident share without the context scratch, because it reserves a staged
expert tensor and prompt activations instead
([MoeExpertPlan](MoeExpertPlan.md)`.heldBackBytes`).
