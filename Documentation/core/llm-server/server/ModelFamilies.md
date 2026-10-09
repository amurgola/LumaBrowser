# ModelFamilies

`core/llm-server/server/ModelFamilies.js`

Identifies a model's tuning family and turns the family's published recipe
(see [ModelFamilyTable](ModelFamilyTable.md)) into launch args and switches for
the launch planner and the chat path.

## Methods

- `ModelFamilies.detect(model)` returns a family id (`'muse-glimmer'`,
  `'qwen38'`, `'qwen38-flash-next'`) or `null` (the common case). `model` is a
  scanner entry `{ name, weights, gguf }`.
- `ModelFamilies.launchArgs(family, unsupported = new Set())` returns
  `{ args, skipped, profile }`: sampler flags plus plain flags, with anything in
  `unsupported` moved to `skipped`.
- `ModelFamilies.speculativeArgs(family, { drafterPath, flagsSupported, gpuOffload, dialect = 'mainline' })`
  returns `{ args, specType, draftNMax, label }` for a family drafter, or `null`.
- `ModelFamilies.mtpDraftNMax(family)` returns the family's grafted-MTP
  `--spec-draft-n-max`, or `null` for the planner default.
- `ModelFamilies.penaltyHostile(family)`, `nativeToolCalls(family)`,
  `nativeToolCallsCapable(family)`, `kvQuantUnsafe(family)`, `ngramSpec(family)`
  return booleans.
- `ModelFamilies.nativeToolExclude(family)` returns a copy of the tool names the
  family must still reach through the text fence.

Unknown, empty and prototype-key family ids (`'constructor'`) resolve to no
profile everywhere.

## Why

Almost every launch knob is derived from hardware and the GGUF header and stays
arch-agnostic. A few are published by model authors and cannot be inferred
(sampler, whether tool calls need llama.cpp's jinja path, which drafter ships).
Keeping those as data means the next family is a table edit, not another `if`
in the planner.

Detection prefers `general.architecture` over the filename because headers
survive renames and repacks. Every architecture is tried before any name
pattern, which is also why Qwen3.8 Flash Next (`qwen4exp`) is never claimed by
the Qwen3.8 name fallback. Qwen3.8 itself is name-matched because its arch tag
`qwen35` is shared with 3.5 and 3.6, whose published samplers differ.

Sampler flags are emitted as llama-server defaults: they apply to any request
that does not carry its own value. The chat path always sends `temperature`, so
`--temp` is the one overridden per request. Any flag the runtime's argparser
rejects is skipped, because an unknown flag is fatal on older forks.

`speculativeArgs` is conditional on a file: the drafter is a separate GGUF the
scanner pairs from disk. The ik dialect spells the stage `dflash:n_max=N` and
has no `--spec-draft-n-max` (unverified live on ik). `-ngld 99` is added only
when layers go to the GPU, because a ~1.6 GB drafter left on the CPU drafts
slower than the decode it is meant to accelerate.

`mtpDraftNMax` is separate from `speculative`: it tunes the MTP head grafted
into the main GGUF, and the right N depends on how expensive one forward pass of
that model is against its own draft head, so it is measured per family.

`penaltyHostile` distinguishes two meanings of a published `repeat_penalty 1.0`.
Muse Glimmer means "never": llama.cpp's penalty cannot tell control tokens from
content, and its channel format re-emits markers many times per turn. Qwen3.8
means "not at temperature 1.0": pin the temperature cold (agent turns) and the
house penalty floor must come back, or a reasoning model loops. Only the first
kind sets the flag; `familySampler` in the chat router reads it.

`nativeToolCalls` is read from the live plan's `modelFamily`, not re-derived
from a name, so tools are never registered for a process that did not get the
family's `--jinja`. `nativeToolCallsCapable` lets the
`core.llmServer.chat.nativeToolCalls` setting opt a fence-default family back in.
