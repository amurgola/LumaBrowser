# LaunchCostInput

`core/llm-server/server/launch/LaunchCostInput.js`

Builds the [FullOffloadCost](FullOffloadCost.md) input for one launch from its
resolved stages.

## Methods

- `LaunchCostInput.build({ files, kv, flags, spec, vision }, modelBytes, swaFull)`
  returns the `FullOffloadCost.bytes` input: the loaded projector, header,
  context, K/V types, MTP and drafter terms, flash attention, `kvOnHost` and the
  draft cache type, for the given weight share.
- `LaunchCostInput.noHeader({ files, spec })` returns the `FullOffloadCost.noHeaderBytes` input.

## Why

The legacy planner priced a full offload four times (whole file for the MoE
decision, the resident share for the expert fill, and with and without
`--swa-full`), each time spelling out the same thirteen fields. One builder keeps
the four prices over the same terms.
