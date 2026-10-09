# FamilyTuning

`core/llm-server/server/launch/FamilyTuning.js`

The per-family launch tuning and the family's own drafter arguments for one launch.

## Methods

- `FamilyTuning.resolve({ files, flags, spec, offload })` returns
  `{ tuning, drafterSpec }`: `tuning` is [ModelFamilies](../ModelFamilies.md)`.launchArgs(family, flags.unsupported)`
  (`{ args, skipped, profile }`); `drafterSpec` is `ModelFamilies.speculativeArgs`
  with `gpuOffload: ngl > 0`, only when the DFlash drafter is enabled.

## Why

The published sampler and template flags cannot be read from a GGUF header. They
are emitted after the hardware flags so they never change placement, and before
the runtime's extras so a runtime override wins. `-ngld 99` needs `ngl`, which is
why the drafter arguments are resolved after the offload decision.
