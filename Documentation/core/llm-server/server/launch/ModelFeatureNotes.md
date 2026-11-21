# ModelFeatureNotes

`core/llm-server/server/launch/ModelFeatureNotes.js`

The plan notes that explain how a launch runs the model.

## Methods

- `ModelFeatureNotes.build(state)` returns, in order and only when they apply:
  KV cache precision; flash attention (forced or not); the SWA cache (full, or
  windowed with the VRAM it saves); the prompt micro-batch of a model that
  keeps an attention mask per block pass (the mask VRAM at this context, and
  when [MicroBatchPlan](MicroBatchPlan.md) stepped it down, the size, what
  that saved and that only prompts get slower); MTP (ik grammar, mainline pipeline with the
  grafted-head or detached-head line, or why it is off: flags, ik with a detached
  head, no `-md`); standalone n-gram speculation; the draft KV cache; context
  shift off; skipped flags; a suppressed projector; the runtime's extra args; the
  user's flags.

## Why

Each note names the flag it explains, so a user reading the launch log can find
it in argv. Notes about features that are off say why, so nothing is a silent
no-op.

## SWA note for a looped model (2026-11-20)

When `offload.swaFullUseless` is set the SWA cache note reads "windowed" and
says `--swa-full` is left out on purpose: the model runs its core in a loop,
the server restores context checkpoints for it either way, and the full-size
cache would only read prompts more than twice as slowly and hold the stated
VRAM. It replaces the "would not fit the budget" wording, which is not the
reason there.
